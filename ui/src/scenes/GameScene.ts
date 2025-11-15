import Phaser from 'phaser';
import type { NetworkService } from '../services/NetworkService';
import type { GameSession } from '../services/GameSession';
import { InputBuffer } from '../services/InputBuffer';
import { PlayerSprite } from '../utils/PlayerSprite';
import { ObstacleSprite } from '../utils/ObstacleSprite';
import type { GameSnapshot } from '../types';

export class GameScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;
  private inputBuffer!: InputBuffer;

  private players: Map<string, PlayerSprite> = new Map();
  private obstacles: Map<string, ObstacleSprite> = new Map();

  private scoreText!: Phaser.GameObjects.Text;
  private currentScore = 0;

  private groundY = 500; // Ground level
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Get services from registry
    this.networkService = this.registry.get('networkService');
    this.gameSession = this.registry.get('gameSession');
    this.inputBuffer = new InputBuffer();

    // Setup camera
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue

    // Draw ground
    const ground = this.add.rectangle(400, this.groundY + 25, 800, 50, 0x8B4513);
    ground.setOrigin(0.5);

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // UI - Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '24px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 8, y: 4 },
    });

    // Match info
    const matchId = this.gameSession.getMatchId() || 'unknown';
    this.add.text(16, 50, `Match: ${matchId.substring(0, 12)}`, {
      fontSize: '14px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 4, y: 2 },
    });

    // Instructions
    this.add.text(400, 16, 'Press SPACE or UP to Jump', {
      fontSize: '18px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 0);

    // Network event listeners
    this.networkService.on('game_update', (snapshot: GameSnapshot) => {
      this.handleGameUpdate(snapshot);
    });

    this.networkService.on('match_ended', (result) => {
      console.log('Match ended:', result);
      this.scene.start('ResultsScene', { result });
    });

    console.log('🎮 Game started!');
  }

  update() {
    // Handle input
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.handleJumpInput();
    }

    if (this.cursors.down?.isDown) {
      this.handleDuckInput();
    }
  }

  private handleJumpInput(): void {
    const playerId = this.gameSession.getPlayerId();
    if (!playerId) return;

    const input = this.inputBuffer.addInput(playerId, 'jump');
    this.networkService.sendInput(input);
  }

  private handleDuckInput(): void {
    const playerId = this.gameSession.getPlayerId();
    if (!playerId) return;

    const input = this.inputBuffer.addInput(playerId, 'duck');
    this.networkService.sendInput(input);
  }

  private handleGameUpdate(snapshot: GameSnapshot): void {
    const myPlayerId = this.gameSession.getPlayerId();

    // Update players
    for (const playerData of snapshot.players) {
      const isLocalPlayer = playerData.playerId === myPlayerId;

      if (!this.players.has(playerData.playerId)) {
        // Create new player sprite
        const playerSprite = new PlayerSprite(
          this,
          playerData.playerId,
          playerData.position.x,
          this.groundY - playerData.position.y,
          isLocalPlayer
        );
        this.players.set(playerData.playerId, playerSprite);
      }

      // Update existing player
      const playerSprite = this.players.get(playerData.playerId)!;

      // Convert server Y (0 = ground) to screen Y (groundY = ground, up is negative)
      const screenY = this.groundY - playerData.position.y;

      playerSprite.updatePosition(
        { x: playerData.position.x, y: screenY },
        playerData.velocity
      );

      // Check if eliminated
      if (playerData.state === 'ELIMINATED') {
        playerSprite.eliminate();
      }

      // Update score if local player
      if (isLocalPlayer && playerData.score !== this.currentScore) {
        this.currentScore = playerData.score;
        this.scoreText.setText(`Score: ${this.currentScore}`);
      }
    }

    // Remove disconnected players
    for (const [playerId, sprite] of this.players.entries()) {
      const playerExists = snapshot.players.some((p) => p.playerId === playerId);
      if (!playerExists) {
        sprite.destroy();
        this.players.delete(playerId);
      }
    }

    // Update obstacles
    for (const obstacleData of snapshot.obstacles) {
      if (!this.obstacles.has(obstacleData.id)) {
        // Create new obstacle sprite
        const screenY = this.groundY - obstacleData.position.y;
        const obstacleSprite = new ObstacleSprite(
          this,
          obstacleData.id,
          { x: obstacleData.position.x, y: screenY },
          obstacleData.width,
          obstacleData.height,
          obstacleData.type
        );
        this.obstacles.set(obstacleData.id, obstacleSprite);
      }

      // Update existing obstacle
      const obstacleSprite = this.obstacles.get(obstacleData.id)!;
      const screenY = this.groundY - obstacleData.position.y;
      obstacleSprite.updatePosition({ x: obstacleData.position.x, y: screenY });
    }

    // Remove off-screen obstacles
    for (const [obstacleId, sprite] of this.obstacles.entries()) {
      const obstacleExists = snapshot.obstacles.some((o) => o.id === obstacleId);
      if (!obstacleExists) {
        sprite.destroy();
        this.obstacles.delete(obstacleId);
      }
    }
  }
}
