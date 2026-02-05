/**
 * F14 — Haptic Feedback Service
 * Centralized vibration patterns using navigator.vibrate().
 * Graceful no-op on desktop, iOS (no vibrate API), or when API unavailable.
 */

const STORAGE_KEY = 'dizolaur_haptic_enabled';

export class HapticService {
  private _enabled: boolean;
  private supported: boolean;

  constructor() {
    this.supported = typeof navigator !== 'undefined'
      && typeof navigator.vibrate === 'function';

    // Default on; respect saved preference
    let stored = true;
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      if (val !== null) stored = val === 'true';
    } catch { /* noop */ }
    this._enabled = stored;
  }

  get enabled(): boolean {
    return this._enabled && this.supported;
  }

  get isSupported(): boolean {
    return this.supported;
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
  // Durations tuned for perceptibility: most phones ignore pulses < 20ms

  /** Jump — short tap */
  jump(): void {
    this.vibrate(30);
  }

  /** Duck — short tap */
  duck(): void {
    this.vibrate(35);
  }

  /** Near-miss — double quick pulse */
  nearMiss(): void {
    this.vibrate([30, 40, 30]);
  }

  /** Pixel perfect near-miss — triple strong pulse */
  pixelPerfect(): void {
    this.vibrate([40, 20, 40, 20, 40]);
  }

  /** Own elimination — long buzz */
  ownElimination(): void {
    this.vibrate(300);
  }

  /** Other player eliminated — single pulse */
  otherElimination(): void {
    this.vibrate(30);
  }

  /** Victory — celebration pattern */
  victory(): void {
    this.vibrate([100, 50, 100, 50, 200]);
  }
}
