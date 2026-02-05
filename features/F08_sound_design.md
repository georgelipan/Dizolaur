# F08 — Sound Design

## Descriere
Sunete pentru fiecare actiune si eveniment, plus muzica de fundal cu tempo care creste.

## Sunete

| Event | Caracter | Durata | Scop |
|---|---|---|---|
| Jump | "boing" scurt, pitch variat | 150ms | Feedback input |
| Duck | "swoosh" jos | 120ms | Confirma duck |
| Obstacle cleared | "ding" subtil (pentatonic) | 100ms | Micro-reward |
| Near-miss close | "whoosh" dramatic + tensiune | 300ms | Excitement spike |
| Near-miss pixel perfect | "whoosh" + crowd gasp + sparkle | 500ms | Peak excitement |
| Score multiplier | Chime ascendent | 400ms | Achievement |
| Alt jucator eliminat | Impact profund + dramatic sting | 600ms | Drama |
| Eliminare proprie | Crash + ton descendent | 800ms | Defeat signal |
| Victorie | Fanfara + crowd cheer | 2000ms | Maximum dopamine |

## Muzica de fundal
- Electronica, ritmica
- Tempo sincronizat cu viteza jocului:
  - Phase 1: 120 BPM
  - Phase 2: 130 BPM
  - Phase 3: 145 BPM
  - Phase 4: 160 BPM
  - Phase 5: 175 BPM
- Cresterea e graduala si continua (nu stepped)

## Fisiere de modificat

### Frontend
- **Nou: `services/AudioManager.ts`**: centralizare sunete, volume, mute toggle
- **`GameScene.ts`**: trigger sunete la evenimentele corespunzatoare
- **Assets:** fisiere audio in `ui/public/sounds/`

## Dependinte
- F06 (Near-Miss) — sunetele de near-miss

## Validare
- [x] Fiecare actiune are sunet
- [x] Tempo muzica creste cu fazele
- [x] Mute toggle functioneaza
- [x] Sunetele nu se suprapun haotic (prioritizare)
- [x] Performanta OK pe mobile
