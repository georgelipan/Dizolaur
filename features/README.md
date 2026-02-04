# Feature Backlog — Dizolaur

Features sunt ordonate pe prioritate. Fiecare feature e un fisier separat cu specificatii complete.

## Prioritate 1 — Core Gameplay (fara astea jocul nu e fun)

| # | Feature | Fisier | Depinde de |
|---|---------|--------|------------|
| F01 | Progressive Difficulty (viteza + spawn dinamic) | [F01_progressive_difficulty.md](F01_progressive_difficulty.md) | - |
| F02 | Noi tipuri de obstacole (tall cactus, low bird, double cactus, moving bird) | [F02_new_obstacles.md](F02_new_obstacles.md) | F01 |
| F03 | Pattern System (combinatii de obstacole) | [F03_pattern_system.md](F03_pattern_system.md) | F02 |
| F04 | Hitbox Forgiveness (collision box 80% din visual) | [F04_hitbox_forgiveness.md](F04_hitbox_forgiveness.md) | - |
| F05 | Input Forgiveness (jump buffer + late-jump grace) | [F05_input_forgiveness.md](F05_input_forgiveness.md) | F04 |

## Prioritate 2 — Feel & Juice (face jocul addictive)

| # | Feature | Fisier | Depinde de |
|---|---------|--------|------------|
| F06 | Near-Miss Detection & Feedback | [F06_near_miss.md](F06_near_miss.md) | F04 |
| F07 | Visual Effects (speed lines, screen shake, particles, color shift) | [F07_visual_effects.md](F07_visual_effects.md) | F01 |
| F08 | Sound Design (jump, duck, near-miss, elimination, victory) | [F08_sound_design.md](F08_sound_design.md) | F06 |
| F09 | Score Multiplier Streaks | [F09_score_streaks.md](F09_score_streaks.md) | F06 |

## Prioritate 3 — Multiplayer Experience

| # | Feature | Fisier | Depinde de |
|---|---------|--------|------------|
| F10 | Spectator Mode (dupa eliminare) | [F10_spectator_mode.md](F10_spectator_mode.md) | - |
| F11 | Elimination Announcements & Alive Counter | [F11_elimination_ui.md](F11_elimination_ui.md) | F10 |
| F12 | Victory & Defeat Sequences | [F12_victory_defeat.md](F12_victory_defeat.md) | F08 |

## Prioritate 4 — Mobile & Touch

| # | Feature | Fisier | Depinde de |
|---|---------|--------|------------|
| F13 | Touch Controls (tap jump, swipe duck) | [F13_touch_controls.md](F13_touch_controls.md) | - |
| F14 | Haptic Feedback | [F14_haptic_feedback.md](F14_haptic_feedback.md) | F13 |
| F15 | Mobile Layout (portrait + landscape) | [F15_mobile_layout.md](F15_mobile_layout.md) | F13 |
