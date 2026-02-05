/**
 * F11 — Elimination Banner
 * Slide-in banner from top on each elimination:
 * - "[PLAYER_NAME] ELIMINATED! N REMAIN"
 * - Duration: 2s (300ms slide-in, 1400ms hold, 300ms fade-out)
 * - "FINAL 2" special banner when 2 players remain
 */

import Phaser from 'phaser';

interface BannerEntry {
  container: Phaser.GameObjects.Container;
  expireTime: number;
}

export class EliminationBanner {
  private scene: Phaser.Scene;
  private worldWidth: number;
  private queue: BannerEntry[] = [];
  private final2Shown = false;

  constructor(scene: Phaser.Scene, worldWidth: number) {
    this.scene = scene;
    this.worldWidth = worldWidth;
  }

  /** Show elimination banner for a specific player */
  showElimination(playerName: string, remaining: number): void {
    const text = `${playerName} ELIMINATED!  ${remaining} REMAIN`;
    this.showBanner(text, '#ff4444', '#440000');

    // Show FINAL 2 banner if exactly 2 remain
    if (remaining === 2 && !this.final2Shown) {
      this.final2Shown = true;
      // Slight delay so it appears after the elimination banner
      this.scene.time.delayedCall(800, () => {
        this.showFinal2();
      });
    }
  }

  /** Show the special FINAL 2 banner */
  private showFinal2(): void {
    this.showBanner('FINAL 2', '#ffaa00', '#442200', true);
  }

  private showBanner(
    message: string,
    textColor: string,
    bgColor: string,
    isSpecial = false,
  ): void {
    const centerX = this.worldWidth / 2;
    const bannerY = 130;

    const container = this.scene.add.container(centerX, -50);
    container.setDepth(80);

    // Background bar
    const fontSize = isSpecial ? '28px' : '20px';
    const bgWidth = isSpecial ? 280 : Math.min(this.worldWidth - 40, 500);
    const bgHeight = isSpecial ? 50 : 40;
    const bgHex = parseInt(bgColor.replace('#', ''), 16);

    const bg = this.scene.add.rectangle(0, 0, bgWidth, bgHeight, bgHex, 0.9);
    bg.setStrokeStyle(2, parseInt(textColor.replace('#', ''), 16));
    container.add(bg);

    // Text
    const label = this.scene.add.text(0, 0, message, {
      fontSize,
      color: textColor,
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);
    container.add(label);

    // Slide in from top (300ms)
    this.scene.tweens.add({
      targets: container,
      y: bannerY + this.queue.length * 50,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Scale pulse for special banner
    if (isSpecial) {
      this.scene.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 300,
        yoyo: true,
        delay: 400,
        ease: 'Quad.easeInOut',
      });
    }

    // Fade out after 2s (300ms fade)
    this.scene.tweens.add({
      targets: container,
      alpha: 0,
      y: bannerY - 20 + this.queue.length * 50,
      duration: 300,
      delay: 1700,
      ease: 'Quad.easeIn',
      onComplete: () => {
        container.destroy();
        this.queue = this.queue.filter(e => e.container !== container);
      },
    });

    this.queue.push({
      container,
      expireTime: Date.now() + 2000,
    });
  }

  destroy(): void {
    for (const entry of this.queue) {
      entry.container.destroy();
    }
    this.queue = [];
  }
}
