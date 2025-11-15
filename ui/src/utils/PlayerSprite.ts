import Phaser from 'phaser';
import type { Vector2D } from '../types';

export class PlayerSprite extends Phaser.GameObjects.Rectangle {
  private playerId: string;
  private playerLabel: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    playerId: string,
    x: number,
    y: number,
    isLocalPlayer: boolean = false
  ) {
    // Create a rectangle to represent the dino (40x50 pixels)
    super(scene, x, y, 40, 50, isLocalPlayer ? 0x00ff00 : 0xff6600);

    this.playerId = playerId;

    // Add to scene
    scene.add.existing(this);

    // Add label above player
    const labelText = isLocalPlayer ? 'YOU' : playerId.substring(0, 8);
    this.playerLabel = scene.add.text(x, y - 40, labelText, {
      fontSize: '12px',
      color: isLocalPlayer ? '#00ff00' : '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    this.playerLabel.setOrigin(0.5);

    // Set origin to bottom center for ground alignment
    this.setOrigin(0.5, 1);
  }

  public updatePosition(position: Vector2D, velocity: Vector2D): void {
    this.x = position.x;
    this.y = position.y;

    // Update label position
    this.playerLabel.x = this.x;
    this.playerLabel.y = this.y - 40;

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
