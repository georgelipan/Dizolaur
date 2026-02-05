# F11 — Elimination Announcements & Alive Counter

## Descriere
Counter "N/4 ALIVE" prominent + banner dramatic la fiecare eliminare.

## Specificatii

### Alive Counter
- Pozitie: top-right
- Format: "4/4 ALIVE"
- La eliminare: pulseaza rosu 500ms, numar scade cu animatie slot-machine (200ms)
- La "2 ALIVE": counter glows amber permanent
- La "1 ALIVE" (ai castigat): explodeaza in "WINNER!"

### Elimination Banner
- Slide-in din top la fiecare eliminare
- Text: "[PLAYER_NAME] ELIMINATED! N REMAIN"
- Durata: 2s (300ms slide-in, 300ms fade-out)

### Final Showdown
- Cand raman 2 jucatori: banner "FINAL 2" + UI shift (ambii dinos highlighted)

## Fisiere de modificat

### Frontend
- **`GameScene.ts`**: adauga alive counter si elimination banner
- **Nou: `ui/AliveCounter.ts`**: component counter cu animatii
- **Nou: `ui/EliminationBanner.ts`**: component banner

### Backend
- Serverul trimite deja `PlayerState.ELIMINATED` in snapshot — suficient

## Dependinte
- F10 (Spectator Mode) — banner-urile sunt relevante si in spectator

## Validare
- [x] Counter se actualizeaza la fiecare eliminare
- [x] Banner apare cu animatie
- [x] "FINAL 2" banner la ultimii 2 jucatori
- [x] Animatiile nu interfereaza cu gameplay-ul
