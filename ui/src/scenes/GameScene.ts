import Phaser from 'phaser';
import type { NetworkService } from '../services/NetworkService';
import type { GameSession } from '../services/GameSession';
import { InputBuffer } from '../services/InputBuffer';
import { PlayerSprite } from '../utils/PlayerSprite';
import { ObstacleSprite } from '../utils/ObstacleSprite';
import type { GameSnapshot, MatchResult } from '../types';
import { PlayerState } from '../types';

const DUCK_THROTTLE_MS = 100;
const MAX_PLAYERS = 10;
const MAX_OBSTACLES = 50;
const GROUND_Y = 500;

export class GameScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;
  private inputBuffer!: InputBuffer;

  private players: Map<string, PlayerSprite> = new Map();
  private obstacles: Map<string, ObstacleSprite> = new Map();

  private scoreText!: Phaser.GameObjects.Text;
  private currentScore = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private lastDuckTime = 0;

  // Store handler references for cleanup
  private onGameUpdate!: (snapshot: GameSnapshot) => void;
  private onMatchEnded!: (result: MatchResult) => void;

  // Scratch set for O(n) cleanup instead of O(n*m)
  private readonly activeIdSet: Set<string> = new Set();

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.networkService = this.registry.get('networkService');
    this.gameSession = this.registry.get('gameSession');
    this.inputBuffer = new InputBuffer();
    this.currentScore = 0;
    this.lastDuckTime = 0;
    this.players.clear();
    this.obstacles.clear();

    // Setup camera
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Draw ground
    const ground = this.add.rectangle(400, GROUND_Y + 25, 800, 50, 0x8B4513);
    ground.setOrigin(0.5);

    // Setup input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

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
    this.add.text(400, 16, 'Press SPACE or UP to Jump, DOWN to Duck', {
      fontSize: '18px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 0);

    // Network event listeners (stored for cleanup)
    this.onGameUpdate = (snapshot: GameSnapshot) => {
      this.handleGameUpdate(snapshot);
    };

    this.onMatchEnded = (result: MatchResult) => {
      this.scene.start('ResultsScene', { result });
    };

    this.networkService.on('game_update', this.onGameUpdate);
    this.networkService.on('match_ended', this.onMatchEnded);

    // Register shutdown for cleanup
    this.events.once('shutdown', this.shutdown, this);
  }

  update(_time: number, _delta: number) {
    if (!this.cursors || !this.spaceKey) return;

    // Handle jump input (JustDown = frame-rate independent)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.handleJumpInput();
    }

    // Handle duck input with throttle
    if (this.cursors.down?.isDown) {
      const now = Date.now();
      if (now - this.lastDuckTime >= DUCK_THROTTLE_MS) {
        this.lastDuckTime = now;
        this.handleDuckInput();
      }
    }
  }

  private handleJumpInput(): void {
    const input = this.inputBuffer.addInput('jump');
    this.networkService.sendInput(input);
  }

  private handleDuckInput(): void {
    const input = this.inputBuffer.addInput('duck');
    this.networkService.sendInput(input);
  }

  private handleGameUpdate(snapshot: GameSnapshot): void {
    // Validate snapshot structure
    if (!snapshot || !Array.isArray(snapshot.players) || !Array.isArray(snapshot.obstacles)) {
      return;
    }

    // Cap arrays to prevent denial-of-service
    const players = snapshot.players.slice(0, MAX_PLAYERS);
    const obstaclesData = snapshot.obstacles.slice(0, MAX_OBSTACLES);

    const myPlayerId = this.gameSession.getPlayerId();

    // Update players
    for (const playerData of players) {
      if (!playerData.playerId || !playerData.position) continue;

      const isLocalPlayer = playerData.playerId === myPlayerId;

      if (!this.players.has(playerData.playerId)) {
        const playerSprite = new PlayerSprite(
          this,
          playerData.playerId,
          playerData.position.x,
          GROUND_Y - playerData.position.y,
          isLocalPlayer
        );
        this.players.set(playerData.playerId, playerSprite);
      }

      const playerSprite = this.players.get(playerData.playerId)!;
      const screenY = GROUND_Y - playerData.position.y;

      playerSprite.updatePosition(
        { x: playerData.position.x, y: screenY },
        playerData.velocity
      );

      if (playerData.state === PlayerState.ELIMINATED) {
        playerSprite.eliminate();
      }

      if (isLocalPlayer && playerData.score !== this.currentScore) {
        this.currentScore = playerData.score;
        this.scoreText.setText(`Score: ${this.currentScore}`);
      }
    }

    // Remove disconnected players using Set for O(n) instead of O(n*m)
    this.activeIdSet.clear();
    for (const p of players) {
      this.activeIdSet.add(p.playerId);
    }
    for (const [playerId, sprite] of this.players.entries()) {
      if (!this.activeIdSet.has(playerId)) {
        sprite.destroy();
        this.players.delete(playerId);
      }
    }

    // Update obstacles
    for (const obstacleData of obstaclesData) {
      if (!obstacleData.id || !obstacleData.position) continue;

      if (!this.obstacles.has(obstacleData.id)) {
        const screenY = GROUND_Y - obstacleData.position.y;
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

      const obstacleSprite = this.obstacles.get(obstacleData.id)!;
      const screenY = GROUND_Y - obstacleData.position.y;
      obstacleSprite.updatePosition({ x: obstacleData.position.x, y: screenY });
    }

    // Remove off-screen obstacles using Set
    this.activeIdSet.clear();
    for (const o of obstaclesData) {
      this.activeIdSet.add(o.id);
    }
    for (const [obstacleId, sprite] of this.obstacles.entries()) {
      if (!this.activeIdSet.has(obstacleId)) {
        sprite.destroy();
        this.obstacles.delete(obstacleId);
      }
    }
  }

  shutdown() {
    // Clean up network listeners
    this.networkService.off('game_update', this.onGameUpdate);
    this.networkService.off('match_ended', this.onMatchEnded);

    // Clean up game objects
    for (const [, sprite] of this.players) {
      sprite.destroy();
    }
    this.players.clear();

    for (const [, sprite] of this.obstacles) {
      sprite.destroy();
    }
    this.obstacles.clear();
  }
}
