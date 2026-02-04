import type { Player } from '../models/Player.js';
import type { Obstacle } from '../models/Obstacle.js';
import type { GameConfig } from '../types/index.js';

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Late-jump grace constants
const GRACE_WINDOW_TICKS = 5;  // ~80ms at 60fps
const GRACE_MAX_OVERLAP_PX = 6;

export class CollisionDetector {
  private forgiveness: number;

  constructor(private config: GameConfig) {
    // Clamp forgiveness between 0.5 and 1.0 for safety
    this.forgiveness = Math.min(1.0, Math.max(0.5, config.hitboxForgiveness));
  }

  /**
   * Shrink a bounding box toward its center by the forgiveness factor.
   * forgiveness=0.8 means the collision box is 80% of the visual size,
   * centered within the visual sprite.
   */
  private shrinkBounds(bounds: Bounds): Bounds {
    const f = this.forgiveness;
    const marginX = (bounds.right - bounds.left) * (1 - f) / 2;
    const marginY = (bounds.top - bounds.bottom) * (1 - f) / 2;
    return {
      left: bounds.left + marginX,
      right: bounds.right - marginX,
      top: bounds.top - marginY,
      bottom: bounds.bottom + marginY,
    };
  }

  /**
   * Calculate the horizontal overlap between two bounds.
   * Returns 0 if no overlap.
   */
  private getHorizontalOverlap(a: Bounds, b: Bounds): number {
    const overlapLeft = Math.max(a.left, b.left);
    const overlapRight = Math.min(a.right, b.right);
    return Math.max(0, overlapRight - overlapLeft);
  }

  public checkCollision(player: Player, obstacle: Obstacle, currentTick: number): boolean {
    // Player visual bounds — use ducking height if ducking
    const playerHeight = player.isDucking
      ? this.config.playerHeight * 0.5
      : this.config.playerHeight;

    const playerVisual: Bounds = {
      left: player.position.x,
      right: player.position.x + this.config.playerWidth,
      top: player.position.y + playerHeight,
      bottom: player.position.y,
    };

    // Obstacle visual bounds
    const obstacleVisual = obstacle.getBounds();

    // Shrink both by forgiveness factor (centered)
    const playerBounds = this.shrinkBounds(playerVisual);
    const obstacleBounds = this.shrinkBounds(obstacleVisual);

    // AABB collision detection
    if (!this.aabbCollision(playerBounds, obstacleBounds)) {
      return false;
    }

    // Collision detected — check late-jump grace
    const overlap = this.getHorizontalOverlap(playerBounds, obstacleBounds);
    const recentJump = (currentTick - player.lastJumpInputTick) <= GRACE_WINDOW_TICKS;

    if (overlap <= GRACE_MAX_OVERLAP_PX && recentJump) {
      // Player "barely makes it" — ignore collision
      return false;
    }

    return true;
  }

  private aabbCollision(a: Bounds, b: Bounds): boolean {
    return (
      a.left < b.right &&
      a.right > b.left &&
      a.bottom < b.top &&
      a.top > b.bottom
    );
  }

  /**
   * Track the vertical clearance between player and obstacle each tick.
   * Called every tick for obstacles that are horizontally overlapping with the player.
   * Updates the player's obstacleMinMargins map with the minimum seen so far.
   */
  public trackNearMissMargin(player: Player, obstacle: Obstacle): void {
    const playerHeight = player.isDucking
      ? this.config.playerHeight * 0.5
      : this.config.playerHeight;

    const playerBounds: Bounds = {
      left: player.position.x,
      right: player.position.x + this.config.playerWidth,
      top: player.position.y + playerHeight,
      bottom: player.position.y,
    };

    const obstacleBounds = obstacle.getBounds();

    // Only track when horizontally overlapping (obstacle is passing the player)
    if (playerBounds.right <= obstacleBounds.left || playerBounds.left >= obstacleBounds.right) {
      return;
    }

    // Compute vertical clearance (using visual bounds, not shrunk)
    // Gap above obstacle (player jumped over it)
    const gapAbove = playerBounds.bottom - obstacleBounds.top;
    // Gap below obstacle (player ducked under it)
    const gapBelow = obstacleBounds.bottom - playerBounds.top;

    // Take the smallest positive gap (the near-miss axis)
    let verticalMargin = Infinity;
    if (gapAbove > 0) verticalMargin = Math.min(verticalMargin, gapAbove);
    if (gapBelow > 0) verticalMargin = Math.min(verticalMargin, gapBelow);

    // If both are negative, they're overlapping (collision zone) — margin is 0
    if (verticalMargin === Infinity) verticalMargin = 0;

    // Update minimum margin for this obstacle
    const existing = player.obstacleMinMargins.get(obstacle.id);
    if (existing === undefined || verticalMargin < existing) {
      player.obstacleMinMargins.set(obstacle.id, verticalMargin);
    }
  }

  public checkObstaclePassed(player: Player, obstacle: Obstacle): boolean {
    return (
      !obstacle.passed &&
      player.position.x > obstacle.position.x + obstacle.width
    );
  }
}
