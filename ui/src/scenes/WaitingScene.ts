import Phaser from 'phaser';
import type { NetworkService } from '../services/NetworkService';
import type { GameSession } from '../services/GameSession';
import type { PlayerJoinedData, PlayerLeftData, PlayerReadyData, MatchStartingData } from '../types';

export class WaitingScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;
  private statusText!: Phaser.GameObjects.Text;
  private playerCountText!: Phaser.GameObjects.Text;
  private readyButton!: Phaser.GameObjects.Rectangle;
  private readyButtonText!: Phaser.GameObjects.Text;
  private isReady = false;

  // Store handler references for cleanup
  private onPlayerJoined!: (data: PlayerJoinedData) => void;
  private onPlayerLeft!: (data: PlayerLeftData) => void;
  private onPlayerReady!: (data: PlayerReadyData) => void;
  private onMatchStarting!: (data: MatchStartingData) => void;

  constructor() {
    super({ key: 'WaitingScene' });
  }

  create() {
    this.isReady = false;
    this.networkService = this.registry.get('networkService');
    this.gameSession = this.registry.get('gameSession');

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Title
    this.add.text(centerX, 100, 'Multiplayer Dino Game', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Match info
    const matchId = this.gameSession.getMatchId() || 'unknown';
    this.add.text(centerX, 160, `Match: ${matchId.substring(0, 16)}...`, {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Bet info
    const betAmount = this.gameSession.getBetAmount();
    const currency = this.gameSession.getCurrency();
    this.add.text(centerX, 190, `Bet: ${betAmount} ${currency}`, {
      fontSize: '18px',
      color: '#ffff00',
    }).setOrigin(0.5);

    // Status text
    this.statusText = this.add.text(centerX, centerY - 50, 'Waiting for players...', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Player count
    this.playerCountText = this.add.text(centerX, centerY, '', {
      fontSize: '20px',
      color: '#00ff00',
    }).setOrigin(0.5);
    this.updatePlayerCount();

    // Ready button
    this.readyButton = this.add.rectangle(centerX, centerY + 80, 200, 50, 0x00aa00);
    this.readyButton.setInteractive({ useHandCursor: true });
    this.readyButton.setStrokeStyle(2, 0xffffff);

    this.readyButtonText = this.add.text(centerX, centerY + 80, 'READY', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.readyButton.on('pointerdown', () => {
      if (!this.isReady) {
        this.setReady();
      }
    });

    this.readyButton.on('pointerover', () => {
      this.readyButton.setFillStyle(0x00dd00);
    });

    this.readyButton.on('pointerout', () => {
      this.readyButton.setFillStyle(this.isReady ? 0x666666 : 0x00aa00);
    });

    // Define handlers with stored references
    this.onPlayerJoined = (data: PlayerJoinedData) => {
      this.gameSession.setPlayerCount(data.playerCount);
      this.updatePlayerCount();
    };

    this.onPlayerLeft = (data: PlayerLeftData) => {
      this.gameSession.setPlayerCount(data.playerCount);
      this.updatePlayerCount();
    };

    this.onPlayerReady = (data: PlayerReadyData) => {
      if (data.playerId === this.gameSession.getPlayerId()) {
        this.statusText.setText('You are ready! Waiting for others...');
      }
    };

    this.onMatchStarting = (data: MatchStartingData) => {
      this.gameSession.setGameConfig(data.config);
      this.statusText.setText('Match starting!');

      this.time.delayedCall(1000, () => {
        this.scene.start('GameScene');
      });
    };

    this.networkService.on('player_joined', this.onPlayerJoined);
    this.networkService.on('player_left', this.onPlayerLeft);
    this.networkService.on('player_ready', this.onPlayerReady);
    this.networkService.on('match_starting', this.onMatchStarting);

    // Register shutdown for cleanup
    this.events.once('shutdown', this.shutdown, this);
  }

  private setReady(): void {
    this.isReady = true;
    this.readyButton.setFillStyle(0x666666);
    this.readyButtonText.setText('WAITING...');
    this.readyButton.disableInteractive();

    this.networkService.setPlayerReady();
  }

  private updatePlayerCount(): void {
    const count = this.gameSession.getPlayerCount();
    const maxPlayers = this.gameSession.getGameConfig()?.maxPlayers || 4;
    this.playerCountText.setText(`Players: ${count}/${maxPlayers}`);
  }

  shutdown() {
    this.networkService.off('player_joined', this.onPlayerJoined);
    this.networkService.off('player_left', this.onPlayerLeft);
    this.networkService.off('player_ready', this.onPlayerReady);
    this.networkService.off('match_starting', this.onMatchStarting);
  }
}
