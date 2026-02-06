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

  preload() {
    // Player sprites
    this.load.image('player_run1', '/assets/theme_mario/player_run1.png');
    this.load.image('player_run2', '/assets/theme_mario/player_run2.png');
    this.load.image('player_jump', '/assets/theme_mario/player_jump.png');

    // Ground obstacles (static)
    this.load.image('ground_small', '/assets/theme_mario/ground_small.png');
    this.load.image('ground_tall', '/assets/theme_mario/ground_tall.png');
    this.load.image('ground_wide', '/assets/theme_mario/ground_wide.png');

    // Air obstacles (2-frame animated)
    this.load.image('air_high_f1', '/assets/theme_mario/air_high_f1.png');
    this.load.image('air_high_f2', '/assets/theme_mario/air_high_f2.png');
    this.load.image('air_low_f1', '/assets/theme_mario/air_low_f1.png');
    this.load.image('air_low_f2', '/assets/theme_mario/air_low_f2.png');
    this.load.image('air_moving_f1', '/assets/theme_mario/air_moving_f1.png');
    this.load.image('air_moving_f2', '/assets/theme_mario/air_moving_f2.png');

    // Background & ground
    this.load.image('bg_far', '/assets/theme_mario/bg_far.png');
    this.load.image('ground_tile', '/assets/theme_mario/ground_tile.png');
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
    // Create animations (global, persist across scenes)
    if (!this.anims.exists('player_run')) {
      this.anims.create({
        key: 'player_run',
        frames: [{ key: 'player_run1' }, { key: 'player_run2' }],
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: 'air_high_anim',
        frames: [{ key: 'air_high_f1' }, { key: 'air_high_f2' }],
        frameRate: 4,
        repeat: -1,
      });
      this.anims.create({
        key: 'air_low_anim',
        frames: [{ key: 'air_low_f1' }, { key: 'air_low_f2' }],
        frameRate: 4,
        repeat: -1,
      });
      this.anims.create({
        key: 'air_moving_anim',
        frames: [{ key: 'air_moving_f1' }, { key: 'air_moving_f2' }],
        frameRate: 4,
        repeat: -1,
      });
    }

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
