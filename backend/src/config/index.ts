import type { GameConfig } from '../types/index.js';

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  platformCallbackUrl: string | undefined;
  platformApiKey: string | undefined;
  gameConfig: GameConfig;
}

export const defaultServerConfig: ServerConfig = {
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  host: process.env['HOST'] ?? '0.0.0.0',
  corsOrigins: process.env['CORS_ORIGINS']?.split(',') ?? ['http://localhost:5173', 'http://localhost:3000'],
  platformCallbackUrl: process.env['PLATFORM_CALLBACK_URL'],
  platformApiKey: process.env['PLATFORM_API_KEY'],
  gameConfig: {
    maxPlayers: parseInt(process.env['MAX_PLAYERS'] ?? '4', 10),
    gravity: parseFloat(process.env['GRAVITY'] ?? '800'),
    jumpVelocity: parseFloat(process.env['JUMP_VELOCITY'] ?? '400'),
    dinoSpeed: parseFloat(process.env['DINO_SPEED'] ?? '200'),
    obstacleSpawnRate: parseInt(process.env['OBSTACLE_SPAWN_RATE'] ?? '2000', 10),
    tickRate: parseInt(process.env['TICK_RATE'] ?? '16', 10),
    devMode: process.env['DEV_MODE'] === 'true' || process.env['NODE_ENV'] !== 'production',
  },
};

export function loadConfig(): ServerConfig {
  return defaultServerConfig;
}
