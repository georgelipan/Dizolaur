import type { Vector2D, GameConfig } from '../types/index.js';

export type ObstacleType = 'ground_small' | 'ground_tall' | 'ground_wide' | 'air_high' | 'air_low' | 'air_moving';

export interface SineParams {
  baseY: number;
  amplitude: number;
  period: number;
}

export class Obstacle {
  public id: string;
  public type: ObstacleType;
  public position: Vector2D;
  public width: number;
  public height: number;
  public velocity: Vector2D;
  public passed: boolean;
  public sineParams?: SineParams | undefined;
  public pattern?: string | undefined;
  public spawnTime: number;

  constructor(
    id: string,
    type: ObstacleType,
    position: Vector2D,
    width: number,
    height: number,
    velocity: Vector2D,
    sineParams?: SineParams
  ) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.width = width;
    this.height = height;
    this.velocity = velocity;
    this.passed = false;
    this.sineParams = sineParams;
    this.spawnTime = Date.now();
  }

  public update(deltaTime: number): void {
    // Move obstacle leftward
    this.position.x += this.velocity.x * deltaTime;

    // Sine wave vertical movement for air_moving
    if (this.sineParams) {
      const elapsed = (Date.now() - this.spawnTime) / 1000;
      this.position.y = this.sineParams.baseY + this.sineParams.amplitude * Math.sin(2 * Math.PI * elapsed / this.sineParams.period);
    } else {
      this.position.y += this.velocity.y * deltaTime;
    }
  }

  public isOffScreen(): boolean {
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
    const snapshot: {
      id: string;
      position: { x: number; y: number };
      width: number;
      height: number;
      type: ObstacleType;
      pattern?: string;
    } = {
      id: this.id,
      position: { ...this.position },
      width: this.width,
      height: this.height,
      type: this.type,
    };
    if (this.pattern) {
      snapshot.pattern = this.pattern;
    }
    return snapshot;
  }

  // --- Factory methods ---

  public static createGroundSmall(id: string, x: number, speed: number, config: GameConfig): Obstacle {
    return new Obstacle(id, 'ground_small', { x, y: config.groundY }, config.groundSmallWidth, config.groundSmallHeight, { x: -speed, y: 0 });
  }

  public static createGroundTall(id: string, x: number, speed: number, config: GameConfig): Obstacle {
    return new Obstacle(id, 'ground_tall', { x, y: config.groundY }, config.groundTallWidth, config.groundTallHeight, { x: -speed, y: 0 });
  }

  public static createGroundWide(id: string, x: number, speed: number, config: GameConfig): Obstacle {
    return new Obstacle(id, 'ground_wide', { x, y: config.groundY }, config.groundWideWidth, config.groundWideHeight, { x: -speed, y: 0 });
  }

  public static createAirHigh(id: string, x: number, speed: number, config: GameConfig): Obstacle {
    return new Obstacle(id, 'air_high', { x, y: config.airHighSpawnY }, config.airHighWidth, config.airHighHeight, { x: -speed, y: 0 });
  }

  public static createAirLow(id: string, x: number, speed: number, config: GameConfig): Obstacle {
    return new Obstacle(id, 'air_low', { x, y: config.airLowSpawnY }, config.airLowWidth, config.airLowHeight, { x: -speed, y: 0 });
  }

  public static createAirMoving(id: string, x: number, speed: number, config: GameConfig): Obstacle {
    return new Obstacle(
      id, 'air_moving',
      { x, y: config.airMovingBaseY },
      config.airMovingWidth, config.airMovingHeight,
      { x: -speed, y: 0 },
      { baseY: config.airMovingBaseY, amplitude: 40, period: 1.5 }
    );
  }
}
