# F05 — Input Forgiveness (Jump Buffer + Late-Jump Grace)

## Descriere
Doua mecanisme care fac inputul sa se simta responsive si corect.

## De ce
Pe mobil si cu latenta de retea, jucatorul adesea apasa jump "aproape la timp". Fara forgiveness, simte ca "n-a mers butonul" si se frustreaza.

## A) Jump Buffer

**Problema:** Jucatorul e in aer dupa un salt si apasa jump pentru urmatorul obstacol. Inputul e ignorat pentru ca e inca in aer.

**Solutia:** Buffer-ul tine inputul si il executa la aterizare.

- Buffer window: 100ms (6 tick-uri la 60fps)
- Server-side: daca `player.position.y > 0` (in aer) si vine jump input, se stocheaza in `player.bufferedJump = true`
- La aterizare (`player.position.y <= 0`), daca `bufferedJump === true`, executa jump instant

## B) Late-Jump Grace

**Problema:** Obstacolul a inceput sa se suprapuna cu jucatorul (sub 6px overlap), dar jucatorul tocmai apasa jump. Fara grace, e mort.

**Solutia:** Daca overlap-ul e mic si exista jump input recent, anuleaza coliziunea.

- Grace window: 80ms (5 tick-uri)
- Overlap maxim: 6px
- Server-side in CollisionDetector:
  ```typescript
  if (overlap < 6 && player.hasRecentJumpInput(5)) {
    // Ignore collision, player "barely makes it"
    return false;
  }
  ```

## Fisiere de modificat

### Backend
- **`Player.ts`**: adauga `bufferedJump: boolean` si `lastJumpInputTick: number`
- **`PhysicsEngine.ts`**: in `processPlayerInput()`, daca player e in aer si vine jump, seteaza buffer
- **`Match.ts`**: in `update()`, la aterizare verifica buffered jump
- **`CollisionDetector.ts`**: adauga late-jump grace check (overlap < 6px + recent input)

### Frontend
- Nicio modificare — totul e server-side

## Dependinte
- F04 (Hitbox Forgiveness) — complementar, dar poate fi implementat independent

## Validare
- [ ] Jump buffer: apasa jump in aer, aterizare + salt automat
- [ ] Late-jump grace: overlap < 6px + jump = supravietuire
- [ ] Overlap >= 6px = moarte normala (nu se exploateaza)
- [ ] Testare cu latenta simulata (100ms, 200ms)
