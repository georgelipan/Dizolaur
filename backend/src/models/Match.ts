import type { GameConfig, GameSnapshot } from '../types/index.js';
import { MatchState } from '../types/index.js';
import { Player } from './Player.js';
import { Obstacle } from './Obstacle.js';

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
    if (!player) {
      return;
    }

    // If match hasn't started or is finished, fully remove player
    if (this.state === MatchState.WAITING || this.state === MatchState.FINISHED) {
      this.players.delete(playerId);
      console.log(`Player ${playerId} removed from match ${this.id}`);
    } else {
      // During active match, mark as disconnected but keep in game
      player.disconnect();
      console.log(`Player ${playerId} disconnected from active match ${this.id}`);
    }
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  public canStart(): boolean {
    if (this.state !== MatchState.WAITING) {
      return false;
    }

    // Count only connected/ready players (not disconnected)
    const connectedPlayers = Array.from(this.players.values()).filter(
      (p) => p.state !== 'DISCONNECTED'
    );

    // Need at least minPlayers connected players, all must be ready
    if (connectedPlayers.length < this.config.minPlayers) {
       return false;
    }

    for (const player of connectedPlayers) {
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
      player.position = { x: 50, y: 0 }; // Starting position
      player.velocity = { x: 0, y: 0 };
    }
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
        // Increment score based on time survived
        player.incrementScore(1);
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

  public spawnObstacle(): void {
    const obstacleId = `obs_${this.id}_${this.obstacleIdCounter++}`;
    const spawnX = 800; // Right edge of screen
    const speed = this.config.dinoSpeed;

    // Randomly spawn either cactus or bird
    const obstacle =
      Math.random() > 0.5
        ? Obstacle.createCactus(obstacleId, spawnX, speed)
        : Obstacle.createBird(obstacleId, spawnX, 100, speed); // Birds at height 100

    this.obstacles.set(obstacleId, obstacle);
  }

  private checkMatchEnd(): void {
    // Count active players
    let activePlayers = 0;
    for (const player of this.players.values()) {
      if (player.state === 'PLAYING') {
        activePlayers++;
      }
    }

    // Match ends when 0 or 1 players remain
    if (activePlayers <= 1) {
      this.end();
    }
  }

  public end(): void {
    if (this.state !== MatchState.IN_PROGRESS) {
      return;
    }
    this.state = MatchState.FINISHED;
    this.endTime = Date.now();
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
}
