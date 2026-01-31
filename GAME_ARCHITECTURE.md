# 🦖 DIZOLAUR - Multiplayer Dino Game Architecture

## 📊 OVERVIEW

**Dizolaur** este un joc multiplayer skill-based inspirat de celebrul "Chrome Dino", construit cu o arhitectură client-server autoritativă și sincronizare în timp real. Proiectul este optimizat pentru integrare cu platforme de gambling și suportă până la 4 jucători simultan.

### **Stack Tehnologic**
- **Backend**: Node.js + TypeScript + Socket.IO
- **Frontend**: Phaser 3 + TypeScript + Socket.IO Client
- **Deployment**: Render.com (servicii separate)
- **Real-time Communication**: WebSocket (Socket.IO)

---

## 🏗️ ARHITECTURA SISTEM

### **1. BACKEND (Server Authoritative)**

Backend-ul este responsabil pentru toată logica de joc, fizică și validare, eliminând posibilitatea de cheat.

#### **Structura Directorii**
```
backend/src/
├── server.ts              # Entry point, inițializare HTTP + Socket.IO
├── config/
│   └── index.ts          # Configurare (PORT, CORS, game settings)
├── handlers/
│   └── SocketHandler.ts  # Gestionează toate eventurile Socket.IO
├── models/
│   ├── Match.ts          # Model pentru meci (state machine)
│   ├── Player.ts         # Model pentru jucător (state, physics)
│   └── Obstacle.ts       # Model pentru obstacole (cactus, bird)
├── services/
│   ├── MatchManager.ts          # Matchmaking și lifecycle meciuri
│   ├── PhysicsEngine.ts         # Engine fizică server-side
│   ├── CollisionDetector.ts     # Detecție coliziuni (AABB)
│   └── PlatformIntegration.ts   # Integrare cu gambling platform
├── types/
│   └── index.ts          # TypeScript interfaces și enums
└── utils/
    ├── auth.ts           # Autentificare și validare token
    ├── hash.ts           # Hashing pentru security
    └── timestep.ts       # Fixed timestep pentru physics
```

#### **Componente Principale**

##### **server.ts - Inima Serverului**
```typescript
Responsabilități:
- Inițializare HTTP server cu health check endpoint
- Configurare Socket.IO cu CORS pentru frontend separat
- Creeare și pornire game loop global (16ms tick = ~60 FPS)
- Graceful shutdown pentru SIGTERM/SIGINT
- Logging și monitorizare

Configurație:
- Port: 10000 (Render) / 3000 (local)
- Host: 0.0.0.0 (acceptă toate conexiunile)
- Ping interval: 25s, timeout: 60s
```

##### **MatchManager.ts - Orchestrator de Meciuri**
```typescript
Funcții Principale:
- createMatch(): Creează meci nou cu config custom
- findOrCreateMatch(): Matchmaking automat (caută WAITING sau creează nou)
- addPlayerToMatch(): Adaugă player sau reconectează
- removePlayerFromMatch(): Șterge player și cleanup
- startMatch(): Pornește meciul când toți sunt READY
- updateAllMatches(): Rulează physics pentru toate meciurile active

State Management:
- matches: Map<matchId, Match>
- playerToMatch: Map<playerId, matchId>
- Cleanup automat: meciuri goale (WAITING) sau vechi (FINISHED)

Reconnection Logic:
- Verifică dacă playerul există deja în meci
- Update socket ID fără a pierde progresul
- Previne duplicate players în meciuri diferite
```

##### **SocketHandler.ts - Comunicare Real-time**
```typescript
Evenimente Primite de la Client:
- authenticate { token }          → Verifică token, join match
- player_ready                    → Marchează player ca ready
- player_input { action, seq }    → Procesează jump/duck

Evenimente Emise către Client:
- authenticated { playerId, matchId, players }
- player_joined { playerId, playerCount }
- player_left { playerId, playerCount, matchState }
- player_ready { playerId }
- match_starting { matchId, startTime, config }
- game_update { timestamp, tick, players[], obstacles[] }
- match_ended { matchId, winnerId, players[], rankings }
- match_cancelled { reason, playerCount }

Security:
- Validare token pentru fiecare conexiune
- Socket ID tracking pentru anti-duplicate
- Cleanup old sockets la reconnection
```

##### **Match.ts - State Machine pentru Meci**
```typescript
States (MatchState enum):
WAITING       → Lobby, așteaptă jucători
IN_PROGRESS   → Joc activ, physics rulează
FINISHED      → Meci terminat, calculare rezultate

Logică Principale:
- canStart(): Min 2 playeri READY, nu DISCONNECTED
- start(): Inițializează toți playerii la poziții start
- update(deltaTime): Actualizează physics, verifică end condition
- spawnObstacle(): Generează cactus sau bird random
- checkMatchEnd(): Termină când ≤1 player PLAYING
- end(): Marchează FINISHED, oprește spawning

Configurație Meci:
- maxPlayers: 4
- gravity: 800 px/s²
- jumpVelocity: 400 px/s
- dinoSpeed: 200 px/s
- obstacleSpawnRate: 2000ms
- tickRate: 16ms (~60 FPS)
```

##### **Player.ts - Model Jucător**
```typescript
States (PlayerState enum):
CONNECTED     → Conectat, nu e ready
READY         → Gata să înceapă
PLAYING       → În joc activ
ELIMINATED    → Lovit de obstacol
DISCONNECTED  → Deconectat (reconnection posibilă)

Proprietăți Fizice:
- position: { x, y }
- velocity: { x, y }
- isGrounded: boolean
- score: number

Acțiuni:
- jump(velocity): Sări dacă grounded && PLAYING
- duck(): Fast-fall în aer (2x gravity)
- updatePosition(deltaTime, gravity): Aplică physics
- incrementScore(points): Adaugă puncte
- eliminate(): Marchează ELIMINATED

Reconnection:
- updateSocketId(): Update socket + reconnect dacă DISCONNECTED
```

##### **PhysicsEngine.ts - Server-Authoritative Physics**
```typescript
Principii:
- Toată fizica rulează pe server (anti-cheat)
- Client trimite doar input-uri (jump/duck)
- Server calculează poziții, coliziuni, scor

Proces:
1. processPlayerInput(match, input):
   - Validare sequenceNumber (anti-replay)
   - Execute action (jump/duck)
   
2. updateMatch(match):
   - match.update() → Physics pentru toți playerii
   - Collision detection pentru fiecare player vs obstacles
   - Eliminate player la coliziune
   - +10 score pentru obstacol depășit

Collision Detection (AABB):
- Player hitbox: 24x24 px
- Obstacle hitbox: variabil (cactus/bird)
- checkObstaclePassed(): Bonus când x_player > x_obstacle
```

##### **PlatformIntegration.ts - Gambling Platform API**
```typescript
Funcții:
- verifySession(token): Verifică token-ul de la platform
- sendMatchResult(result): Trimite rezultate pentru payout
- notifyPlayerDisconnect(): Anunță platform de disconnect

Mock Implementation (Development):
- Generează playerId automat (test-player-xxx)
- Returnează betData dummy
- Log-uri pentru debugging
```

---

### **2. FRONTEND (Phaser 3 Client)**

Frontend-ul este un client "thin" care doar randează și trimite input-uri, fără logică de joc.

#### **Structura Directorii**
```
ui/src/
├── main.ts                # Entry point, configurare Phaser
├── config/
│   └── index.ts          # VITE_BACKEND_URL din env vars
├── scenes/
│   ├── BootScene.ts      # Preload assets, conectare la server
│   ├── WaitingScene.ts   # Lobby UI, Ready button
│   ├── GameScene.ts      # Gameplay activ, input handling
│   └── ResultsScene.ts   # Match results, leaderboard
├── services/
│   ├── NetworkService.ts # Socket.IO client wrapper
│   ├── GameSession.ts    # Session state singleton
│   └── InputBuffer.ts    # Input buffering cu sequence numbers
├── utils/
│   ├── PlayerSprite.ts   # Sprite + animații pentru players
│   └── ObstacleSprite.ts # Sprite pentru obstacles
└── types/
    └── index.ts          # TypeScript types (match backend)
```

#### **Componente Principale**

##### **main.ts - Configurare Phaser**
```typescript
Game Config:
- Canvas: 800x600 px
- Physics: Arcade (gravity: 0 - controlat de server)
- Scale: FIT mode, centered
- Background: #87CEEB (sky blue)

Scene Flow:
BootScene → WaitingScene → GameScene → ResultsScene

Global Registry:
- networkService: NetworkService instance
- gameSession: GameSession instance
```

##### **NetworkService.ts - Abstracție Socket.IO**
```typescript
Metodă Publică:
- connect(): Promise<void>           → Conectare la backend
- authenticate(token): void          → Emit authenticate event
- setPlayerReady(): void             → Emit player_ready
- sendInput(input): void             → Emit player_input
- disconnect(): void                 → Cleanup conexiune

Event System:
- on<T>(event, callback): void       → Subscribe la evenimente
- off(event, callback): void         → Unsubscribe
- Internal emit pentru dispatch

Configuration:
- Transport: WebSocket only (mai rapid)
- Reconnection: 5 attempts, 1s delay
- serverUrl: window.location.origin (production) sau localhost (dev)
```

##### **GameSession.ts - State Manager (Singleton)**
```typescript
Responsabilități:
- Stochează session data (token, playerId, matchId)
- Bet information (amount, currency)
- Match state tracking (WAITING, IN_PROGRESS, etc.)
- Player count pentru UI updates

Source:
- Token din URL query param (?token=xxx&bet=10&currency=USD)
- Fallback: demo-token-{timestamp} pentru testing

Usage:
const session = GameSession.getInstance();
session.getPlayerId() // "test-player-12345"
```

##### **Scene Flow Detaliat**

**1. BootScene - Initialization**
```typescript
Responsabilități:
- Preload sprites și assets (dino, cactus, bird, ground)
- Conectare la backend via NetworkService
- Autentificare cu token
- Așteptare răspuns authenticated

Evenimente Ascultate:
- authenticated → Salvează playerId/matchId, goto WaitingScene
- auth_error → Alert + retry

Assets:
- player.png (spritesheet 24x24)
- cactus.png, bird.png
- ground.png (tiling)
```

**2. WaitingScene - Lobby**
```typescript
UI Elements:
- Titlu: "Multiplayer Dino Game"
- Match ID (truncated)
- Bet info: "{amount} {currency}"
- Player count: "X/4 players"
- READY button (verde → gri când pressed)

Logică:
- Click READY → Emit player_ready → Button disabled
- Listen player_joined → Update count
- Listen player_left → Update count
- Listen player_ready → Show "{playerId} is ready"
- Listen match_starting → goto GameScene

State Management:
- Track isReady flag (prevent double-click)
- Visual feedback (hover effects)
```

**3. GameScene - Active Gameplay**
```typescript
Rendering:
- Ground (y=500)
- Playerii: PlayerSprite (dino animat)
- Obstacles: ObstacleSprite (cactus/bird)
- UI: Score, Match ID, Instructions

Input Handling:
- SPACE/UP Arrow → handleJumpInput()
- DOWN Arrow → handleDuckInput()
- Input → InputBuffer.addInput() → NetworkService.sendInput()

Update Loop:
- Listen game_update @ 60 FPS
- Update player sprites (position, animation)
- Update obstacle sprites (position)
- Interpolation pentru smooth movement

End Condition:
- Listen match_ended → goto ResultsScene
```

**4. ResultsScene - Match Results**
```typescript
Display:
- Winner announcement
- Leaderboard (players sorted by score)
- Rankings: 1st, 2nd, 3rd, 4th
- Winnings pentru câștigător
- "Play Again" button

Data:
- MatchResult { winnerId, players[], startTime, endTime }
- Player info: score, ranking, winnings

Actions:
- "Play Again" → Reset session → goto BootScene
```

##### **InputBuffer.ts - Client-Side Prediction**
```typescript
Purpose:
- Anti-cheat via sequence numbers
- Buffer pentru reconnection
- Timestamp validation

Logic:
let sequenceNumber = 0;

addInput(playerId, action) {
  return {
    playerId,
    action,
    timestamp: Date.now(),
    sequenceNumber: ++sequenceNumber
  };
}

Server validation:
if (input.sequenceNumber <= player.lastInputSequence) {
  return; // Reject replay attack
}
```

---

## 🎮 FLOW COMPLET DE JOC

### **Phase 1: Connection & Matchmaking**
```
1. Player deschide UI (http://localhost:5173?token=demo-123)
   ↓
2. BootScene: NetworkService.connect()
   ↓
3. Socket.IO handshake cu backend
   ↓
4. Emit 'authenticate' { token: "demo-123" }
   ↓
5. Backend → PlatformIntegration.verifySession()
   - Mock: return { valid: true, playerId: "test-player-xxx" }
   ↓
6. Backend → MatchManager.findOrCreateMatch()
   - Search: meciuri în WAITING cu loc
   - Or create: nou meci (WAITING state)
   ↓
7. Backend → MatchManager.addPlayerToMatch()
   - Check: player deja în meci? (reconnection)
   - Create: new Player(session, socketId)
   - Add: match.addPlayer(player)
   - Track: playerToMatch.set(playerId, matchId)
   ↓
8. Backend emit 'authenticated' {
     playerId: "test-player-xxx",
     matchId: "match_0_1234567890",
     matchState: "WAITING",
     players: [{ id, state }]
   }
   ↓
9. UI → WaitingScene
```

### **Phase 2: Lobby & Ready Check**
```
10. WaitingScene display:
    - "Waiting for players... 1/4"
    - [READY] button
    ↓
11. Player click READY
    ↓
12. Emit 'player_ready'
    ↓
13. Backend → Player.setReady() (CONNECTED → READY)
    ↓
14. Backend broadcast 'player_ready' { playerId }
    ↓
15. All clients: Update UI "Player X is ready"
    ↓
16. Backend → Match.canStart() check:
    - players.size >= 2
    - All players in READY state
    - No DISCONNECTED players
    ↓
17. If TRUE → MatchManager.startMatch()
```

### **Phase 3: Match Start**
```
18. Match.start():
    - state = IN_PROGRESS
    - startTime = Date.now()
    - For each player:
      * player.startPlaying() (READY → PLAYING)
      * player.position = { x: 50, y: 0 }
      * player.velocity = { x: 0, y: 0 }
    ↓
19. MatchManager.startObstacleSpawning():
    - setInterval(spawnObstacle, 2000ms)
    ↓
20. Backend emit 'match_starting' {
      matchId,
      startTime,
      config: { gravity, jumpVelocity, ... }
    }
    ↓
21. All clients → GameScene
    ↓
22. Game loop starts:
    - setInterval(updateAllMatches, 16ms)
```

### **Phase 4: Active Gameplay**
```
23. Player presses SPACE
    ↓
24. GameScene.handleJumpInput():
    - input = InputBuffer.addInput('jump', seq++)
    - NetworkService.sendInput(input)
    ↓
25. Backend receives 'player_input' { playerId, action, seq, timestamp }
    ↓
26. PhysicsEngine.processPlayerInput():
    - Validate: seq > lastInputSequence
    - Update: player.lastInputSequence = seq
    - Execute: player.jump(jumpVelocity)
      * if (isGrounded && PLAYING)
      * velocity.y = 400
      * isGrounded = false
    ↓
27. Game Loop (every 16ms):
    PhysicsEngine.updateMatch(match)
    ↓
    Match.update(currentTime):
      - deltaTime = (now - lastTick) / 1000
      - For each player PLAYING:
        * player.updatePosition(deltaTime, gravity)
          - velocity.y -= gravity * deltaTime
          - position.y += velocity.y * deltaTime
          - if (position.y <= 0): isGrounded = true, velocity.y = 0
        * player.incrementScore(1) // +1 per tick
      
      - For each obstacle:
        * obstacle.update(deltaTime)
        * if (obstacle.isOffScreen()): delete
      
      - Match.checkMatchEnd():
        * activePlayers = count(players where state === PLAYING)
        * if (activePlayers <= 1): match.end()
    ↓
    For each player:
      For each obstacle:
        - CollisionDetector.checkCollision(player, obstacle)
          * AABB overlap detection
          * if (collision): player.eliminate() (PLAYING → ELIMINATED)
        
        - CollisionDetector.checkObstaclePassed(player, obstacle)
          * if (player.x > obstacle.x + width && !obstacle.passed):
            - obstacle.passed = true
            - player.incrementScore(10) // Bonus
    ↓
28. Backend emit 'game_update' {
      timestamp,
      tick,
      players: [{ playerId, position, velocity, state, score }],
      obstacles: [{ id, position, type, width, height }]
    }
    ↓
29. GameScene.handleGameUpdate(snapshot):
    - For each player in snapshot:
      * if (!sprite exists): create PlayerSprite
      * sprite.updatePosition(player.position)
      * sprite.updateAnimation(player.velocity)
      * scoreText.setText(player.score)
    
    - For each obstacle in snapshot:
      * if (!sprite exists): create ObstacleSprite
      * sprite.updatePosition(obstacle.position)
    
    - Remove sprites for missing players/obstacles
```

### **Phase 5: Match End**
```
30. Match.checkMatchEnd():
    - activePlayers <= 1
    ↓
31. Match.end():
    - state = FINISHED
    - endTime = Date.now()
    ↓
32. MatchManager.calculateMatchResult():
    - Sort players by score DESC
    - winner = players[0]
    - totalPot = sum(betData.stake)
    - winnings = winner ? totalPot * 0.95 : 0 // 5% house fee
    ↓
33. Backend emit 'match_ended' {
      matchId,
      winnerId,
      players: [{
        playerId,
        platformUserId,
        score,
        ranking,
        winnings
      }],
      startTime,
      endTime
    }
    ↓
34. PlatformIntegration.sendMatchResult(result)
    - POST to gambling platform API
    - Platform processes payouts
    ↓
35. All clients → ResultsScene
    - Display winner
    - Show leaderboard
    - Show winnings
    ↓
36. Cleanup (after 5 seconds):
    - MatchManager.cleanupMatch(matchId)
    - matches.delete(matchId)
    - For each player: playerToMatch.delete(playerId)
```

---

## 🔐 SECURITY & ANTI-CHEAT

### **1. Server-Authoritative Architecture**
```
✅ Physics: 100% server-side calculation
✅ Collision: Server validates all hits
✅ Score: Server increments, client displays
✅ Match State: Server controls all transitions
```

### **2. Input Validation**
```typescript
// Prevent replay attacks
if (input.sequenceNumber <= player.lastInputSequence) {
  console.warn('Replay attack detected');
  return; // Reject
}

// Validate timestamp (prevent time manipulation)
const timeDiff = Date.now() - input.timestamp;
if (timeDiff > 5000 || timeDiff < 0) {
  console.warn('Invalid timestamp');
  return;
}
```

### **3. Session Management**
```typescript
// Token verification
const sessionData = await platformIntegration.verifySession(token);
if (!sessionData.valid) {
  socket.emit('auth_error', { message: 'Invalid token' });
  socket.disconnect();
  return;
}

// Prevent duplicate connections
for (const [oldSocketId, playerId] of socketToPlayer.entries()) {
  if (playerId === player.id && oldSocketId !== socket.id) {
    socketToPlayer.delete(oldSocketId);
    console.log('Cleaned up old socket');
  }
}
```

### **4. Rate Limiting**
```typescript
// Socket.IO built-in
pingInterval: 25000,  // 25s between pings
pingTimeout: 60000,   // 60s timeout

// Input throttling (client-side)
const MIN_INPUT_INTERVAL = 50; // 50ms between inputs
```

---

## 🌐 DEPLOYMENT ARCHITECTURE

### **Render.com Setup**

```
┌───────────────────────────────────────┐
│  Internet (Players)                   │
└──────────────┬────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│ Static Site │  │ Web Service  │
│ (Frontend)  │  │ (Backend)    │
├─────────────┤  ├──────────────┤
│ Render CDN  │  │ Node.js      │
│ - Vite dist │  │ - Socket.IO  │
│ - Phaser 3  │  │ - Physics    │
│ - HTML/CSS  │  │ - Match Mgmt │
└──────┬──────┘  └──────┬───────┘
       │                │
       │  WebSocket     │
       └────────────────┘
```

### **render.yaml Configuration**

```yaml
services:
  # Backend - Web Service
  - type: web
    name: dizolaur-backend
    runtime: node
    region: frankfurt
    plan: free
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /
    envVars:
      - PORT: 10000
      - HOST: 0.0.0.0
      - CORS_ORIGINS: https://dizolaur-frontend.onrender.com
      - MAX_PLAYERS: 4
      - TICK_RATE: 16

  # Frontend - Static Site
  - type: web
    name: dizolaur-frontend
    env: static
    rootDir: ui
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - VITE_BACKEND_URL: https://dizolaur-backend.onrender.com
```

### **Environment Variables**

**Backend (.env):**
```bash
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
MAX_PLAYERS=4
GRAVITY=800
JUMP_VELOCITY=400
DINO_SPEED=200
OBSTACLE_SPAWN_RATE=2000
TICK_RATE=16
```

**Frontend (.env):**
```bash
VITE_BACKEND_URL=http://localhost:3000
VITE_DEBUG_MODE=false
```

---

## 📊 PERFORMANCE & SCALABILITY

### **Current Performance**
```
Tick Rate:          16ms (~60 FPS)
Obstacle Spawn:     2000ms (2s)
Socket Ping:        25s interval
Socket Timeout:     60s
Match Cleanup:      5s after finish

Network:
- Game Update Size: ~500 bytes per snapshot
- Bandwidth: ~30 KB/s per player (60 updates/s)
- Latency Tolerance: <200ms for good UX
```

### **Scalability Considerations**

**Current Limitations:**
- In-memory storage (Map<matchId, Match>)
- Single server instance
- No persistence layer

**Future Improvements:**
```typescript
// 1. Redis for distributed state
const redis = new Redis(process.env.REDIS_URL);
await redis.hset('matches', matchId, JSON.stringify(match));

// 2. Database for match history
await db.matchResults.insert({
  matchId,
  winnerId,
  players,
  timestamp
});

// 3. Load balancing with Socket.IO adapter
const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient)
});

// 4. Horizontal scaling
- Multiple backend instances
- Sticky sessions (same matchId → same server)
- Or: shared state in Redis
```

---

## 🐛 KNOWN ISSUES & FIXES

### **Recently Fixed:**
1. ✅ **Match.removePlayer()** - Acum șterge efectiv din Map în WAITING/FINISHED
2. ✅ **Duplicate players** - Previne player în 2 meciuri simultan
3. ✅ **Race conditions** - Cleanup old socket IDs la reconnect
4. ✅ **canStart() logic** - Exclude playeri DISCONNECTED
5. ✅ **Disconnect cleanup** - Proper cleanup în WAITING state

### **Potential Future Issues:**

**1. Latency Compensation**
```
Problem: High latency → delayed inputs → poor UX
Solution: Client-side prediction + server reconciliation
```

**2. Cheating via Network Manipulation**
```
Problem: Modified packets, timing attacks
Solution: 
- Encrypt WebSocket traffic (wss://)
- Server-side input validation
- Anomaly detection (sudden score jumps)
```

**3. Memory Leaks**
```
Problem: Zombie matches, orphaned players
Solution:
- Aggressive cleanup (implemented)
- Memory monitoring
- Automatic restart on high memory
```

---

## 🎯 TESTING GUIDE

### **Local Testing**

**1. Single Player (Development):**
```bash
# Terminal 1
cd backend
npm run build
npm start

# Terminal 2
cd ui
npm run dev

# Browser
http://localhost:5173?token=test-1
```

**2. Multiplayer (4 Players):**
```bash
# Open 4 browser tabs:
Tab 1: http://localhost:5173?token=player-1
Tab 2: http://localhost:5173?token=player-2
Tab 3: http://localhost:5173?token=player-3
Tab 4: http://localhost:5173?token=player-4

# In each tab: Click READY
# Match starts when all ready
```

**3. Reconnection Test:**
```bash
# Tab 1: Join match, click READY
# Close Tab 1
# Reopen: http://localhost:5173?token=player-1
# Should reconnect to same match
```

### **Production Testing (Render.com)**

**URLs:**
```
Frontend: https://dizolaur-frontend.onrender.com
Backend:  https://dizolaur-backend.onrender.com
Health:   https://dizolaur-backend.onrender.com/health
```

**Test Scenarios:**
1. **Cold Start**: First request → ~30s (free tier spin-up)
2. **Multiple Players**: Open in different devices/browsers
3. **Network Issues**: Disable WiFi → Enable → Should reconnect
4. **Concurrent Matches**: 8 players → Should create 2 matches

---

## 📚 API REFERENCE

### **Socket.IO Events**

#### **Client → Server**

**authenticate**
```typescript
socket.emit('authenticate', {
  token: string
});
```

**player_ready**
```typescript
socket.emit('player_ready');
```

**player_input**
```typescript
socket.emit('player_input', {
  playerId: string,
  action: 'jump' | 'duck',
  timestamp: number,
  sequenceNumber: number
});
```

#### **Server → Client**

**authenticated**
```typescript
socket.on('authenticated', (data: {
  playerId: string,
  matchId: string,
  matchState: MatchState,
  players: Array<{ id: string, state: PlayerState }>
}) => { ... });
```

**player_joined**
```typescript
socket.on('player_joined', (data: {
  playerId: string,
  playerCount: number
}) => { ... });
```

**player_left**
```typescript
socket.on('player_left', (data: {
  playerId: string,
  playerCount: number,
  matchState: MatchState
}) => { ... });
```

**match_starting**
```typescript
socket.on('match_starting', (data: {
  matchId: string,
  startTime: number,
  config: GameConfig
}) => { ... });
```

**game_update**
```typescript
socket.on('game_update', (snapshot: {
  timestamp: number,
  tick: number,
  players: Array<{
    playerId: string,
    position: { x: number, y: number },
    velocity: { x: number, y: number },
    state: PlayerState,
    score: number
  }>,
  obstacles: Array<{
    id: string,
    position: { x: number, y: number },
    type: 'cactus' | 'bird',
    width: number,
    height: number
  }>
}) => { ... });
```

**match_ended**
```typescript
socket.on('match_ended', (result: {
  matchId: string,
  winnerId: string | null,
  players: Array<{
    playerId: string,
    platformUserId: string,
    score: number,
    ranking: number,
    winnings: number
  }>,
  startTime: number,
  endTime: number
}) => { ... });
```

---

## 🔧 CONFIGURATION REFERENCE

### **Game Physics**
```typescript
gravity: 800           // px/s² (falling acceleration)
jumpVelocity: 400      // px/s (initial jump speed)
dinoSpeed: 200         // px/s (horizontal speed)
groundLevel: 0         // y position (collision)
```

### **Match Settings**
```typescript
maxPlayers: 4              // Players per match
obstacleSpawnRate: 2000    // ms between obstacles
tickRate: 16               // ms per physics update (~60 FPS)
minPlayersToStart: 2       // Minimum for match start
```

### **Network Settings**
```typescript
pingInterval: 25000        // Socket.IO ping every 25s
pingTimeout: 60000         // Disconnect after 60s no pong
reconnectionAttempts: 5    // Client retry attempts
reconnectionDelay: 1000    // ms between retries
```

### **Gambling Integration**
```typescript
houseFee: 0.05            // 5% commission
winnerTakesAll: true      // Winner gets 95% of pot
currency: 'USD'           // Default currency
minBet: 1                 // Minimum bet amount
maxBet: 1000              // Maximum bet amount
```

---

## 🚀 QUICK COMMANDS

### **Development**
```bash
# Backend
cd backend
npm install
npm run build    # Compile TypeScript
npm start        # Run production build
npm run dev      # Run with auto-restart
npm run watch    # Watch mode (compile on change)

# Frontend
cd ui
npm install
npm run dev      # Vite dev server (hot reload)
npm run build    # Production build
npm run preview  # Preview production build
```

### **Deployment**
```bash
# Git
git add .
git commit -m "Deploy updates"
git push origin main

# Render.com
# Auto-deploys from main branch
# Manual: Dashboard → Service → Deploy → Deploy latest commit
```

### **Testing**
```bash
# Health check
curl https://dizolaur-backend.onrender.com/health

# View logs (Render Dashboard)
Dashboard → dizolaur-backend → Logs → Live tail
```

---

## 📝 DEVELOPMENT NOTES

### **Code Style**
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Functional programming preferred
- Extensive comments for complex logic

### **Git Workflow**
```
main              # Production-ready code
└── feature/*     # New features
└── bugfix/*      # Bug fixes
└── hotfix/*      # Critical fixes
```

### **Commit Messages**
```
feat: Add reconnection support
fix: Resolve duplicate player bug
refactor: Optimize physics engine
docs: Update API documentation
```

---

## 🎓 LEARNING RESOURCES

### **Technologies Used**
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Render.com Guides](https://render.com/docs)

### **Game Development Concepts**
- Server-Authoritative Multiplayer
- Client-Side Prediction & Interpolation
- Fixed Timestep Physics
- AABB Collision Detection
- WebSocket Real-time Communication

---

## 📧 SUPPORT & CONTRIBUTION

### **Bug Reports**
Create an issue with:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/logs

### **Feature Requests**
Describe:
1. Use case
2. Proposed solution
3. Alternatives considered

---

**Last Updated**: November 22, 2025
**Version**: 1.0.0
**License**: ISC
