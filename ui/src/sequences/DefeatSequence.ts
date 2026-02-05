/**
 * F12 — Defeat Sequence
 * Shown after slow-motion death replay ends (at T+1500ms after elimination).
 * - Desaturated dark overlay dims the game world
 * - "ELIMINATED" text fades/scales in over 400ms
 * - Subtitle "Entering spectator mode..."
 * - Both fade out after 1.5s to make way for spectator overlay
 */

import Phaser from 'phaser';

export class DefeatSequence {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, worldWidth: number, worldHeight: number) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(85);

    const cx = worldWidth / 2;

    // Desaturated palette: dark overlay to grey out the game world
    const overlay = scene.add.rectangle(
      worldWidth / 2, worldHeight / 2,
      worldWidth, worldHeight,
      0x000000, 0,
    );
    this.container.add(overlay);

    // Fade in overlay
    scene.tweens.add({
      targets: overlay,
      alpha: 0.35,
      duration: 300,
      ease: 'Power2',
    });

    // "ELIMINATED" text
    const elimText = scene.add.text(cx, 180, 'ELIMINATED', {
      fontSize: '48px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#440000',
      strokeThickness: 4,
    });
    elimText.setOrigin(0.5);
    elimText.setAlpha(0);
    elimText.setScale(0.5);
    this.container.add(elimText);

    // Subtitle
    const subText = scene.add.text(cx, 230, 'Entering spectator mode...', {
      fontSize: '18px',
      color: '#aaaaaa',
    });
    subText.setOrigin(0.5);
    subText.setAlpha(0);
    this.container.add(subText);

    // Animate in
    scene.tweens.add({
      targets: elimText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });
    scene.tweens.add({
      targets: subText,
      alpha: 0.8,
      duration: 400,
      delay: 200,
      ease: 'Power2',
    });

    // Fade out everything after 1.5s (300ms fade)
    scene.tweens.add({
      targets: [elimText, subText, overlay],
      alpha: 0,
      duration: 300,
      delay: 1500,
      ease: 'Quad.easeIn',
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
