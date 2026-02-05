import Phaser from 'phaser';
import type { NetworkService } from '../services/NetworkService';
import type { GameSession } from '../services/GameSession';
import type { PlayerJoinedData, PlayerLeftData, PlayerReadyData, MatchStartingData } from '../types';

// Same palette as ResultsScene
const BG_COLOR = '#0f0e1a';
const ACCENT = '#22c55e';
const GOLD = '#fbbf24';
const TEXT_DIM = '#64748b';
const TEXT_LIGHT = '#e2e8f0';
const CARD_BG = 0x1e293b;
const BTN_PRIMARY = 0x22c55e;
const BTN_DISABLED = 0x334155;

export class WaitingScene extends Phaser.Scene {
  private networkService!: NetworkService;
  private gameSession!: GameSession;
  private statusText!: Phaser.GameObjects.Text;
  private playerCountText!: Phaser.GameObjects.Text;
  private playerDots: Phaser.GameObjects.Graphics[] = [];
  private readyBtnGfx!: Phaser.GameObjects.Graphics;
  private readyBtnHitbox!: Phaser.GameObjects.Rectangle;
  private readyButtonText!: Phaser.GameObjects.Text;
  private isReady = false;

  private onPlayerJoined!: (data: PlayerJoinedData) => void;
  private onPlayerLeft!: (data: PlayerLeftData) => void;
  private onPlayerReady!: (data: PlayerReadyData) => void;
  private onMatchStarting!: (data: MatchStartingData) => void;

  constructor() {
    super({ key: 'WaitingScene' });
  }

  create() {
    this.isReady = false;
    this.playerDots = [];
    this.networkService = this.registry.get('networkService');
    this.gameSession = this.registry.get('gameSession');

    const cx = this.cameras.main.centerX;
    const w = this.cameras.main.width;

    this.cameras.main.setBackgroundColor(BG_COLOR);

    // ── Decorative top accent line ──
    this.add.rectangle(cx, 2, w * 0.6, 4, 0x2563eb).setOrigin(0.5, 0).setAlpha(0.8);

    // ── Title ──
    const title = this.add.text(cx, 48, 'DIZOLAUR', {
      fontSize: '40px',
      color: GOLD,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setAlpha(0);
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 52,
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.add.text(cx, 80, 'MULTIPLAYER ARENA', {
      fontSize: '12px',
      color: TEXT_DIM,
      fontStyle: 'bold',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // ── Bet card ──
    const betAmount = this.gameSession.getBetAmount();
    const currency = this.gameSession.getCurrency();
    const betCardW = 240;
    const betCardH = 56;
    const betY = 120;

    const betGfx = this.add.graphics();
    betGfx.fillStyle(CARD_BG, 1);
    betGfx.fillRoundedRect(cx - betCardW / 2, betY, betCardW, betCardH, 10);
    betGfx.lineStyle(2, 0xfbbf24);
    betGfx.strokeRoundedRect(cx - betCardW / 2, betY, betCardW, betCardH, 10);

    this.add.text(cx, betY + 16, 'YOUR BET', {
      fontSize: '10px',
      color: TEXT_DIM,
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(cx, betY + 38, `${currency} ${betAmount.toFixed(2)}`, {
      fontSize: '22px',
      color: GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Separator ──
    this.add.rectangle(cx, betY + betCardH + 14, w * 0.5, 1, 0x334155).setOrigin(0.5, 0);

    // ── Match info ──
    const matchId = this.gameSession.getMatchId() || 'unknown';
    this.add.text(cx, betY + betCardH + 28, `Match #${matchId.substring(0, 8)}`, {
      fontSize: '12px',
      color: TEXT_DIM,
    }).setOrigin(0.5);

    // ── Players card ──
    const maxPlayers = this.gameSession.getGameConfig()?.maxPlayers || 4;
    const playersCardW = 400;
    const playersCardH = 100;
    const playersY = 222;

    const playersGfx = this.add.graphics();
    playersGfx.fillStyle(CARD_BG, 1);
    playersGfx.fillRoundedRect(cx - playersCardW / 2, playersY, playersCardW, playersCardH, 10);
    playersGfx.lineStyle(2, 0x334155);
    playersGfx.strokeRoundedRect(cx - playersCardW / 2, playersY, playersCardW, playersCardH, 10);

    // Player count text
    this.playerCountText = this.add.text(cx, playersY + 20, '', {
      fontSize: '16px',
      color: TEXT_LIGHT,
      fontStyle: 'bold',
    });
    this.playerCountText.setOrigin(0.5);

    // Player dots
    const dotSize = 28;
    const dotGap = 18;
    const totalDotsW = maxPlayers * dotSize + (maxPlayers - 1) * dotGap;
    const dotsStartX = cx - totalDotsW / 2 + dotSize / 2;
    const dotsY = playersY + 54;

    for (let i = 0; i < maxPlayers; i++) {
      const dx = dotsStartX + i * (dotSize + dotGap);
      const gfx = this.add.graphics();
      gfx.setPosition(dx, dotsY);
      this.drawDot(gfx, dotSize / 2, false);
      this.playerDots.push(gfx);
    }

    // Status text
    this.statusText = this.add.text(cx, playersY + 84, 'Waiting for players...', {
      fontSize: '13px',
      color: TEXT_DIM,
    });
    this.statusText.setOrigin(0.5);

    this.tweens.add({
      targets: this.statusText,
      alpha: { from: 0.5, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    this.updatePlayerCount();

    // ── Ready button ──
    const btnW = 260;
    const btnH = 50;
    const btnY = 356;

    this.readyBtnGfx = this.add.graphics();
    this.drawButton(this.readyBtnGfx, cx, btnY, btnW, btnH, BTN_PRIMARY);

    this.readyBtnHitbox = this.add.rectangle(cx, btnY, btnW, btnH, 0x000000, 0);
    this.readyBtnHitbox.setInteractive({ useHandCursor: true });

    this.readyButtonText = this.add.text(cx, btnY, 'READY', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.readyButtonText.setOrigin(0.5);

    // Hover
    const hoverColor = Phaser.Display.Color.ValueToColor(BTN_PRIMARY).brighten(20).color;
    this.readyBtnHitbox.on('pointerover', () => {
      if (!this.isReady) this.drawButton(this.readyBtnGfx, cx, btnY, btnW, btnH, hoverColor);
    });
    this.readyBtnHitbox.on('pointerout', () => {
      if (!this.isReady) this.drawButton(this.readyBtnGfx, cx, btnY, btnW, btnH, BTN_PRIMARY);
    });
    this.readyBtnHitbox.on('pointerdown', () => {
      if (!this.isReady) {
        this.isReady = true;
        this.readyBtnHitbox.disableInteractive();
        this.drawButton(this.readyBtnGfx, cx, btnY, btnW, btnH, BTN_DISABLED);
        this.readyButtonText.setText('WAITING...');
        this.readyButtonText.setColor('#94a3b8');
        this.networkService.setPlayerReady();
      }
    });

    // ── Balance ──
    this.add.text(cx, 410, '▸ BALANCE  10,000', {
      fontSize: '12px',
      color: TEXT_DIM,
    }).setOrigin(0.5);

    // ── Bottom info ──
    this.add.text(16, 530, `#${matchId.substring(0, 8)}`, {
      fontSize: '9px',
      color: '#334155',
    });
    this.add.text(w - 16, 530, '18+', {
      fontSize: '10px',
      color: '#334155',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    // ── Network event handlers ──
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
        this.statusText.setText('Ready! Waiting for others...');
        this.statusText.setColor(ACCENT);
        this.tweens.killTweensOf(this.statusText);
        this.statusText.setAlpha(1);
      }
    };

    this.onMatchStarting = (data: MatchStartingData) => {
      this.gameSession.setGameConfig(data.config);
      this.statusText.setText('MATCH STARTING!');
      this.statusText.setColor(GOLD);
      this.statusText.setFontSize(18);
      this.tweens.killTweensOf(this.statusText);
      this.statusText.setAlpha(1);

      this.cameras.main.flash(400, 255, 255, 255, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          this.scene.start('GameScene');
        }
      });
    };

    this.networkService.on('player_joined', this.onPlayerJoined);
    this.networkService.on('player_left', this.onPlayerLeft);
    this.networkService.on('player_ready', this.onPlayerReady);
    this.networkService.on('match_starting', this.onMatchStarting);

    this.events.once('shutdown', this.shutdown, this);
  }

  private drawButton(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number): void {
    gfx.clear();
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
  }

  private drawDot(gfx: Phaser.GameObjects.Graphics, r: number, active: boolean): void {
    gfx.clear();
    if (active) {
      gfx.fillStyle(0x22c55e, 0.25);
      gfx.fillCircle(0, 0, r + 4);
      gfx.fillStyle(0x22c55e, 1);
      gfx.fillCircle(0, 0, r);
      gfx.fillStyle(0xffffff, 0.6);
      gfx.fillCircle(0, 0, r * 0.35);
    } else {
      gfx.fillStyle(0x1e293b, 1);
      gfx.fillCircle(0, 0, r);
      gfx.lineStyle(2, 0x334155);
      gfx.strokeCircle(0, 0, r);
    }
  }

  private updatePlayerCount(): void {
    const count = this.gameSession.getPlayerCount();
    const maxPlayers = this.gameSession.getGameConfig()?.maxPlayers || 4;
    this.playerCountText.setText(`${count} / ${maxPlayers} PLAYERS`);

    for (let i = 0; i < this.playerDots.length; i++) {
      const active = i < count;
      this.drawDot(this.playerDots[i], 14, active);

      if (active) {
        this.tweens.killTweensOf(this.playerDots[i]);
        this.tweens.add({
          targets: this.playerDots[i],
          scaleX: { from: 1, to: 1.1 },
          scaleY: { from: 1, to: 1.1 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          delay: i * 150,
          ease: 'Sine.easeInOut',
        });
      } else {
        this.tweens.killTweensOf(this.playerDots[i]);
        this.playerDots[i].setScale(1);
      }
    }
  }

  shutdown() {
    this.networkService.off('player_joined', this.onPlayerJoined);
    this.networkService.off('player_left', this.onPlayerLeft);
    this.networkService.off('player_ready', this.onPlayerReady);
    this.networkService.off('match_starting', this.onMatchStarting);
  }
}
