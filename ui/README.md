# Multiplayer Dino Game - Frontend UI

Frontend pentru jocul multiplayer tip "Chrome Dino" construit cu Phaser 3, TypeScript și Socket.IO.

## Tehnologii

- **Phaser 3** - Game engine pentru 2D games
- **TypeScript** - Type safety și development experience
- **Socket.IO Client** - Real-time comunicare cu serverul
- **Vite** - Build tool rapid și modern

## Structura Proiectului

```
ui/
├── src/
│   ├── scenes/
│   │   ├── BootScene.ts        # Inițializare și autentificare
│   │   ├── WaitingScene.ts     # Așteptare jucători
│   │   ├── GameScene.ts        # Jocul principal
│   │   └── ResultsScene.ts     # Afișare rezultate
│   ├── services/
│   │   ├── NetworkService.ts   # Socket.IO wrapper
│   │   ├── GameSession.ts      # State management
│   │   └── InputBuffer.ts      # Client-side prediction
│   ├── utils/
│   │   ├── PlayerSprite.ts     # Player game object
│   │   └── ObstacleSprite.ts   # Obstacle game object
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   └── main.ts                # Entry point
├── public/
│   └── assets/                # Game assets (imagini, sunete)
├── index.html
├── package.json
└── vite.config.ts
```

## Instalare

```bash
npm install
```

## Rulare

### Development Mode

```bash
npm run dev
```

Aplicația va porni pe `http://localhost:5173`

### Build pentru Production

```bash
npm run build
```

Output-ul va fi generat în folderul `dist/`.

### Preview Production Build

```bash
npm run preview
```

## Cum Funcționează

### 1. Autentificare

La pornire, aplicația:
- Preia token-ul din URL query params (`?token=...`)
- Se conectează la serverul de joc (WebSocket)
- Trimite token-ul pentru autentificare
- Primește `playerId` și `matchId` de la server

### 2. Lobby (Waiting Scene)

- Afișează informații despre match și bet
- Afișează numărul de jucători conectați
- Buton "READY" pentru a semnala că ești pregătit
- Meciul începe când toți jucătorii sunt ready (minim 2)

### 3. Game Scene

- Redare joc în timp real (60 FPS)
- Control: **SPACE** sau **↑** pentru săritură
- Control: **↓** pentru ghemuit
- Sincronizare cu serverul prin Socket.IO
- Serverul este autoritar (controlează fizica și coliziunile)

### 4. Results Scene

- Afișează clasamentul final
- Afișează câștigurile fiecărui jucător
- Buton "Play Again" pentru un nou meci

## Configurare

### URL Parameters

- `token` - Token de autentificare de la platforma de gambling
- `bet` - Suma pariată (opțional, default: 10)
- `currency` - Moneda (opțional, default: USD)

Exemplu:
```
http://localhost:5173?token=abc123&bet=50&currency=EUR
```

### Server URL

Server URL-ul este configurat în `src/services/NetworkService.ts`:
```typescript
constructor(serverUrl: string = 'http://localhost:3000')
```

Pentru producție, schimbă cu URL-ul real al serverului.

## Features

### ✅ Implementate

- ✅ Conectare WebSocket la server
- ✅ Autentificare cu token
- ✅ Multiplayer lobby
- ✅ Real-time game synchronization
- ✅ Client-side input buffering
- ✅ Visual feedback pentru jucători și obstacole
- ✅ Score tracking
- ✅ Match results display
- ✅ Responsive design

### 🔜 De Implementat (Opțional)

- ⏳ Client-side prediction și reconciliation (full)
- ⏳ Sprite animations și particle effects
- ⏳ Sound effects și muzică
- ⏳ Mobile touch controls
- ⏳ Reconnection handling

## Development

### Type Checking

```bash
npm run typecheck
```

### Hot Module Replacement

Vite oferă HMR automat în development mode. Modificările se reflectă instant în browser.

## Debugging

Game instance este expus global pentru debugging:

```javascript
// În browser console
window.game.scene.getScenes() // Vezi toate scene-urile
window.game.registry.get('gameSession') // Vezi session data
window.game.registry.get('networkService') // Vezi network service
```

## Browser Support

- Chrome/Edge (recomandat)
- Firefox
- Safari
- Orice browser modern cu suport WebGL și WebSocket

## Licență

ISC
