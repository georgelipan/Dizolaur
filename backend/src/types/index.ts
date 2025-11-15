// Core types and interfaces for the game

export interface Vector2D {
  x: number;
  y: number;
}

export interface BetData {
  stake: number;
  currency: string;
  gameConfig?: Record<string, unknown>;
}

export interface PlayerSession {
  playerId: string;
  token: string;
  platformUserId: string;
  betData: BetData;
  timestamp: number;
}

export interface GameConfig {
  maxPlayers: number;
  gravity: number;
  jumpVelocity: number;
  dinoSpeed: number;
  obstacleSpawnRate: number;
  tickRate: number; // Fixed timestep in ms (e.g., 16ms = ~60 FPS)
}

export enum MatchState {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export enum PlayerState {
  CONNECTED = 'CONNECTED',
  READY = 'READY',
  PLAYING = 'PLAYING',
  ELIMINATED = 'ELIMINATED',
  DISCONNECTED = 'DISCONNECTED',
}

export interface PlayerInput {
  playerId: string;
  timestamp: number;
  action: 'jump' | 'duck';
  sequenceNumber: number;
}

export interface GameSnapshot {
  timestamp: number;
  tick: number;
  players: Array<{
    playerId: string;
    position: Vector2D;
    velocity: Vector2D;
    state: PlayerState;
    score: number;
  }>;
  obstacles: Array<{
    id: string;
    position: Vector2D;
    width: number;
    height: number;
    type: 'cactus' | 'bird';
  }>;
}

export interface MatchResult {
  matchId: string;
  winnerId: string | null;
  players: Array<{
    playerId: string;
    platformUserId: string;
    score: number;
    ranking: number;
    winnings: number;
  }>;
  startTime: number;
  endTime: number;
}

export interface PlatformCallback {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
}
