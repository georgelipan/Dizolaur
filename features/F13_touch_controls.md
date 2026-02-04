# F13 — Touch Controls

## Descriere
Tap to jump, swipe down to duck. Playabil cu un singur deget.

## Scheme de control

### Primary (default)
- **Tap oriunde pe ecran:** Jump
- **Swipe down oriunde:** Duck
- **Ridica degetul / tap in duck:** Unduck

### Alternativ (in settings)
- **Tap jumatatea stanga:** Jump
- **Tap jumatatea dreapta:** Duck

## Specificatii tehnice
| Parametru | Valoare |
|---|---|
| Tap detection | < 10px miscare = tap (nu swipe) |
| Swipe down | > 30px miscare in jos in < 200ms |
| Latenta input | < 50ms de la touch la server |
| Tap dead zone dupa jump | 100ms (previne double-tap accidental) |
| Duck hold | player sta in duck cat timp degetul e apasat dupa swipe |

**Regula critica:** Orice touch care NU e clar swipe down = jump. Multi utilizatori mobili nu ridica degetul curat.

## Fisiere de modificat

### Frontend
- **`GameScene.ts`**: adauga touch event listeners (`pointerdown`, `pointerup`, `pointermove`)
- **Nou: `services/TouchInputHandler.ts`**: detectie tap vs swipe, dead zones, buffer
- **`GameScene.ts`**: hint text "TAP = JUMP | SWIPE = DUCK" care dispare dupa 3 jocuri

## Dependinte
Niciuna

## Validare
- [ ] Tap = jump pe mobil
- [ ] Swipe down = duck pe mobil
- [ ] Nu interfereaza cu keyboard controls pe desktop
- [ ] Dead zone previne double-tap
- [ ] Functioneaza cu un singur deget
