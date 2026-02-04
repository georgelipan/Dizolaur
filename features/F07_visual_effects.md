# F07 — Visual Effects

## Descriere
Speed lines, screen shake, particles, color shift pe background — "juice" vizual care face jocul sa se simta viu.

## Efecte

### Speed Lines
- Apar din Phase 3 (speed > 300px/s)
- Linii albe/gri diagonale in background
- Densitate: `lineCount = floor((speed - 300) / 20)` — max 11 la 520px/s

### Screen Shake
- La eliminare proprie: 4px amplitudine, 300ms, sinus descrescator
- La near-miss pixel perfect: 2px, 150ms
- NICIODATA in timpul gameplay normal (interfereaza cu precizia)

### Particles
| Event | Particule | Durata |
|---|---|---|
| Jump | Dust cloud la picioare, 3-5 particule | 200ms |
| Landing | Dust cloud mai mare, 5-8 particule | 300ms |
| Eliminare | Bone/star burst, 8-12 particule | 500ms |
| Near-miss | Spark trail intre dino si obstacol, 2-3 particule | 200ms |
| Victorie | Confetti din top, 20-30 particule | 2000ms |

### Background Color Shift
| Faza | Cer | Sol | Emotie |
|---|---|---|---|
| Phase 1 | #87CEEB (bleu) | #8B4513 (maro) | Calm |
| Phase 2 | #7BC8E8 (bleu mai intens) | #7D3C0F | Warming up |
| Phase 3 | #E8A87C (peach/sunset) | #6B340D | Alert |
| Phase 4 | #D4735E (portocaliu sunset) | #5A2D0B | Pericol |
| Phase 5 | #B8433A (rosu-portocaliu) | #4A2509 | Critic |

Tranzitie: lerp liniar pe 3 secunde la granita de faza.

### Motion Blur
- Blur horizontal pe obstacole la Phase 4+ (speed > 400px/s)
- 2px horizontal stretch pe sprite
- Dinozaurul NU se blureaza (e avatarul jucatorului)

## Fisiere de modificat

### Frontend
- **`GameScene.ts`**: adauga sisteme de particles, speed lines, background color lerp
- **Nou: `effects/SpeedLines.ts`**: render speed lines in background
- **Nou: `effects/ScreenShake.ts`**: camera shake system
- **Nou: `effects/ParticleManager.ts`**: centralizare particule

## Dependinte
- F01 (Progressive Difficulty) — fazele si viteza
- Phase info trebuie trimisa in snapshot de la server

## Validare
- [x] Speed lines apar doar peste 300px/s
- [x] Background-ul se schimba gradual pe faze
- [x] Screen shake doar la eliminare si pixel perfect near-miss
- [x] Particles la jump/landing/eliminare
- [x] Performance: fara drop de FPS pe mobile
