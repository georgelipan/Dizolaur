import { io, Socket } from 'socket.io-client';
import type {
  GameSnapshot,
  MatchResult,
  AuthenticatedData,
  MatchStartingData,
  PlayerJoinedData,
  PlayerLeftData,
  PlayerReadyData,
  PlayerInput,
  ServerEventMap,
} from '../types';

type EventCallback<T> = (data: T) => void;

export class NetworkService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private isConnected = false;
  private token: string | null = null;
  private eventHandlers: Map<string, EventCallback<unknown>[]> = new Map();

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || import.meta.env.VITE_SERVER_URL || this.getDefaultServerUrl();
  }

  private getDefaultServerUrl(): string {
    // If accessing from non-localhost, use the same host for backend
    const { hostname, protocol } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:3000`;
    }
    return 'http://localhost:3000';
  }

  public connect(token: string): Promise<void> {
    this.token = token;

    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: { token },
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      // Re-authenticate on reconnection
      this.socket.io.on('reconnect', () => {
        this.isConnected = true;
        if (this.token) {
          this.authenticate(this.token);
        }
      });

      this.registerServerEvents();
    });
  }

  private registerServerEvents(): void {
    if (!this.socket) return;

    this.socket.on('authenticated', (data: AuthenticatedData) => {
      this.emitLocal('authenticated', data);
    });

    this.socket.on('auth_error', (data: { message: string }) => {
      this.emitLocal('auth_error', data);
    });

    this.socket.on('player_joined', (data: PlayerJoinedData) => {
      this.emitLocal('player_joined', data);
    });

    this.socket.on('player_left', (data: PlayerLeftData) => {
      this.emitLocal('player_left', data);
    });

    this.socket.on('player_ready', (data: PlayerReadyData) => {
      this.emitLocal('player_ready', data);
    });

    this.socket.on('match_starting', (data: MatchStartingData) => {
      this.emitLocal('match_starting', data);
    });

    this.socket.on('game_update', (data: GameSnapshot) => {
      this.emitLocal('game_update', data);
    });

    this.socket.on('match_ended', (data: MatchResult) => {
      this.emitLocal('match_ended', data);
    });
  }

  public authenticate(token: string): void {
    if (!this.socket || !this.isConnected) return;
    this.token = token;
    this.socket.emit('authenticate', { token });
  }

  public setPlayerReady(): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('player_ready');
  }

  public sendInput(input: PlayerInput): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('player_input', input);
  }

  public on<K extends keyof ServerEventMap>(event: K, callback: EventCallback<ServerEventMap[K]>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback as EventCallback<unknown>);
  }

  public off<K extends keyof ServerEventMap>(event: K, callback: EventCallback<ServerEventMap[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(callback as EventCallback<unknown>);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public removeAllListeners(event?: keyof ServerEventMap): void {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }

  private emitLocal<K extends keyof ServerEventMap>(event: K, data: ServerEventMap[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.eventHandlers.clear();
    this.token = null;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
