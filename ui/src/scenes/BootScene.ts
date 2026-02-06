/**
 * BootScene - Vegas Casino Neon Style
 * Displays DIZOLAUR title and "PLAY FOR REAL. WIN FOR REAL." in neon style
 * Handles server connection and authentication
 */

import Phaser from 'phaser';
import { NetworkService } from '../services/NetworkService';
import { GameSession } from '../services/GameSession';
import type { AuthenticatedData } from '../types';
import { BootOverlay } from '../ui/BootOverlay';

const AUTH_TIMEOUT_MS = 10000;

export class BootScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;
  private overlay!: BootOverlay;
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
    // Dark background
    this.cameras.main.setBackgroundColor('#0a0015');

    // Create and show overlay
    this.overlay = new BootOverlay();
    this.overlay.show();
    this.overlay.setStatus('⏳ CONNECTING TO SERVER...');

    try {
      const token = this.gameSession.getToken();

      // Connect with token in auth handshake
      await this.networkService.connect(token);

      this.overlay.setStatus('🔐 AUTHENTICATING...');

      // Authenticate
      this.networkService.authenticate(token);

      // Auth timeout
      const authTimeout = this.time.delayedCall(AUTH_TIMEOUT_MS, () => {
        this.overlay.setStatus('⚠️ CONNECTION TIMED OUT', true);
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

        this.overlay.setStatus('✅ CONNECTED! ENTERING ARENA...');

        // Delay then transition (6 seconds to show the neon splash)
        this.time.delayedCall(6000, () => {
          this.cleanupListeners();
          this.overlay.hide();
          this.scene.start('WaitingScene');
        });
      };

      this.onAuthError = (_data: { message: string }) => {
        authTimeout.destroy();
        this.overlay.setStatus('❌ AUTHENTICATION FAILED', true);
        this.cleanupListeners();
      };

      this.networkService.on('authenticated', this.onAuthenticated);
      this.networkService.on('auth_error', this.onAuthError);
    } catch {
      this.overlay.setStatus('❌ CONNECTION FAILED', true);
    }

    this.events.once('shutdown', this.shutdown, this);
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
    if (this.overlay) {
      this.overlay.destroy();
    }
  }
}
