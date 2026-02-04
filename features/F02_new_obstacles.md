# F02 — Noi Tipuri de Obstacole ✅ DONE

## Descriere
Adauga 4 tipuri noi de obstacole pe langa cactus si bird existente.

## De ce
Cu doar 2 tipuri, jocul devine predictibil repede. Varietatea tine jucatorul alert si creeaza momente de near-miss.

## Obstacole noi

### Type 3: Tall Cactus
- **Dimensiuni:** 25w x 80h
- **Pozitie:** ground (y=0)
- **Actiune:** Jump (necesita arc complet — clearance doar 28px la peak de 100px)
- **Introdus:** Phase 3 (T=18s)
- **Near-miss generator:** la 80px inaltime vs 100px jump peak, 40% din clear-uri sunt sub 10px margin

### Type 4: Low Bird
- **Dimensiuni:** 40w x 30h
- **Pozitie:** y=40 (sub inaltimea capului playerului)
- **Actiune:** Duck
- **Introdus:** Phase 3 (T=20s)
- **Visual:** aceeasi pasare dar mai jos, cu shadow pe sol si animatie swooping

### Type 5: Double Cactus Cluster
- **Dimensiuni:** 70w x 50h (un singur obstacol lat)
- **Pozitie:** ground (y=0)
- **Actiune:** Jump (trebuie sa sara mai devreme din cauza latimii)
- **Introdus:** Phase 3 (T=22s)

### Type 6: Moving Bird
- **Dimensiuni:** 40w x 30h
- **Pozitie:** oscileaza vertical: `y(t) = 80 + 40 * sin(2 * PI * t / 1.5)`
- **Actiune:** depinde de pozitia curenta (duck daca e jos, jump daca coboara in cale)
- **Introdus:** Phase 4 (T=32s)
- **Frecventa:** 5-10% din spawn-uri in Phase 4+

## Distributie pe faze

| Faza | Cactus | Bird | Tall Cactus | Low Bird | Double | Moving |
|---|---|---|---|---|---|---|
| Phase 1 | 100% | 0 | 0 | 0 | 0 | 0 |
| Phase 2 | 70% | 30% | 0 | 0 | 0 | 0 |
| Phase 3 | 35% | 25% | 15% | 10% | 15% | 0 |
| Phase 4 | 25% | 20% | 15% | 10% | 20% | 10% |
| Phase 5 | 20% | 15% | 15% | 15% | 20% | 15% |

## Fisiere de modificat

### Backend
- **`types/index.ts`**: extinde `ObstacleType` cu `'tall_cactus' | 'low_bird' | 'double_cactus' | 'moving_bird'`
- **`config/env.ts`** + **`config/index.ts`**: adauga dimensiuni noi in GameConfig (TALL_CACTUS_WIDTH, etc.)
- **`Obstacle.ts`**:
  - Adauga factory methods: `createTallCactus()`, `createLowBird()`, `createDoubleCactus()`, `createMovingBird()`
  - Adauga `movementPattern` optional pe Obstacle
  - In `update()`, daca `movementPattern === 'sine'`, aplica oscilatie verticala
- **`Match.ts`**: logica de selectie obstacol bazata pe faza curenta si distributia de mai sus

### Frontend
- **`ObstacleSprite.ts`**: culori/vizualuri diferite per tip
- **`types/index.ts`**: extinde ObstacleType

## Dependinte
- F01 (Progressive Difficulty) — pentru fazele care controleaza cand apar obstacolele noi

## Validare
- [ ] Tall cactus apare doar dupa T=18s
- [ ] Low bird apare doar dupa T=20s
- [ ] Moving bird oscileaza vertical corect
- [ ] Distributia pe faze corespunde tabelului
- [ ] Toate obstacolele noi sunt vizibil distincte
