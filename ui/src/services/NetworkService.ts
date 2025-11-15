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
} from '../types';

type EventCallback<T> = (data: T) => void;

export class NetworkService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private isConnected = false;
  private eventHandlers: Map<string, EventCallback<any>[]> = new Map();

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to game server');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from game server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      // Register server event listeners
      this.registerServerEvents();
    });
  }

  private registerServerEvents(): void {
    if (!this.socket) return;

    this.socket.on('authenticated', (data: AuthenticatedData) => {
      this.emit('authenticated', data);
    });

    this.socket.on('auth_error', (data: { message: string }) => {
      this.emit('auth_error', data);
    });

    this.socket.on('player_joined', (data: PlayerJoinedData) => {
      this.emit('player_joined', data);
    });

    this.socket.on('player_left', (data: PlayerLeftData) => {
      this.emit('player_left', data);
    });

    this.socket.on('player_ready', (data: PlayerReadyData) => {
      this.emit('player_ready', data);
    });

    this.socket.on('match_starting', (data: MatchStartingData) => {
      this.emit('match_starting', data);
    });

    this.socket.on('game_update', (data: GameSnapshot) => {
      this.emit('game_update', data);
    });

    this.socket.on('match_ended', (data: MatchResult) => {
      this.emit('match_ended', data);
    });
  }

  public authenticate(token: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('authenticate', { token });
  }

  public setPlayerReady(): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('player_ready');
  }

  public sendInput(input: PlayerInput): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('player_input', input);
  }

  public on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  public off(event: string, callback: EventCallback<any>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit<T>(event: string, data: T): void {
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
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
