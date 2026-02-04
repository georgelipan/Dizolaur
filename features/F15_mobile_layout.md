# F15 — Mobile Layout

## Descriere
Layout responsive pentru portrait, landscape si desktop.

## Portrait Layout
```
+----------------------------------+
|  Score: 1,247    3/4 ALIVE       |  48px status bar
|  [Elimination feed]              |  semi-transparent
|                                  |
|         GAME AREA                |  main viewport
|    [dinos + obstacles]           |
|  ================================|  ground la 75% din inaltime
|                                  |
|  TAP = JUMP  |  SWIPE = DUCK    |  hint (dispare dupa 3 jocuri)
+----------------------------------+
```

## Landscape / Desktop
```
+--------------------------------------------------------------+
| Score: 1,247        Match: abc123        3/4 ALIVE           |
|              GAME AREA (full width)                          |
|   [Players]                [Obstacles ->]                    |
|   =========================================================  |
+--------------------------------------------------------------+
```

## Reguli vizuale
- Obstacol minim 20px in orice dimensiune pe ecran
- Contrast minim 4.5:1 (WCAG AA)
- Score text minim 16px
- 8px padding de la margini (notch-safe)
- Niciun element interactiv in zona de joc in timpul gameplay-ului
- Background simplificat pe mobile (mai putine detalii, performanta > estetica)

## Fisiere de modificat

### Frontend
- **`main.ts`**: detectie orientare, resize handler
- **`GameScene.ts`**: layout responsive bazat pe dimensiuni ecran
- **CSS/config**: responsive breakpoints

## Dependinte
- F13 (Touch Controls)

## Validare
- [ ] Layout corect in portrait pe telefon
- [ ] Layout corect in landscape
- [ ] Elementele UI sunt lizibile pe ecran 320px latime
- [ ] Nicio suprapunere UI cu zona de joc
