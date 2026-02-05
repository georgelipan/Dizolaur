
# Modele de facut

Canvas: 960 x 540 (16:9)
## W x H
## 1. Player — 48 x 64

## 2. ground_small — 36 x 55
Obstacol pe sol, standard. Salt normal il trece.

## 3. ground_tall — 30 x 90
Obstacol pe sol, ingust si inalt. Necesita salt complet.

## 4. ground_wide — 85 x 48
Obstacol pe sol, lat si scund. Trebuie salt devreme.

## 5. air_high — 50 x 40
Pluteste sus (Y=95). Jucatorul trece pe sub daca nu sare.

## 6. air_low — 55 x 40
Pluteste jos (Y=32). Jucatorul trebuie sa faca duck.

## 7. air_moving — 45 x 40
Pluteste si oscileaza vertical intre Y=30 si Y=110. Imprevizibil.

## 8. Sol — 960 x 50
Banda maro la baza ecranului.


# Game Dimensions Reference

Toate valorile sunt in game units si se pot suprascrie din `.env`.

## Canvas & World

| Proprietate | Valoare | ENV | Nota |
|---|---|---|---|
| Canvas width | 960 | `WORLD_WIDTH` | 16:9 aspect ratio, mobile-first |
| Canvas height | 540 | `WORLD_HEIGHT` | |
| Ground Y | 0 | `GROUND_Y` | Backend: Y=0 e solul, Y+ e sus |
| Ground Y (screen) | 440 | — | Frontend: `worldHeight - 100` |

## Fizica

| Proprietate | Valoare | ENV | Derivat |
|---|---|---|---|
| Gravity | 800 px/s² | `GRAVITY` | |
| Jump velocity | 400 px/s | `JUMP_VELOCITY` | |
| Max jump height | 100 | — | `v²/(2g) = 160000/1600` |
| Jump duration | 1.0s | — | `2v/g = 800/800` |
| Runner speed | 200 px/s | `RUNNER_SPEED` | Baza, creste cu faza |
| Obstacle spawn rate | 2000 ms | `OBSTACLE_SPAWN_RATE` | Baza, scade cu faza |
| Tick rate | 16 ms | `TICK_RATE` | ~60 FPS |
| Hitbox forgiveness | 0.8 | `HITBOX_FORGIVENESS` | Collision box = 80% din visual |

## Player

| Proprietate | Valoare | ENV | Nota |
|---|---|---|---|
| Width | 48 | `PLAYER_WIDTH` | |
| Height | 64 | `PLAYER_HEIGHT` | |
| Start X | 60 | `PLAYER_START_X` | |
| Start Y | 0 | `PLAYER_START_Y` | Pe sol |
| Cap standing | Y=64 | — | `playerStartY + playerHeight` |
| Cap ducking | ~Y=32 | — | ~50% din inaltime |
| Cap la peak jump | Y=164 | — | `maxJump + playerHeight` |

## Obstacole Ground

| Tip | Width | Height | ENV W/H | Spawn Y | Culoare | Gameplay |
|---|---|---|---|---|---|---|
| ground_small | 36 | 55 | `GROUND_SMALL_WIDTH/HEIGHT` | 0 (sol) | `#00aa00` green | Salt normal |
| ground_tall | 30 | 90 | `GROUND_TALL_WIDTH/HEIGHT` | 0 (sol) | `#006600` dark green | Salt aproape complet |
| ground_wide | 85 | 48 | `GROUND_WIDE_WIDTH/HEIGHT` | 0 (sol) | `#008800` med green | Salt devreme (lat) |

## Obstacole Air

| Tip | Width | Height | ENV W/H | Spawn Y | ENV Y | Culoare | Gameplay |
|---|---|---|---|---|---|---|---|
| air_high | 50 | 40 | `AIR_HIGH_WIDTH/HEIGHT` | 95 | `AIR_HIGH_SPAWN_Y` | `#aa0000` red | Nu sari — stai jos |
| air_low | 55 | 40 | `AIR_LOW_WIDTH/HEIGHT` | 32 | `AIR_LOW_SPAWN_Y` | `#cc4400` orange | Duck |
| air_moving | 45 | 40 | `AIR_MOVING_WIDTH/HEIGHT` | 70 (base) | `AIR_MOVING_BASE_Y` | `#ff0066` pink | Oscileaza, imprevizibil |

### air_moving sine wave
- Base Y: 70
- Amplitude: 40 (hardcoded in `Obstacle.createAirMoving`)
- Period: 1.5s (hardcoded in `Obstacle.createAirMoving`)
- Range: Y=30 — Y=110

## Diagrama verticala (game units, Y=0 e sol)

```
Y=164 ── cap player la peak jump
Y=110 ── air_moving max (70+40)
Y=100 ── picioare player la peak jump (max jump height)
Y=95  ── air_high bottom
Y=90  ── ground_tall top
Y=72  ── air_low top (32+40)
Y=70  ── air_moving base
Y=64  ── cap player standing
Y=55  ── ground_small top
Y=48  ── ground_wide top
Y=40  ── air_high + air_low height band
Y=32  ── air_low bottom / cap player ducking
Y=30  ── air_moving min (70-40)
Y=0   ── SOL
```

## Faze (progressive difficulty)

| Faza | Incepe la | ENV | Speed mult | Spawn mult | Obstacole noi |
|---|---|---|---|---|---|
| Phase 1 | 0s | — | 1.0x | 1.25x | ground_small |
| Phase 2 | 6s | `PHASE_2_START` | 1.0→1.3x | 1.25→1.0x | + air_high |
| Phase 3 | 15s | `PHASE_3_START` | 1.3→1.8x | 1.0→0.7x | + ground_tall, air_low, ground_wide |
| Phase 4 | 30s | `PHASE_4_START` | 1.8→2.2x | 0.7→0.5x | + air_moving |
| Phase 5 | 45s | `PHASE_5_START` | 2.2→2.6x | 0.5→0.35x | Distributie finala |
| Hard cap | 90s | — | — | — | Meciul se termina |

### Distributie obstacole per faza

| Faza | ground_small | air_high | ground_tall | air_low | ground_wide | air_moving |
|---|---|---|---|---|---|---|
| 1 | 100% | — | — | — | — | — |
| 2 | 70% | 30% | — | — | — | — |
| 3 | 35% | 25% | 15% | 10% | 15% | — |
| 4 | 25% | 20% | 15% | 10% | 20% | 10% |
| 5 | 20% | 15% | 15% | 15% | 20% | 15% |

## Mobile scaling

Canvas 960x540 cu `Phaser.Scale.FIT`:

| Telefon | Landscape | Scale | Player pe ecran |
|---|---|---|---|
| iPhone SE | 667x375 | 0.69x | 33x44 px |
| iPhone 14 | 844x390 | 0.72x | 35x46 px |
| iPhone 15 Pro Max | 932x430 | 0.80x | 38x51 px |
| Samsung S23 | 915x412 | 0.76x | 36x49 px |
| Desktop (capped) | 960x540 | 1.0x | 48x64 px |
