import Phaser from 'phaser';
import type { Vector2D } from '../types';

type ObstacleType = 'ground_small' | 'ground_tall' | 'ground_wide' | 'air_high' | 'air_low' | 'air_moving';

const OBSTACLE_COLORS: Record<ObstacleType, number> = {
  ground_small: 0x00aa00,
  ground_tall: 0x006600,
  ground_wide: 0x008800,
  air_high: 0xaa0000,
  air_low: 0xcc4400,
  air_moving: 0xff0066,
};

export class ObstacleSprite extends Phaser.GameObjects.Rectangle {
  private obstacleId: string;
  private obstacleType: ObstacleType;

  constructor(
    scene: Phaser.Scene,
    id: string,
    position: Vector2D,
    width: number,
    height: number,
    type: ObstacleType
  ) {
    const color = OBSTACLE_COLORS[type] ?? 0xffffff;
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

  public getType(): ObstacleType {
    return this.obstacleType;
  }
}
