import type { Match } from '../models/Match.js';
import type { PlayerInput } from '../types/index.js';
import { MatchState, PlayerState } from '../types/index.js';
import { CollisionDetector } from './CollisionDetector.js';

export class PhysicsEngine {
  private collisionDetector: CollisionDetector;

  constructor() {
    this.collisionDetector = new CollisionDetector();
  }

  public processPlayerInput(match: Match, input: PlayerInput): void {
    const player = match.getPlayer(input.playerId);
    if (!player || player.state !== PlayerState.PLAYING) {
      return;
    }

    // Validate timestamp and sequence number to prevent replay attacks
    if (input.sequenceNumber <= player.lastInputSequence) {
      return; // Old or duplicate input
    }

    player.lastInputSequence = input.sequenceNumber;

    // Process input action
    switch (input.action) {
      case 'jump':
        player.jump(match.config.jumpVelocity);
        break;
      case 'duck':
        player.duck();
        break;
    }
  }

  public updateMatch(match: Match): void {
    if (match.state !== MatchState.IN_PROGRESS) {
      return;
    }

    // Update match state
    match.update(Date.now());

    // Check collisions for all active players
    for (const player of match.getActivePlayers()) {
      for (const obstacle of match.obstacles.values()) {
        // Check collision
        if (this.collisionDetector.checkCollision(player, obstacle)) {
          player.eliminate();
          console.log(`Player ${player.id} eliminated by collision`);
        }

        // Check if player passed obstacle (for bonus scoring)
        if (this.collisionDetector.checkObstaclePassed(player, obstacle)) {
          obstacle.passed = true;
          player.incrementScore(10); // Bonus points for passing obstacle
        }
      }
    }
  }

  public getCollisionDetector(): CollisionDetector {
    return this.collisionDetector;
  }
}
