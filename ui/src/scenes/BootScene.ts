import Phaser from 'phaser';
import { NetworkService } from '../services/NetworkService';
import { GameSession } from '../services/GameSession';

export class BootScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;

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

    // Create fresh network service
    this.networkService = new NetworkService('http://localhost:3000');

    // Store in registry for access from other scenes
    this.registry.set('networkService', this.networkService);
    this.registry.set('gameSession', this.gameSession);
  }

  async create() {
    // Show loading text
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
      // Connect to server
      await this.networkService.connect();

      // Authenticate with token (same token = same player = proper reconnection)
      const token = this.gameSession.getToken();
      this.networkService.authenticate(token);

      // Wait for authentication response
      this.networkService.on<any>('authenticated', (data: any) => {
        console.log('✅ Authenticated:', data);
        this.gameSession.setPlayerId(data.playerId);
        this.gameSession.setMatchId(data.matchId);
        this.gameSession.setMatchState(data.matchState);
        this.gameSession.setPlayerCount(data.players.length);

        // Move to waiting scene
        this.scene.start('WaitingScene');
      });

      this.networkService.on<any>('auth_error', (data: any) => {
        console.error('❌ Authentication failed:', data.message);
        loadingText.setText('Authentication failed: ' + data.message);
      });
    } catch (error) {
      console.error('❌ Connection failed:', error);
      loadingText.setText('Failed to connect to server');
    }
  }
}
