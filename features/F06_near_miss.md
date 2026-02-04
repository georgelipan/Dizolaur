# F06 — Near-Miss Detection & Feedback

## Descriere
Serverul detecteaza cand jucatorul trece aproape de un obstacol si trimite feedback vizual/audio.

## De ce
Near-miss = cel mai puternic dopamine hit in gaming. "Am scapat la limita" creeaza adrenalina si face jucatorul sa vrea sa mai joace.

## Specificatii

### Niveluri de near-miss
| Nivel | Distanta | Indicator | Bonus puncte |
|---|---|---|---|
| Close | < 8px | "CLOSE!" text galben | +5 |
| Insane | < 5px | "INSANE!" text portocaliu + screen flash | +15 |
| Pixel Perfect | < 3px | "PIXEL PERFECT!" text rosu + particle burst | +30 |

### Frecventa target
~1 near-miss la fiecare 8-12 secunde de gameplay (3-5 per meci).

### Detectie (server-side)
Cand un obstacol e trecut cu succes (`checkObstaclePassed`), calculeaza distanta minima intre collision boxes:
```typescript
const margin = getMinMargin(playerBounds, obstacleBounds);
if (margin < 8) {
  player.recordNearMiss(margin);
  // Include in next snapshot
}
```

## Fisiere de modificat

### Backend
- **`CollisionDetector.ts`**: adauga `getPassMargin(player, obstacle): number`
- **`Player.ts`**: adauga `nearMisses: Array<{tick, margin}>` si `recordNearMiss()`
- **`types/index.ts`**: adauga `nearMisses` in player snapshot

### Frontend
- **`GameScene.ts`**: cand primeste near-miss in snapshot, afiseaza indicator floating text
- **Nou: `NearMissEffect.ts`**: floating text + particle effect

## Dependinte
- F04 (Hitbox Forgiveness) — near-miss-urile depind de collision box-ul redus

## Validare
- [x] Near-miss detectat corect sub 20px, 12px, 6px
- [x] Text indicator apare pe ecran (centrat)
- [x] Bonus puncte acordate (+5/+15/+30)
- [x] Frecventa: ~3-5 pe meci tipic
