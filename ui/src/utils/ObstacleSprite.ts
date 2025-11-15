import Phaser from 'phaser';
import type { Vector2D } from '../types';

export class ObstacleSprite extends Phaser.GameObjects.Rectangle {
  private obstacleId: string;
  private obstacleType: 'cactus' | 'bird';

  constructor(
    scene: Phaser.Scene,
    id: string,
    position: Vector2D,
    width: number,
    height: number,
    type: 'cactus' | 'bird'
  ) {
    // Different colors for different obstacle types
    const color = type === 'cactus' ? 0x00aa00 : 0xaa0000;
    super(scene, position.x, position.y, width, height, color);

    this.obstacleId = id;
    this.obstacleType = type;

    // Add to scene
    scene.add.existing(this);

    // Set origin to bottom left for ground alignment
    this.setOrigin(0, 1);
  }

  public updatePosition(position: Vector2D): void {
    this.x = position.x;
    this.y = position.y;
  }

  public getObstacleId(): string {
    return this.obstacleId;
  }

  public getType(): 'cactus' | 'bird' {
    return this.obstacleType;
  }
}
