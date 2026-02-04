import type { GameConfig } from '../types/index.js';
import type { ObstacleType } from './Obstacle.js';
import type { SeededRNG } from '../utils/hash.js';

// --- Pattern element: one obstacle within a pattern ---

export interface PatternElement {
  type: ObstacleType;
  /** Gap in pixels from the previous element (0 for the first element) */
  gap: number;
}

export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'very_hard' | 'expert';

export interface PatternDefinition {
  id: string;
  name: string;
  difficulty: DifficultyTier;
  /** Number of obstacles in this pattern (used to scale spawn interval) */
  size: number;
  /**
   * Build the element sequence for a given speed.
   * Gaps that scale with speed use the speed parameter; fixed gaps ignore it.
   */
  build(speed: number): PatternElement[];
}

// ---------------------------------------------------------------------------
// Absolute minimum gaps (pixels) — ensures patterns are always beatable
// regardless of speed. These are floors that the speed-scaled gaps cannot
// go below.
// ---------------------------------------------------------------------------

const MIN_GAP_ABSOLUTE = 280;           // Minimum px between any two obstacles
const MIN_JUMP_RECOVERY_ABSOLUTE = 350; // After a ground obstacle (jump), min px to next
const MIN_DUCK_TO_JUMP_ABSOLUTE = 320;  // After an air obstacle (duck), min px to ground

// ---------------------------------------------------------------------------
// Pattern definitions (from F03 spec)
// ---------------------------------------------------------------------------

// Phase 1 — ONLY single ground obstacles
const SINGLE_GROUND: PatternDefinition = {
  id: 'single',
  name: 'Single Obstacle',
  difficulty: 'easy',
  size: 1,
  build: () => [{ type: 'ground_small', gap: 0 }],
};

// --- Simple (Phase 2-3) ---

const S1_DOUBLE_JUMP: PatternDefinition = {
  id: 'S1',
  name: 'Double Jump',
  difficulty: 'medium',
  size: 2,
  build: (speed) => [
    { type: 'ground_small', gap: 0 },
    { type: 'ground_small', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.6) },
  ],
};

const S2_JUMP_DUCK: PatternDefinition = {
  id: 'S2',
  name: 'Jump-Duck',
  difficulty: 'medium',
  size: 2,
  build: (speed) => [
    { type: 'ground_small', gap: 0 },
    { type: 'air_low', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.8) },
  ],
};

const S3_DUCK_JUMP: PatternDefinition = {
  id: 'S3',
  name: 'Duck-Jump',
  difficulty: 'medium',
  size: 2,
  build: (speed) => [
    { type: 'air_low', gap: 0 },
    { type: 'ground_small', gap: Math.max(MIN_DUCK_TO_JUMP_ABSOLUTE, speed * 1.5) },
  ],
};

// --- Complex (Phase 3-4) ---

const C1_TRIPLE_JUMP: PatternDefinition = {
  id: 'C1',
  name: 'Triple Jump',
  difficulty: 'hard',
  size: 3,
  build: (speed) => [
    { type: 'ground_small', gap: 0 },
    { type: 'ground_small', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.5) },
    { type: 'ground_small', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.5) },
  ],
};

const C2_JUMP_DUCK_JUMP: PatternDefinition = {
  id: 'C2',
  name: 'Jump-Duck-Jump',
  difficulty: 'hard',
  size: 3,
  build: (speed) => [
    { type: 'ground_small', gap: 0 },
    { type: 'air_low', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.7) },
    { type: 'ground_small', gap: Math.max(MIN_DUCK_TO_JUMP_ABSOLUTE, speed * 1.4) },
  ],
};

const C3_TALL_LOW: PatternDefinition = {
  id: 'C3',
  name: 'Tall+Low',
  difficulty: 'hard',
  size: 2,
  build: (speed) => [
    { type: 'ground_tall', gap: 0 },
    { type: 'air_low', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.8) },
  ],
};

const C4_STUTTER_STEP: PatternDefinition = {
  id: 'C4',
  name: 'Stutter Step',
  difficulty: 'very_hard',
  size: 3,
  build: (speed) => [
    { type: 'ground_small', gap: 0 },
    { type: 'air_low', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.8) },
    { type: 'ground_small', gap: Math.max(MIN_DUCK_TO_JUMP_ABSOLUTE, speed * 1.3) },
  ],
};

// --- Expert (Phase 4-5) ---

const E1_QUAD: PatternDefinition = {
  id: 'E1',
  name: 'Quad',
  difficulty: 'expert',
  size: 4,
  build: (speed) => [
    { type: 'ground_small', gap: 0 },
    { type: 'air_low', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.5) },
    { type: 'ground_small', gap: Math.max(MIN_DUCK_TO_JUMP_ABSOLUTE, speed * 1.3) },
    { type: 'air_low', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.5) },
  ],
};

const E2_FAKE_OUT: PatternDefinition = {
  id: 'E2',
  name: 'Fake-Out',
  difficulty: 'expert',
  size: 2,
  build: (speed) => [
    { type: 'air_high', gap: 0 },      // High bird — no action needed
    { type: 'ground_small', gap: Math.max(MIN_GAP_ABSOLUTE, speed * 1.0) },
  ],
};

const E3_PRECISION: PatternDefinition = {
  id: 'E3',
  name: 'Precision',
  difficulty: 'expert',
  size: 2,
  build: (speed) => [
    { type: 'ground_wide', gap: 0 },   // Wide ground obstacle
    { type: 'air_low', gap: Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.5) },
  ],
};

// ---------------------------------------------------------------------------
// All patterns grouped by difficulty
// ---------------------------------------------------------------------------

const PATTERNS_BY_DIFFICULTY: Record<DifficultyTier, PatternDefinition[]> = {
  easy:      [SINGLE_GROUND],
  medium:    [S1_DOUBLE_JUMP, S2_JUMP_DUCK, S3_DUCK_JUMP],
  hard:      [C1_TRIPLE_JUMP, C2_JUMP_DUCK_JUMP, C3_TALL_LOW],
  very_hard: [C4_STUTTER_STEP],
  expert:    [E1_QUAD, E2_FAKE_OUT, E3_PRECISION],
};

// ---------------------------------------------------------------------------
// Weighted selection per phase
// Order: [easy%, medium%, hard%, very_hard%, expert%]
// Phase 1: ONLY single obstacles. Patterns appear from Phase 2 onward.
// ---------------------------------------------------------------------------

const PHASE_WEIGHTS: Record<number, number[]> = {
  1: [100, 0,  0,  0,  0],
  2: [60,  40, 0,  0,  0],
  3: [20,  35, 35, 10, 0],
  4: [5,   15, 30, 30, 20],
  5: [0,   5,  20, 35, 40],
};

const DIFFICULTY_ORDER: DifficultyTier[] = ['easy', 'medium', 'hard', 'very_hard', 'expert'];

// ---------------------------------------------------------------------------
// Validation constraints (F03 spec hard constraints)
// ---------------------------------------------------------------------------

function isGroundType(type: ObstacleType): boolean {
  return type === 'ground_small' || type === 'ground_tall' || type === 'ground_wide';
}

function isAirType(type: ObstacleType): boolean {
  return type === 'air_low' || type === 'air_high' || type === 'air_moving';
}

function validatePattern(elements: PatternElement[], speed: number): PatternElement[] {
  const minGap = Math.max(MIN_GAP_ABSOLUTE, speed * 1.2);
  const jumpRecovery = Math.max(MIN_JUMP_RECOVERY_ABSOLUTE, speed * 1.5);
  const duckToJumpMin = Math.max(MIN_DUCK_TO_JUMP_ABSOLUTE, speed * 1.3);

  const validated: PatternElement[] = [];

  for (let i = 0; i < elements.length; i++) {
    const el = { ...elements[i]! };

    if (i > 0) {
      const prev = elements[i - 1]!;

      // Enforce minimum gap
      if (el.gap < minGap) {
        el.gap = minGap;
      }

      // Rule 2: if previous was ground (requires jump), enforce jump recovery
      if (isGroundType(prev.type) && el.gap < jumpRecovery) {
        el.gap = jumpRecovery;
      }

      // Rule 3: if previous was air (requires duck) and current is ground (requires jump)
      if (isAirType(prev.type) && isGroundType(el.type) && el.gap < duckToJumpMin) {
        el.gap = duckToJumpMin;
      }
    }

    validated.push(el);
  }

  return validated;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class PatternLibrary {
  /**
   * Select a pattern using weighted random based on current phase,
   * then build and validate the element sequence.
   *
   * Returns the pattern definition (with .size for spawn interval scaling)
   * and the validated element sequence.
   */
  public static selectPattern(
    phase: number,
    speed: number,
    rng: SeededRNG,
    _config: GameConfig
  ): { pattern: PatternDefinition; elements: PatternElement[] } {
    const clampedPhase = Math.min(Math.max(phase, 1), 5);
    const weights = PHASE_WEIGHTS[clampedPhase]!;

    // Pick difficulty tier via weighted random
    const roll = rng.next() * 100;
    let cumulative = 0;
    let chosenTier: DifficultyTier = 'easy';

    for (let i = 0; i < DIFFICULTY_ORDER.length; i++) {
      cumulative += weights[i]!;
      if (roll < cumulative) {
        chosenTier = DIFFICULTY_ORDER[i]!;
        break;
      }
    }

    // Pick a random pattern from that tier
    const candidates = PATTERNS_BY_DIFFICULTY[chosenTier];
    const idx = Math.floor(rng.next() * candidates.length);
    const pattern = candidates[idx]!;

    // Build elements for current speed
    const rawElements = pattern.build(speed);

    // Validate constraints (enforces absolute minimums)
    const elements = validatePattern(rawElements, speed);

    return { pattern, elements };
  }
}
