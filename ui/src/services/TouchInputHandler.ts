/**
 * F13 — Touch Input Handler
 * Tap to jump, swipe down to duck. Single-finger playable.
 *
 * Detection rules:
 *   - Tap: < 10px total movement from touch start → jump
 *   - Swipe down: > 30px downward movement in < 200ms → duck
 *   - Any touch that is NOT a clear swipe down → jump (critical rule)
 *   - Duck hold: player stays ducking while finger is held after swipe
 *   - Dead zone: 100ms after jump, ignore taps (prevents accidental double-tap)
 */

const TAP_THRESHOLD_PX = 10;
const SWIPE_DOWN_MIN_PX = 30;
const SWIPE_TIME_LIMIT_MS = 200;
const TAP_DEAD_ZONE_MS = 100;

export type TouchAction = 'jump' | 'duck_start' | 'duck_hold' | 'duck_end';

export interface TouchInputCallbacks {
  onJump: () => void;
  onDuckStart: () => void;
  onDuckHold: () => void;
  onDuckEnd: () => void;
}

export class TouchInputHandler {
  private scene: Phaser.Scene;
  private callbacks: TouchInputCallbacks;
  private enabled = true;

  // Touch tracking state
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private isTouching = false;
  private isDucking = false;
  private lastJumpTime = 0;

  // Duck hold interval
  private duckHoldInterval: ReturnType<typeof setInterval> | null = null;

  constructor(scene: Phaser.Scene, callbacks: TouchInputCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    this.setupListeners();
  }

  private setupListeners(): void {
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) return;

    // Ignore mouse clicks (only handle touch)
    if (pointer.wasTouch === false) return;

    this.isTouching = true;
    this.touchStartX = pointer.x;
    this.touchStartY = pointer.y;
    this.touchStartTime = Date.now();
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || !this.isTouching) return;
    if (pointer.wasTouch === false) return;

    // Already ducking — keep sending duck_hold
    if (this.isDucking) return;

    const dy = pointer.y - this.touchStartY;
    const elapsed = Date.now() - this.touchStartTime;

    // Check for swipe down: > 30px downward in < 200ms
    if (dy > SWIPE_DOWN_MIN_PX && elapsed < SWIPE_TIME_LIMIT_MS) {
      this.startDuck();
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || !this.isTouching) return;
    if (pointer.wasTouch === false) return;

    this.isTouching = false;

    // If ducking, end duck
    if (this.isDucking) {
      this.endDuck();
      return;
    }

    // Calculate movement distance
    const dx = pointer.x - this.touchStartX;
    const dy = pointer.y - this.touchStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - this.touchStartTime;

    // Critical rule: anything that is NOT a clear swipe down = jump
    // Swipe down that happened too slowly also becomes a jump
    const isSwipeDown = dy > SWIPE_DOWN_MIN_PX && elapsed < SWIPE_TIME_LIMIT_MS;

    if (!isSwipeDown) {
      // Dead zone check: prevent double-tap
      const now = Date.now();
      if (now - this.lastJumpTime < TAP_DEAD_ZONE_MS) return;

      this.lastJumpTime = now;
      this.callbacks.onJump();
    }
  }

  private startDuck(): void {
    this.isDucking = true;
    this.callbacks.onDuckStart();

    // Send duck_hold every 100ms while finger is held
    this.duckHoldInterval = setInterval(() => {
      if (this.isDucking && this.isTouching) {
        this.callbacks.onDuckHold();
      } else {
        this.clearDuckInterval();
      }
    }, 100);
  }

  private endDuck(): void {
    this.isDucking = false;
    this.clearDuckInterval();
    this.callbacks.onDuckEnd();
  }

  private clearDuckInterval(): void {
    if (this.duckHoldInterval !== null) {
      clearInterval(this.duckHoldInterval);
      this.duckHoldInterval = null;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.isDucking) {
      this.endDuck();
    }
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.clearDuckInterval();
  }
}
