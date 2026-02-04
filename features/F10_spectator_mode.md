# F10 — Spectator Mode

## Descriere
Dupa eliminare, jucatorul vede in continuare meciul live. Urmareste ceilalti jucatori.

## De ce
Creeaza tensiune, social engagement, si motivatie ("urmatorul meci fac mai bine"). Tine jucatorul in joc in loc sa-l piarda.

## Flow
1. **T+0s:** Slow-motion death replay (1.5s la 0.3x speed)
2. **T+1.5s:** Camera zoom out, toti jucatorii activi vizibili
3. **T+2s+:** Spectare live — scoruri in timp real, dinos highlighted
4. Buton "Play Again" vizibil dar neobstructiv (bottom screen)

## UI in spectator mode
- "N PLAYERS REMAINING" counter
- Scoruri live ale jucatorilor activi
- Scorul propriu dimmed pentru comparatie
- Numele jucatorilor deasupra dino-urilor
- Buton "PLAY AGAIN" in partea de jos

## Fisiere de modificat

### Frontend
- **Nou: `SpectatorOverlay.ts`**: UI overlay cu scoruri, counter, play again
- **`GameScene.ts`**: dupa eliminare, tranzitie la spectator view (nu iesi din scena)
- **`GameScene.ts`**: camera adjustments pt spectator

### Backend
- Nicio modificare — serverul trimite deja snapshot-uri cu toti jucatorii

## Dependinte
Niciuna

## Validare
- [ ] Dupa eliminare, vad ceilalti jucatori live
- [ ] Scorurile se actualizeaza in timp real
- [ ] Butonul Play Again functioneaza
- [ ] Death replay se afiseaza 1.5s
