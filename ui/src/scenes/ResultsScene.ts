/**
 * F12 — Enhanced Results Screen
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
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.autoReturnSeconds = 15;

    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Validate result data
    if (!this.result || !Array.isArray(this.result.players)) {
      this.add.text(centerX, centerY, 'Error loading results', {
        fontSize: '24px',
        color: '#ff0000',
      }).setOrigin(0.5);
      this.addActionButtons(centerX, centerY + 100);
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

    // ── Title ──
    if (isWinner) {
      this.add.text(centerX, 50, 'YOU WON!', {
        fontSize: '36px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#003300',
        strokeThickness: 3,
      }).setOrigin(0.5);
    } else {
      this.add.text(centerX, 50, 'BETTER LUCK NEXT TIME', {
        fontSize: '28px',
        color: '#ff6644',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // ── Payout with animated count-up ──
    let yPos = 95;
    if (myResult) {
      const currency = this.gameSession.getCurrency();
      const target = myResult.winnings || 0;
      const winColor = target > 0 ? '#00ff00' : '#ff4444';
      const prefix = target > 0 ? 'YOU WON ' : 'PAYOUT: ';

      const winText = this.add.text(centerX, yPos, `${prefix}${currency} 0.00`, {
        fontSize: '28px',
        color: winColor,
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 12, y: 6 },
      });
      winText.setOrigin(0.5);

      if (target > 0) {
        // Animated count-up using requestAnimationFrame (real-time, not Phaser-dependent)
        const startTime = Date.now();
        const duration = 1000;
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(elapsed / duration, 1);
          const eased = 1 - (1 - t) * (1 - t); // ease-out quad
          winText.setText(`${prefix}${currency} ${(target * eased).toFixed(2)}`);
          if (t < 1) requestAnimationFrame(tick);
          else winText.setText(`${prefix}${currency} ${target.toFixed(2)}`);
        };
        requestAnimationFrame(tick);
      } else {
        winText.setText(`${prefix}${currency} ${target.toFixed(2)}`);
      }
      yPos += 50;
    }

    // ── Rankings with survival times ──
    this.add.text(centerX, yPos, 'RANKINGS', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    yPos += 35;

    const matchDuration = this.result.endTime - this.result.startTime;
    const totalPlayers = this.result.players.length;
    const sortedPlayers = [...this.result.players].sort((a, b) => a.ranking - b.ranking);
    const currency = this.gameSession.getCurrency();

    sortedPlayers.forEach((player, index) => {
      const isMe = player.playerId === myPlayerId;
      const rank = player.ranking;
      const name = isMe ? 'YOU' : player.playerId.substring(0, 10);
      const score = player.score;
      const winnings = (typeof player.winnings === 'number') ? player.winnings.toFixed(2) : '0.00';

      // Estimate survival: winner gets full duration, others proportional to placement
      const survivalMs = rank === 1
        ? matchDuration
        : Math.round(matchDuration * (totalPlayers - rank + 1) / totalPlayers);
      const survSec = Math.floor(survivalMs / 1000);

      const medal = rank <= 3 ? `#${rank}` : `#${rank}`;
      const text = `${medal}  ${name}  |  Score: ${score}  |  ${survSec}s  |  ${currency} ${winnings}`;

      const entry = this.add.text(centerX, yPos + (index * 30), text, {
        fontSize: '16px',
        color: isMe ? '#00ff00' : '#cccccc',
        backgroundColor: isMe ? '#003300' : undefined,
        padding: isMe ? { x: 8, y: 3 } : { x: 0, y: 3 },
      });
      entry.setOrigin(0.5);

      // Slide-in animation
      entry.setAlpha(0);
      entry.setX(centerX + 40);
      this.tweens.add({
        targets: entry,
        alpha: 1,
        x: centerX,
        duration: 300,
        delay: index * 100,
        ease: 'Power2',
      });
    });

    yPos += sortedPlayers.length * 30 + 15;

    // ── Stats row (F12: near-miss count, obstacles, survival) ──
    if (this.stats) {
      const survSec = Math.floor(this.stats.survivalTime / 1000);
      this.add.text(centerX, yPos, [
        `Survival: ${survSec}s`,
        `Obstacles: ${this.stats.obstaclesCleared}`,
        `Near Misses: ${this.stats.nearMissCount}`,
      ].join('   |   '), {
        fontSize: '14px',
        color: '#888888',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: { x: 10, y: 4 },
      }).setOrigin(0.5);
      yPos += 30;
    }

    // ── Personal best comparison (F12) ──
    if (myResult) {
      const currentScore = myResult.score;
      const prevBest = this.getPersonalBest();

      if (currentScore > prevBest) {
        this.setPersonalBest(currentScore);
        const pbText = this.add.text(centerX, yPos, `NEW PERSONAL BEST: ${currentScore}!`, {
          fontSize: '16px',
          color: '#ffdd00',
          fontStyle: 'bold',
          backgroundColor: 'rgba(100,80,0,0.4)',
          padding: { x: 10, y: 4 },
        });
        pbText.setOrigin(0.5);
        this.tweens.add({
          targets: pbText,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 400,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
        });
      } else if (prevBest > 0) {
        this.add.text(centerX, yPos, `Personal Best: ${prevBest}  (Current: ${currentScore})`, {
          fontSize: '14px',
          color: '#777777',
          padding: { x: 10, y: 4 },
        }).setOrigin(0.5);
      }
      yPos += 30;
    }

    // ── Action buttons ──
    this.addActionButtons(centerX, yPos + 10);

    // ── Auto-return timer (15s) ──
    this.autoReturnText = this.add.text(centerX, yPos + 120, `Returning to lobby in 15s...`, {
      fontSize: '14px',
      color: '#666666',
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

    // Reset timer on any user interaction
    this.input.on('pointerdown', () => this.resetAutoReturn());
  }

  private addActionButtons(centerX: number, y: number): void {
    // PLAY AGAIN — prominent, same bet pre-filled
    this.addButton(centerX, y, 'PLAY AGAIN', 200, 44, 0x0066cc, () => {
      this.gameSession.reset();
      this.scene.start('BootScene');
    });

    // CHANGE BET
    this.addButton(centerX - 85, y + 55, 'CHANGE BET', 150, 36, 0x666600, () => {
      this.gameSession.reset();
      this.scene.start('BootScene');
    });

    // LOBBY
    this.addButton(centerX + 85, y + 55, 'LOBBY', 140, 36, 0x444444, () => {
      this.returnToLobby();
    });
  }

  private addButton(
    x: number, y: number,
    label: string, width: number, height: number,
    color: number, onClick: () => void,
  ): void {
    const btn = this.add.rectangle(x, y, width, height, color);
    btn.setInteractive({ useHandCursor: true });
    btn.setStrokeStyle(2, 0xffffff);

    this.add.text(x, y, label, {
      fontSize: height > 40 ? '20px' : '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerdown', onClick);
    const brighter = Phaser.Display.Color.ValueToColor(color).brighten(30).color;
    btn.on('pointerover', () => btn.setFillStyle(brighter));
    btn.on('pointerout', () => btn.setFillStyle(color));
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
      this.autoReturnText.setText(`Returning to lobby in 15s...`);
    }
  }

  private returnToLobby(): void {
    this.gameSession.reset();
    this.scene.start('BootScene');
  }
}
