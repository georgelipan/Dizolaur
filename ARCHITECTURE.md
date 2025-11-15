# 🏗️ Arhitectura Aplicației - Dizolaur Multiplayer Game

## 📊 Vizualizare Generală

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENDER.COM CLOUD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────┐        ┌─────────────────────────┐  │
│  │   FRONTEND (UI)        │        │    BACKEND (Server)     │  │
│  │   Static Site          │◄──────►│    Web Service          │  │
│  │                        │  WSS   │                         │  │
│  │  • Phaser 3            │        │  • Node.js              │  │
│  │  • Socket.IO Client    │        │  • Socket.IO Server     │  │
│  │  • TypeScript          │        │  • TypeScript           │  │
│  │                        │        │  • Game Logic           │  │
│  │  Port: 443 (HTTPS)     │        │  Port: 10000            │  │
│  └────────────────────────┘        └─────────────────────────┘  │
│           │                                    │                 │
│           │ URL:                               │ URL:            │
│           │ dizolaur-frontend                  │ dizolaur-backend│
│           │ .onrender.com                      │ .onrender.com   │
│           │                                    │                 │
└───────────┼────────────────────────────────────┼─────────────────┘
            │                                    │
            ▼                                    ▼
     ┌──────────────┐                    ┌──────────────┐
     │   Players    │                    │  Game State  │
     │   (Browsers) │                    │  Management  │
     └──────────────┘                    └──────────────┘
```

## 🔄 Flow de Comunicare

### 1. Player se conectează

```
Player Browser
    │
    ├─► Opens: https://dizolaur-frontend.onrender.com
    │
    ├─► Frontend loads (HTML + JS)
    │
    ├─► NetworkService reads VITE_BACKEND_URL
    │   from environment (.env compiled into build)
    │
    ├─► Connects to: https://dizolaur-backend.onrender.com
    │   via WebSocket Secure (WSS)
    │
    └─► Backend validates CORS origin
        └─► Connection established ✅
```

### 2. Authentication & Game Flow

```
Frontend (Phaser)                    Backend (Node.js)
    │                                      │
    ├──► emit('authenticate', token) ─────►│
    │                                      ├─► Validate token
    │◄──── emit('authenticated', data) ────┤
    │                                      │
    ├──► emit('player_ready') ────────────►│
    │                                      ├─► Add to match queue
    │◄──── emit('match_starting') ─────────┤
    │                                      │
    ├──── Game Loop ──────────────────────►│
    │                                      │
    │     emit('player_input', {jump})     │
    │──────────────────────────────────────►│
    │                                      ├─► Process physics
    │                                      ├─► Check collisions
    │                                      ├─► Update game state
    │                                      │
    │◄─── emit('game_update', snapshot) ───┤
    │                                      │
    │     Render game state                │
    │                                      │
    │◄──── emit('match_ended', results)────┤
    │                                      │
    │     Show results screen              │
    │                                      │
```

## 🗂️ Structura Directorii

```
Dizolaur/
├── backend/                    # Backend Service
│   ├── src/
│   │   ├── server.ts          # Entry point
│   │   ├── config/            # Environment config
│   │   │   └── index.ts       # Reads .env vars
│   │   ├── handlers/          # Socket event handlers
│   │   ├── services/          # Game logic
│   │   │   ├── MatchManager.ts
│   │   │   └── PlatformIntegration.ts
│   │   ├── models/            # Data models
│   │   └── types/             # TypeScript types
│   ├── package.json           # Dependencies + engines
│   ├── tsconfig.json
│   └── .env                   # Local env vars (gitignored)
│
├── ui/                        # Frontend Static Site
│   ├── src/
│   │   ├── main.ts           # Entry point
│   │   ├── config/           # Environment config
│   │   │   └── index.ts      # Reads VITE_* vars
│   │   ├── scenes/           # Phaser game scenes
│   │   │   ├── BootScene.ts
│   │   │   ├── WaitingScene.ts
│   │   │   ├── GameScene.ts
│   │   │   └── ResultsScene.ts
│   │   ├── services/         # Client services
│   │   │   ├── NetworkService.ts  # Socket.IO client
│   │   │   └── GameSession.ts
│   │   ├── types/            # TypeScript types
│   │   └── utils/
│   ├── index.html
│   ├── package.json          # Dependencies + engines
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env                  # Local env vars (gitignored)
│
├── render.yaml               # Render.com blueprint
├── RENDER_DEPLOY.md         # Deployment guide
├── DEPLOY_CHECKLIST.md      # Quick checklist
└── README.md                # Main documentation
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=10000                                    # Render default
HOST=0.0.0.0                                  # Accept all IPs
CORS_ORIGINS=https://dizolaur-frontend.onrender.com  # Frontend URL
MAX_PLAYERS=4
GRAVITY=800
JUMP_VELOCITY=400
DINO_SPEED=200
OBSTACLE_SPAWN_RATE=2000
TICK_RATE=16
```

**Citit de**: `backend/src/config/index.ts`
**Folosit în**: `server.ts`, `MatchManager.ts`, Socket.IO CORS

### Frontend (.env)
```env
VITE_BACKEND_URL=https://dizolaur-backend.onrender.com  # Backend URL
VITE_DEBUG_MODE=false
```

**Citit de**: `ui/src/config/index.ts`
**Folosit în**: `NetworkService.ts` (pentru Socket.IO connection)
**Compiled în**: Build-ul final (variabilele sunt embedded în JS)

## 🌐 Networking

### Local Development
```
Frontend: http://localhost:5173
Backend:  http://localhost:3000
Protocol: HTTP + WS (WebSocket)
```

### Production (Render.com)
```
Frontend: https://dizolaur-frontend.onrender.com
Backend:  https://dizolaur-backend.onrender.com
Protocol: HTTPS + WSS (WebSocket Secure)
```

### CORS Configuration

**Backend permite conexiuni doar de la:**
- URL-ul setat în `CORS_ORIGINS`
- Verificat la nivel de Socket.IO

**Security:**
- Nu permite wildcard (`*`) în production
- Verifică origin pentru fiecare conexiune
- Headers personalizate pentru caching

## 📦 Deployment Pipeline

```
Developer
    │
    ├─► git add .
    ├─► git commit -m "..."
    └─► git push origin main
            │
            ▼
        GitHub Repository
            │
            ├──────────────┬──────────────┐
            ▼              ▼              ▼
    Render detects    Render detects    (Optional)
    changes in        changes in        Manual
    /backend          /ui               Deploy
            │              │
            ▼              ▼
    npm install       npm install
    npm run build     npm run build
            │              │
            ▼              ▼
    Start service     Publish to CDN
    (Always running)  (Static files)
            │              │
            └──────┬───────┘
                   ▼
            Services Live! 🚀
```

## 🔄 Auto-Deploy

Render.com detectează automat:
- Push pe branch-ul `main`
- Modificări în `/backend` → Re-deploy backend
- Modificări în `/ui` → Re-build și re-publish frontend
- Environment variables changes → Re-deploy serviciul afectat

## 💾 Data Flow

### Input Processing
```
Player presses SPACE
    │
    ▼
Frontend: KeyboardHandler detects
    │
    ▼
NetworkService.sendInput({jump: true, timestamp: ...})
    │
    ▼
Socket.IO emit('player_input')
    │
    ───── Network (WSS) ─────►
    │
    ▼
Backend: SocketHandler receives
    │
    ▼
MatchManager.processInput()
    │
    ▼
Physics engine (update player velocity)
    │
    ▼
Collision detection
    │
    ▼
Update game state
```

### State Synchronization
```
Backend Game Loop (every 16ms)
    │
    ├─► Update all players
    ├─► Update obstacles
    ├─► Check collisions
    ├─► Calculate scores
    │
    ▼
Create GameSnapshot
    │
    ▼
Socket.IO broadcast('game_update', snapshot)
    │
    ───── Network (WSS) ─────►
    │
    ▼
Frontend receives snapshot
    │
    ▼
GameScene.handleUpdate()
    │
    ▼
Update Phaser sprites positions
    │
    ▼
Render frame
```

## 🎯 Scalability

### Current Architecture
- **Single Backend Instance**: Handles all games
- **Static Frontend**: Served via CDN
- **WebSocket**: One persistent connection per player

### Potential Improvements
- **Load Balancer**: Multiple backend instances
- **Redis**: Shared state between instances
- **Room-based Routing**: Route players to specific servers
- **Database**: Persistent user data & stats

## 🔒 Security

### CORS Protection
- Whitelist specific origins
- No wildcard in production

### WebSocket Security
- WSS (encrypted) in production
- Token-based authentication
- Input validation

### Environment Variables
- Secrets not in code
- Different configs per environment
- `.env` files gitignored

## 📊 Monitoring

**Render Dashboard provides:**
- Real-time logs
- CPU/Memory usage
- Request metrics
- Error tracking
- Deploy history

**Access logs:**
Dashboard → Service → Logs (live tail)

---

## 🚀 Performance

### Free Tier Limitations
- **Cold Starts**: 30-60s after inactivity
- **Shared CPU**: Performance varies
- **Limited RAM**: 512MB

### Optimization Strategies
- Minimize bundle size (code splitting)
- Lazy load assets
- Compress static files
- Use CDN for assets
- Optimize game loop (fixed tick rate)

---

**Pentru deployment**: Vezi `RENDER_DEPLOY.md` și `DEPLOY_CHECKLIST.md`
