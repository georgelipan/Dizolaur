import Phaser from 'phaser';
import type { NetworkService } from '../services/NetworkService';
import type { GameSession } from '../services/GameSession';
import { InputBuffer } from '../services/InputBuffer';
import { PlayerSprite } from '../utils/PlayerSprite';
import { ObstacleSprite } from '../utils/ObstacleSprite';
import type { GameSnapshot, GameConfig, MatchResult } from '../types';
import { PlayerState } from '../types';
import { showNearMissEffect } from '../utils/NearMissEffect';
import { SpeedLines } from '../effects/SpeedLines';
import { ScreenShake } from '../effects/ScreenShake';
import { ParticleManager } from '../effects/ParticleManager';

const DUCK_THROTTLE_MS = 100;
const MAX_PLAYERS = 10;
const MAX_OBSTACLES = 50;

// Background color shift per phase
const PHASE_COLORS = {
  sky:    [0x87CEEB, 0x7BC8E8, 0xE8A87C, 0xD4735E, 0xB8433A],
  ground: [0x8B4513, 0x7D3C0F, 0x6B340D, 0x5A2D0B, 0x4A2509],
};

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export class GameScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;
  private inputBuffer!: InputBuffer;
  private config!: GameConfig;
  private groundYScreen!: number;

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

  // Visual effects (F07)
  private speedLines!: SpeedLines;
  private screenShake!: ScreenShake;
  private particleManager!: ParticleManager;
  private groundRect!: Phaser.GameObjects.Rectangle;
  private currentPhase = 1;
  private wasAirborne = false;
  private wasEliminated = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.networkService = this.registry.get('networkService');
    this.gameSession = this.registry.get('gameSession');

    // Get game config from server (sent in match_starting event)
    const config = this.gameSession.getGameConfig();
    if (!config) {
      console.error('GameConfig not available in GameScene');
      return;
    }
    this.config = config;

    // Calculate screen ground Y from server world dimensions
    // Backend uses Y=0 as ground, frontend inverts Y axis
    this.groundYScreen = config.worldHeight - 100;

    this.inputBuffer = new InputBuffer();
    this.currentScore = 0;
    this.lastDuckTime = 0;
    this.currentPhase = 1;
    this.wasAirborne = false;
    this.wasEliminated = false;
    this.players.clear();
    this.obstacles.clear();

    // Setup camera
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Draw ground using config dimensions
    this.groundRect = this.add.rectangle(
      this.config.worldWidth / 2,
      this.groundYScreen + 25,
      this.config.worldWidth,
      50,
      0x8B4513
    );
    this.groundRect.setOrigin(0.5);

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
    this.scoreText.setDepth(50);

    // Match info
    const matchId = this.gameSession.getMatchId() || 'unknown';
    const matchText = this.add.text(16, 50, `Match: ${matchId.substring(0, 12)}`, {
      fontSize: '14px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 4, y: 2 },
    });
    matchText.setDepth(50);

    // Instructions
    const instrText = this.add.text(this.config.worldWidth / 2, 16, 'Press SPACE or UP to Jump, DOWN to Duck', {
      fontSize: '18px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 8, y: 4 },
    });
    instrText.setOrigin(0.5, 0);
    instrText.setDepth(50);

    // Initialize visual effects
    this.speedLines = new SpeedLines(this, this.config.worldWidth, this.config.worldHeight);
    this.screenShake = new ScreenShake(this.cameras.main);
    this.particleManager = new ParticleManager(this);

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

    // Update visual effects based on phase/speed
    this.updatePhaseEffects(snapshot.phase, snapshot.speed);

    // Update players
    for (const playerData of players) {
      if (!playerData.playerId || !playerData.position) continue;

      const isLocalPlayer = playerData.playerId === myPlayerId;

      if (!this.players.has(playerData.playerId)) {
        const playerSprite = new PlayerSprite(
          this,
          playerData.playerId,
          playerData.position.x,
          this.groundYScreen - playerData.position.y,
          this.config.playerWidth,
          this.config.playerHeight,
          isLocalPlayer
        );
        this.players.set(playerData.playerId, playerSprite);
      }

      const playerSprite = this.players.get(playerData.playerId)!;
      const screenY = this.groundYScreen - playerData.position.y;

      playerSprite.updatePosition(
        { x: playerData.position.x, y: screenY },
        playerData.velocity
      );

      // Local player-specific effects
      if (isLocalPlayer) {
        const isAirborne = playerData.position.y > 0.5;

        // Jump particles — when player just left the ground
        if (isAirborne && !this.wasAirborne && playerData.velocity.y > 0) {
          this.particleManager.onJump(
            playerData.position.x + this.config.playerWidth / 2,
            this.groundYScreen
          );
        }

        // Landing particles — when player just touched the ground
        if (!isAirborne && this.wasAirborne) {
          this.particleManager.onLanding(
            playerData.position.x + this.config.playerWidth / 2,
            this.groundYScreen
          );
        }

        this.wasAirborne = isAirborne;

        // Elimination effects
        if (playerData.state === PlayerState.ELIMINATED && !this.wasEliminated) {
          this.wasEliminated = true;
          this.screenShake.onElimination();
          this.particleManager.onElimination(
            playerData.position.x + this.config.playerWidth / 2,
            screenY
          );
        }

        // Score update
        if (playerData.score !== this.currentScore) {
          this.currentScore = Math.floor(playerData.score);
          this.scoreText.setText(`Score: ${this.currentScore}`);
        }

        // Near-miss effects
        if (playerData.nearMisses) {
          for (const nm of playerData.nearMisses) {
            const cx = this.cameras.main.centerX;
            const cy = this.cameras.main.centerY;
            showNearMissEffect(this, cx, cy, nm);
            // Spark particles at player position
            this.particleManager.onNearMiss(
              playerData.position.x + this.config.playerWidth / 2,
              screenY
            );
            // Screen shake for pixel perfect only
            if (nm.level === 'pixel_perfect') {
              this.screenShake.onPixelPerfect();
            }
          }
        }
      }

      if (playerData.state === PlayerState.ELIMINATED) {
        playerSprite.eliminate();
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
        const screenY = this.groundYScreen - obstacleData.position.y;
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
      const screenY = this.groundYScreen - obstacleData.position.y;
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

  /** Update background color, speed lines, and motion blur based on current phase/speed */
  private updatePhaseEffects(phase: number, speed: number): void {
    // Background color shift (lerp between phases over ~3 seconds worth of snapshots)
    const phaseIdx = Math.max(0, Math.min(4, phase - 1));
    if (phase !== this.currentPhase) {
      this.currentPhase = phase;
    }

    // Smooth lerp toward target color
    const skyColor = PHASE_COLORS.sky[phaseIdx];
    const groundColor = PHASE_COLORS.ground[phaseIdx];

    // If between phases, lerp with neighbor
    let targetSky = skyColor;
    let targetGround = groundColor;
    if (phaseIdx > 0) {
      // Blend from previous phase color
      const prevSky = PHASE_COLORS.sky[phaseIdx - 1];
      const prevGround = PHASE_COLORS.ground[phaseIdx - 1];
      // Use a simple time-based lerp (converges over multiple frames)
      const currentBg = this.cameras.main.backgroundColor;
      const currentSkyHex = (currentBg.red << 16) | (currentBg.green << 8) | currentBg.blue;

      // Lerp 5% per frame toward target
      targetSky = lerpColor(currentSkyHex, skyColor, 0.05);
      targetGround = lerpColor(
        this.groundRect.fillColor,
        groundColor,
        0.05
      );
      // On first transition from phase 1, seed with previous color
      if (currentSkyHex === PHASE_COLORS.sky[0] && phaseIdx > 0) {
        targetSky = lerpColor(prevSky, skyColor, 0.05);
        targetGround = lerpColor(prevGround, groundColor, 0.05);
      }
    }

    this.cameras.main.setBackgroundColor(targetSky);
    this.groundRect.setFillStyle(targetGround);

    // Speed lines
    this.speedLines.update(speed);

    // Motion blur on obstacles at Phase 4+ (speed > 400)
    if (speed > 400) {
      const stretch = Math.min(4, (speed - 400) / 60);
      for (const [, sprite] of this.obstacles) {
        sprite.setScale(1 + stretch * 0.05, 1);
      }
    }
  }

  shutdown() {
    // Clean up network listeners
    this.networkService.off('game_update', this.onGameUpdate);
    this.networkService.off('match_ended', this.onMatchEnded);

    // Clean up visual effects
    this.speedLines.destroy();

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
