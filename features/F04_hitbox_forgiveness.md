# F04 — Hitbox Forgiveness

## Descriere
Collision box-ul e 80% din dimensiunea vizuala, centrat. Jucatorul "trece razant" pe langa obstacol fara sa moara.

## De ce
Cand sprite-ul vizual se suprapune putin cu obstacolul dar jucatorul nu moare, creeaza near-miss moments care sunt extrem de satisfacatoare. Elimina mortile care "se simt nedrepte".

## Specificatii

| Element | Visual Size | Collision Size | Forgiveness |
|---|---|---|---|
| Player (standing) | 40w x 50h | 32w x 42h | 20% |
| Player (ducking) | 40w x 25h | 32w x 20h | 20% |
| Small cactus | 30w x 50h | 24w x 44h | 20% |
| Tall cactus | 25w x 80h | 20w x 72h | 20% |
| Bird | 40w x 30h | 32w x 24h | 20% |
| Double cactus | 70w x 50h | 60w x 44h | ~14% |

**Centrare:** collision box centrat in sprite. Forgiveness egala pe toate partile.

## Fisiere de modificat

### Backend
- **`CollisionDetector.ts`**:
  - Adauga `FORGIVENESS_MULTIPLIER = 0.8`
  - Player bounds: centreaza collision box in sprite
  ```typescript
  const marginX = config.playerWidth * (1 - FORGIVENESS) / 2;
  const marginY = config.playerHeight * (1 - FORGIVENESS) / 2;
  const playerBounds = {
    left: player.position.x + marginX,
    right: player.position.x + config.playerWidth - marginX,
    top: player.position.y + config.playerHeight - marginY,
    bottom: player.position.y + marginY,
  };
  ```
  - Obstacol bounds: la fel, centrare cu 80%

- **`config/env.ts`** + **`config/index.ts`**: adauga `HITBOX_FORGIVENESS` env var (default 0.8)
- **`types/index.ts`**: adauga `hitboxForgiveness: number` in GameConfig

### Frontend
- Nicio modificare — frontend-ul nu face collision detection

## Dependinte
Niciuna — se poate implementa independent.

## Validare
- [ ] Collision box e 80% din vizual pe ambele axe
- [ ] Player sprite se suprapune vizual cu obstacol fara sa moara (20% overlap)
- [ ] Forgiveness e configurabila prin env var
- [ ] Testare cu diferite valori (0.7, 0.8, 0.9)
