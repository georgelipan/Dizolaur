import Phaser from 'phaser';
import { NetworkService } from '../services/NetworkService';
import { GameSession } from '../services/GameSession';
import type { AuthenticatedData } from '../types';

const AUTH_TIMEOUT_MS = 10000;

export class BootScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;
  private onAuthenticated!: (data: AuthenticatedData) => void;
  private onAuthError!: (data: { message: string }) => void;

  constructor() {
    super({ key: 'BootScene' });
  }

  init() {
    this.gameSession = GameSession.getInstance();

    // Disconnect old network service if it exists (Play Again flow)
    const existingNetwork: NetworkService | undefined = this.registry.get('networkService');
    if (existingNetwork) {
      existingNetwork.disconnect();
    }

    // Create fresh network service (URL from env or fallback)
    this.networkService = new NetworkService();

    // Store in registry for access from other scenes
    this.registry.set('networkService', this.networkService);
    this.registry.set('gameSession', this.gameSession);
  }

  async create() {
    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Connecting to server...',
      {
        fontSize: '24px',
        color: '#ffffff',
      }
    );
    loadingText.setOrigin(0.5);

    try {
      const token = this.gameSession.getToken();

      // Connect with token in auth handshake
      await this.networkService.connect(token);

      // Authenticate
      this.networkService.authenticate(token);

      // Auth timeout
      const authTimeout = this.time.delayedCall(AUTH_TIMEOUT_MS, () => {
        loadingText.setText('Authentication timed out. Please refresh.');
        this.cleanupListeners();
      });

      // Store handler references for cleanup
      this.onAuthenticated = (data: AuthenticatedData) => {
        authTimeout.destroy();
        this.gameSession.setPlayerId(data.playerId);
        this.gameSession.setMatchId(data.matchId);
        this.gameSession.setMatchState(data.matchState);
        this.gameSession.setPlayerCount(data.players.length);

        // Use server-provided bet/currency if available
        if (data.betAmount != null) {
          this.gameSession.setBetAmount(data.betAmount);
        }
        if (data.currency) {
          this.gameSession.setCurrency(data.currency);
        }

        this.cleanupListeners();
        this.scene.start('WaitingScene');
      };

      this.onAuthError = (_data: { message: string }) => {
        authTimeout.destroy();
        loadingText.setText('Authentication failed. Please try again.');
        this.cleanupListeners();
      };

      this.networkService.on('authenticated', this.onAuthenticated);
      this.networkService.on('auth_error', this.onAuthError);
    } catch {
      loadingText.setText('Failed to connect to server');
    }
  }

  private cleanupListeners(): void {
    if (this.onAuthenticated) {
      this.networkService.off('authenticated', this.onAuthenticated);
    }
    if (this.onAuthError) {
      this.networkService.off('auth_error', this.onAuthError);
    }
  }

  shutdown() {
    this.cleanupListeners();
  }
}
