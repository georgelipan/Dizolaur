import { createHash, randomBytes, randomInt } from 'crypto';

/**
 * Cryptographically secure hash for generating consistent player IDs from tokens.
 * Uses SHA-256 to avoid collisions (critical for real-money games).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex').substring(0, 16);
}

/**
 * Seeded PRNG (Mulberry32) for deterministic obstacle generation.
 * Given the same seed, produces the same sequence — required for audit/replay.
 */
export class SeededRNG {
  private state: number;
  public readonly seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? randomInt(0, 2 ** 31 - 1);
    this.state = this.seed;
  }

  /** Returns a float in [0, 1) — deterministic from seed */
  public next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a boolean with given probability (default 0.5) */
  public nextBool(probability = 0.5): boolean {
    return this.next() < probability;
  }
}

/**
 * Generate a cryptographically secure random seed for a new match.
 */
export function generateMatchSeed(): number {
  return randomBytes(4).readUInt32BE(0);
}

/**
 * Generate a commit hash for provable fairness.
 * Server commits to the seed BEFORE match starts; players can verify after.
 */
export function generateSeedCommitment(seed: number): string {
  return createHash('sha256').update(seed.toString()).digest('hex');
}
