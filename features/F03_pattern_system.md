# F03 — Pattern System (Combinatii de Obstacole)

## Descriere
Obstacole spawn-ate in grupuri (pattern-uri) de 2-4, cu spacing controlat, in loc de obstacole individuale random.

## De ce
Secventele de obstacole creeaza gameplay mai interesant: jump-duck-jump cere skill real. Pattern-uri predictate dar variate.

## Pattern-uri

### Simple (Phase 2-3)
| Pattern | Secventa | Gap | Actiune | Dificultate |
|---|---|---|---|---|
| S1 Double Jump | Cactus → Cactus | 120px fix | Jump, land, Jump | Easy |
| S2 Jump-Duck | Cactus → Bird | speed*0.5 px | Jump, land, Duck | Medium |
| S3 Duck-Jump | Bird → Cactus | speed*0.45 px | Duck, stand, Jump | Medium |

### Complex (Phase 3-4)
| Pattern | Secventa | Gap | Actiune | Dificultate |
|---|---|---|---|---|
| C1 Triple Jump | Cactus → Cactus → Cactus | 130px fix | Jump x3 | Hard |
| C2 Jump-Duck-Jump | Cactus → Bird → Cactus | speed*0.5, speed*0.45 | Jump, Duck, Jump | Hard |
| C3 Tall+Low | Tall Cactus → Low Bird | speed*0.55 | Full jump, duck la aterizare | Hard |
| C4 Stutter Step | Cactus → Bird → Cactus | speed*0.8, speed*0.35 | Jump, wait, Duck, Jump | Very Hard |

### Expert (Phase 4-5)
| Pattern | Secventa | Gap | Actiune | Dificultate |
|---|---|---|---|---|
| E1 Quad | Cactus→Bird→Cactus→Bird | speed*0.45, 0.4, 0.5 | Jump,Duck,Jump,Duck | Expert |
| E2 Fake-Out | High Bird (y=130) → Cactus | speed*0.3 | Nothing, then Jump | Expert |
| E3 Precision | Double Cactus → Low Bird | speed*0.42 | Early jump, duck la landing | Expert |

## Selectie pattern (weighted random)

| Faza | Easy % | Medium % | Hard % | Very Hard % | Expert % |
|---|---|---|---|---|---|
| Phase 1 | 100 | 0 | 0 | 0 | 0 |
| Phase 2 | 60 | 40 | 0 | 0 | 0 |
| Phase 3 | 20 | 35 | 35 | 10 | 0 |
| Phase 4 | 5 | 15 | 30 | 30 | 20 |
| Phase 5 | 0 | 5 | 20 | 35 | 40 |

## Reguli de validare (hard constraints)
1. **Gap minim:** gap >= speed * 0.4 (400ms clear space)
2. **Jump recovery:** dupa jump, urmatorul obstacol la minim speed * 1.05 px
3. **Duck-to-jump transition:** minim speed * 0.35 px
4. **Niciodata input imposibil:** niciun obstacol nu cere jump + duck simultan
5. **Lookahead:** spawner-ul valideaza urmatoarele 3 obstacole inainte de spawn

## Fisiere de modificat

### Backend
- **`Match.ts`**: inlocuieste `spawnObstacle()` cu `spawnPattern()` care genereaza grupuri
- **Nou: `PatternLibrary.ts`** (sau in Match.ts): definitii de pattern-uri + weighted selection
- **`types/index.ts`**: adauga `pattern?: string` in obstacle snapshot (pt audit trail)

### Frontend
- Nicio modificare necesara — frontend-ul primeste obstacole individual din snapshot

## Dependinte
- F01 (Progressive Difficulty) — fazele
- F02 (New Obstacles) — tipurile de obstacole

## Validare
- [x] In Phase 1 apar doar single cactus
- [x] In Phase 3+ apar combinatii
- [x] Niciun pattern nu produce secventa imposibila
- [x] Gap-urile se scaleaza cu viteza
- [x] Pattern selection foloseste SeededRNG (provable fairness)
