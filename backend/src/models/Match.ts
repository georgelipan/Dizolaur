import type { GameConfig, GameSnapshot } from '../types/index.js';
import { MatchState } from '../types/index.js';
import { Player } from './Player.js';
import { Obstacle } from './Obstacle.js';
import { SeededRNG, generateMatchSeed, generateSeedCommitment } from '../utils/hash.js';

export class Match {
  public id: string;
  public state: MatchState;
  public players: Map<string, Player>;
  public obstacles: Map<string, Obstacle>;
  public config: GameConfig;
  public startTime: number | null;
  public endTime: number | null;
  public currentTick: number;
  public lastTickTime: number;
  private obstacleIdCounter: number;
  public rng: SeededRNG;
  public seedCommitment: string; // Hash of seed — shared before match starts (provable fairness)
  public auditLog: Array<{ tick: number; event: string; data: unknown }>;

  constructor(id: string, config: GameConfig) {
    this.id = id;
    this.state = MatchState.WAITING;
    this.players = new Map();
    this.obstacles = new Map();
    this.config = config;
    this.startTime = null;
    this.endTime = null;
    this.currentTick = 0;
    this.lastTickTime = Date.now();
    this.obstacleIdCounter = 0;
    const seed = generateMatchSeed();
    this.rng = new SeededRNG(seed);
    this.seedCommitment = generateSeedCommitment(seed);
    this.auditLog = [];
  }

  public addPlayer(player: Player): boolean {
    if (this.players.size >= this.config.maxPlayers) {
      return false;
    }
    if (this.state !== 'WAITING') {
      return false;
    }
    this.players.set(player.id, player);
    return true;
  }

  public removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    if (this.state === MatchState.WAITING || this.state === MatchState.FINISHED) {
      // Safe to fully remove — game not in progress
      this.players.delete(playerId);
    } else {
      // Match in progress — mark disconnected but keep state for reconnection
      player.disconnect();
    }

    this.logEvent('player_removed', { playerId, matchState: this.state });
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  public canStart(): boolean {
    if (this.state !== MatchState.WAITING) {
      return false;
    }
    // Dev mode: allow single player; production: minimum 2
    const minPlayers = this.config.devMode ? 1 : 2;
    if (this.players.size < minPlayers) {
      return false;
    }
    for (const player of this.players.values()) {
      if (player.state !== 'READY') {
        return false;
      }
    }
    return true;
  }

  public start(): void {
    if (!this.canStart()) {
      throw new Error('Cannot start match: conditions not met');
    }
    this.state = MatchState.IN_PROGRESS;
    this.startTime = Date.now();
    this.lastTickTime = this.startTime;

    // Initialize all players to playing state
    for (const player of this.players.values()) {
      player.startPlaying();
      player.position = { x: this.config.playerStartX, y: this.config.playerStartY };
      player.velocity = { x: 0, y: 0 };
    }

    this.logEvent('match_started', {
      players: Array.from(this.players.keys()),
      seedCommitment: this.seedCommitment,
    });
  }

  public update(currentTime: number): void {
    if (this.state !== MatchState.IN_PROGRESS) {
      return;
    }

    const deltaTime = (currentTime - this.lastTickTime) / 1000; // Convert to seconds
    this.lastTickTime = currentTime;
    this.currentTick++;

    // Update all players
    for (const player of this.players.values()) {
      if (player.state === 'PLAYING') {
        player.updatePosition(deltaTime, this.config.gravity);
        // Increment score proportional to time survived (normalized to ~60 per second)
        player.incrementScore(deltaTime * 60);
      }
    }

    // Update all obstacles
    for (const obstacle of this.obstacles.values()) {
      obstacle.update(deltaTime);

      // Remove obstacles that are off screen
      if (obstacle.isOffScreen()) {
        this.obstacles.delete(obstacle.id);
      }
    }

    // Check if match should end
    this.checkMatchEnd();
  }

  /** Seconds elapsed since match started */
  public getElapsedSeconds(): number {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /** Progressive speed based on elapsed time — relative to config.runnerSpeed */
  public getSpeed(elapsed: number): number {
    const base = this.config.runnerSpeed;
    // Phase multipliers derived from spec: 1.0x → 1.3x → 1.8x → 2.2x → 2.6x cap
    if (elapsed <= 6) return base;
    if (elapsed <= 15) return base * (1.0 + (0.3 / 9) * (elapsed - 6));
    if (elapsed <= 30) return base * (1.3 + (0.5 / 15) * (elapsed - 15));
    if (elapsed <= 45) return base * (1.8 + (0.4 / 15) * (elapsed - 30));
    return Math.min(base * 2.6, base * (2.2 + 0.04 * (elapsed - 45)));
  }

  /** Progressive spawn interval based on elapsed time — relative to config.obstacleSpawnRate */
  public getSpawnInterval(elapsed: number): number {
    const base = this.config.obstacleSpawnRate;
    // Multipliers: 1.25x → 1.0x → 0.7x → 0.5x → 0.35x floor
    if (elapsed <= 6) return base * 1.25;
    if (elapsed <= 15) return base * (1.25 - (0.25 / 9) * (elapsed - 6));
    if (elapsed <= 30) return base * (1.0 - (0.3 / 15) * (elapsed - 15));
    if (elapsed <= 45) return base * (0.7 - (0.2 / 15) * (elapsed - 30));
    return Math.max(base * 0.35, base * (0.5 - 0.015 * (elapsed - 45)));
  }

  public spawnObstacle(): void {
    const obstacleId = `obs_${this.id}_${this.obstacleIdCounter++}`;
    const spawnX = this.config.obstacleSpawnX;
    const speed = this.getSpeed(this.getElapsedSeconds());

    // Use seeded RNG — deterministic, auditable, same for all players
    const obstacle = this.rng.nextBool(0.5)
      ? Obstacle.createGroundSmall(obstacleId, spawnX, speed, this.config)
      : Obstacle.createAirHigh(obstacleId, spawnX, this.config.airHighSpawnY, speed, this.config);

    this.obstacles.set(obstacleId, obstacle);
    this.logEvent('obstacle_spawned', { obstacleId, type: obstacle.type, speed });
  }

  private static readonly MATCH_HARD_CAP_SECONDS = 90;

  private checkMatchEnd(): void {
    // Hard cap: force end at 90s
    if (this.getElapsedSeconds() >= Match.MATCH_HARD_CAP_SECONDS) {
      this.logEvent('match_hard_cap', { elapsed: this.getElapsedSeconds() });
      this.end();
      return;
    }

    // Count active players
    let activePlayers = 0;
    for (const player of this.players.values()) {
      if (player.state === 'PLAYING') {
        activePlayers++;
      }
    }

    // Dev mode (solo): end when 0 players remain
    // Production (multiplayer): end when 0 or 1 players remain
    const threshold = this.config.devMode ? 0 : 1;
    if (activePlayers <= threshold) {
      this.end();
    }
  }

  public end(): void {
    if (this.state !== MatchState.IN_PROGRESS) {
      return;
    }
    this.state = MatchState.FINISHED;
    this.endTime = Date.now();

    this.logEvent('match_ended', {
      scores: Array.from(this.players.values()).map(p => ({
        playerId: p.id,
        score: p.score,
        state: p.state,
      })),
    });
  }

  public getWinner(): Player | null {
    if (this.state !== MatchState.FINISHED) {
      return null;
    }

    let winner: Player | null = null;
    let highestScore = -1;

    for (const player of this.players.values()) {
      if (player.score > highestScore) {
        highestScore = player.score;
        winner = player;
      }
    }

    return winner;
  }

  public getSnapshot(): GameSnapshot {
    return {
      timestamp: Date.now(),
      tick: this.currentTick,
      players: Array.from(this.players.values()).map((p) => p.getSnapshot()),
      obstacles: Array.from(this.obstacles.values()).map((o) => o.getSnapshot()),
    };
  }

  public getActivePlayers(): Player[] {
    return Array.from(this.players.values()).filter(
      (p) => p.state === 'PLAYING'
    );
  }

  public isFull(): boolean {
    return this.players.size >= this.config.maxPlayers;
  }

  /** Append an entry to the audit log for this match */
  public logEvent(event: string, data: unknown): void {
    this.auditLog.push({ tick: this.currentTick, event, data });
  }

  /** Get the full audit trail (for post-match verification) */
  public getAuditTrail() {
    return {
      matchId: this.id,
      seed: this.rng.seed,
      seedCommitment: this.seedCommitment,
      startTime: this.startTime,
      endTime: this.endTime,
      events: this.auditLog,
    };
  }
}
