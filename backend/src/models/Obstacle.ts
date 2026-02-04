import type { Vector2D, GameConfig } from '../types/index.js';

export type ObstacleType = 'ground_small' | 'air_high';

export class Obstacle {
  public id: string;
  public type: ObstacleType;
  public position: Vector2D;
  public width: number;
  public height: number;
  public velocity: Vector2D;
  public passed: boolean; // Track if obstacle has been passed by player

  constructor(
    id: string,
    type: ObstacleType,
    position: Vector2D,
    width: number,
    height: number,
    velocity: Vector2D
  ) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.width = width;
    this.height = height;
    this.velocity = velocity;
    this.passed = false;
  }

  public update(deltaTime: number): void {
    // Move obstacle (typically leftward in an endless runner)
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  public isOffScreen(): boolean {
    // Check if obstacle has moved off the left side of the screen
    return this.position.x + this.width < 0;
  }

  public getBounds() {
    return {
      left: this.position.x,
      right: this.position.x + this.width,
      top: this.position.y + this.height,
      bottom: this.position.y,
    };
  }

  public getSnapshot() {
    return {
      id: this.id,
      position: { ...this.position },
      width: this.width,
      height: this.height,
      type: this.type,
    };
  }

  public static createGroundSmall(id: string, x: number, speed: number, config: GameConfig): Obstacle {
    return new Obstacle(
      id,
      'ground_small',
      { x, y: config.groundY },
      config.groundSmallWidth,
      config.groundSmallHeight,
      { x: -speed, y: 0 }
    );
  }

  public static createAirHigh(id: string, x: number, y: number, speed: number, config: GameConfig): Obstacle {
    return new Obstacle(
      id,
      'air_high',
      { x, y },
      config.airHighWidth,
      config.airHighHeight,
      { x: -speed, y: 0 }
    );
  }
}
