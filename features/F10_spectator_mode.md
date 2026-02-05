# F10 — Spectator Mode

> **Nota:** Acest feature nu poate fi testat complet decat dupa implementarea partii de multiplayer (mai multi jucatori in acelasi meci). In single-player, se poate verifica doar death replay-ul si tranzitia la spectator view.

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
- [x] Dupa eliminare, vad ceilalti jucatori live
- [x] Scorurile se actualizeaza in timp real
- [x] Butonul Play Again functioneaza
- [x] Death replay se afiseaza 1.5s
