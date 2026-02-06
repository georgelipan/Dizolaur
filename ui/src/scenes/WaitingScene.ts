import Phaser from 'phaser';
import type { NetworkService } from '../services/NetworkService';
import type { GameSession } from '../services/GameSession';
import type { PlayerJoinedData, PlayerLeftData, PlayerReadyData, MatchStartingData } from '../types';
import { WaitingOverlay } from '../ui/WaitingOverlay';
import { AudioManager } from '../services/AudioManager';

export class WaitingScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;
  private overlay!: WaitingOverlay;

  private onPlayerJoined!: (data: PlayerJoinedData) => void;
  private onPlayerLeft!: (data: PlayerLeftData) => void;
  private onPlayerReady!: (data: PlayerReadyData) => void;
  private onMatchStarting!: (data: MatchStartingData) => void;

  constructor() {
    super({ key: 'WaitingScene' });
  }

  create() {
    this.networkService = this.registry.get('networkService');
    this.gameSession = this.registry.get('gameSession');

    // Dark background behind overlay
    this.cameras.main.setBackgroundColor('#0a0015');

    // Create and show HTML/CSS overlay
    this.overlay = new WaitingOverlay();
    this.overlay.show({
      betAmount: this.gameSession.getBetAmount(),
      currency: this.gameSession.getCurrency(),
      matchId: this.gameSession.getMatchId() || 'unknown',
      playerCount: this.gameSession.getPlayerCount(),
      maxPlayers: this.gameSession.getGameConfig()?.maxPlayers || 4,
    });

    // Wire ready button
    this.overlay.onReady(() => {
      this.overlay.setReady();
      this.networkService.setPlayerReady();

      // Preload jackpot sounds on user interaction (required for mobile autoplay policy)
      const audio = new AudioManager();
      audio.resume();
      audio.preloadJackpotSounds();
    });

    // Network event handlers
    this.onPlayerJoined = (data: PlayerJoinedData) => {
      this.gameSession.setPlayerCount(data.playerCount);
      this.overlay.updatePlayers(data.playerCount);
    };

    this.onPlayerLeft = (data: PlayerLeftData) => {
      this.gameSession.setPlayerCount(data.playerCount);
      this.overlay.updatePlayers(data.playerCount);
    };

    this.onPlayerReady = (data: PlayerReadyData) => {
      if (data.playerId === this.gameSession.getPlayerId()) {
        this.overlay.setReadyConfirmed();
      }
    };

    this.onMatchStarting = (data: MatchStartingData) => {
      this.gameSession.setGameConfig(data.config);
      this.overlay.setMatchStarting();

      // Delay then transition
      this.time.delayedCall(500, () => {
        this.overlay.hide();
        this.scene.start('GameScene');
      });
    };

    this.networkService.on('player_joined', this.onPlayerJoined);
    this.networkService.on('player_left', this.onPlayerLeft);
    this.networkService.on('player_ready', this.onPlayerReady);
    this.networkService.on('match_starting', this.onMatchStarting);

    this.events.once('shutdown', this.shutdown, this);
  }

  shutdown() {
    this.networkService.off('player_joined', this.onPlayerJoined);
    this.networkService.off('player_left', this.onPlayerLeft);
    this.networkService.off('player_ready', this.onPlayerReady);
    this.networkService.off('match_starting', this.onMatchStarting);
    this.overlay.destroy();
  }
}
