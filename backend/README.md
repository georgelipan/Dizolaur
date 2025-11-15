# Multiplayer Dino Game - Backend

Backend server pentru un joc multiplayer tip "Chrome Dino" integrat cu platforme de gambling.

## Arhitectură

Acest backend este construit cu:
- **Node.js** + **TypeScript**
- **Socket.IO** pentru comunicare în timp real
- **Arhitectură autoritativă** - serverul controlează fizica și starea jocului

## Structura Proiectului

```
backend/
├── src/
│   ├── config/          # Configurare server și joc
│   ├── handlers/        # Socket.IO event handlers
│   ├── models/          # Modele de date (Player, Match, Obstacle)
│   ├── services/        # Logică business (MatchManager, PhysicsEngine, etc.)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Funcții helper
│   └── server.ts        # Entry point
├── dist/                # Build output (generat)
└── package.json
```

## Instalare

```bash
# Instalare dependențe
npm install

# Instalare pachetul @types/node dacă nu este deja instalat
npm install
```

## Configurare

Creați un fișier `.env` bazat pe `.env.example`:

```bash
cp .env.example .env
```

Editați `.env` cu configurările dorite:
- `PORT`: Portul serverului (default: 3000)
- `PLATFORM_CALLBACK_URL`: URL-ul platformei de gambling pentru rezultate
- `PLATFORM_API_KEY`: Cheia API pentru autentificare cu platforma
- Parametrii de joc (gravity, jump velocity, etc.)

## Rulare

```bash
# Development (build + run)
npm run dev

# Build
npm run build

# Production (după build)
npm start

# Watch mode (recompilare automată)
npm run watch
```

## Protocoale Socket.IO

### Client → Server Events

#### `authenticate`
Autentifică jucătorul cu token-ul de la platforma de gambling.
```typescript
{
  token: string
}
```

#### `player_ready`
Semnalează că jucătorul este pregătit să înceapă meciul.

#### `player_input`
Trimite input de la jucător (săritură, ghemuit).
```typescript
{
  playerId: string,
  timestamp: number,
  action: 'jump' | 'duck',
  sequenceNumber: number
}
```

### Server → Client Events

#### `authenticated`
Confirmare de autentificare reușită.
```typescript
{
  playerId: string,
  matchId: string,
  matchState: MatchState,
  players: Array<{id: string, state: PlayerState}>
}
```

#### `player_joined` / `player_left`
Notificare când un jucător se alătură sau părăsește meciul.

#### `match_starting`
Meciul începe.
```typescript
{
  matchId: string,
  startTime: number,
  config: GameConfig
}
```

#### `game_update`
Snapshot periodic al stării jocului (60 FPS).
```typescript
{
  timestamp: number,
  tick: number,
  players: Array<PlayerSnapshot>,
  obstacles: Array<ObstacleSnapshot>
}
```

#### `match_ended`
Meciul s-a terminat cu rezultate.
```typescript
{
  matchId: string,
  winnerId: string | null,
  players: Array<{
    playerId: string,
    score: number,
    ranking: number,
    winnings: number
  }>
}
```

## Integrare cu Platforma de Gambling

Backend-ul comunică cu platforma de gambling prin:

1. **Verificare token** - Validează session token-urile primite de la clienți
2. **Callback HTTP** - Trimite rezultatele meciurilor la `PLATFORM_CALLBACK_URL`
3. **Notificări disconnect** - Informează platforma despre deconectări

### Format Callback

```typescript
POST /api/game-results
Content-Type: application/json
X-API-Key: <PLATFORM_API_KEY>

{
  type: 'match_result',
  data: {
    matchId: string,
    winnerId: string,
    players: [...],
    startTime: number,
    endTime: number
  },
  timestamp: number
}
```

## Dezvoltare

### Adăugare Funcționalități Noi

1. **Model nou** - Adăugați în `src/models/`
2. **Service nou** - Adăugați în `src/services/`
3. **Event Socket.IO nou** - Adăugați în `src/handlers/SocketHandler.ts`
4. **Tipuri noi** - Adăugați în `src/types/index.ts`

### Debugging

Serverul loghează în consolă:
- Conexiuni/deconexiuni de clienți
- Creare/ștergere meciuri
- Evenimente importante din joc

## Securitate

- ✅ Token-urile sunt verificate cu platforma
- ✅ Input-urile jucătorilor sunt validate
- ✅ Sequence numbers previne replay attacks
- ⚠️ Implementați rate limiting în producție
- ⚠️ Folosiți HTTPS/WSS în producție

## Scalabilitate

Pentru scalare orizontală:
1. Folosiți Redis Adapter pentru Socket.IO
2. Shared state între servere (Redis/Database)
3. Session affinity la load balancer
4. Considerați message queue (RabbitMQ/Kafka) pentru platform callbacks

## Licență

ISC
