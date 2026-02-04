import type { Player } from '../models/Player.js';
import type { Obstacle } from '../models/Obstacle.js';
import type { GameConfig } from '../types/index.js';

export class CollisionDetector {
  constructor(private config: GameConfig) {}

  public checkCollision(player: Player, obstacle: Obstacle): boolean {
    // Get player bounds using config dimensions
    const playerBounds = {
      left: player.position.x,
      right: player.position.x + this.config.playerWidth,
      top: player.position.y + this.config.playerHeight,
      bottom: player.position.y,
    };

    // Get obstacle bounds
    const obstacleBounds = obstacle.getBounds();

    // AABB (Axis-Aligned Bounding Box) collision detection
    return this.aabbCollision(playerBounds, obstacleBounds);
  }

  private aabbCollision(
    a: { left: number; right: number; top: number; bottom: number },
    b: { left: number; right: number; top: number; bottom: number }
  ): boolean {
    return (
      a.left < b.right &&
      a.right > b.left &&
      a.bottom < b.top &&
      a.top > b.bottom
    );
  }

  public checkObstaclePassed(player: Player, obstacle: Obstacle): boolean {
    // Check if player has passed the obstacle (for scoring)
    return (
      !obstacle.passed &&
      player.position.x > obstacle.position.x + obstacle.width
    );
  }
}
