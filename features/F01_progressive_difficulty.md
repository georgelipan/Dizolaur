# F01 — Progressive Difficulty ✅ DONE

## Descriere
Viteza si rata de spawn a obstacolelor cresc progresiv pe parcursul meciului, in 5 faze.

## De ce
Acum viteza (200px/s) si spawn rate-ul (2000ms) sunt fixe. Jocul e la fel de greu la secunda 5 ca la secunda 50 — nu exista tensiune, nu exista escaladare.

## Specificatii

### 5 Faze

| Faza | Timp | Viteza (px/s) | Spawn Interval (ms) | Spacing minim (px) |
|---|---|---|---|---|
| Warmup | 0-6s | 200 | 2500 | 500 |
| Introduction | 6-15s | 200→260 | 2500→2000 | 450 |
| Escalation | 15-30s | 260→360 | 2000→1400 | 400→300 |
| Intensity | 30-45s | 360→440 | 1400→1000 | 300→220 |
| Endgame | 45s+ | 440→520 (cap) | 1000→700 (cap) | 200 |

### Formule

```typescript
function getSpeed(elapsed: number): number {
  if (elapsed <= 6) return 200;
  if (elapsed <= 15) return 200 + (60 / 9) * (elapsed - 6);
  if (elapsed <= 30) return 260 + (100 / 15) * (elapsed - 15);
  if (elapsed <= 45) return 360 + (80 / 15) * (elapsed - 30);
  return Math.min(520, 440 + 8 * (elapsed - 45));
}

function getSpawnInterval(elapsed: number): number {
  if (elapsed <= 6) return 2500;
  if (elapsed <= 15) return 2500 - (500 / 9) * (elapsed - 6);
  if (elapsed <= 30) return 2000 - (600 / 15) * (elapsed - 15);
  if (elapsed <= 45) return 1400 - (400 / 15) * (elapsed - 30);
  return Math.max(700, 1000 - 30 * (elapsed - 45));
}
```

### Match hard cap
La T=90s, daca mai multi jucatori sunt in viata, meciul se termina si castiga cel cu scorul cel mai mare.

## Fisiere de modificat

### Backend
- **`Match.ts`**:
  - Adauga `getElapsedSeconds()` bazat pe `Date.now() - this.startTime`
  - Adauga `currentPhase: number` property
  - In `update()`, obstacole existente se misca cu viteza curenta (nu fixa)
  - Adauga `getSpeed()` si `getSpawnInterval()` ca metode pe Match
  - Adauga logica match hard cap la 90s in `checkMatchEnd()`

- **`MatchManager.ts`**:
  - Inlocuieste `setInterval` in `startObstacleSpawning()` cu `setTimeout` recursiv
  - La fiecare spawn, recalculeaza intervalul: `setTimeout(spawn, match.getSpawnInterval())`

- **`Obstacle.ts`**:
  - `update(deltaTime)` ramane la fel — viteza e setata la creare
  - La spawn, viteza obstacolului = `getSpeed(elapsed)` din acel moment

### Frontend
- **`GameScene.ts`**:
  - Serverul trimite `phase` in snapshot (optional, pt UI)

## Dependinte
Niciuna — se poate implementa independent.

## Validare
- [ ] Primele 6 secunde: niciun obstacol nu ajunge la jucator
- [ ] La 30s viteza e ~360px/s
- [ ] La 55s+ viteza e capata la 520px/s
- [ ] Spawn interval scade progresiv
- [ ] Match-ul se termina fortat la 90s
