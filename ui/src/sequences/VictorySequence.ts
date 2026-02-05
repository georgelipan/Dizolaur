/**
 * F12 — Victory Sequence
 * Full-screen cinematic when local player wins (last one standing).
 * Timeline (all real-time):
 *   T+0ms:    Obstacles freeze. White flash 100ms.
 *   T+100ms:  "WINNER!" text slam (scale 3→1) + camera shake (6px, 200ms) + fanfare sound.
 *   T+300ms:  Confetti particles fall from top.
 *   T+500ms:  Animated winnings count-up "$0.00 → $X.XX" over 1.5s.
 *   T+2000ms: Stats (survival time, obstacles cleared, near-misses).
 *   T+3000ms: "PLAY AGAIN" button with pulse animation.
 */

import Phaser from 'phaser';
import type { AudioManager } from '../services/AudioManager';

export interface VictoryData {
  winnings: number;
  currency: string;
  survivalTime: number;
  obstaclesCleared: number;
  nearMissCount: number;
}

export class VictorySequence {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    audioManager: AudioManager,
    worldWidth: number,
    worldHeight: number,
    data: VictoryData,
    onPlayAgain: () => void,
  ) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(90);

    const cx = worldWidth / 2;
    const cy = worldHeight / 2;

    // ── T+0ms: White flash ──
    scene.cameras.main.flash(100, 255, 255, 255);

    // ── T+100ms: "WINNER!" slam + shake + fanfare ──
    this.delay(100, () => {
      audioManager.playVictory();

      // Dark backdrop so text is readable
      const backdrop = scene.add.rectangle(cx, cy, worldWidth, worldHeight, 0x000000, 0.4);
      this.container.add(backdrop);

      const winnerText = scene.add.text(cx, cy - 80, 'WINNER!', {
        fontSize: '64px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#003300',
        strokeThickness: 6,
      });
      winnerText.setOrigin(0.5);
      winnerText.setScale(3);
      winnerText.setAlpha(0);
      this.container.add(winnerText);

      scene.tweens.add({
        targets: winnerText,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });

      // Impact shake (6px, 200ms)
      scene.cameras.main.shake(200, 0.008);
    });

    // ── T+300ms: Confetti ──
    this.delay(300, () => {
      this.spawnConfetti(worldWidth, worldHeight);
    });

    // ── T+500ms: Winnings count-up over 1.5s ──
    this.delay(500, () => {
      const target = data.winnings;
      const label = scene.add.text(cx, cy - 10, `${data.currency} 0.00`, {
        fontSize: '36px',
        color: '#ffdd00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      });
      label.setOrigin(0.5);
      this.container.add(label);

      // Animate using manual interval (not affected by Phaser timeScale)
      const startTime = Date.now();
      const duration = 1500;
      const tick = () => {
        if (this.destroyed) return;
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease out quad
        const eased = 1 - (1 - t) * (1 - t);
        const val = target * eased;
        label.setText(`${data.currency} ${val.toFixed(2)}`);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          label.setText(`${data.currency} ${target.toFixed(2)}`);
          // Pulse on final value
          scene.tweens.add({
            targets: label,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Quad.easeOut',
          });
        }
      };
      requestAnimationFrame(tick);
    });

    // ── T+2000ms: Stats ──
    this.delay(2000, () => {
      const survSec = Math.floor(data.survivalTime / 1000);
      const lines = [
        `Survival: ${survSec}s`,
        `Obstacles: ${data.obstaclesCleared}`,
        `Near Misses: ${data.nearMissCount}`,
      ];
      let yOff = cy + 40;
      for (const line of lines) {
        const t = scene.add.text(cx, yOff + 10, line, {
          fontSize: '18px',
          color: '#cccccc',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: { x: 8, y: 3 },
        });
        t.setOrigin(0.5);
        t.setAlpha(0);
        this.container.add(t);
        scene.tweens.add({
          targets: t,
          alpha: 1,
          y: yOff,
          duration: 300,
          ease: 'Power2',
        });
        yOff += 30;
      }
    });

    // ── T+3000ms: PLAY AGAIN button ──
    this.delay(3000, () => {
      const btnY = cy + 160;
      const btn = scene.add.rectangle(cx, btnY, 220, 50, 0x0066cc, 0.9);
      btn.setStrokeStyle(2, 0xffffff);
      btn.setInteractive({ useHandCursor: true });
      this.container.add(btn);

      const btnLabel = scene.add.text(cx, btnY, 'PLAY AGAIN', {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      btnLabel.setOrigin(0.5);
      this.container.add(btnLabel);

      // Pulse animation
      scene.tweens.add({
        targets: [btn, btnLabel],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      btn.on('pointerdown', onPlayAgain);
      btn.on('pointerover', () => btn.setFillStyle(0x0088ff, 0.95));
      btn.on('pointerout', () => btn.setFillStyle(0x0066cc, 0.9));
    });
  }

  /** setTimeout wrapper that respects destroyed state */
  private delay(ms: number, fn: () => void): void {
    setTimeout(() => {
      if (!this.destroyed) fn();
    }, ms);
  }

  private spawnConfetti(worldWidth: number, worldHeight: number): void {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800];
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(50, worldWidth - 50);
      const color = Phaser.Math.RND.pick(colors);
      const w = Phaser.Math.Between(4, 8);
      const h = Phaser.Math.Between(8, 16);

      const piece = this.scene.add.rectangle(x, -10, w, h, color);
      piece.setAngle(Phaser.Math.Between(0, 360));
      this.container.add(piece);

      this.scene.tweens.add({
        targets: piece,
        y: worldHeight + 20,
        x: x + Phaser.Math.Between(-100, 100),
        angle: piece.angle + Phaser.Math.Between(-540, 540),
        duration: Phaser.Math.Between(2000, 4000),
        ease: 'Quad.easeIn',
        delay: Phaser.Math.Between(0, 600),
        onComplete: () => piece.destroy(),
      });
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.container.destroy();
  }
}
