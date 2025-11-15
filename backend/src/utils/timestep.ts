/**
 * Fixed timestep utilities for deterministic game simulation
 */

export class FixedTimestep {
  private accumulator: number;
  private readonly dt: number; // Fixed delta time in seconds

  constructor(tickRate: number) {
    this.dt = tickRate / 1000; // Convert ms to seconds
    this.accumulator = 0;
  }

  public update(deltaTime: number, callback: (dt: number) => void): void {
    this.accumulator += deltaTime;

    // Run simulation steps for accumulated time
    while (this.accumulator >= this.dt) {
      callback(this.dt);
      this.accumulator -= this.dt;
    }
  }

  public getAlpha(): number {
    // Interpolation alpha for rendering between fixed timesteps
    return this.accumulator / this.dt;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function getServerTime(): number {
  return Date.now();
}
