import type { GameConfig } from '../types/index.js';
import { ENV } from './env.js';

const {
  PORT, HOST, CORS_ORIGINS, PLATFORM_CALLBACK_URL, PLATFORM_API_KEY,
  NODE_ENV, MAX_PLAYERS, GRAVITY, JUMP_VELOCITY, RUNNER_SPEED,
  OBSTACLE_SPAWN_RATE, TICK_RATE, DEV_MODE,
  WORLD_WIDTH, WORLD_HEIGHT, GROUND_Y,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_START_X, PLAYER_START_Y,
  GROUND_SMALL_WIDTH, GROUND_SMALL_HEIGHT, AIR_HIGH_WIDTH, AIR_HIGH_HEIGHT,
  OBSTACLE_SPAWN_X, AIR_HIGH_SPAWN_Y,
} = ENV;

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  platformCallbackUrl: string | undefined;
  platformApiKey: string | undefined;
  gameConfig: GameConfig;
}

export const defaultServerConfig: ServerConfig = {
  port: parseInt(process.env[PORT] ?? '3000', 10),
  host: process.env[HOST] ?? '0.0.0.0',
  corsOrigins: process.env[CORS_ORIGINS]?.split(',') ?? ['http://localhost:5173', 'http://localhost:3000'],
  platformCallbackUrl: process.env[PLATFORM_CALLBACK_URL],
  platformApiKey: process.env[PLATFORM_API_KEY],
  gameConfig: {
    maxPlayers: parseInt(process.env[MAX_PLAYERS] ?? '4', 10),
    gravity: parseFloat(process.env[GRAVITY] ?? '800'),
    jumpVelocity: parseFloat(process.env[JUMP_VELOCITY] ?? '400'),
    runnerSpeed: parseFloat(process.env[RUNNER_SPEED] ?? '200'),
    obstacleSpawnRate: parseInt(process.env[OBSTACLE_SPAWN_RATE] ?? '2000', 10),
    tickRate: parseInt(process.env[TICK_RATE] ?? '16', 10),
    devMode: process.env[DEV_MODE] === 'true' || process.env[NODE_ENV] !== 'production',

    // World dimensions
    worldWidth: parseInt(process.env[WORLD_WIDTH] ?? '800', 10),
    worldHeight: parseInt(process.env[WORLD_HEIGHT] ?? '600', 10),
    groundY: parseInt(process.env[GROUND_Y] ?? '0', 10),

    // Player dimensions
    playerWidth: parseInt(process.env[PLAYER_WIDTH] ?? '40', 10),
    playerHeight: parseInt(process.env[PLAYER_HEIGHT] ?? '50', 10),
    playerStartX: parseInt(process.env[PLAYER_START_X] ?? '50', 10),
    playerStartY: parseInt(process.env[PLAYER_START_Y] ?? '0', 10),

    // Obstacle dimensions
    groundSmallWidth: parseInt(process.env[GROUND_SMALL_WIDTH] ?? '30', 10),
    groundSmallHeight: parseInt(process.env[GROUND_SMALL_HEIGHT] ?? '50', 10),
    airHighWidth: parseInt(process.env[AIR_HIGH_WIDTH] ?? '40', 10),
    airHighHeight: parseInt(process.env[AIR_HIGH_HEIGHT] ?? '30', 10),

    // Spawn positions
    obstacleSpawnX: parseInt(process.env[OBSTACLE_SPAWN_X] ?? '800', 10),
    airHighSpawnY: parseInt(process.env[AIR_HIGH_SPAWN_Y] ?? '100', 10),
  },
};

export function loadConfig(): ServerConfig {
  return defaultServerConfig;
}