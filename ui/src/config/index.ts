/**
 * Application configuration
 * Reads from environment variables set by Vite
 */

export interface AppConfig {
  backendUrl: string;
  debugMode: boolean;
}

/**
 * Load configuration from environment variables
 * Vite exposes env vars prefixed with VITE_ through import.meta.env
 */
export function loadConfig(): AppConfig {
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
  const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  if (!backendUrl) {
    console.warn('⚠️ VITE_BACKEND_URL not set, using default: http://localhost:3000');
  }

  return {
    backendUrl: backendUrl || 'http://localhost:3000',
    debugMode,
  };
}

/**
 * Global config instance
 */
export const config = loadConfig();
