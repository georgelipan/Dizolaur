# F09 — Score Multiplier Streaks

## Descriere
Multiplicator de scor care creste pe masura ce treci obstacole consecutive fara sa mori.

## Specificatii
| Obstacole consecutive | Multiplicator |
|---|---|
| 0-4 | 1.0x |
| 5-9 | 1.5x |
| 10-14 | 2.0x |
| 15+ | 3.0x |

- Multiplicatorul se aplica pe bonus-ul de obstacol (+10 per obstacol) si pe near-miss bonus
- NU se aplica pe scorul de timp (60pts/sec) — altfel ar fi prea puternic
- Reset la 1.0x daca jucatorul moare (evident) — nu exista "miss" fara moarte in jocul curent

## Formula scor completa
```
scorePerSecond = 60
obstacleBonus = 10 * streakMultiplier
nearMissBonus = (5|15|30) * streakMultiplier
```

## Fisiere de modificat

### Backend
- **`Player.ts`**: adauga `obstacleStreak: number` si `getStreakMultiplier(): number`
- **`PhysicsEngine.ts`**: in checkObstaclePassed, incrementeaza streak si aplica multiplicator
- **`types/index.ts`**: adauga `streak` si `multiplier` in player snapshot (pt UI)

### Frontend
- **`GameScene.ts`**: afiseaza multiplicator langa scor ("Score: 1,247 x2.0")
- Animatie cand se activeaza un nou tier de multiplicator

## Dependinte
- F06 (Near-Miss) — bonus-ul de near-miss e multiplicat

## Validare
- [ ] Multiplicator creste la 5, 10, 15 obstacole
- [ ] Se afiseaza pe ecran
- [ ] Bonus-ul de obstacol e multiplicat corect
- [ ] Scorul de timp NU e multiplicat
