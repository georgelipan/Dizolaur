# F14 — Haptic Feedback

## Descriere
Vibratii pe mobil la actiuni si evenimente.

## Specificatii
| Event | Pattern | Intensitate |
|---|---|---|
| Jump | Single pulse scurt | Light (10ms) |
| Duck | Single pulse mediu | Light (15ms) |
| Near-miss | Double quick pulse | Medium (10ms-gap-10ms) |
| Pixel Perfect | Triple pulse | Strong (15ms-gap-10ms-gap-15ms) |
| Eliminare proprie | Long buzz | Strong (200ms) |
| Eliminare altul | Single pulse | Light (10ms) |
| Victorie | Celebration pattern | Strong (100ms-50ms-100ms-50ms-200ms) |

## Implementare
- Foloseste `navigator.vibrate()` API
- Toggle in settings (default: on)
- Check availability: `'vibrate' in navigator`

## Fisiere de modificat

### Frontend
- **Nou: `services/HapticService.ts`**: centralizare haptic patterns + toggle
- **`GameScene.ts`**: trigger haptic la evenimente

## Dependinte
- F13 (Touch Controls) — relevant doar pe mobil

## Validare
- [ ] Vibratii la fiecare event
- [ ] Toggle on/off functioneaza
- [ ] Nu crasheaza pe desktop (graceful fallback)
