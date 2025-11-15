import type { Player } from '../models/Player.js';
import type { Obstacle } from '../models/Obstacle.js';

export class CollisionDetector {
  // Dino hitbox dimensions (simplified)
  private readonly DINO_WIDTH = 40;
  private readonly DINO_HEIGHT = 50;

  public checkCollision(player: Player, obstacle: Obstacle): boolean {
    // Get player bounds
    const playerBounds = {
      left: player.position.x,
      right: player.position.x + this.DINO_WIDTH,
      top: player.position.y + this.DINO_HEIGHT,
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
