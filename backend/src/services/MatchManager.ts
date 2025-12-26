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

    // Config comes from loadConfig() in server.ts which reads from .env
    // These hardcoded values are only fallbacks if no config is provided
    if (config) {
      this.defaultConfig = config as GameConfig;
    } else {
      // Fallback defaults (should rarely be used - config always comes from .env)
      this.defaultConfig = {
        maxPlayers: 4,
        minPlayers: 1,
        gravity: 800,
        jumpVelocity: 400,
        dinoSpeed: 200,
        obstacleSpawnRate: 2000,
        tickRate: 16,
      };
    }
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

    // Check if player is already in ANOTHER match
    const existingMatchId = this.playerToMatch.get(session.playerId);
    if (existingMatchId && existingMatchId !== matchId) {
      console.warn(`Player ${session.playerId} already in match ${existingMatchId}, removing from old match`);
      this.removePlayerFromMatch(session.playerId);
    }

    // Check if player already exists in THIS match (reconnection)
    const existingPlayer = match.getPlayer(session.playerId);
    if (existingPlayer) {
      // Player reconnecting - update socket ID (this also reconnects if disconnected)
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
    const match = this.matches.get(matchId);
    if (!match) {
      return;
    }

    const spawnInterval = setInterval(() => {
      const currentMatch = this.matches.get(matchId);
      if (!currentMatch || currentMatch.state !== MatchState.IN_PROGRESS) {
        clearInterval(spawnInterval);
        return;
      }

      currentMatch.spawnObstacle();
    }, match.config.obstacleSpawnRate);
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
