# F12 — Victory & Defeat Sequences

## Descriere
Secvente cinematice la sfarsitul meciului — victorie si infrangere.

## Victory Sequence
1. **T+0ms:** Obstacole se opresc. Background flash alb 100ms
2. **T+100ms:** "WINNER!" text slam pe ecran + impact shake (6px, 200ms) + fanfara
3. **T+300ms:** Confetti particles din top
4. **T+500ms:** Castiguri animate: "$0.00 → $1.90" count-up pe 1.5s
5. **T+2000ms:** Stats (survival time, obstacles cleared, near-misses)
6. **T+3000ms:** "PLAY AGAIN" buton cu pulse animation

## Defeat Sequence
1. **T+0ms:** Slow-motion collision replay (1.5s la 0.3x speed)
2. **T+1500ms:** "ELIMINATED" text cu palette desaturata
3. **T+2000ms:** Tranzitie la spectator mode (daca sunt jucatori activi) sau results screen

## Results Screen
- Clasament final: 1st, 2nd, 3rd, 4th
- Timpii de supravietuire
- Payout: "YOU WON $7.60!" sau "Better luck next time"
- Comparatie personal best
- Near-miss count
- "PLAY AGAIN" (prominent), "CHANGE BET", "LOBBY"
- Auto-return la lobby dupa 15s fara actiune

## Fisiere de modificat

### Frontend
- **Nou: `sequences/VictorySequence.ts`**: animatii victorie
- **Nou: `sequences/DefeatSequence.ts`**: slow-mo + ELIMINATED
- **`ResultsScene.ts`**: redesign cu stats, animations, quick rematch

## Dependinte
- F08 (Sound Design) — fanfara victorie, crash infrangere
- F10 (Spectator Mode) — defeat transitioneaza la spectator

## Validare
- [ ] Victory sequence completa cu confetti si count-up
- [ ] Defeat replay in slow motion
- [ ] Play Again functioneaza instant (same bet pre-filled)
- [ ] Auto-return la lobby dupa 15s
