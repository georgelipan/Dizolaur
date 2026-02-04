import type { Match } from '../models/Match.js';
import type { PlayerInput } from '../types/index.js';
import { MatchState, PlayerState } from '../types/index.js';
import { CollisionDetector } from './CollisionDetector.js';

export class PhysicsEngine {
  public processPlayerInput(match: Match, input: PlayerInput): void {
    const player = match.getPlayer(input.playerId);
    if (!player || player.state !== PlayerState.PLAYING) {
      return;
    }

    // Validate sequence number to prevent replay attacks
    if (input.sequenceNumber <= player.lastInputSequence) {
      return; // Old or duplicate input
    }

    // Rate limiting — reject if player sends inputs too fast
    if (!player.checkRateLimit()) {
      console.warn(`[Anti-Cheat] Rate limit exceeded for player ${player.id}`);
      return;
    }

    // Validate timestamp — reject inputs with impossible timing
    const timeDiff = Date.now() - input.timestamp;
    if (timeDiff > 5000 || timeDiff < -1000) {
      console.warn(`[Anti-Cheat] Invalid timestamp from player ${player.id}: drift=${timeDiff}ms`);
      return;
    }

    player.lastInputSequence = input.sequenceNumber;

    // Process input action
    switch (input.action) {
      case 'jump':
        player.jump(match.config.jumpVelocity, match.currentTick);
        break;
      case 'duck':
        player.duck();
        break;
      case 'unduck':
        player.unduck();
        break;
    }

    match.logEvent('player_input', {
      playerId: player.id,
      action: input.action,
      seq: input.sequenceNumber,
    });
  }

  public updateMatch(match: Match): void {
    if (match.state !== MatchState.IN_PROGRESS) {
      return;
    }

    // Update match state
    match.update(Date.now());

    // Create collision detector with match-specific config
    const collisionDetector = new CollisionDetector(match.config);

    // Check collisions for all active players
    for (const player of match.getActivePlayers()) {
      for (const obstacle of match.obstacles.values()) {
        // Check collision
        if (collisionDetector.checkCollision(player, obstacle, match.currentTick)) {
          player.eliminate();
          console.log(`Player ${player.id} eliminated by collision`);
        }

        // Track vertical clearance each tick for near-miss detection
        if (!obstacle.passed) {
          collisionDetector.trackNearMissMargin(player, obstacle);
        }

        // Check if player passed obstacle (for bonus scoring + near-miss detection)
        if (collisionDetector.checkObstaclePassed(player, obstacle)) {
          obstacle.passed = true;
          player.incrementScore(10); // Bonus points for passing obstacle

          // Near-miss detection: use the tracked minimum margin
          const margin = player.obstacleMinMargins.get(obstacle.id);
          if (margin !== undefined && margin > 0 && margin < 20) {
            player.recordNearMiss(margin, match.currentTick);
          }
          // Clean up tracking for this obstacle
          player.obstacleMinMargins.delete(obstacle.id);
        }
      }
    }
  }
}
