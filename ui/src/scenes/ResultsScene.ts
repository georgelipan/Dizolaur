/**
 * F12 — Enhanced Results Screen (restyled F15)
 * - Rankings with survival times
 * - Animated winnings count-up
 * - Personal best comparison (localStorage)
 * - Near-miss count & stats
 * - Buttons: PLAY AGAIN (prominent), CHANGE BET, LOBBY
 * - Auto-return to lobby after 15s without interaction
 */

import Phaser from 'phaser';
import type { GameSession } from '../services/GameSession';
import type { MatchResult } from '../types';
import { AudioManager } from '../services/AudioManager';

interface GameStats {
  survivalTime: number;
  obstaclesCleared: number;
  nearMissCount: number;
}

const PERSONAL_BEST_KEY = 'dizolaur_personal_best';

// Colors
const BG_COLOR = '#0f0e1a';
const ACCENT_WIN = '#22c55e';
const ACCENT_LOSE = '#ef4444';
const GOLD = '#fbbf24';
const SILVER = '#94a3b8';
const BRONZE = '#d97706';
const TEXT_DIM = '#64748b';
const TEXT_MUTED = '#475569';
const CARD_BG = 0x1e293b;
const BTN_PRIMARY = 0x2563eb;
const BTN_SECONDARY = 0x334155;

export class ResultsScene extends Phaser.Scene {
  private gameSession!: GameSession;
  private result!: MatchResult;
  private stats: GameStats | null = null;
  private audioManager!: AudioManager;
  private autoReturnText: Phaser.GameObjects.Text | null = null;
  private autoReturnSeconds = 15;

  constructor() {
    super({ key: 'ResultsScene' });
  }

  init(data: { result: MatchResult; stats?: GameStats }) {
    this.result = data.result;
    this.stats = data.stats || null;
    this.gameSession = this.registry.get('gameSession');
  }

  create() {
    const cx = this.cameras.main.centerX;
    const w = this.cameras.main.width;
    this.autoReturnSeconds = 15;

    this.cameras.main.setBackgroundColor(BG_COLOR);

    // Validate result data
    if (!this.result || !Array.isArray(this.result.players)) {
      this.add.text(cx, 270, 'Error loading results', {
        fontSize: '24px', color: ACCENT_LOSE,
      }).setOrigin(0.5);
      this.addActionButtons(cx, 340);
      return;
    }

    const myPlayerId = this.gameSession.getPlayerId();
    const myResult = this.result.players.find(p => p.playerId === myPlayerId);
    const isWinner = myResult?.playerId === this.result.winnerId;

    // Victory/defeat sound (F08)
    this.audioManager = new AudioManager();
    this.audioManager.resume();
    if (isWinner) {
      this.audioManager.playVictory();
    } else {
      this.audioManager.playDefeat();
    }

    // ── Decorative top line ──
    const accentColor = isWinner ? 0x22c55e : 0xef4444;
    this.add.rectangle(cx, 2, w * 0.6, 4, accentColor).setOrigin(0.5, 0).setAlpha(0.8);

    // ── Title ──
    const titleColor = isWinner ? ACCENT_WIN : ACCENT_LOSE;
    const titleText = isWinner ? 'VICTORY' : 'DEFEATED';
    const title = this.add.text(cx, 38, titleText, {
      fontSize: '42px',
      color: titleColor,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setAlpha(0);
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 42,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // ── Payout card ──
    let yPos = 90;
    if (myResult) {
      const currency = this.gameSession.getCurrency();
      const target = myResult.winnings || 0;
      const isPositive = target > 0;

      // Card background
      const cardW = 280;
      const cardH = 56;
      const card = this.add.rectangle(cx, yPos + cardH / 2, cardW, cardH, isPositive ? 0x14532d : 0x450a0a);
      card.setStrokeStyle(2, isPositive ? 0x22c55e : 0x7f1d1d);
      card.setOrigin(0.5);

      const prefix = isPositive ? '+' : '';
      const winText = this.add.text(cx, yPos + cardH / 2, `${prefix}${currency} 0.00`, {
        fontSize: '28px',
        color: isPositive ? ACCENT_WIN : ACCENT_LOSE,
        fontStyle: 'bold',
      });
      winText.setOrigin(0.5);

      // Count-up animation
      if (target > 0) {
        const startTime = Date.now();
        const duration = 1200;
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(elapsed / duration, 1);
          const eased = 1 - (1 - t) * (1 - t);
          winText.setText(`${prefix}${currency} ${(target * eased).toFixed(2)}`);
          if (t < 1) requestAnimationFrame(tick);
          else winText.setText(`${prefix}${currency} ${target.toFixed(2)}`);
        };
        requestAnimationFrame(tick);
      } else {
        winText.setText(`${prefix}${currency} ${target.toFixed(2)}`);
      }

      yPos += cardH + 20;
    }

    // ── Rankings ──
    const matchDuration = this.result.endTime - this.result.startTime;
    const totalPlayers = this.result.players.length;
    const sortedPlayers = [...this.result.players].sort((a, b) => a.ranking - b.ranking);
    const currency = this.gameSession.getCurrency();

    // Rankings header line
    this.add.rectangle(cx, yPos + 4, w * 0.65, 1, 0x334155).setOrigin(0.5, 0);
    yPos += 20;

    const ROW_H = 36;
    const ROW_W = Math.min(w - 40, 560);

    sortedPlayers.forEach((player, index) => {
      const isMe = player.playerId === myPlayerId;
      const rank = player.ranking;
      const name = isMe ? 'YOU' : `Player ${rank}`;
      const score = Math.round(player.score);
      const winnings = (typeof player.winnings === 'number') ? player.winnings.toFixed(2) : '0.00';

      const survivalMs = rank === 1
        ? matchDuration
        : Math.round(matchDuration * (totalPlayers - rank + 1) / totalPlayers);
      const survSec = Math.floor(survivalMs / 1000);

      const rowY = yPos + index * (ROW_H + 6);

      // Row background
      const rowBg = this.add.rectangle(cx, rowY, ROW_W, ROW_H, isMe ? 0x1a3a2a : CARD_BG);
      rowBg.setOrigin(0.5);
      if (isMe) rowBg.setStrokeStyle(1, 0x22c55e);

      // Medal / rank
      const medalColors: Record<number, string> = { 1: GOLD, 2: SILVER, 3: BRONZE };
      const medalColor = medalColors[rank] || TEXT_DIM;
      const medalSymbol = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;

      this.add.text(cx - ROW_W / 2 + 16, rowY, medalSymbol, {
        fontSize: '15px',
        color: medalColor,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // Name
      this.add.text(cx - ROW_W / 2 + 64, rowY, name, {
        fontSize: '15px',
        color: isMe ? ACCENT_WIN : '#e2e8f0',
        fontStyle: isMe ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);

      // Score
      this.add.text(cx + 10, rowY, `${score}`, {
        fontSize: '15px',
        color: '#cbd5e1',
      }).setOrigin(0.5);

      // Time
      this.add.text(cx + ROW_W / 2 - 140, rowY, `${survSec}s`, {
        fontSize: '14px',
        color: TEXT_DIM,
      }).setOrigin(0.5);

      // Winnings
      this.add.text(cx + ROW_W / 2 - 16, rowY, `${currency} ${winnings}`, {
        fontSize: '14px',
        color: parseFloat(winnings) > 0 ? ACCENT_WIN : TEXT_DIM,
      }).setOrigin(1, 0.5);

      // Slide-in animation
      const rowElements = [rowBg, ...this.children.list.slice(-5)];
      rowElements.forEach(el => {
        if (el instanceof Phaser.GameObjects.Text || el instanceof Phaser.GameObjects.Rectangle) {
          const origX = el.x;
          el.setAlpha(0);
          el.x += 30;
          this.tweens.add({
            targets: el,
            alpha: 1,
            x: origX,
            duration: 300,
            delay: 150 + index * 80,
            ease: 'Power2',
          });
        }
      });
    });

    yPos += sortedPlayers.length * (ROW_H + 6) + 18;

    // ── Stats bar ──
    if (this.stats) {
      const survSec = Math.floor(this.stats.survivalTime / 1000);
      const statsItems = [
        `${survSec}s survived`,
        `${this.stats.obstaclesCleared} obstacles`,
        `${this.stats.nearMissCount} near misses`,
      ];

      this.add.text(cx, yPos, statsItems.join('    '), {
        fontSize: '13px',
        color: TEXT_MUTED,
      }).setOrigin(0.5);
      yPos += 28;
    }

    // ── Personal best ──
    if (myResult) {
      const currentScore = Math.round(myResult.score);
      const prevBest = this.getPersonalBest();

      if (currentScore > prevBest) {
        this.setPersonalBest(currentScore);
        const pbText = this.add.text(cx, yPos, `NEW BEST: ${currentScore}`, {
          fontSize: '16px',
          color: GOLD,
          fontStyle: 'bold',
        });
        pbText.setOrigin(0.5);
        this.tweens.add({
          targets: pbText,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else if (prevBest > 0) {
        this.add.text(cx, yPos, `Best: ${prevBest}  |  This game: ${currentScore}`, {
          fontSize: '13px',
          color: TEXT_MUTED,
        }).setOrigin(0.5);
      }
      yPos += 32;
    }

    // ── Action buttons ──
    this.addActionButtons(cx, yPos + 8);

    // ── Auto-return timer ──
    this.autoReturnText = this.add.text(cx, yPos + 108, 'Returning to lobby in 15s...', {
      fontSize: '12px',
      color: TEXT_MUTED,
    });
    this.autoReturnText.setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        this.autoReturnSeconds--;
        if (this.autoReturnText?.active) {
          this.autoReturnText.setText(`Returning to lobby in ${this.autoReturnSeconds}s...`);
        }
        if (this.autoReturnSeconds <= 0) {
          this.returnToLobby();
        }
      },
    });

    this.input.on('pointerdown', () => this.resetAutoReturn());
  }

  private addActionButtons(cx: number, y: number): void {
    // PLAY AGAIN — prominent
    this.addButton(cx, y, 'PLAY AGAIN', 220, 46, BTN_PRIMARY, () => {
      this.gameSession.reset();
      this.scene.start('BootScene');
    });

    // CHANGE BET + LOBBY side by side
    this.addButton(cx - 75, y + 58, 'CHANGE BET', 130, 36, BTN_SECONDARY, () => {
      this.gameSession.reset();
      this.scene.start('BootScene');
    });

    this.addButton(cx + 75, y + 58, 'LOBBY', 130, 36, BTN_SECONDARY, () => {
      this.returnToLobby();
    });
  }

  private addButton(
    x: number, y: number,
    label: string, width: number, height: number,
    color: number, onClick: () => void,
  ): void {
    // Rounded rect via Graphics
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    gfx.setDepth(0);

    // Invisible hitbox
    const hitbox = this.add.rectangle(x, y, width, height, 0x000000, 0);
    hitbox.setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontSize: height > 40 ? '18px' : '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Hover effect
    const brighter = Phaser.Display.Color.ValueToColor(color).brighten(25).color;
    hitbox.on('pointerover', () => {
      gfx.clear();
      gfx.fillStyle(brighter, 1);
      gfx.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    });
    hitbox.on('pointerout', () => {
      gfx.clear();
      gfx.fillStyle(color, 1);
      gfx.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    });

    hitbox.on('pointerdown', onClick);
  }

  private getPersonalBest(): number {
    try {
      const stored = localStorage.getItem(PERSONAL_BEST_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private setPersonalBest(score: number): void {
    try {
      localStorage.setItem(PERSONAL_BEST_KEY, String(score));
    } catch {
      // localStorage may be unavailable
    }
  }

  private resetAutoReturn(): void {
    this.autoReturnSeconds = 15;
    if (this.autoReturnText?.active) {
      this.autoReturnText.setText('Returning to lobby in 15s...');
    }
  }

  private returnToLobby(): void {
    this.gameSession.reset();
    this.scene.start('BootScene');
  }
}
