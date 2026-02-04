import Phaser from 'phaser';

interface ParticleConfig {
  x: number;
  y: number;
  count: number;
  color: number;
  speedX: [number, number];
  speedY: [number, number];
  lifespan: number;
  size: [number, number];
}

/**
 * Lightweight particle system using simple rectangles.
 * No texture atlas needed — uses Phaser rectangles with tweens.
 */
export class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private emit(config: ParticleConfig): void {
    for (let i = 0; i < config.count; i++) {
      const size = Phaser.Math.Between(config.size[0], config.size[1]);
      const particle = this.scene.add.rectangle(
        config.x, config.y, size, size, config.color
      );
      particle.setDepth(90);

      const vx = Phaser.Math.FloatBetween(config.speedX[0], config.speedX[1]);
      const vy = Phaser.Math.FloatBetween(config.speedY[0], config.speedY[1]);

      this.scene.tweens.add({
        targets: particle,
        x: config.x + vx * (config.lifespan / 1000),
        y: config.y + vy * (config.lifespan / 1000),
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: config.lifespan,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** Dust cloud at feet on jump */
  public onJump(x: number, groundY: number): void {
    this.emit({
      x, y: groundY,
      count: Phaser.Math.Between(3, 5),
      color: 0xc8b090,
      speedX: [-60, 60],
      speedY: [-30, -80],
      lifespan: 200,
      size: [3, 6],
    });
  }

  /** Dust cloud on landing */
  public onLanding(x: number, groundY: number): void {
    this.emit({
      x, y: groundY,
      count: Phaser.Math.Between(5, 8),
      color: 0xc8b090,
      speedX: [-80, 80],
      speedY: [-50, -120],
      lifespan: 300,
      size: [3, 7],
    });
  }

  /** Bone/star burst on elimination */
  public onElimination(x: number, y: number): void {
    this.emit({
      x, y,
      count: Phaser.Math.Between(8, 12),
      color: 0xff4444,
      speedX: [-150, 150],
      speedY: [-200, 50],
      lifespan: 500,
      size: [4, 8],
    });
  }

  /** Spark trail on near-miss */
  public onNearMiss(x: number, y: number): void {
    this.emit({
      x, y,
      count: Phaser.Math.Between(2, 3),
      color: 0xffdd00,
      speedX: [-40, 40],
      speedY: [-60, -20],
      lifespan: 200,
      size: [2, 4],
    });
  }

  /** Confetti on victory */
  public onVictory(worldWidth: number): void {
    for (let i = 0; i < 25; i++) {
      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
      const color = colors[i % colors.length];
      const x = Phaser.Math.Between(0, worldWidth);
      const particle = this.scene.add.rectangle(x, -10, 6, 6, color);
      particle.setDepth(95);

      this.scene.tweens.add({
        targets: particle,
        y: Phaser.Math.Between(200, 500),
        x: x + Phaser.Math.Between(-100, 100),
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-3, 3),
        duration: 2000,
        ease: 'Power1',
        delay: Phaser.Math.Between(0, 500),
        onComplete: () => particle.destroy(),
      });
    }
  }
}
