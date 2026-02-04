import { Match } from '../models/Match.js';
import { Player } from '../models/Player.js';
import type { GameConfig, PlayerSession, MatchResult } from '../types/index.js';
import { MatchState } from '../types/index.js';
import { PhysicsEngine } from './PhysicsEngine.js';

export class MatchManager {
  private matches: Map<string, Match>;
  private playerToMatch: Map<string, string>; // playerId -> matchId
  private matchIdCounter: number;
  private physicsEngine: PhysicsEngine;
  private defaultConfig: GameConfig;

  constructor(config?: Partial<GameConfig>) {
    this.matches = new Map();
    this.playerToMatch = new Map();
    this.matchIdCounter = 0;
    this.physicsEngine = new PhysicsEngine();

    this.defaultConfig = {
      maxPlayers: 4,
      gravity: 800, // pixels per second squared
      jumpVelocity: 400, // pixels per second
      runnerSpeed: 200, // pixels per second
      obstacleSpawnRate: 2000, // ms between spawns
      tickRate: 16, // ~60 FPS
      devMode: false,

      // World dimensions
      worldWidth: 800,
      worldHeight: 600,
      groundY: 0,

      // Player dimensions
      playerWidth: 40,
      playerHeight: 50,
      playerStartX: 50,
      playerStartY: 0,

      // Obstacle dimensions
      groundSmallWidth: 30,
      groundSmallHeight: 50,
      airHighWidth: 40,
      airHighHeight: 30,

      // Spawn positions
      obstacleSpawnX: 800,
      airHighSpawnY: 100,

      ...config,
    };
  }

  public createMatch(config?: Partial<GameConfig>): Match {
    const matchId = `match_${this.matchIdCounter++}_${Date.now()}`;
    const matchConfig = { ...this.defaultConfig, ...config };
    const match = new Match(matchId, matchConfig);
    this.matches.set(matchId, match);
    console.log(`Match created: ${matchId}`);
    return match;
  }

  public findOrCreateMatch(): Match {
    // Try to find an available match
    for (const match of this.matches.values()) {
      if (match.state === MatchState.WAITING && !match.isFull()) {
        return match;
      }
    }

    // No available match, create new one
    return this.createMatch();
  }

  public addPlayerToMatch(
    matchId: string,
    session: PlayerSession,
    socketId: string
  ): Player | null {
    const match = this.matches.get(matchId);
    if (!match) {
      return null;
    }

    // Check if player already exists in match (reconnection)
    const existingPlayer = match.getPlayer(session.playerId);
    if (existingPlayer) {
      // Player reconnecting - update socket ID
      existingPlayer.updateSocketId(socketId);
      console.log(`Player ${existingPlayer.id} reconnected to match ${matchId}`);
      return existingPlayer;
    }

    // New player - create and add
    const player = new Player(session, socketId);
    const added = match.addPlayer(player);

    if (added) {
      this.playerToMatch.set(player.id, matchId);
      console.log(`Player ${player.id} joined match ${matchId}`);
      return player;
    }

    return null;
  }

  public removePlayerFromMatch(playerId: string): void {
    const matchId = this.playerToMatch.get(playerId);
    if (!matchId) {
      return;
    }

    const match = this.matches.get(matchId);
    if (match) {
      match.removePlayer(playerId);
      console.log(`Player ${playerId} removed from match ${matchId}`);

      // Clean up empty waiting matches
      if (match.state === MatchState.WAITING && match.players.size === 0) {
        this.matches.delete(matchId);
        console.log(`Empty match ${matchId} deleted`);
      }
    }

    this.playerToMatch.delete(playerId);
  }

  public getMatchForPlayer(playerId: string): Match | undefined {
    const matchId = this.playerToMatch.get(playerId);
    if (!matchId) {
      return undefined;
    }
    return this.matches.get(matchId);
  }

  public startMatch(matchId: string): boolean {
    const match = this.matches.get(matchId);
    if (!match || !match.canStart()) {
      return false;
    }

    match.start();
    console.log(`Match ${matchId} started with ${match.players.size} players`);

    // Start obstacle spawning
    this.startObstacleSpawning(matchId);

    return true;
  }

  private startObstacleSpawning(matchId: string): void {
    const scheduleNext = () => {
      const match = this.matches.get(matchId);
      if (!match || match.state !== MatchState.IN_PROGRESS) {
        return;
      }

      match.spawnObstacle();

      // Recalculate interval based on current difficulty phase
      const interval = match.getSpawnInterval(match.getElapsedSeconds());
      setTimeout(scheduleNext, interval);
    };

    // Schedule first spawn using initial interval
    const match = this.matches.get(matchId);
    if (!match) return;
    const initialInterval = match.getSpawnInterval(0);
    setTimeout(scheduleNext, initialInterval);
  }

  public updateAllMatches(): void {
    const now = Date.now();
    for (const match of this.matches.values()) {
      if (match.state === MatchState.IN_PROGRESS) {
        this.physicsEngine.updateMatch(match);
      }

      // Clean up finished matches after a delay
      if (match.state === MatchState.FINISHED && match.endTime) {
        const timeSinceEnd = now - match.endTime;
        if (timeSinceEnd > 5000) {
          // 5 seconds
          this.cleanupMatch(match.id);
        }
      }
    }
  }

  private cleanupMatch(matchId: string): void {
    const match = this.matches.get(matchId);
    if (!match) {
      return;
    }

    // Remove all player mappings
    for (const playerId of match.players.keys()) {
      this.playerToMatch.delete(playerId);
    }

    this.matches.delete(matchId);
    console.log(`Match ${matchId} cleaned up`);
  }

  public calculateMatchResult(matchId: string): MatchResult | null {
    const match = this.matches.get(matchId);
    if (!match || match.state !== MatchState.FINISHED) {
      return null;
    }

    // Sort players by score
    const sortedPlayers = Array.from(match.players.values()).sort(
      (a, b) => b.score - a.score
    );

    const winner = match.getWinner();
    const totalPot = Array.from(match.players.values()).reduce(
      (sum, p) => sum + p.betData.stake,
      0
    );

    // Calculate winnings (simple winner-takes-all for now)
    const result: MatchResult = {
      matchId: match.id,
      winnerId: winner?.id ?? null,
      players: sortedPlayers.map((player, index) => ({
        playerId: player.id,
        platformUserId: player.platformUserId,
        score: player.score,
        ranking: index + 1,
        winnings: player.id === winner?.id ? totalPot * 0.95 : 0, // 5% house fee
      })),
      startTime: match.startTime ?? 0,
      endTime: match.endTime ?? 0,
    };

    return result;
  }

  public getPhysicsEngine(): PhysicsEngine {
    return this.physicsEngine;
  }

  public getMatch(matchId: string): Match | undefined {
    return this.matches.get(matchId);
  }

  public getAllMatches(): Match[] {
    return Array.from(this.matches.values());
  }
}
