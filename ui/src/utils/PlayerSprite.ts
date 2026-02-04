import Phaser from 'phaser';
import type { Vector2D } from '../types';

export class PlayerSprite extends Phaser.GameObjects.Rectangle {
  private playerId: string;
  private playerLabel: Phaser.GameObjects.Text;
  private spriteWidth: number;
  private spriteHeight: number;

  constructor(
    scene: Phaser.Scene,
    playerId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    isLocalPlayer: boolean = false
  ) {
    super(scene, x, y, width, height, isLocalPlayer ? 0x00ff00 : 0xff6600);

    this.playerId = playerId;
    this.spriteWidth = width;
    this.spriteHeight = height;

    // Add to scene
    scene.add.existing(this);

    // Set origin to bottom-left to match server hitbox (x = left edge, y = bottom edge)
    this.setOrigin(0, 1);

    // Add label above player (centered on sprite width)
    const labelText = isLocalPlayer ? 'YOU' : playerId.substring(0, 8);
    this.playerLabel = scene.add.text(x + width / 2, y - height + 10, labelText, {
      fontSize: '12px',
      color: isLocalPlayer ? '#00ff00' : '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    this.playerLabel.setOrigin(0.5);
  }

  public updatePosition(position: Vector2D, velocity: Vector2D): void {
    this.x = position.x;
    this.y = position.y;

    // Update label position using stored dimensions
    this.playerLabel.x = this.x + this.spriteWidth / 2;
    this.playerLabel.y = this.y - this.spriteHeight + 10;

    // Simple animation: tilt based on velocity
    if (velocity.y > 0) {
      this.setRotation(0.1); // Jumping up
    } else if (velocity.y < 0) {
      this.setRotation(-0.1); // Falling down
    } else {
      this.setRotation(0);
    }
  }

  public eliminate(): void {
    // Visual feedback for elimination
    this.setFillStyle(0xff0000);
    this.setAlpha(0.5);
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  public destroy(): void {
    this.playerLabel.destroy();
    super.destroy();
  }
}
