import Phaser from 'phaser';
import type { Vector2D } from '../types';

type ObstacleType = 'ground_small' | 'ground_tall' | 'ground_wide' | 'air_high' | 'air_low' | 'air_moving';

const OBSTACLE_TEXTURES: Record<ObstacleType, string> = {
  ground_small: 'ground_small',
  ground_tall: 'ground_tall',
  ground_wide: 'ground_wide',
  air_high: 'air_high_f1',
  air_low: 'air_low_f1',
  air_moving: 'air_moving_f1',
};

const AIR_ANIMATIONS: Partial<Record<ObstacleType, string>> = {
  air_high: 'air_high_anim',
  air_low: 'air_low_anim',
  air_moving: 'air_moving_anim',
};

export class ObstacleSprite {
  private sprite: Phaser.GameObjects.Sprite;
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
    this.obstacleId = id;
    this.obstacleType = type;

    const textureKey = OBSTACLE_TEXTURES[type] ?? 'ground_small';
    this.sprite = scene.add.sprite(position.x, position.y, textureKey);
    this.sprite.setOrigin(0, 1);
    this.sprite.setDisplaySize(width, height);
    this.sprite.setDepth(10);

    // Play animation for air obstacles (2-frame loop)
    const animKey = AIR_ANIMATIONS[type];
    if (animKey) {
      this.sprite.play(animKey);
    }
  }

  public updatePosition(position: Vector2D): void {
    this.sprite.x = position.x;
    this.sprite.y = position.y;
  }

  public setScale(x: number, y: number): void {
    this.sprite.setScale(x, y);
  }

  public getObstacleId(): string {
    return this.obstacleId;
  }

  public getType(): ObstacleType {
    return this.obstacleType;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
