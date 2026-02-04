// Shared types between client and server

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerSnapshot {
  playerId: string;
  position: Vector2D;
  velocity: Vector2D;
  state: PlayerState;
  score: number;
}

export interface ObstacleSnapshot {
  id: string;
  position: Vector2D;
  width: number;
  height: number;
  type: 'ground_small' | 'ground_tall' | 'ground_wide' | 'air_high' | 'air_low' | 'air_moving';
}

export interface GameSnapshot {
  timestamp: number;
  tick: number;
  players: PlayerSnapshot[];
  obstacles: ObstacleSnapshot[];
}

export enum PlayerState {
  CONNECTED = 'CONNECTED',
  READY = 'READY',
  PLAYING = 'PLAYING',
  ELIMINATED = 'ELIMINATED',
  DISCONNECTED = 'DISCONNECTED',
}

export enum MatchState {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

// PlayerInput no longer includes playerId - server determines identity from socket session
export interface PlayerInput {
  timestamp: number;
  action: 'jump' | 'duck';
  sequenceNumber: number;
}

export interface GameConfig {
  maxPlayers: number;
  gravity: number;
  jumpVelocity: number;
  runnerSpeed: number;
  obstacleSpawnRate: number;
  tickRate: number;

  // World dimensions
  worldWidth: number;
  worldHeight: number;
  groundY: number;

  // Player dimensions
  playerWidth: number;
  playerHeight: number;
  playerStartX: number;
  playerStartY: number;

  // Obstacle dimensions
  groundSmallWidth: number;
  groundSmallHeight: number;
  groundTallWidth: number;
  groundTallHeight: number;
  groundWideWidth: number;
  groundWideHeight: number;
  airHighWidth: number;
  airHighHeight: number;
  airLowWidth: number;
  airLowHeight: number;
  airMovingWidth: number;
  airMovingHeight: number;

  // Spawn positions
  obstacleSpawnX: number;
  airHighSpawnY: number;
  airLowSpawnY: number;
  airMovingBaseY: number;

  // Phase thresholds (seconds)
  phase2Start: number;
  phase3Start: number;
  phase4Start: number;
  phase5Start: number;
}

export interface MatchResult {
  matchId: string;
  winnerId: string | null;
  players: Array<{
    playerId: string;
    score: number;
    ranking: number;
    winnings: number;
  }>;
  startTime: number;
  endTime: number;
}

// Client-specific types

export interface SessionData {
  token: string;
  playerId?: string;
  matchId?: string;
  betAmount?: number;
  currency?: string;
}

export interface AuthenticatedData {
  playerId: string;
  matchId: string;
  matchState: MatchState;
  betAmount: number;
  currency: string;
  players: Array<{
    id: string;
    state: PlayerState;
  }>;
}

export interface MatchStartingData {
  matchId: string;
  startTime: number;
  config: GameConfig;
}

export interface PlayerJoinedData {
  playerId: string;
  playerCount: number;
}

export interface PlayerLeftData {
  playerId: string;
  playerCount: number;
}

export interface PlayerReadyData {
  playerId: string;
}

// Typed event map for NetworkService
export interface ServerEventMap {
  authenticated: AuthenticatedData;
  auth_error: { message: string };
  player_joined: PlayerJoinedData;
  player_left: PlayerLeftData;
  player_ready: PlayerReadyData;
  match_starting: MatchStartingData;
  game_update: GameSnapshot;
  match_ended: MatchResult;
}
