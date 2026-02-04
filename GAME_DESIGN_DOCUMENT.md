# DIZOLAUR -- Complete Gameplay Design Document

**Version:** 1.0
**Date:** 2026-02-04
**Status:** Design Specification
**Platforms:** Mobile (iOS/Android browser), Desktop browser
**Genre:** Competitive multiplayer endless runner (real-money wagering)

---

## TABLE OF CONTENTS

1. Executive Summary
2. Current System Baseline
3. Progressive Difficulty System
4. Obstacle Design and Patterns
5. Psychology and Addiction Mechanics
6. Competitive and Social Mechanics
7. Mobile UX and Touch Controls
8. Casino Platform Integration
9. Visual and Audio Feedback
10. Anti-Frustration Design
11. Monetization-Friendly Design
12. Match Flow
13. Technical Implementation Notes
14. Balancing Reference Tables

---

## 1. EXECUTIVE SUMMARY

Dizolaur is a competitive multiplayer endless runner where 2-4 players bet real money and race to be the last dinosaur standing. The game runs on casino platforms, embedding inside operator sites via iframe or webview. All physics and collision detection are server-authoritative with provable fairness (seeded RNG, audit logs, seed commitments).

**Core loop:** Bet -> Run -> Survive -> Win pot (minus 5% house fee)

**Target session:** 45-90 seconds per match (lobby to results)
**Target match duration:** 25-55 seconds of active gameplay
**Ideal replays per session:** 8-15 matches

**Design pillars:**
- Skill matters, but the game is accessible to newcomers
- Every death must feel like the player's fault, never the game's
- Tension escalates naturally -- the longer you survive, the harder it gets
- The "one more game" loop must be irresistible

---

## 2. CURRENT SYSTEM BASELINE

Based on the existing codebase, these are the current values that all design specs build upon:

| Parameter | Current Value | Unit |
|---|---|---|
| World size | 800 x 600 | pixels |
| Ground Y | 0 | server coords (inverted on client) |
| Player size | 40 x 50 | pixels |
| Player start | (50, 0) | pixels |
| Gravity | 800 | px/s^2 |
| Jump velocity | 400 | px/s (upward) |
| Dino speed | 200 | px/s (obstacle scroll speed) |
| Obstacle spawn rate | 2000 | ms (fixed interval) |
| Cactus size | 30 x 50 | pixels |
| Bird size | 40 x 30 | pixels |
| Bird spawn Y | 100 | pixels above ground |
| Tick rate | 16 | ms (~60 FPS) |
| Max players | 4 | per match |
| Obstacle types | cactus, bird | 50/50 random |
| Scoring | 60 pts/sec + 10 per obstacle passed | |
| House fee | 5% of pot | |

**Key physics notes:**
- Jump arc: With velocity=400 and gravity=800, peak height = v^2/(2g) = 100px, total air time = 2v/g = 1.0s
- At speed 200px/s, an obstacle crosses the 800px screen in 4.0 seconds
- Player has visual reaction window of roughly (800 - 50 - 30) / 200 = 3.6 seconds for a cactus
- At current spawn rate (2000ms), obstacles are spaced 400px apart

---

## 3. PROGRESSIVE DIFFICULTY SYSTEM

### 3.1 Design Philosophy

Difficulty must ramp in a way that:
1. Gives every player a fair start (grace period)
2. Creates a steady sense of "I can handle this... barely"
3. Eventually overwhelms all but the most skilled players
4. Never produces an impossible obstacle combination

The difficulty curve is **not linear**. It follows a piecewise function with distinct phases.

### 3.2 Match Phases

A match consists of five phases. Phase transitions are based on elapsed time since match start.

#### PHASE 1: WARMUP (0s - 6s)

**Purpose:** Let players settle in. No one should die here unless they literally do not press any buttons. This is the "everyone gets comfortable" zone.

| Parameter | Value |
|---|---|
| Speed | 200 px/s (base) |
| Spawn interval | 2500ms |
| Obstacle types | Cactus only (ground obstacles) |
| Pattern complexity | Single obstacles only |
| Obstacle spacing | Minimum 500px between obstacles |

**Design rationale:** The first obstacle appears at T=2500ms. At 200px/s, it takes 3.6s to reach the player from spawn. So the first obstacle reaches the player around T=6.1s. This means the player has over 6 seconds of pure running before they need to react. The first few obstacles are exclusively ground-level cacti -- the simplest input (tap to jump).

**Speed formula for Phase 1:**
```
speed(t) = 200  // constant during warmup
```

#### PHASE 2: INTRODUCTION (6s - 15s)

**Purpose:** Introduce birds. Teach the duck mechanic through gameplay. Speed begins to increase.

| Parameter | Value |
|---|---|
| Speed | 200 -> 260 px/s (linear ramp) |
| Spawn interval | 2500ms -> 2000ms (linear ramp) |
| Obstacle types | 70% cactus, 30% bird |
| Pattern complexity | Singles only, first bird at ~8s |
| Minimum spacing | 450px |

**Speed formula for Phase 2:**
```
speed(t) = 200 + (60 / 9) * (t - 6)  // linear from 200 to 260 over 9 seconds
```

**Spawn interval formula:**
```
interval(t) = 2500 - (500 / 9) * (t - 6)  // linear from 2500ms to 2000ms
```

**Key design rule:** The first bird appears after the player has successfully jumped over at least 2 cacti. The bird is introduced as a single, isolated obstacle with maximum reaction time (spawned with extra spacing). This teaches the player: "some things you duck under, some things you jump over."

#### PHASE 3: ESCALATION (15s - 30s)

**Purpose:** The real game begins. Patterns emerge. Speed increases meaningfully. This is where weaker players start to fall.

| Parameter | Value |
|---|---|
| Speed | 260 -> 360 px/s (linear ramp) |
| Spawn interval | 2000ms -> 1400ms (linear ramp) |
| Obstacle types | 50% cactus, 35% bird, 15% tall cactus |
| Pattern complexity | Doubles introduced at T=18s, triples at T=25s |
| Minimum spacing | 400px -> 300px |

**Speed formula:**
```
speed(t) = 260 + (100 / 15) * (t - 15)  // 260 to 360 over 15 seconds
```

**Spawn interval formula:**
```
interval(t) = 2000 - (600 / 15) * (t - 15)  // 2000ms to 1400ms
```

**New obstacle patterns introduced:**
- Double cactus (two cacti spaced 80-120px apart -- requires sustained jump timing)
- Cactus-then-bird (jump, then immediately duck -- first combo pattern)
- Low bird (must duck, cannot jump)

**Elimination expectation:** In a 4-player match, 1-2 players typically eliminate during this phase.

#### PHASE 4: INTENSITY (30s - 45s)

**Purpose:** Rapid-fire decisions. Only skilled players survive. Patterns become complex. Speed is aggressive.

| Parameter | Value |
|---|---|
| Speed | 360 -> 440 px/s (linear ramp) |
| Spawn interval | 1400ms -> 1000ms (linear ramp) |
| Obstacle types | 40% cactus, 30% bird, 15% tall cactus, 15% double cactus cluster |
| Pattern complexity | Full pattern library active |
| Minimum spacing | 300px -> 220px |

**Speed formula:**
```
speed(t) = 360 + (80 / 15) * (t - 30)
```

**Reaction time analysis at 440px/s:**
- Screen crossing time: 800 / 440 = 1.82 seconds
- Reaction window (spawn to player): (800 - 50 - 30) / 440 = 1.64 seconds
- Human average reaction time: ~250ms
- Net decision time: ~1.39 seconds -- tight but fair

**Pattern combinations:**
- Bird-cactus-bird (duck-jump-duck)
- Triple cactus cluster (one long jump or three quick jumps)
- High bird followed by low cactus (no action needed, then jump -- tests restraint)
- Cactus + simultaneous bird at different height (must jump at precise height)

#### PHASE 5: ENDGAME (45s+)

**Purpose:** The match must end. Difficulty becomes extreme. This phase is designed to force resolution within 15-20 additional seconds.

| Parameter | Value |
|---|---|
| Speed | 440 -> 520 px/s (aggressive ramp, then cap) |
| Speed cap | 520 px/s (reached at ~55s) |
| Spawn interval | 1000ms -> 700ms (then cap) |
| Interval cap | 700ms (reached at ~52s) |
| Obstacle types | Full roster, weighted toward hardest patterns |
| Pattern complexity | Maximum -- 4-element combos |
| Minimum spacing | 200px (absolute minimum, never less) |

**Speed formula:**
```
speed(t) = min(520, 440 + (80 / 10) * (t - 45))
```

**Reaction time at 520px/s:**
- Reaction window: (800 - 50 - 30) / 520 = 1.38 seconds
- Net decision time after human reaction: ~1.13 seconds
- This is fast enough that even skilled players will eventually fail

**Match hard cap:** At T=90s, if more than one player survives, the match ends and the player with the highest score wins. This prevents infinite matches. In practice, matches almost never reach this point.

### 3.3 Unified Speed Formula

For implementation, a single continuous function that approximates the piecewise phases:

```
function getSpeed(elapsedSeconds: number): number {
  if (elapsedSeconds <= 6) return 200;
  if (elapsedSeconds <= 15) return 200 + (60 / 9) * (elapsedSeconds - 6);
  if (elapsedSeconds <= 30) return 260 + (100 / 15) * (elapsedSeconds - 15);
  if (elapsedSeconds <= 45) return 360 + (80 / 15) * (elapsedSeconds - 30);
  return Math.min(520, 440 + 8 * (elapsedSeconds - 45));
}
```

### 3.4 Spawn Interval Formula

```
function getSpawnInterval(elapsedSeconds: number): number {
  if (elapsedSeconds <= 6) return 2500;
  if (elapsedSeconds <= 15) return 2500 - (500 / 9) * (elapsedSeconds - 6);
  if (elapsedSeconds <= 30) return 2000 - (600 / 15) * (elapsedSeconds - 15);
  if (elapsedSeconds <= 45) return 1400 - (400 / 15) * (elapsedSeconds - 30);
  return Math.max(700, 1000 - 30 * (elapsedSeconds - 45));
}
```

### 3.5 Difficulty Validation Rules

These rules are hard constraints enforced by the obstacle spawner. They exist to prevent "bullshit death" scenarios:

1. **Minimum gap rule:** The gap between any two consecutive obstacles must allow the player to physically clear both. Minimum gap in pixels = `speed * 0.4` (400ms of clear space at any speed).

2. **Jump recovery rule:** After a jump, the player needs 1.0s to land. No obstacle may require a second jump within `speed * 1.05` pixels of the previous one (1.05s at current speed).

3. **Duck-to-jump transition rule:** Transitioning from duck to jump takes approximately 150ms of reaction time. Obstacles requiring this transition must be spaced at least `speed * 0.35` pixels apart.

4. **No simultaneous impossible inputs:** An obstacle must never require both jumping and ducking at the same instant. Every obstacle has exactly one correct action (jump, duck, or do nothing).

5. **Pattern lookahead:** The spawner must validate the next 3 obstacles in the queue before spawning. If any sequence violates rules 1-4, the pattern is rerolled.

---

## 4. OBSTACLE DESIGN AND PATTERNS

### 4.1 Obstacle Types

The current system has two types (cactus and bird). The full design calls for six obstacle types, introduced progressively:

#### Type 1: Small Cactus (EXISTING)
- **Dimensions:** 30w x 50h pixels
- **Position:** Ground level (y=0)
- **Action required:** Jump
- **Introduced:** Phase 1 (T=0s)
- **Visual:** Single saguaro cactus, clearly visible green against brown ground
- **Hitbox forgiveness:** Collision box is 24w x 44h (80% of visual, centered)

#### Type 2: Bird (EXISTING)
- **Dimensions:** 40w x 30h pixels
- **Position:** y=100 (above player standing height of 50px, below jump peak of 100px)
- **Action required:** Duck
- **Introduced:** Phase 2 (T=8s)
- **Visual:** Pterodactyl with flapping animation, silhouette clearly distinct from ground obstacles
- **Hitbox forgiveness:** Collision box is 32w x 24h (80% of visual)

#### Type 3: Tall Cactus (NEW)
- **Dimensions:** 25w x 80h pixels
- **Position:** Ground level (y=0)
- **Action required:** Jump (requires full jump arc to clear)
- **Introduced:** Phase 3 (T=18s)
- **Visual:** Taller, thinner cactus with thorns. Visually distinct height from small cactus (different silhouette shape, slightly different green hue)
- **Hitbox forgiveness:** Collision box is 20w x 72h
- **Design note:** At 80px height and a jump peak of 100px, the player clears this with only 20px of margin. This creates near-miss moments.

#### Type 4: Low Bird (NEW)
- **Dimensions:** 40w x 30h pixels
- **Position:** y=40 (slightly below standing head height)
- **Action required:** Duck
- **Introduced:** Phase 3 (T=20s)
- **Visual:** Same pterodactyl but lower, with a subtle downward swooping animation and a ground shadow to indicate low altitude
- **Hitbox forgiveness:** Collision box is 32w x 24h
- **Design note:** This creates ambiguity -- is it a bird I duck or a cactus I jump? The visual must be crystal clear. The swooping animation and distinct color (bird is orange/brown vs green cactus) resolves this.

#### Type 5: Double Cactus Cluster (NEW)
- **Dimensions:** 70w x 50h pixels (treated as single wide obstacle)
- **Position:** Ground level
- **Action required:** Jump (requires early jump due to width)
- **Introduced:** Phase 3 (T=22s)
- **Visual:** Two cacti visually close together, connected by small ground detail. Player must recognize this as "one wide thing to jump over"
- **Hitbox forgiveness:** Collision box is 60w x 44h
- **Design note:** The wider hitbox means the player must jump earlier. This tests timing precision.

#### Type 6: Moving Bird (NEW)
- **Dimensions:** 40w x 30h pixels
- **Position:** y oscillates between 40 and 120 using sine wave
- **Action required:** Context-dependent (duck if low, jump if descending into path, or do nothing if high enough)
- **Introduced:** Phase 4 (T=32s)
- **Visual:** Bird with exaggerated wing flaps, vertical movement clearly telegraphed by a dotted trajectory line or shadow
- **Hitbox forgiveness:** Collision box is 32w x 24h
- **Movement formula:** `y(t) = 80 + 40 * sin(2 * PI * t / 1.5)` where t is the obstacle's lifetime
- **Design note:** This is the only obstacle that requires reading and prediction rather than pure reaction. It should appear rarely (5-10% of spawns in Phase 4+).

### 4.2 Obstacle Patterns

Patterns are pre-defined sequences of 2-4 obstacles spawned as a group. The pattern system guarantees that every pattern is clearable.

#### Simple Patterns (Phase 2-3)

**Pattern S1: Double Jump**
```
[Cactus, gap=120px, Cactus]
Action: Jump, land, Jump
Difficulty: Easy
```

**Pattern S2: Jump-Duck**
```
[Cactus, gap=speed*0.5px, Bird]
Action: Jump, land, Duck
Difficulty: Medium
Note: Gap scales with speed to always be clearable
```

**Pattern S3: Duck-Jump**
```
[Bird, gap=speed*0.45px, Cactus]
Action: Duck, stand, Jump
Difficulty: Medium
Note: Slightly tighter than S2 because duck recovery is faster than land recovery
```

#### Complex Patterns (Phase 3-4)

**Pattern C1: Triple Jump**
```
[Cactus, gap=130px, Cactus, gap=130px, Cactus]
Action: Jump, land, Jump, land, Jump
Difficulty: Hard (timing precision required)
```

**Pattern C2: Jump-Duck-Jump**
```
[Cactus, gap=speed*0.5px, Bird, gap=speed*0.45px, Cactus]
Action: Jump, Duck, Jump
Difficulty: Hard (input switching)
```

**Pattern C3: Tall Cactus + Low Bird**
```
[Tall Cactus, gap=speed*0.55px, Low Bird]
Action: Full jump (must clear 80px), then duck immediately on landing
Difficulty: Hard (the tall cactus requires a full jump arc, landing timing is tight)
```

**Pattern C4: Stutter Step**
```
[Cactus, gap=speed*0.8px, Bird, gap=speed*0.35px, Cactus]
Action: Jump, wait, Duck, immediately Jump
Difficulty: Very Hard (the wait between first jump and duck tests patience)
```

#### Expert Patterns (Phase 4-5)

**Pattern E1: Quad Sequence**
```
[Cactus, gap=speed*0.45px, Bird, gap=speed*0.4px, Cactus, gap=speed*0.5px, Bird]
Action: Jump, Duck, Jump, Duck
Difficulty: Expert (sustained alternating inputs)
```

**Pattern E2: Fake-Out**
```
[High Bird (y=130, above jump peak), gap=speed*0.3px, Cactus]
Action: Do nothing for bird (it is above you), then Jump for cactus
Difficulty: Expert (tests restraint -- panicking players will duck for the bird and miss the jump window)
```

**Pattern E3: Precision Gap**
```
[Double Cactus Cluster, gap=speed*0.42px, Low Bird]
Action: Early jump for wide cluster, duck immediately on landing
Difficulty: Expert (timing margin is approximately 100ms)
```

### 4.3 Pattern Selection Algorithm

The spawner uses weighted random selection from the available pattern pool:

```
function selectPattern(elapsedSeconds: number, rng: SeededRNG): Pattern {
  const pool = getAvailablePatterns(elapsedSeconds);
  const weights = pool.map(p => p.weight * getDifficultyMultiplier(elapsedSeconds, p.difficulty));
  return rng.weightedChoice(pool, weights);
}

function getDifficultyMultiplier(elapsed: number, difficulty: string): number {
  // Higher difficulty patterns become more likely over time
  const difficultyWeights: Record<string, (t: number) => number> = {
    'easy':      (t) => Math.max(0.2, 1.0 - t / 60),     // starts high, fades
    'medium':    (t) => Math.min(1.0, t / 20),            // ramps up
    'hard':      (t) => Math.min(1.0, Math.max(0, (t - 15) / 20)),  // starts at 15s
    'very_hard': (t) => Math.min(1.0, Math.max(0, (t - 25) / 20)),  // starts at 25s
    'expert':    (t) => Math.min(0.8, Math.max(0, (t - 35) / 25)),  // starts at 35s, caps at 0.8
  };
  return (difficultyWeights[difficulty] ?? (() => 0.5))(elapsed);
}
```

### 4.4 Pattern Probability by Phase

| Phase | Easy % | Medium % | Hard % | Very Hard % | Expert % |
|---|---|---|---|---|---|
| Phase 1 (0-6s) | 100 | 0 | 0 | 0 | 0 |
| Phase 2 (6-15s) | 60 | 40 | 0 | 0 | 0 |
| Phase 3 (15-30s) | 20 | 35 | 35 | 10 | 0 |
| Phase 4 (30-45s) | 5 | 15 | 30 | 30 | 20 |
| Phase 5 (45s+) | 0 | 5 | 20 | 35 | 40 |

### 4.5 Visual Telegraphing Rules

Every obstacle must be visually readable before the player needs to react:

1. **Minimum visual warning time:** 800ms at any speed. If an obstacle would reach the player in less than 800ms from spawn, it must spawn further right (off-screen buffer).

2. **Color coding:**
   - Ground obstacles (jump): Green family (cacti are inherently green)
   - Air obstacles (duck): Warm colors (orange/brown pterodactyls)
   - This creates instant subconscious association: green = jump, warm = duck

3. **Silhouette distinctness:** Every obstacle type must be identifiable by silhouette alone, even at thumbnail size. No two obstacles should have similar outlines.

4. **Animation telegraphing:** Moving birds telegraph their path with a faint dotted trajectory line 200ms ahead of their actual position.

5. **Pattern preview:** When a pattern (multi-obstacle group) spawns, all obstacles in the pattern appear on screen within 300ms of each other. The player always sees the full pattern before needing to react to the first element.

---

## 5. PSYCHOLOGY AND ADDICTION MECHANICS

### 5.1 Near-Miss Design

Near-misses are the single most powerful engagement driver in gambling-adjacent games. A near-miss feels like "I almost died but my skill saved me" -- even when the margin was designed into the game.

**How we engineer near-misses:**

1. **Hitbox forgiveness (see Section 8):** The collision box is 80% of the visual sprite. This means the dinosaur's visual sprite will overlap with obstacle sprites by up to 20% without triggering death. The player sees their dino "brush past" the obstacle. This happens naturally and frequently.

2. **Tall cactus near-miss zone:** The tall cactus (80px) vs jump peak (100px) creates a 20px near-miss zone. Approximately 40% of successful tall cactus clears will show the dino passing within 5-10 pixels of the top -- visually dramatic.

3. **Near-miss detection and celebration:** The server tracks proximity during successful obstacle passes. If the player clears an obstacle with less than 8px margin, a "CLOSE!" indicator flashes on screen.
   - Under 5px: "INSANE!" indicator with screen flash
   - Under 3px: "PIXEL PERFECT!" indicator with particle burst
   - Each near-miss level awards bonus points: +5, +15, +30 respectively

4. **Near-miss frequency target:** The obstacle design should produce near-miss events (under 8px) approximately once every 8-12 seconds of gameplay. This means roughly 3-5 near-miss moments per typical match. Tuning the tall cactus height and bird Y positions achieves this.

5. **Near-miss sound design:** A distinct "whoosh" sound effect plays during near-misses, with pitch and intensity scaling with proximity. This audio cue creates a Pavlovian association with excitement.

### 5.2 Flow State Design

Flow state (Csikszentmihalyi) requires the challenge to be precisely matched to the player's skill level. In a competitive multiplayer game, we cannot customize difficulty per player -- but we can design the curve so that every skill level has a "flow window."

**Flow state principles applied:**

1. **Clear goals:** "Be the last one standing." No ambiguity.

2. **Immediate feedback:** Every input has instant visual and audio response. Jump has a satisfying "boing," duck has a "swoosh," obstacle clearance has a "ding."

3. **Challenge-skill balance:** The progressive difficulty curve means:
   - Beginners experience flow in Phase 2 (6-15s) -- things are getting interesting but manageable
   - Intermediate players find flow in Phase 3 (15-30s) -- patterns are emerging, concentration is required
   - Expert players find flow in Phase 4 (30-45s) -- fast, complex, demanding full attention
   - Everyone is in over their head in Phase 5 -- this is by design (creates exciting finishes)

4. **Sense of control:** The player is never doing something complex. There are only two inputs: jump and duck. The complexity comes from WHEN to use them, not HOW.

5. **Loss of self-consciousness:** The UI is minimal during gameplay. No pop-ups, no notifications, no distractions. Just the dino, the ground, and the obstacles.

6. **Time distortion:** When the game is working, 40 seconds of gameplay should feel like 15 seconds. This is achieved through:
   - Gradually increasing speed (subtle, not jarring)
   - Musical tempo increasing with speed
   - Obstacle density increasing (more frequent decisions = less time to think about time)

### 5.3 Variable Reward Schedules

Variable ratio reinforcement (the slot machine principle) is the most resistant to extinction. We apply this through:

1. **Score multiplier streaks:** Successfully clearing 5 obstacles in a row activates a 1.5x score multiplier. 10 in a row activates 2x. 15 activates 3x. Missing an obstacle resets to 1x. The thresholds create variable achievement -- sometimes you hit them, sometimes you do not.

2. **Near-miss bonus randomness:** Near-miss detection has a slight randomness to it (the 80% hitbox means the exact margin varies per obstacle and position). Some clears that look close are not registered as near-misses, and some that look safe produce a "CLOSE!" indicator. This unpredictability makes each near-miss feel special.

3. **Elimination order payoff:** In future tournament modes, surviving longer than certain thresholds earns partial payouts (see Section 6). The player does not know exactly when others will die, creating variable reward timing.

4. **Daily challenge rewards:** Random daily challenges (see Section 6.4) with varying difficulty create unpredictable reward opportunities.

### 5.4 Loss Aversion and "One More Game"

Loss aversion is twice as powerful as gain seeking (Kahneman & Tversky). We leverage this:

1. **Score display persistence:** After elimination, the player's score stays on screen alongside the remaining players' live scores. If the player died at 1,200 points and watches someone else die at 1,250, they think: "I was SO close to outlasting them."

2. **Elimination replay:** When a player dies, a brief 1.5-second slow-motion replay shows the exact moment of collision. This creates a clear mental image of "if I had just jumped 100ms earlier..."

3. **"Your best" comparison:** The results screen shows the player's score compared to their personal best. If they beat their personal best but still lost, the messaging is: "NEW PERSONAL BEST! 1,847 points" -- they lost money but gained a personal achievement.

4. **Quick rematch:** The results screen has a prominent "PLAY AGAIN" button with the same bet amount pre-filled. Friction to re-enter is near zero. One tap from results to the next lobby.

5. **Streak tracking:** "You survived to Phase 3 in your last 4 games" -- showing consistency makes the player feel like they are improving and one more game might be the breakthrough.

6. **Watching others after death:** The spectator mode is critical (see Section 5.6). Watching someone else win YOUR money is powerful motivation to try again.

### 5.5 The "One More Game" Loop

The complete psychological loop:

```
BET -> PLAY -> [survive warmup, feel confident]
  -> [enter escalation, feel challenged]
  -> [die OR win]
  -> IF WIN: dopamine hit, "I'm good at this, let's go again" (confidence)
  -> IF LOSE:
     -> watch remaining players (engagement maintained)
     -> see how close you were (loss aversion)
     -> see results (personal best comparison)
     -> one-tap rematch (zero friction)
     -> "I know what I did wrong" (perceived learning, self-efficacy)
     -> BET AGAIN
```

**Critical design constraint:** The loop from death to next match start must take no more than 15 seconds. Any longer and the emotional momentum dissipates.

### 5.6 Spectator Mode After Elimination

When a player is eliminated:

1. **T+0s:** Slow-motion death replay (1.5s)
2. **T+1.5s:** Camera zooms out to show all remaining players. Eliminated player's position is marked with an "X" on the timeline.
3. **T+2s onward:** The eliminated player watches the remaining runners. Their score is shown dimmed. Active players' scores tick up in real time.
4. **UI elements during spectating:**
   - "N players remaining" counter (prominent)
   - Active players' dinos highlighted with name labels
   - The eliminated player's best score shown for comparison
   - "Play Again" button visible but not obstructive (bottom of screen)
5. **Elimination announcements:** When another player dies, a dramatic announcement appears: "[Player] ELIMINATED! 2 remain." This creates tension and drama.
6. **Final showdown:** When only 2 players remain, the UI shifts to a split-focus view showing both dinos. A "FINAL 2" banner appears. Heart rate should spike here.

### 5.7 Sound Design for Dopamine

Sound is the fastest path to emotional response. Design principles:

| Event | Sound Character | Duration | Purpose |
|---|---|---|---|
| Jump | Short, bright "boing" with slight pitch variation | 150ms | Satisfying input feedback |
| Duck | Low "swoosh" | 120ms | Confirms duck action |
| Obstacle cleared | Subtle "ding" (pentatonic, always harmonious) | 100ms | Micro-reward |
| Near-miss (close) | Dramatic "whoosh" + brief tension sting | 300ms | Excitement spike |
| Near-miss (pixel perfect) | "Whoosh" + crowd gasp + sparkle | 500ms | Peak excitement |
| Score multiplier activated | Ascending chime sequence | 400ms | Achievement |
| Other player eliminated | Deep impact sound + brief dramatic sting | 600ms | Drama, superiority |
| Your elimination | Crash + descending tone | 800ms | Clear defeat signal |
| Victory | Triumphant fanfare + crowd cheer | 2000ms | Maximum dopamine |
| Speed phase transition | Subtle tempo increase in background music | Continuous | Subconscious tension |

**Background music:** Rhythmic, electronic, tempo-matched to game speed.
- Phase 1: 120 BPM
- Phase 2: 130 BPM
- Phase 3: 145 BPM
- Phase 4: 160 BPM
- Phase 5: 175 BPM

The tempo increase is gradual and continuous (not stepped). Players subconsciously sync their attention to the beat, which enhances flow state.

---

## 6. COMPETITIVE AND SOCIAL MECHANICS

### 6.1 Real-Time Competitive Pressure

The multiplayer view is the core differentiator from single-player endless runners. Design:

1. **Player lanes:** Each player's dino runs on a shared track (same obstacles for all players -- provable fairness via seeded RNG). All dinos are visible simultaneously, vertically offset by 8px per player for visual clarity.

2. **Alive counter:** A prominent "4/4 ALIVE" counter in the top-right corner. When a player dies, this updates with animation: "3/4 ALIVE" with the number pulsing red briefly.

3. **Elimination feed:** Kill feed in the upper portion of the screen:
   ```
   [12.4s] DinoKing eliminated!
   [28.1s] CactusDodger eliminated!
   ```

4. **Opponent proximity awareness:** When all players share the same obstacles, the skill difference becomes visible. A player who clears obstacles with near-misses while others clear them cleanly can see (and feel) the skill gap.

### 6.2 Leaderboard System

**Match leaderboard (in-game):**
- Shows during spectator mode
- Real-time score rankings of all match participants
- Updates every second

**Session leaderboard:**
- Tracks performance across the current gaming session
- Metrics: matches played, wins, total earnings, longest survival, best score

**Global leaderboard (persistent):**
- All-time rankings by total wins, total score, win rate, longest survival
- Weekly rankings (reset every Monday 00:00 UTC)
- Tiered by bet level (prevents high-rollers from dominating casual leaderboards)

**Leaderboard tiers by average bet:**
- Bronze: average bet under 1.00 currency units
- Silver: 1.00 - 5.00
- Gold: 5.00 - 25.00
- Diamond: 25.00+

### 6.3 Streak and Achievement Systems

**Win streaks:**
- 2 wins in a row: "Hot Streak" badge, 5% score bonus next match
- 3 wins: "On Fire" badge, 10% score bonus
- 5 wins: "Unstoppable" badge, 15% score bonus, special trail effect
- 10 wins: "Legendary" badge (extremely rare), permanent profile badge

Score bonuses from streaks affect only points (for leaderboard), never bet payouts. This is a regulatory requirement.

**Survival streaks:**
- Track "matches where player survived past Phase 3" as a consistency metric
- Display as "Phase 3+ streak: 7 matches" on profile

**Daily challenges (3 per day, refreshed at 00:00 UTC):**
- "Survive for 30 seconds" (Easy)
- "Achieve 3 near-misses in one match" (Medium)
- "Win a match without ducking" (Hard, luck-dependent on obstacle spawns)
- "Clear 20 obstacles in one match" (Medium)
- "Achieve a Pixel Perfect near-miss" (Hard)
- Reward: Cosmetic currency, profile badges, leaderboard points

### 6.4 Skill-Based Matchmaking (SBMM)

For fairness and engagement, players should be matched with opponents of similar skill:

**Elo-like rating system:**
- New players start at 1000 rating
- Win: +K * (1 - expected), where expected = 1 / (1 + 10^((opponent_avg_rating - player_rating) / 400))
- Loss: -K * expected
- K-factor: 32 for first 20 matches, then 16
- Rating displayed as tier name, not number (to reduce anxiety):
  - Under 800: Hatchling
  - 800-1000: Runner
  - 1000-1200: Sprinter
  - 1200-1400: Survivor
  - 1400-1600: Veteran
  - 1600+: Apex

**Matchmaking tolerance:**
- First 5 seconds of queue: match within 200 rating points
- 5-10 seconds: within 400 rating points
- 10+ seconds: match with anyone (better to play than wait)

**Display:** Opponent skill tier is shown in the lobby. "Runner vs Sprinter vs Runner vs Survivor" -- this creates both aspiration and threat perception.

---

## 7. MOBILE UX AND TOUCH CONTROLS

### 7.1 Touch Input Design

The game has exactly two inputs. Touch controls must be completely unambiguous.

**Primary scheme (recommended):**
- **Tap anywhere on screen:** Jump
- **Swipe down anywhere on screen:** Duck
- **Release finger / tap during duck:** Stand up (unduck)

**Alternative scheme (available in settings):**
- **Left half of screen tap:** Jump
- **Right half of screen tap:** Duck
- This is worse for most players but some prefer it

**Input specifications:**
| Parameter | Value |
|---|---|
| Tap detection threshold | 10px movement (anything under 10px of finger travel = tap, not swipe) |
| Swipe down detection | Finger moves downward > 30px within 200ms |
| Input latency budget | Under 50ms from touch event to server-sent input |
| Tap dead zone after jump | 100ms (prevents accidental double-tap registering as two jumps) |
| Duck hold behavior | Player stays ducking as long as finger holds down after swipe |

**Critical rule:** Tap-to-jump must work even if the player's finger is slightly dragging. Many mobile users do not lift their finger cleanly. Any touch that is not a clear downward swipe is interpreted as a jump tap.

### 7.2 Screen Layout (Mobile Portrait)

```
+----------------------------------+
|  Score: 1,247    3/4 ALIVE       |  <- Status bar (48px height)
|                                  |
|  [Elimination feed area]         |  <- Semi-transparent overlay
|                                  |
|                                  |
|         GAME AREA                |  <- Main viewport
|    [dinos running, obstacles]    |
|                                  |
|  ================================|  <- Ground line (bottom 25%)
|                                  |
|                                  |  <- Touch input zone (transparent)
|  TAP = JUMP  |  SWIPE = DUCK    |  <- Hint text (fades after 3 games)
+----------------------------------+
```

**Layout rules:**
- Game viewport occupies the full screen width
- Ground line is positioned at 75% of screen height from top
- Status elements are semi-transparent and never overlap with the action zone
- No interactive UI elements in the game area during active play (no buttons to accidentally tap)

### 7.3 Screen Layout (Mobile Landscape / Desktop)

```
+--------------------------------------------------------------+
| Score: 1,247        Match: abc123        3/4 ALIVE           |
|                                                              |
|              GAME AREA (full width)                          |
|   [Player dinos]            [Obstacles approaching ->]       |
|   =========================================================  |
|                                                              |
+--------------------------------------------------------------+
```

### 7.4 Haptic Feedback

Haptic feedback provides physical confirmation of actions. Uses the Vibration API where available.

| Event | Haptic Pattern | Intensity |
|---|---|---|
| Jump | Single short pulse | Light (10ms) |
| Duck | Single medium pulse | Light (15ms) |
| Near-miss | Double quick pulse | Medium (10ms-gap-10ms) |
| Pixel Perfect near-miss | Triple pulse | Strong (15ms-gap-10ms-gap-15ms) |
| Elimination (self) | Long buzz | Strong (200ms) |
| Elimination (other) | Single pulse | Light (10ms) |
| Victory | Celebration pattern | Strong (100ms-50ms-100ms-50ms-200ms) |

**Implementation note:** Always respect device settings. Check `navigator.vibrate` availability. Provide toggle in settings.

### 7.5 One-Hand Playability

The game must be fully playable with one thumb:

1. All gameplay inputs are area-based (tap/swipe anywhere), not point-based (no precise button targets)
2. The "Play Again" button on results screen is large (minimum 64px height) and positioned in the lower third of the screen (thumb-reachable zone)
3. Lobby "Ready" button is similarly positioned
4. Settings and menu are accessible via a small icon in the top corner (not needed during gameplay)

### 7.6 Visual Clarity on Small Screens

Design rules for readability on 320px-wide screens (smallest supported):

1. **Minimum obstacle size on screen:** 20px in any dimension. If the world-to-screen scale would make an obstacle smaller than 20px, the camera must zoom or the world scale must adjust.
2. **Color contrast:** All obstacles maintain minimum 4.5:1 contrast ratio against background (WCAG AA compliance)
3. **Background simplification on mobile:** Fewer parallax layers, simpler ground texture, reduced particle effects. Performance over beauty.
4. **Score text size:** Minimum 16px rendered font size on any screen
5. **No critical information in corners:** Status elements have 8px minimum padding from screen edges (notch-safe, rounded-corner-safe)

---

## 8. CASINO PLATFORM INTEGRATION

### 8.1 Bet Structure

**Current system:** Winner-takes-all, 5% house fee. All players bet the same amount in a match.

**Proposed bet tiers:**

| Tier | Bet Amount | Pot (4 players) | Winner Payout | House Take |
|---|---|---|---|---|
| Micro | 0.10 | 0.40 | 0.38 | 0.02 |
| Low | 0.50 | 2.00 | 1.90 | 0.10 |
| Medium | 2.00 | 8.00 | 7.60 | 0.40 |
| High | 5.00 | 20.00 | 19.00 | 1.00 |
| Premium | 10.00 | 40.00 | 38.00 | 2.00 |
| VIP | 25.00 | 100.00 | 95.00 | 5.00 |

Players select their bet tier before matchmaking. Matchmaking only groups players of the same bet tier.

### 8.2 Payout Models

**Model A: Winner Takes All (Default)**
- Last survivor wins 95% of pot
- Simple, high stakes, maximum drama
- Best for: casual players, lower bet tiers

**Model B: Proportional Payout (Tournament Mode)**
- 1st place: 65% of pot
- 2nd place: 25% of pot
- 3rd place: 10% of pot (in 4-player matches)
- 4th place: 0%
- House takes 5% before distribution
- Best for: higher bet tiers, risk-averse players

**Model C: Survival Threshold (Special Events)**
- Survive past 30s: get your bet back (break even)
- Survive past 45s: 1.5x your bet
- Last standing: remaining pot
- This model guarantees that skilled players rarely lose money, encouraging higher bets

### 8.3 Match Length and Betting Satisfaction

Casino game design requires that each "round" provides sufficient entertainment value for the bet amount. A 5-second death feels like wasted money. A 3-minute match is too long (reduces hands per hour, reduces house revenue).

**Target match duration distribution:**

| Duration | Frequency | Player Feeling |
|---|---|---|
| Under 10s | 5% of matches | "I messed up badly" (rare due to grace period) |
| 10-20s | 20% | "That was tough, I need to focus more" |
| 20-35s | 40% | "Good game, came down to skill" (sweet spot) |
| 35-50s | 25% | "Intense! That was a real battle" |
| 50s+ | 10% | "Epic showdown" (memorable) |

**Average match duration target:** 28-35 seconds of active gameplay
**Average lobby-to-lobby time:** 55-75 seconds (including countdown, results, transition)
**Matches per hour:** approximately 50-65

**Revenue projection per active player-hour:**
- At 55 matches/hour, 0.50 bet tier: 55 * 0.50 = 27.50 wagered per hour
- At 5% house edge: 1.375 GGR per player-hour
- With 4 players per match: effectively 4 * 1.375 = 5.50 GGR per match-hour

### 8.4 Lobby and Tournament Structure

**Quick Match (Primary Mode):**
1. Player selects bet tier
2. Placed in matchmaking queue (target: under 10 seconds to fill)
3. When 2-4 players found (2 minimum, 4 maximum), lobby forms
4. 5-second countdown (all players see each other)
5. Match starts
6. Results -> Play Again loop

**Scheduled Tournaments (Special Events):**
- 8, 16, or 32 player bracket tournaments
- Entry fee: fixed per tournament tier
- Structure: single elimination, top 2 from each match advance
- Prize pool: total entry fees minus 8% house fee
- Frequency: hourly micro-tournaments, daily featured tournaments, weekly championships

**Sit-and-Go Tournaments:**
- 8 players, 2 rounds
- Round 1: Two 4-player matches, top 2 from each advance
- Round 2: Final 4-player match
- Entry fee: 2x the equivalent quick-match bet (higher stakes, higher reward)
- Prize: 1st gets 55% of pool, 2nd gets 30%, 3rd-4th get 7.5% each (after house fee)

### 8.5 Provable Fairness

The current system already implements seed commitments and seeded RNG. This is critical for casino credibility:

1. **Pre-match:** Server generates a random seed, computes SHA-256 hash (commitment), shares commitment with all players before match starts
2. **During match:** All obstacle spawns use the seeded RNG -- deterministic and reproducible
3. **Post-match:** Server reveals the actual seed. Players (or auditors) can verify that the seed produces the commitment hash, and that replaying the seed produces the exact obstacle sequence
4. **Audit log:** Every match stores a complete event log (inputs, spawns, collisions, eliminations) that can be replayed for dispute resolution

### 8.6 Regulatory Considerations

- All randomness is from seeded PRNG (provably fair, not exploitable by operator)
- No game mechanic affects payout -- only survival time determines winner
- Cosmetics never provide gameplay advantage
- House edge is fixed and transparent (5%)
- Skill component is genuine (not illusory) -- this may classify the game differently than pure-chance gambling in some jurisdictions
- RTP (Return To Player) is approximately 95% (same as house fee), but actual RTP varies by player skill
- Minimum bet and responsible gambling limits enforced by the platform integration layer

---

## 9. VISUAL AND AUDIO FEEDBACK

### 9.1 Screen Effects

**Speed lines:**
- Begin appearing at Phase 3 (speed > 300px/s)
- Thin white/grey diagonal lines streaking past in the background
- Density increases with speed: `lineCount = floor((speed - 300) / 20)`
- At max speed (520px/s): 11 speed lines active

**Screen shake:**
- On elimination (self): 4px amplitude, 300ms duration, decaying sine wave
- On near-miss (pixel perfect): 2px amplitude, 150ms duration
- Never during normal gameplay (would interfere with input precision)

**Motion blur:**
- Subtle horizontal blur on obstacles at Phase 4+ speeds
- Implemented as a 2px horizontal stretch on obstacle sprites when speed > 400px/s
- The dino itself never blurs (it is the player's avatar, must stay sharp)

**Particle effects:**
- Jump: Small dust cloud at feet (3-5 particles, 200ms lifetime)
- Landing: Larger dust cloud (5-8 particles, 300ms lifetime)
- Elimination: Bone/star burst from dino position (8-12 particles, 500ms lifetime)
- Near-miss: Spark trail between dino and obstacle (2-3 particles along edge)
- Victory: Confetti burst from top of screen (20-30 particles, 2000ms lifetime)

### 9.2 Color Progression

The background color subtly shifts with difficulty phases to create subconscious tension:

| Phase | Sky Color | Ground Color | Emotional Association |
|---|---|---|---|
| Phase 1 | #87CEEB (light sky blue) | #8B4513 (saddle brown) | Calm, safe |
| Phase 2 | #7BC8E8 (slightly deeper blue) | #7D3C0F | Warming up |
| Phase 3 | #E8A87C (warm peach/sunset) | #6B340D | Alert, intensity rising |
| Phase 4 | #D4735E (sunset orange) | #5A2D0B | Danger, high alert |
| Phase 5 | #B8433A (deep red-orange) | #4A2509 | Critical, endgame |

Transition between phase colors: linear interpolation over 3 seconds at phase boundary.

### 9.3 UI Animations

**Score counter:** Numbers tick up smoothly (not instant jumps). When near-miss bonus is awarded, the bonus amount floats up from the score as "+15" with a gold color and fades out over 800ms.

**Alive counter:** When a player is eliminated, the counter:
1. Pulses red for 500ms
2. The number decreases with a "slot machine roll" animation (200ms)
3. At "2 ALIVE" the counter permanently glows amber
4. At "1 ALIVE" (you won), the counter explodes into a "WINNER!" animation

**Elimination banner:** When another player dies, a banner slides in from the top:
```
========================
  DINOPLAYER ELIMINATED
     3 REMAIN
========================
```
Banner duration: 2 seconds, with 300ms slide-in and 300ms fade-out.

### 9.4 Victory Sequence

When the match ends and you win:

1. **T+0ms:** All obstacles stop. Background flashes white for 100ms.
2. **T+100ms:** "WINNER!" text slams onto screen with impact shake (6px, 200ms). Triumphant fanfare plays.
3. **T+300ms:** Confetti particles burst from top.
4. **T+500ms:** Winnings amount animates counting up: "$0.00 -> $1.90" over 1.5 seconds.
5. **T+2000ms:** Final stats fade in (survival time, obstacles cleared, near-misses).
6. **T+3000ms:** "PLAY AGAIN" button appears with a subtle pulse animation.

**When you lose:**
1. **T+0ms:** Slow-motion collision replay (1.5s at 0.3x speed).
2. **T+1500ms:** "ELIMINATED" text with muted color palette.
3. **T+2000ms:** Switch to spectator mode (or results if match is over).

---

## 10. ANTI-FRUSTRATION DESIGN

### 10.1 Grace Period

**First 6 seconds:** No obstacles can reach the player. The first obstacle spawns at T=2500ms at x=800 and moves at 200px/s, reaching the player (x=50) at approximately T=6.25s.

**First obstacle guarantee:** The first obstacle is always a small cactus (easiest obstacle, simplest input). Never a bird, never a pattern.

**First 3 obstacles:** All single small cacti with maximum spacing (2500ms intervals). The player gets 3 "practice jumps" before any complexity is introduced.

### 10.2 Hitbox Forgiveness

All collision boxes are smaller than visual sprites:

| Element | Visual Size | Collision Size | Forgiveness |
|---|---|---|---|
| Player (standing) | 40w x 50h | 32w x 42h | 20% smaller |
| Player (ducking) | 40w x 25h | 32w x 20h | 20% smaller |
| Small cactus | 30w x 50h | 24w x 44h | 20% smaller |
| Tall cactus | 25w x 80h | 20w x 72h | 20% smaller |
| Bird | 40w x 30h | 32w x 24h | 20% smaller |
| Double cactus | 70w x 50h | 60w x 44h | 14% smaller |

**Collision box positioning:** Centered within the visual sprite. This means there is equal forgiveness on all sides.

**Implementation note:** The current `CollisionDetector` uses the full visual dimensions. This must be updated to use inner collision boxes.

### 10.3 Input Forgiveness (Jump Buffer + Late-Jump Grace)

In Dizolaur nu exista platforme — dinozaurul alearga pe pamant plat. Dar exista doua mecanisme de input forgiveness care elimina frustrarea:

**A) Jump Buffer — input inainte de aterizare:**
Daca jucatorul apasa jump in timp ce e inca in aer (dupa un salt anterior), inputul e tinut in buffer si executat automat la aterizare. Fara asta, jucatorul simte ca "nu i-a mers butonul".
- Buffer window: 100ms inainte de aterizare
- Server-side: se verifica daca player.position.y <= 2px (aproape de sol) si exista un jump input recent in ultimele 6 tick-uri

**B) Late-Jump Grace — input imediat dupa collision:**
Daca jucatorul apasa jump cu max 80ms intarziere fata de momentul ideal, SI overlap-ul cu obstacolul e sub 6px, saritura e acceptata si coliziunea e ignorata. Jucatorul "o scapa la limita".

- Window: 80ms (5 frames la 60fps)
- Overlap maxim: 6px (previne exploatarea)
- Invizibil pentru jucator — simte doar ca "a reusit"
- Server-side: collision check ruleaza, dar daca overlap < 6px SI exista jump input in ultimele 5 tick-uri, coliziunea e anulata

**Frecventa impact:** Salveaza aproximativ 1 din 15 morti care altfel ar fi simtite ca nedrepte. Pe termen lung, reduce frustrarea fara sa afecteze balansul jocului.

### 10.4 Visual Warnings

1. **Obstacle spawn visibility:** Obstacles always spawn at x=800 (right edge of screen) and are immediately visible. They are never spawned off-screen-right unless speed is so high that they need extra buffer distance (in which case the spawn x extends to maintain 800ms minimum visual warning time).

2. **Pattern preview:** All obstacles in a pattern group spawn within 300ms of each other, giving the player full visual information before needing to react to the first element.

3. **Phase transition indicator:** When entering a new phase, a subtle text indicator appears briefly: "PHASE 3" in small text, upper-left corner, for 2 seconds. This sets expectations.

4. **Speed indicator (optional, settings):** A small speedometer in the corner showing current speed as a percentage of max. Default off. Some players find this helpful, others find it distracting.

### 10.5 Why Players Should Never Feel Cheated

The anti-frustration system works together to create a game where every death feels deserved:

1. **Grace period** means no one dies before they understand the controls.
2. **Hitbox forgiveness** means visual near-misses are survived, not punished.
3. **Coyote time** means "almost-good-enough" reactions are rewarded.
4. **Visual warnings** mean the player always has time to see and process the obstacle.
5. **Pattern validation** means no impossible obstacle sequences ever spawn.
6. **Provable fairness** means all players face identical obstacles (seeded RNG).
7. **Slow-motion death replay** shows exactly what happened -- the player can see the collision point and understand it.

The net effect: when a player dies, they think "I jumped too late" or "I should have ducked there," never "that was impossible" or "the game cheated."

---

## 11. MONETIZATION-FRIENDLY DESIGN

### 11.1 Cosmetic System

Cosmetics are purely visual and never affect hitboxes, speed, or any gameplay parameter. This is a regulatory requirement for real-money games and also a game design principle (pay-to-win destroys competitive integrity).

**Cosmetic categories:**

#### Dino Skins
- **Base skins (free rotation):** Classic green, desert tan, ocean blue
- **Premium skins:** Neon, galaxy, golden, skeletal, robotic, pixel-art, lava, ice, steampunk
- **Seasonal skins:** Holiday-themed (jack-o-lantern dino for Halloween, etc.)
- **Rarity tiers:** Common, Rare, Epic, Legendary
- **Implementation:** Sprite swap only. All skins use identical collision boxes.

#### Trail Effects
- Dust trail (default, free)
- Fire trail, ice crystals, rainbow, sparkles, lightning, hearts, musical notes
- Trails render behind the dino during movement, purely decorative
- Higher-rarity trails have more complex particle systems

#### Death Animations
- Standard crash (default, free)
- Explosion, poof into feathers, dramatic collapse, ghost float-away, shatter, melt
- Plays during the 1.5s death replay
- Purely cosmetic, does not affect gameplay timing

#### Victory Celebrations
- Standard confetti (default)
- Fireworks, dance animation, crown appearance, throne descent, laser show
- Plays during victory sequence

#### Nameplates and Badges
- Color and style of the name label above the dino
- Achievement badges displayed on profile and in lobby
- Win streak indicators

### 11.2 Cosmetic Acquisition

**Cosmetic currency ("Bones"):**
- Earned through gameplay: 5 Bones per match played, 15 Bones per win, 10 Bones per daily challenge completed
- Purchased with real money (platform currency conversion)
- Pricing: Common skin = 100 Bones, Rare = 300, Epic = 800, Legendary = 2000
- At 5 Bones/match (55 matches/hour), a common skin takes approximately 22 matches (about 25 minutes of play) to earn through play alone

**Direct purchase:**
- Skins can be purchased directly with platform currency
- Pricing: Common = 0.50, Rare = 1.50, Epic = 4.00, Legendary = 10.00
- This is separate from betting -- cosmetic purchases are not gambling

### 11.3 Battle Pass / Season System

**Season duration:** 4 weeks
**Season pass price:** 5.00 (platform currency)

**Free track (available to all):**
- Level 1: 50 Bones
- Level 5: Common skin
- Level 10: Trail effect
- Level 15: 100 Bones
- Level 20: Rare skin
- Level 25: Death animation
- Level 30: 200 Bones

**Premium track (season pass holders):**
- Level 1: Exclusive common skin
- Level 5: 100 Bones + trail effect
- Level 10: Rare skin + nameplate
- Level 15: 200 Bones + death animation
- Level 20: Epic skin
- Level 25: Victory celebration + 300 Bones
- Level 30: Legendary skin (exclusive to this season)

**Season pass XP sources:**
- 10 XP per match played
- 30 XP per win
- 50 XP per daily challenge
- 100 XP per weekly challenge (3 per week)
- XP required per level: 100 XP (flat, not increasing)
- Total XP for level 30: 3000 XP
- Achievable in approximately 150 matches or 20 daily challenge completions + regular play

### 11.4 Engagement Without Pay-to-Win

The cosmetic system drives engagement through:

1. **Social signaling:** Other players see your skin in the match. A legendary skin communicates "I'm a dedicated player" (whether earned or purchased).
2. **Collection motivation:** Completionists want all skins. Season-exclusive skins create urgency.
3. **Self-expression:** Players develop attachment to "their" dino look.
4. **Death animation theater:** Other players see your death animation, creating secondary engagement ("I want that explosion effect").
5. **Win celebration envy:** Watching someone else win with a spectacular celebration motivates cosmetic acquisition.

---

## 12. MATCH FLOW

### 12.1 Complete Match Timeline

The following is the moment-by-moment experience of a typical match.

#### PRE-MATCH: LOBBY (Duration: 5-15 seconds)

```
T-15s to T-5s: MATCHMAKING
- Player taps "PLAY" on the main menu
- Bet amount is pre-selected (last used amount, or default)
- "Finding opponents..." spinner (average wait: 3-8 seconds)
- Players matched by bet tier and skill rating (within tolerance)

T-5s: LOBBY FORMED
- Screen shows all matched players (2-4 dinos lined up)
- Each player's name, skin, and skill tier badge visible
- "Match starting in 5..." countdown begins
- Seed commitment hash displayed (for provable fairness)
- Bet amount and potential winnings shown: "Your bet: $2.00 | Pot: $8.00"

T-3s: COUNTDOWN
- "3... 2... 1..." with escalating audio beeps
- Dinos animate idle/ready pose
- Background transitions from lobby to game scene

T-0s: GO!
- "GO!" flash on screen (300ms)
- Match clock starts
- All dinos begin running simultaneously
```

#### ACTIVE MATCH: GAMEPLAY (Duration: 25-55 seconds typical)

```
T+0s to T+6s: WARMUP (Phase 1)
- Dinos running, no obstacles yet
- Players confirm their controls work (some will test-jump)
- First obstacle (cactus) spawns at T+2.5s, reaches player at T+6.25s
- Music: calm, rhythmic, 120 BPM
- Sky: bright blue

T+6s to T+15s: INTRODUCTION (Phase 2)
- First obstacles cleared (or first eliminations for completely inattentive players)
- Birds introduced around T+8-10s
- Players settle into rhythm
- Score begins accumulating meaningfully
- Music tempo starts increasing

T+15s to T+30s: ESCALATION (Phase 3)
- Speed noticeably faster
- Patterns begin: jump-duck combos, double cacti
- Typical first elimination occurs: T+16-25s
- "PLAYER ELIMINATED! 3 REMAIN" banner
- Eliminated player enters spectator mode
- Sky color shifting to warm tones
- Near-miss frequency increases
- Music tempo: 145 BPM, more intense

T+30s to T+45s: INTENSITY (Phase 4)
- Rapid obstacle sequences
- Complex patterns: 3-4 element combos
- Second elimination typical: T+30-40s
- "2 REMAIN" -- final showdown tension
- Speed lines visible on screen
- Sky: orange-red
- Music: 160 BPM, driving
- Spectators watching intently

T+45s+: ENDGAME (Phase 5)
- Near-maximum speed
- Patterns are relentless
- Final elimination usually occurs: T+45-60s
- Sky: deep red
- Music: 175 BPM, urgent

MATCH END TRIGGER:
- When 1 player remains (multiplayer) or 0 remain (dev mode)
- OR when T+90s hard cap reached (extremely rare)
```

#### POST-MATCH: RESULTS (Duration: 5-10 seconds)

```
T+end+0ms: RESOLUTION
- Winner: Victory sequence (see Section 9.4)
- All others: See final standings

T+end+2s: RESULTS SCREEN
- Final rankings: 1st, 2nd, 3rd, 4th
- Survival times for each player
- Score breakdown
- Payout: "YOU WON $7.60!" or "Better luck next time"
- Personal best comparison
- Near-miss count and score bonuses
- Season pass XP gained

T+end+3s: ACTION OPTIONS
- "PLAY AGAIN" button (prominent, pre-filled bet)
- "CHANGE BET" button (smaller)
- "LOBBY" button (return to main menu)
- Replay is available for 15 seconds before auto-returning to lobby

T+end+15s: AUTO-RETURN
- If no action taken, return to main lobby
```

### 12.2 Duration Statistics and Design Targets

| Metric | Target | Acceptable Range |
|---|---|---|
| Matchmaking wait | 5 seconds | 2-15 seconds |
| Lobby countdown | 5 seconds | Fixed |
| Active gameplay (median) | 32 seconds | 25-55 seconds |
| Results screen | 5 seconds | 3-15 seconds |
| Total loop time | 47 seconds | 35-90 seconds |
| Matches per hour | 55 | 40-70 |

### 12.3 Tension Arc

The emotional experience follows a predictable arc:

```
Tension
  ^
  |                                          ****
  |                                       ***    *
  |                                    ***        *
  |                                 ***            *
  |                              ***                *
  |                           ***                    *  WIN or LOSE
  |                        ***                        *
  |                     ***                            *
  |                  ***                                *
  |               ***                                    *
  |         *****                                         *
  |   ******                                               *
  |***                                                      ***
  +---------------------------------------------------------->
  Lobby  Warmup  Intro  Escalation  Intensity  Endgame  Results
   (calm) (safe) (learning) (engaged)  (stressed) (peak)  (release)
```

This follows the classic dramatic arc: setup, rising action, climax, resolution. The key insight is that the game's difficulty curve naturally creates this emotional arc without any artificial manipulation.

---

## 13. TECHNICAL IMPLEMENTATION NOTES

### 13.1 Changes Required to Current Codebase

Based on the analysis of the existing code, the following modifications are needed to implement this design:

**Backend modifications:**

1. **`Match.ts` -- Dynamic difficulty:**
   - Add `elapsedSeconds` calculation in `update()` based on `Date.now() - this.startTime`
   - Replace fixed `this.config.dinoSpeed` with `getSpeed(elapsedSeconds)` function
   - Replace fixed obstacle spawn interval with `getSpawnInterval(elapsedSeconds)`
   - Add phase tracking: `currentPhase: number` property

2. **`Match.ts` -- Pattern spawning:**
   - Replace `spawnObstacle()` with `spawnPattern()` that can generate multi-obstacle sequences
   - Add pattern validation (minimum gaps, clearability checks)
   - Add pattern selection weighted by current phase

3. **`MatchManager.ts` -- Dynamic spawn interval:**
   - Replace `setInterval` in `startObstacleSpawning()` with `setTimeout` loop that recalculates interval each spawn
   - Current code uses fixed interval: `setInterval(() => { ... }, match.config.obstacleSpawnRate)`
   - New code should use: `setTimeout(() => { spawnAndReschedule(); }, getSpawnInterval(elapsed))`

4. **`Obstacle.ts` -- New obstacle types:**
   - Add `ObstacleType` values: `'tall_cactus' | 'low_bird' | 'double_cactus' | 'moving_bird'`
   - Add factory methods for each new type
   - Add `movementPattern` property for moving bird
   - Update `update()` to handle vertical oscillation for moving birds

5. **`CollisionDetector.ts` -- Hitbox forgiveness:**
   - Add forgiveness multiplier (0.8) to collision box calculations
   - Center the reduced collision box within the visual bounds
   - Add coyote time check (overlap < 6px AND recent jump input)

6. **`Player.ts` -- Near-miss tracking:**
   - Add `nearMissCount: number` and `lastNearMissDistance: number` properties
   - Add method to check proximity when obstacle is passed

7. **Types -- Extended obstacle types:**
   - Update `ObstacleType` in type definitions
   - Add `phase: number` and `nearMisses: number` to `GameSnapshot`
   - Add `pattern: string` to obstacle snapshot for audit trail

**Frontend modifications:**

8. **`GameScene.ts` -- Visual effects:**
   - Add speed line rendering (background layer)
   - Add background color interpolation based on phase
   - Add near-miss indicators (floating text, particle effects)
   - Add elimination banners
   - Add screen shake system

9. **`GameScene.ts` -- Touch input:**
   - Add touch event listeners (`pointerdown`, `pointerup`, `pointermove`)
   - Implement swipe-down detection for duck
   - Add tap detection with dead zone

10. **`PlayerSprite.ts` -- Cosmetic support:**
    - Replace rectangle rendering with sprite-based rendering
    - Add trail effect system
    - Add elimination animation system
    - Add victory celebration system

11. **New: `SpectatorMode.ts`:**
    - Camera system for watching remaining players after elimination
    - UI overlay showing standings, scores, and play-again option

### 13.2 Server Authority Considerations

All difficulty calculations (speed, spawn intervals, pattern selection) must happen on the server. The client receives obstacle data and renders it. The client never determines obstacle placement or collision outcomes.

Key principle: the client is a "dumb terminal" that renders what the server tells it and sends input events. This prevents all client-side cheating.

### 13.3 Network Optimization

At high speeds (Phase 4-5), obstacle positions change rapidly. Network update frequency considerations:

- Current tick rate: 16ms (60fps)
- Socket.IO update rate: should match tick rate during active gameplay
- At 520px/s, an obstacle moves 8.3px per tick. Missing a single update at this speed is noticeable.
- Recommendation: maintain 60fps server updates during active gameplay. Consider delta compression (only send changed values) to reduce bandwidth.

### 13.4 Seeded RNG and Fairness

The current seeded RNG system (`SeededRNG` class) must be extended to handle:
- Pattern selection (weighted random from pattern pool)
- Obstacle type selection within patterns
- All randomness must flow through the seeded RNG for auditability
- The difficulty curve itself is deterministic (based on elapsed time), not random

---

## 14. BALANCING REFERENCE TABLES

### 14.1 Speed Progression Table

| Time (s) | Phase | Speed (px/s) | Screen cross time (s) | Reaction window (s) |
|---|---|---|---|---|
| 0 | 1 | 200 | 4.00 | 3.60 |
| 3 | 1 | 200 | 4.00 | 3.60 |
| 6 | 2 | 200 | 4.00 | 3.60 |
| 10 | 2 | 227 | 3.52 | 3.17 |
| 15 | 3 | 260 | 3.08 | 2.77 |
| 20 | 3 | 293 | 2.73 | 2.46 |
| 25 | 3 | 327 | 2.45 | 2.20 |
| 30 | 4 | 360 | 2.22 | 2.00 |
| 35 | 4 | 387 | 2.07 | 1.86 |
| 40 | 4 | 413 | 1.94 | 1.74 |
| 45 | 5 | 440 | 1.82 | 1.64 |
| 50 | 5 | 480 | 1.67 | 1.50 |
| 55 | 5 | 520 | 1.54 | 1.38 |
| 60+ | 5 | 520 | 1.54 | 1.38 |

### 14.2 Spawn Interval Table

| Time (s) | Spawn Interval (ms) | Obstacles/minute | Effective gap (px) |
|---|---|---|---|
| 0 | 2500 | 24 | 500 |
| 6 | 2500 | 24 | 500 |
| 10 | 2278 | 26 | 518 |
| 15 | 2000 | 30 | 520 |
| 20 | 1800 | 33 | 528 |
| 25 | 1600 | 38 | 523 |
| 30 | 1400 | 43 | 504 |
| 35 | 1133 | 53 | 439 |
| 40 | 1133 | 53 | 468 |
| 45 | 1000 | 60 | 440 |
| 50 | 850 | 71 | 408 |
| 55 | 700 | 86 | 364 |

### 14.3 Jump Physics Reference

| Parameter | Value | Derivation |
|---|---|---|
| Jump velocity | 400 px/s | Config |
| Gravity | 800 px/s^2 | Config |
| Peak height | 100 px | v^2 / (2g) = 160000/1600 |
| Time to peak | 0.5 s | v / g = 400/800 |
| Total air time | 1.0 s | 2v / g |
| Horizontal distance during jump | speed * 1.0 | Varies by phase |
| Duck height | 25 px | Half of standing height |
| Time to duck (gameplay feel) | ~100ms | Input processing + animation |

### 14.4 Obstacle Clearance Margins

| Obstacle | Height | Jump clearance margin | Notes |
|---|---|---|---|
| Small cactus | 50px (44px hitbox) | 56px | Very comfortable |
| Tall cactus | 80px (72px hitbox) | 28px | Tight -- near-miss generator |
| Bird (standard) | y=100, 30h | Must duck | Jump peak exactly at bird level |
| Low bird | y=40, 30h | Must duck | Top of bird at 70px, standing height 50px, overlap 20px |
| Double cactus | 50h, 70w (60w hitbox) | 56px vertical, timing-tight horizontal | Must jump early |

### 14.5 Scoring Formula

```
Base score = elapsedSeconds * 60    // ~60 points per second survived
Obstacle bonus = 10 per obstacle passed
Near-miss bonus:
  - Close (< 8px): +5 points
  - Insane (< 5px): +15 points
  - Pixel Perfect (< 3px): +30 points
Streak multiplier:
  - 5+ obstacles without miss: 1.5x
  - 10+ obstacles: 2.0x
  - 15+ obstacles: 3.0x
```

**Example score for 35-second survival:**
- Base: 35 * 60 = 2,100
- Obstacles cleared (~38): 38 * 10 = 380
- Near-misses (~4): 4 * average(5,15) = 40
- Streak multiplier (average 1.5x on obstacle bonuses): 380 * 0.5 = 190 bonus
- **Total: approximately 2,710 points**

---

## APPENDIX A: GLOSSARY

| Term | Definition |
|---|---|
| AABB | Axis-Aligned Bounding Box -- rectangle-based collision detection |
| Coyote time | Grace period after a player should have acted, allowing late inputs |
| GGR | Gross Gaming Revenue -- total bets minus total payouts |
| Hitbox forgiveness | Collision box smaller than visual sprite |
| RTP | Return To Player -- percentage of wagered money returned over time |
| Seeded RNG | Pseudorandom number generator initialized with a known seed for reproducibility |
| Seed commitment | Cryptographic hash of RNG seed, shared before match for provable fairness |

## APPENDIX B: RISK ANALYSIS

| Risk | Impact | Mitigation |
|---|---|---|
| Matches too short (under 15s average) | Players feel cheated of bet value | Grace period + difficulty curve ensures minimum ~15s |
| Matches too long (over 60s average) | Low revenue per hour, player boredom | Phase 5 endgame + 90s hard cap |
| Skill gap too large | New players always lose, churn | SBMM + bet tier separation |
| Perceived unfairness | Regulatory risk, player complaints | Provable fairness, hitbox forgiveness, audit logs |
| Network latency deaths | Player feels cheated | Coyote time, hitbox forgiveness, server reconciliation |
| Bot/automation abuse | Unfair advantage, revenue loss | Rate limiting, input pattern analysis, CAPTCHA on suspicious accounts |
| Collusion between players | Rigged outcomes | All players face same obstacles, no player interaction mechanics |

---

*End of Game Design Document*
*Version 1.0 -- 2026-02-04*
*Next review: After initial playtest with updated difficulty system*
