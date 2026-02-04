import type { Vector2D, PlayerSession } from '../types/index.js';
import { PlayerState } from '../types/index.js';

export class Player {
  public id: string;
  public platformUserId: string;
  public socketId: string;
  public state: PlayerState;
  public position: Vector2D;
  public velocity: Vector2D;
  public score: number;
  public betData: PlayerSession['betData'];
  public isGrounded: boolean;
  public isDucking: boolean;
  public lastInputSequence: number;
  public disconnectedAt: number | null;

  // Jump buffer: stores a jump request while airborne, executes on landing
  public bufferedJump: boolean;
  // Late-jump grace: tick when last jump input was received
  public lastJumpInputTick: number;

  // Near-miss events (cleared after each snapshot is sent)
  public pendingNearMisses: Array<{ tick: number; margin: number; level: 'close' | 'insane' | 'pixel_perfect' }>;
  // Tracks minimum vertical clearance per obstacle while horizontally near
  public obstacleMinMargins: Map<string, number>;

  // Rate limiting
  private inputTimestamps: number[];
  private static readonly MAX_INPUTS_PER_SECOND = 15;

  constructor(session: PlayerSession, socketId: string) {
    this.id = session.playerId;
    this.platformUserId = session.platformUserId;
    this.socketId = socketId;
    this.state = PlayerState.CONNECTED;
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.score = 0;
    this.betData = session.betData;
    this.isGrounded = true;
    this.isDucking = false;
    this.lastInputSequence = 0;
    this.disconnectedAt = null;
    this.bufferedJump = false;
    this.lastJumpInputTick = -999;
    this.pendingNearMisses = [];
    this.obstacleMinMargins = new Map();
    this.inputTimestamps = [];
  }

  /** Returns false if player is sending inputs too fast */
  public checkRateLimit(): boolean {
    const now = Date.now();
    // Remove timestamps older than 1 second
    this.inputTimestamps = this.inputTimestamps.filter(t => now - t < 1000);
    if (this.inputTimestamps.length >= Player.MAX_INPUTS_PER_SECOND) {
      return false;
    }
    this.inputTimestamps.push(now);
    return true;
  }

  public jump(jumpVelocity: number, currentTick: number): void {
    this.lastJumpInputTick = currentTick;
    if (this.isGrounded && this.state === PlayerState.PLAYING) {
      this.velocity.y = jumpVelocity;
      this.isGrounded = false;
      this.bufferedJump = false;
    } else if (!this.isGrounded && this.state === PlayerState.PLAYING) {
      // Player is airborne — buffer the jump for landing
      this.bufferedJump = true;
    }
  }

  public duck(): void {
    if (this.state !== PlayerState.PLAYING) return;
    this.isDucking = true;
    // Fast fall when in air
    if (!this.isGrounded) {
      this.velocity.y = -Math.abs(this.velocity.y) * 2;
    }
  }

  public unduck(): void {
    this.isDucking = false;
  }

  public updatePosition(deltaTime: number, gravity: number, jumpVelocity: number): void {
    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y -= gravity * deltaTime;
    }

    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Ground collision (simple check at y = 0)
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.isDucking = false; // Reset duck on landing

      // Execute buffered jump immediately on landing
      if (this.bufferedJump) {
        this.bufferedJump = false;
        this.velocity.y = jumpVelocity;
        this.isGrounded = false;
      }
    }
  }

  public recordNearMiss(margin: number, tick: number): void {
    let level: 'close' | 'insane' | 'pixel_perfect';
    let bonus: number;

    if (margin < 6) {
      level = 'pixel_perfect';
      bonus = 30;
    } else if (margin < 12) {
      level = 'insane';
      bonus = 15;
    } else {
      level = 'close';
      bonus = 5;
    }

    this.pendingNearMisses.push({ tick, margin, level });
    this.score += bonus;
  }

  public incrementScore(points: number): void {
    this.score += points;
  }

  public eliminate(): void {
    this.state = PlayerState.ELIMINATED;
  }

  public setReady(): void {
    if (this.state === PlayerState.CONNECTED) {
      this.state = PlayerState.READY;
    }
  }

  public startPlaying(): void {
    if (this.state === PlayerState.READY) {
      this.state = PlayerState.PLAYING;
    }
  }

  public disconnect(): void {
    this.state = PlayerState.DISCONNECTED;
    this.disconnectedAt = Date.now();
  }

  public updateSocketId(newSocketId: string): void {
    this.socketId = newSocketId;
    this.disconnectedAt = null;
    // If player was disconnected, reconnect them
    if (this.state === PlayerState.DISCONNECTED) {
      this.state = PlayerState.CONNECTED;
    }
  }

  public getSnapshot() {
    const nearMisses = this.pendingNearMisses.length > 0
      ? [...this.pendingNearMisses]
      : undefined;
    // Clear after snapshot so each near-miss is sent exactly once
    this.pendingNearMisses.length = 0;

    return {
      playerId: this.id,
      position: { ...this.position },
      velocity: { ...this.velocity },
      state: this.state,
      score: this.score,
      ...(nearMisses ? { nearMisses } : {}),
    };
  }
}
