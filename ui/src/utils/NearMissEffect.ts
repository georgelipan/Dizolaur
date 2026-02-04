import Phaser from 'phaser';
import type { NearMissEvent } from '../types';

const LEVEL_CONFIG = {
  close: {
    text: 'CLOSE!',
    color: '#FFD700',
    fontSize: '20px',
    flash: false,
  },
  insane: {
    text: 'INSANE!',
    color: '#FF8C00',
    fontSize: '26px',
    flash: true,
  },
  pixel_perfect: {
    text: 'PIXEL PERFECT!',
    color: '#FF0000',
    fontSize: '32px',
    flash: true,
  },
} as const;

export function showNearMissEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  event: NearMissEvent
): void {
  const config = LEVEL_CONFIG[event.level];

  // Floating text
  const text = scene.add.text(x, y - 40, config.text, {
    fontSize: config.fontSize,
    color: config.color,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3,
    padding: { x: 4, y: 2 },
  });
  text.setOrigin(0.5);
  text.setDepth(100);

  // Float up and fade out
  scene.tweens.add({
    targets: text,
    y: y - 120,
    alpha: 0,
    duration: 1200,
    ease: 'Power2',
    onComplete: () => text.destroy(),
  });

  // Screen flash for insane and pixel_perfect
  if (config.flash) {
    const flash = scene.add.rectangle(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY,
      scene.cameras.main.width,
      scene.cameras.main.height,
      event.level === 'pixel_perfect' ? 0xff0000 : 0xff8c00,
      0.3
    );
    flash.setDepth(99);
    flash.setScrollFactor(0);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      ease: 'Power1',
      onComplete: () => flash.destroy(),
    });
  }
}
