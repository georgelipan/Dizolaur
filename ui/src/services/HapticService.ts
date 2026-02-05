/**
 * F14 — Haptic Feedback Service
 * Centralized vibration patterns using navigator.vibrate().
 * Graceful no-op on desktop or when API unavailable.
 */

const STORAGE_KEY = 'dizolaur_haptic_enabled';

export class HapticService {
  private _enabled: boolean;
  private supported: boolean;

  constructor() {
    this.supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    // Default on; respect saved preference
    let stored = true;
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      if (val !== null) stored = val === 'true';
    } catch { /* noop */ }
    this._enabled = stored;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  toggle(): boolean {
    this._enabled = !this._enabled;
    try { localStorage.setItem(STORAGE_KEY, String(this._enabled)); } catch { /* noop */ }
    return this._enabled;
  }

  private vibrate(pattern: number | number[]): void {
    if (!this._enabled || !this.supported) return;
    try { navigator.vibrate(pattern); } catch { /* noop */ }
  }

  // ── Event patterns ──

  /** Jump — single light pulse */
  jump(): void {
    this.vibrate(10);
  }

  /** Duck — single light pulse */
  duck(): void {
    this.vibrate(15);
  }

  /** Near-miss — double quick pulse */
  nearMiss(): void {
    this.vibrate([10, 30, 10]);
  }

  /** Pixel perfect near-miss — triple strong pulse */
  pixelPerfect(): void {
    this.vibrate([15, 10, 15, 10, 15]);
  }

  /** Own elimination — long buzz */
  ownElimination(): void {
    this.vibrate(200);
  }

  /** Other player eliminated — single light pulse */
  otherElimination(): void {
    this.vibrate(10);
  }

  /** Victory — celebration pattern */
  victory(): void {
    this.vibrate([100, 50, 100, 50, 200]);
  }
}
