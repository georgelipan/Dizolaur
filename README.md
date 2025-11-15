# 🦖 Multiplayer Dino Game - Full Stack

Joc multiplayer skill-based tip "Chrome Dino" cu integrare pentru platforme de gambling. Arhitectură client-server cu comunicare în timp real.

## 📋 Arhitectură

### Backend (Node.js + TypeScript + Socket.IO)
- **Autoritar**: Serverul controlează toată fizica, coliziunile și scorul
- **Real-time**: Socket.IO pentru sincronizare multiplayer
- **Scalabil**: Design pentru multiple instanțe de server
- **Integrare gambling**: API pentru platforme externe

### Frontend (Phaser 3 + TypeScript + Socket.IO Client)
- **Game Engine**: Phaser 3 pentru rendering 2D
- **Real-time sync**: Socket.IO pentru comunicare cu serverul
- **Client-side prediction**: Input buffering pentru latență redusă
- **Responsive**: Funcționează pe desktop și mobile

## 🚀 Quick Start - Rulare Locală

### Prerequisite
- Node.js v18+ (LTS)
- npm v9+

### Pașii pentru Rulare Completă

#### 1. Pornește Backend-ul (Server)

```bash
# Terminal 1 - Backend
cd backend

# Instalează dependențele (dacă nu s-a făcut deja)
npm install

# Build TypeScript
npm run build

# Pornește serverul
npm start
```

✅ Serverul va porni pe `http://localhost:3000`

Vei vedea:
```
🦖 Dino Game Server starting...
📝 Configuration loaded
   - Port: 3000
   - Max Players: 4
   - Tick Rate: 16ms
🔌 Socket.IO initialized
⚙️  Services initialized
🎮 Socket handlers registered
🔄 Game loop started

🚀 Server running on 0.0.0.0:3000
   Socket.IO endpoint: ws://0.0.0.0:3000

✅ Ready to accept connections!
```

#### 2. Pornește Frontend-ul (Client)

```bash
# Terminal 2 - Frontend
cd ui

# Instalează dependențele (dacă nu s-a făcut deja)
npm install

# Pornește development server
npm run dev
```

✅ UI-ul va porni pe `http://localhost:5173`

Browser-ul se va deschide automat cu jocul.

#### 3. Testare Multiplayer

Pentru a testa multiplayer local, deschide **2-4 tab-uri** în browser:

1. **Tab 1**: `http://localhost:5173`
2. **Tab 2**: `http://localhost:5173`
3. **Tab 3** (opțional): `http://localhost:5173`
4. **Tab 4** (opțional): `http://localhost:5173`

În fiecare tab:
1. Jocul se va conecta automat la server
2. Apasă butonul **READY**
3. Când toți jucătorii (minim 2) sunt ready, meciul începe!
4. Controlează dino-ul cu **SPACE** sau **↑** (săritură)

### 🎮 Controale

- **SPACE** sau **↑ (Up Arrow)**: Sari
- **↓ (Down Arrow)**: Ghemuit (duck) - în timpul săriturii

### 🎯 Regulile Jocului

1. **Obiectiv**: Evită obstacolele cât mai mult timp posibil
2. **Obstacole**: Cactuși (jos) și păsări (sus)
3. **Scor**: Crește automat în timp + bonus pentru obstacole evitate
4. **Eliminare**: Lovirea unui obstacol te elimină
5. **Câștigător**: Ultimul jucător rămas sau cel cu cel mai mare scor

## 📂 Structura Proiectului

```
Dizolaur/
├── backend/                 # Server-ul de joc
│   ├── src/
│   │   ├── config/         # Configurare
│   │   ├── handlers/       # Socket.IO handlers
│   │   ├── models/         # Player, Match, Obstacle
│   │   ├── services/       # MatchManager, PhysicsEngine
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Helper functions
│   │   └── server.ts       # Entry point
│   ├── dist/               # Build output
│   ├── package.json
│   └── tsconfig.json
│
├── ui/                     # Frontend-ul jocului
│   ├── src/
│   │   ├── scenes/         # Phaser scenes
│   │   ├── services/       # Network, Session
│   │   ├── utils/          # Game objects
│   │   ├── types/          # TypeScript types
│   │   └── main.ts         # Entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── README.md              # Acest fișier
```

## 🔧 Configurare Avansată

### Backend - Variabile de Mediu

Creează fișier `.env` în folderul `backend/`:

```env
# Server
PORT=3000
HOST=0.0.0.0

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Platform Integration
PLATFORM_CALLBACK_URL=https://your-platform.com/api/results
PLATFORM_API_KEY=your-secret-key

# Game Config
MAX_PLAYERS=4
GRAVITY=800
JUMP_VELOCITY=400
DINO_SPEED=200
OBSTACLE_SPAWN_RATE=2000
TICK_RATE=16
```

### Frontend - URL Parameters

Jocul acceptă parametri din URL:

```
http://localhost:5173?token=abc123&bet=50&currency=EUR
```

- `token`: Token de autentificare (obligatoriu în producție)
- `bet`: Suma pariată (default: 10)
- `currency`: Moneda (default: USD)

## 🧪 Development

### Backend Development

```bash
cd backend

# Watch mode (recompilare automată)
npm run watch

# În alt terminal
npm start
```

### Frontend Development

```bash
cd ui

# Development mode cu hot reload
npm run dev
```

### Build pentru Producție

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd ui
npm run build
npm run preview
```

## 🐛 Debugging

### Backend Logs

Serverul loghează în consolă:
- Conexiuni/deconexiuni clienți
- Creare/ștergere meciuri
- Evenimente importante

### Frontend Debug

Deschide Developer Console (F12):

```javascript
// Vezi game instance
window.game

// Vezi toate scene-urile
window.game.scene.getScenes()

// Vezi session data
window.game.registry.get('gameSession')

// Vezi network service
window.game.registry.get('networkService')
```

## 🔌 Socket.IO Protocol

### Client → Server

- `authenticate`: `{ token: string }`
- `player_ready`: (no data)
- `player_input`: `{ playerId, timestamp, action, sequenceNumber }`

### Server → Client

- `authenticated`: `{ playerId, matchId, matchState, players }`
- `player_joined/left`: `{ playerId, playerCount }`
- `match_starting`: `{ matchId, startTime, config }`
- `game_update`: `{ timestamp, tick, players[], obstacles[] }` (60 FPS)
- `match_ended`: `{ matchId, winnerId, players[], winnings }`

## 📊 Arhitectura Tehnică

### Backend Stack
- Runtime: Node.js
- Language: TypeScript
- Transport: Socket.IO (WebSocket)
- Persistence: In-memory
- Architecture: Authoritative server

### Frontend Stack
- Game Engine: Phaser 3
- Language: TypeScript
- Networking: Socket.IO Client
- Build Tool: Vite
- Bundler: Rollup (via Vite)

## 🎨 Features

### ✅ Implementate

- ✅ Autentificare cu token
- ✅ Multiplayer lobby (2-4 jucători)
- ✅ Real-time game synchronization
- ✅ Authoritative server (anti-cheat)
- ✅ Collision detection
- ✅ Score tracking
- ✅ Match results și winnings calculation
- ✅ Reconnection handling
- ✅ Multiple simultaneous matches

### 🔜 Viitor (Opțional)

- ⏳ Sprite animations și assets grafice
- ⏳ Sound effects și muzică
- ⏳ Power-ups și items
- ⏳ Different game modes
- ⏳ Leaderboards
- ⏳ Replay system
- ⏳ Mobile touch controls optimizați
- ⏳ Full client-side prediction și reconciliation

## 🤝 Integrare cu Platforma de Gambling

### Flow de Integrare

1. **Platform** generează token JWT/HMAC cu:
   - User ID
   - Bet amount
   - Currency
   - Expiration

2. **Platform** deschide iframe cu:
   ```html
   <iframe src="https://game.example.com?token=...&bet=50&currency=USD"></iframe>
   ```

3. **Game** autentifică tokenul cu backend-ul
4. **Backend** validează tokenul cu platforma
5. **Game** rulează meciul
6. **Backend** trimite rezultatele la platform via HTTP callback

### Callback Format

```json
POST /api/game-results
{
  "type": "match_result",
  "data": {
    "matchId": "match_123",
    "players": [{
      "platformUserId": "user_456",
      "winnings": 95.00,
      "ranking": 1
    }]
  }
}
```

## 📝 Licență

ISC

## 🆘 Troubleshooting

### "Connection failed" în UI

✅ Verifică că backend-ul rulează pe `http://localhost:3000`
✅ Verifică console-ul pentru erori CORS
✅ Verifică că portul 3000 nu este blocat de firewall

### "Authentication failed"

✅ Backend-ul are o verificare mock - ar trebui să funcționeze
✅ Verifică console-ul backend pentru erori

### Jocul nu pornește când toți sunt "READY"

✅ Trebuie minim **2 jucători** ready
✅ Verifică logs în backend pentru erori

### Performance issues

✅ Închide tab-uri nefolosite
✅ Verifică CPU/memory usage
✅ Reduce tick rate în configurare

---

**Enjoy the game! 🦖🎮**
