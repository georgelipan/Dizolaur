# Chrome Dino Multiplayer Game - Complete Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Server-Side Implementation](#server-side-implementation)
5. [Client-Side Implementation](#client-side-implementation)
6. [Communication Protocol](#communication-protocol)
7. [Game Mechanics](#game-mechanics)
8. [Security & Anti-Cheat](#security--anti-cheat)
9. [Performance Optimization](#performance-optimization)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide](#deployment-guide)
12. [Implementation Roadmap](#implementation-roadmap)

---

## Architecture Overview

### High-Level System Design

```
┌────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    React Layer (UI)                           │ │
│  │  • Lobby Component (player list, room management)            │ │
│  │  • HUD Component (score, fps, ping)                          │ │
│  │  • Leaderboard Component (real-time rankings)                │ │
│  │  • Settings Component (volume, graphics quality)             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Phaser Layer (Rendering)                    │ │
│  │  • LobbyScene (waiting room visuals)                         │ │
│  │  • GameScene (render only - no physics!)                     │ │
│  │    - Draw players at server-provided positions               │ │
│  │    - Draw obstacles at server-provided positions             │ │
│  │    - Interpolation for smooth movement                       │ │
│  │    - Particle effects, animations                            │ │
│  │  • GameOverScene (death animation, final score)              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                Socket.io Client                               │ │
│  │  Emit: 'jump', 'duck', 'joinGame', 'leaveGame'               │ │
│  │  Listen: 'gameState', 'playerDied', 'gameStart', 'lobbyUpdate'│ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
                                ↕ WebSocket (Socket.io)
┌────────────────────────────────────────────────────────────────────┐
│                       NODE.JS SERVER                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Express HTTP Server                        │ │
│  │  • Serve React build (static files)                          │ │
│  │  • API endpoints (/api/stats, /api/leaderboard)              │ │
│  │  • Health check endpoint                                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  Socket.io Server                             │ │
│  │  • Connection management                                     │ │
│  │  • Room management (multiple game rooms)                     │ │
│  │  • Event handling (jump, duck, etc)                          │ │
│  │  • Broadcast game state (60 FPS)                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Authoritative Game Server                        │ │
│  │                                                               │ │
│  │  Game Loop (60 FPS):                                         │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │ 1. Process Input Queue                                 │  │ │
│  │  │    • Validate jump/duck commands                       │  │ │
│  │  │    • Rate limiting (max 1 jump per 500ms)              │  │ │
│  │  │    • Timestamp verification                            │  │ │
│  │  │                                                         │  │ │
│  │  │ 2. Update Physics                                      │  │ │
│  │  │    • Apply gravity to all players                      │  │ │
│  │  │    • Update jump velocity                              │  │ │
│  │  │    • Ground collision detection                        │  │ │
│  │  │                                                         │  │ │
│  │  │ 3. Update Game State                                   │  │ │
│  │  │    • Move obstacles (constant speed)                   │  │ │
│  │  │    • Spawn new obstacles (difficulty curve)            │  │ │
│  │  │    • Remove off-screen obstacles                       │  │ │
│  │  │    • Increment score (distance-based)                  │  │ │
│  │  │                                                         │  │ │
│  │  │ 4. Collision Detection                                 │  │ │
│  │  │    • Player AABB vs Obstacle AABB                      │  │ │
│  │  │    • Mark dead players                                 │  │ │
│  │  │    • Calculate final scores                            │  │ │
│  │  │                                                         │  │ │
│  │  │ 5. Broadcast State                                     │  │ │
│  │  │    • Serialize game state                              │  │ │
│  │  │    • Send to all connected clients                     │  │ │
│  │  │    • Delta compression for bandwidth optimization      │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                               │ │
│  │  Components:                                                 │ │
│  │  • GameRoom (manages single game instance)                  │ │
│  │  • Player (id, position, velocity, score, alive)            │ │
│  │  • Obstacle (x, y, width, height, type)                     │ │
│  │  • Physics Engine (gravity, collision, jump mechanics)      │ │
│  │  • ObstacleSpawner (difficulty curve, random generation)    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  Database (Optional)                          │ │
│  │  • Redis: Session storage, leaderboard cache                │ │
│  │  • PostgreSQL/MongoDB: Persistent high scores, player stats │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "phaser": "^3.90.0",
  "socket.io-client": "^4.7.0"
}
```

### Backend
```json
{
  "express": "^4.18.0",
  "socket.io": "^4.7.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.0",
  "redis": "^4.6.0",
  "mongoose": "^8.0.0"
}
```

### Development Tools
```json
{
  "concurrently": "^8.2.0",
  "nodemon": "^3.0.0",
  "vite": "^6.3.1"
}
```

---

## Project Structure

```
template-react/
│
├── client/                              # Frontend (existing src/)
│   ├── src/
│   │   ├── main.jsx                     # React entry point
│   │   ├── App.jsx                      # Main React component
│   │   │
│   │   ├── components/                  # React UI Components
│   │   │   ├── Lobby.jsx               # Game lobby UI
│   │   │   ├── HUD.jsx                 # In-game HUD (score, ping)
│   │   │   ├── Leaderboard.jsx         # Real-time rankings
│   │   │   ├── Settings.jsx            # Game settings
│   │   │   └── PlayerList.jsx          # Connected players list
│   │   │
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── useSocket.js            # Socket.io connection hook
│   │   │   ├── useGameState.js         # Game state management
│   │   │   └── useLeaderboard.js       # Leaderboard updates
│   │   │
│   │   ├── context/                     # React Context
│   │   │   ├── SocketContext.jsx       # WebSocket context provider
│   │   │   └── GameContext.jsx         # Game state context
│   │   │
│   │   ├── PhaserGame.jsx               # Phaser wrapper component
│   │   │
│   │   └── game/                        # Phaser game code
│   │       ├── main.js                  # Phaser config
│   │       ├── EventBus.js              # React-Phaser communication
│   │       │
│   │       ├── scenes/
│   │       │   ├── Boot.js             # Initial loading
│   │       │   ├── Preloader.js        # Asset loading with progress
│   │       │   ├── LobbyScene.js       # Waiting room visuals
│   │       │   ├── GameScene.js        # Main game rendering
│   │       │   └── GameOverScene.js    # Death screen
│   │       │
│   │       ├── entities/                # Visual-only game entities
│   │       │   ├── DinoSprite.js       # Player visual representation
│   │       │   └── ObstacleSprite.js   # Obstacle visuals
│   │       │
│   │       └── utils/
│   │           ├── Interpolation.js    # Smooth position updates
│   │           └── AnimationManager.js # Sprite animations
│   │
│   └── public/
│       ├── assets/
│       │   ├── sprites/
│       │   │   ├── dino-idle.png
│       │   │   ├── dino-run.png
│       │   │   ├── dino-jump.png
│       │   │   ├── cactus-small.png
│       │   │   ├── cactus-large.png
│       │   │   └── pterodactyl.png
│       │   │
│       │   ├── audio/
│       │   │   ├── jump.mp3
│       │   │   ├── death.mp3
│       │   │   └── score-milestone.mp3
│       │   │
│       │   └── fonts/
│       │       └── pixel-font.ttf
│       │
│       └── style.css
│
├── server/                              # Backend (NEW!)
│   ├── src/
│   │   ├── index.js                     # Server entry point
│   │   │
│   │   ├── config/
│   │   │   ├── game.config.js          # Game constants
│   │   │   └── server.config.js        # Server settings
│   │   │
│   │   ├── core/
│   │   │   ├── GameRoom.js             # Single game instance manager
│   │   │   ├── GameLoop.js             # 60 FPS authoritative loop
│   │   │   ├── PhysicsEngine.js        # Gravity, collision, jumps
│   │   │   └── ObstacleSpawner.js      # Procedural obstacle generation
│   │   │
│   │   ├── entities/
│   │   │   ├── Player.js               # Player state & logic
│   │   │   ├── Obstacle.js             # Obstacle data structure
│   │   │   └── GameState.js            # Complete game state
│   │   │
│   │   ├── network/
│   │   │   ├── SocketManager.js        # Socket.io event handlers
│   │   │   ├── InputValidator.js       # Anti-cheat input validation
│   │   │   └── StateSerializer.js      # Compress game state for network
│   │   │
│   │   ├── services/
│   │   │   ├── RoomManager.js          # Multiple game rooms
│   │   │   ├── LeaderboardService.js   # High score management
│   │   │   └── DatabaseService.js      # DB operations
│   │   │
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js          # API rate limiting
│   │   │   └── errorHandler.js         # Global error handling
│   │   │
│   │   └── utils/
│   │       ├── collision.js            # AABB collision detection
│   │       ├── logger.js               # Server logging
│   │       └── constants.js            # Game constants
│   │
│   └── .env                             # Environment variables
│
├── shared/                              # Code shared between client & server
│   ├── constants.js                     # Game physics constants
│   ├── types.js                         # TypeScript types (if using TS)
│   └── utils.js                         # Shared utility functions
│
├── package.json                         # Root package.json
├── .env.example                         # Example environment variables
├── docker-compose.yml                   # Docker setup (optional)
└── README.md                            # Project documentation
```

---

## Server-Side Implementation

### 1. Server Entry Point (`server/src/index.js`)

```javascript
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const SocketManager = require('./network/SocketManager');
const RoomManager = require('./services/RoomManager');
const { SERVER_CONFIG } = require('./config/server.config');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Configure CORS
const io = socketIO(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:8080',
        methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client/dist')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

app.get('/api/stats', (req, res) => {
    const stats = RoomManager.getStats();
    res.json(stats);
});

app.get('/api/leaderboard', async (req, res) => {
    const leaderboard = await RoomManager.getGlobalLeaderboard();
    res.json(leaderboard);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Initialize Socket Manager
const socketManager = new SocketManager(io);
socketManager.initialize();

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🎮 Game servers ready`);
    console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        RoomManager.shutdown();
    });
});
```

### 2. Game Configuration (`server/src/config/game.config.js`)

```javascript
module.exports = {
    GAME_CONFIG: {
        // Physics
        GRAVITY: 2500,                  // pixels/s²
        JUMP_VELOCITY: -800,            // pixels/s
        GROUND_Y: 600,                  // Ground level
        PLAYER_START_X: 100,            // Player X position (fixed)

        // Player hitbox
        PLAYER_WIDTH: 44,
        PLAYER_HEIGHT: 47,

        // Obstacles
        OBSTACLE_SPEED: 400,            // Initial speed (pixels/s)
        OBSTACLE_SPEED_INCREMENT: 5,    // Speed increase per second
        OBSTACLE_SPAWN_MIN_DISTANCE: 500,
        OBSTACLE_SPAWN_MAX_DISTANCE: 900,

        OBSTACLE_TYPES: {
            CACTUS_SMALL: { width: 17, height: 35, points: 1 },
            CACTUS_LARGE: { width: 25, height: 50, points: 2 },
            PTERODACTYL_HIGH: { width: 46, height: 40, y: 450, points: 3 },
            PTERODACTYL_LOW: { width: 46, height: 40, y: 550, points: 3 }
        },

        // Game mechanics
        SCORE_INCREMENT: 1,             // Points per frame alive
        DIFFICULTY_INCREASE_INTERVAL: 10000, // ms
        MAX_GAME_SPEED: 1000,           // Max obstacle speed

        // Input validation
        JUMP_COOLDOWN: 500,             // ms between jumps
        MAX_INPUT_RATE: 10,             // max inputs per second

        // Room settings
        MAX_PLAYERS_PER_ROOM: 8,
        COUNTDOWN_DURATION: 3000,       // ms before game starts

        // Network
        SERVER_TICK_RATE: 60,           // FPS
        CLIENT_UPDATE_RATE: 60          // Send state 60 times/sec
    }
};
```

### 3. Authoritative Game Loop (`server/src/core/GameLoop.js`)

```javascript
const { GAME_CONFIG } = require('../config/game.config');
const PhysicsEngine = require('./PhysicsEngine');
const ObstacleSpawner = require('./ObstacleSpawner');
const { checkCollision } = require('../utils/collision');

class GameLoop {
    constructor(gameRoom) {
        this.room = gameRoom;
        this.isRunning = false;
        this.lastUpdate = Date.now();
        this.loopInterval = null;

        this.physics = new PhysicsEngine();
        this.spawner = new ObstacleSpawner();

        this.frameCount = 0;
        this.gameSpeed = GAME_CONFIG.OBSTACLE_SPEED;
    }

    start() {
        this.isRunning = true;
        this.lastUpdate = Date.now();

        const targetFPS = GAME_CONFIG.SERVER_TICK_RATE;
        const frameTime = 1000 / targetFPS;

        this.loopInterval = setInterval(() => {
            this.tick();
        }, frameTime);

        console.log(`[GameLoop] Started at ${targetFPS} FPS`);
    }

    tick() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;

        // 1. Process input queue
        this.processInputs(deltaTime);

        // 2. Update physics
        this.updatePhysics(deltaTime);

        // 3. Update obstacles
        this.updateObstacles(deltaTime);

        // 4. Check collisions
        this.checkCollisions();

        // 5. Update score
        this.updateScores(deltaTime);

        // 6. Increase difficulty
        this.updateDifficulty();

        // 7. Check game over condition
        this.checkGameOver();

        this.frameCount++;
    }

    processInputs(deltaTime) {
        const inputQueue = this.room.getInputQueue();

        for (const input of inputQueue) {
            const player = this.room.getPlayer(input.playerId);
            if (!player || !player.alive) continue;

            // Validate input timing
            if (!this.validateInput(player, input)) {
                console.warn(`[GameLoop] Invalid input from ${player.id}`);
                continue;
            }

            // Process jump
            if (input.action === 'jump' && player.isOnGround) {
                player.velocityY = GAME_CONFIG.JUMP_VELOCITY;
                player.isOnGround = false;
                player.lastJumpTime = Date.now();
            }

            // Process duck (optional mechanic)
            if (input.action === 'duck') {
                player.isDucking = true;
            }

            if (input.action === 'unduck') {
                player.isDucking = false;
            }
        }

        // Clear processed inputs
        this.room.clearInputQueue();
    }

    validateInput(player, input) {
        const now = Date.now();

        // Check jump cooldown
        if (input.action === 'jump') {
            if (now - player.lastJumpTime < GAME_CONFIG.JUMP_COOLDOWN) {
                return false;
            }
        }

        // Check input rate
        player.inputCount = player.inputCount || 0;
        player.inputWindowStart = player.inputWindowStart || now;

        if (now - player.inputWindowStart > 1000) {
            player.inputCount = 0;
            player.inputWindowStart = now;
        }

        player.inputCount++;
        if (player.inputCount > GAME_CONFIG.MAX_INPUT_RATE) {
            console.warn(`[Anti-Cheat] Player ${player.id} exceeding input rate`);
            return false;
        }

        return true;
    }

    updatePhysics(deltaTime) {
        const players = this.room.getPlayers();

        for (const player of players) {
            if (!player.alive) continue;

            // Apply gravity
            if (!player.isOnGround) {
                player.velocityY += GAME_CONFIG.GRAVITY * deltaTime;
            }

            // Update position
            player.y += player.velocityY * deltaTime;

            // Ground collision
            const groundY = GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_HEIGHT;
            if (player.y >= groundY) {
                player.y = groundY;
                player.velocityY = 0;
                player.isOnGround = true;
            }

            // Update hitbox
            player.hitbox = {
                x: player.x,
                y: player.y,
                width: player.isDucking
                    ? GAME_CONFIG.PLAYER_WIDTH
                    : GAME_CONFIG.PLAYER_WIDTH,
                height: player.isDucking
                    ? GAME_CONFIG.PLAYER_HEIGHT / 2
                    : GAME_CONFIG.PLAYER_HEIGHT
            };
        }
    }

    updateObstacles(deltaTime) {
        const obstacles = this.room.getObstacles();

        // Move obstacles
        for (const obstacle of obstacles) {
            obstacle.x -= this.gameSpeed * deltaTime;
        }

        // Remove off-screen obstacles
        this.room.obstacles = obstacles.filter(obs => obs.x > -100);

        // Spawn new obstacles
        const shouldSpawn = this.spawner.shouldSpawn(
            obstacles,
            this.gameSpeed,
            deltaTime
        );

        if (shouldSpawn) {
            const newObstacle = this.spawner.spawn(this.frameCount);
            this.room.addObstacle(newObstacle);
        }
    }

    checkCollisions() {
        const players = this.room.getPlayers();
        const obstacles = this.room.getObstacles();

        for (const player of players) {
            if (!player.alive) continue;

            for (const obstacle of obstacles) {
                if (checkCollision(player.hitbox, obstacle)) {
                    player.alive = false;
                    player.deathTime = Date.now();
                    this.room.onPlayerDied(player);
                    console.log(`[GameLoop] Player ${player.id} died. Score: ${player.score}`);
                }
            }
        }
    }

    updateScores(deltaTime) {
        const players = this.room.getPlayers();

        for (const player of players) {
            if (!player.alive) continue;
            player.score += GAME_CONFIG.SCORE_INCREMENT * deltaTime * 60; // Normalize to 60 FPS
        }
    }

    updateDifficulty() {
        // Increase game speed over time
        if (this.frameCount % (GAME_CONFIG.SERVER_TICK_RATE * 2) === 0) {
            this.gameSpeed = Math.min(
                this.gameSpeed + GAME_CONFIG.OBSTACLE_SPEED_INCREMENT,
                GAME_CONFIG.MAX_GAME_SPEED
            );
        }
    }

    checkGameOver() {
        const alivePlayers = this.room.getPlayers().filter(p => p.alive);

        if (alivePlayers.length === 0) {
            this.stop();
            this.room.onGameOver();
        }
    }

    stop() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        this.isRunning = false;
        console.log('[GameLoop] Stopped');
    }
}

module.exports = GameLoop;
```

### 4. Player Entity (`server/src/entities/Player.js`)

```javascript
const { GAME_CONFIG } = require('../config/game.config');

class Player {
    constructor(socketId, username) {
        this.id = socketId;
        this.username = username || `Player_${socketId.slice(0, 6)}`;

        // Position
        this.x = GAME_CONFIG.PLAYER_START_X;
        this.y = GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_HEIGHT;

        // Physics
        this.velocityY = 0;
        this.isOnGround = true;
        this.isDucking = false;

        // State
        this.alive = true;
        this.score = 0;
        this.ready = false;

        // Hitbox
        this.hitbox = {
            x: this.x,
            y: this.y,
            width: GAME_CONFIG.PLAYER_WIDTH,
            height: GAME_CONFIG.PLAYER_HEIGHT
        };

        // Anti-cheat
        this.lastJumpTime = 0;
        this.inputCount = 0;
        this.inputWindowStart = Date.now();

        // Metadata
        this.joinedAt = Date.now();
        this.deathTime = null;
        this.ping = 0;
    }

    serialize() {
        return {
            id: this.id,
            username: this.username,
            x: Math.round(this.x),
            y: Math.round(this.y),
            velocityY: Math.round(this.velocityY),
            isOnGround: this.isOnGround,
            isDucking: this.isDucking,
            alive: this.alive,
            score: Math.round(this.score),
            ready: this.ready
        };
    }

    reset() {
        this.x = GAME_CONFIG.PLAYER_START_X;
        this.y = GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_HEIGHT;
        this.velocityY = 0;
        this.isOnGround = true;
        this.isDucking = false;
        this.alive = true;
        this.score = 0;
        this.lastJumpTime = 0;
    }
}

module.exports = Player;
```

### 5. Obstacle Spawner (`server/src/core/ObstacleSpawner.js`)

```javascript
const { GAME_CONFIG } = require('../config/game.config');

class ObstacleSpawner {
    constructor() {
        this.lastSpawnX = 1200; // Start off-screen
        this.spawnTimer = 0;
    }

    shouldSpawn(obstacles, gameSpeed, deltaTime) {
        // No obstacles or last obstacle far enough
        if (obstacles.length === 0) {
            return this.lastSpawnX < 800;
        }

        const lastObstacle = obstacles[obstacles.length - 1];
        const distance = 1200 - lastObstacle.x;

        // Calculate spawn distance based on game speed
        const minDistance = GAME_CONFIG.OBSTACLE_SPAWN_MIN_DISTANCE;
        const maxDistance = GAME_CONFIG.OBSTACLE_SPAWN_MAX_DISTANCE;

        const spawnDistance = minDistance + Math.random() * (maxDistance - minDistance);

        return distance >= spawnDistance;
    }

    spawn(frameCount) {
        // Weighted random selection of obstacle type
        const types = Object.keys(GAME_CONFIG.OBSTACLE_TYPES);
        const weights = [50, 30, 10, 10]; // CACTUS_SMALL, CACTUS_LARGE, PTERO_HIGH, PTERO_LOW

        const type = this.weightedRandom(types, weights);
        const config = GAME_CONFIG.OBSTACLE_TYPES[type];

        const obstacle = {
            id: `obs_${frameCount}_${Date.now()}`,
            type: type,
            x: 1200,
            y: config.y || (GAME_CONFIG.GROUND_Y - config.height),
            width: config.width,
            height: config.height,
            points: config.points
        };

        this.lastSpawnX = obstacle.x;

        return obstacle;
    }

    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            if (random < weights[i]) {
                return items[i];
            }
            random -= weights[i];
        }

        return items[0];
    }
}

module.exports = ObstacleSpawner;
```

### 6. Socket Manager (`server/src/network/SocketManager.js`)

```javascript
const RoomManager = require('../services/RoomManager');

class SocketManager {
    constructor(io) {
        this.io = io;
        this.roomManager = new RoomManager(io);
    }

    initialize() {
        this.io.on('connection', (socket) => {
            console.log(`[Socket] Player connected: ${socket.id}`);

            // Send initial connection confirmation
            socket.emit('connected', {
                playerId: socket.id,
                serverTime: Date.now()
            });

            // Join game
            socket.on('joinGame', (data) => {
                this.handleJoinGame(socket, data);
            });

            // Player input
            socket.on('jump', () => {
                this.handlePlayerInput(socket, 'jump');
            });

            socket.on('duck', () => {
                this.handlePlayerInput(socket, 'duck');
            });

            socket.on('unduck', () => {
                this.handlePlayerInput(socket, 'unduck');
            });

            // Player ready
            socket.on('playerReady', () => {
                this.roomManager.setPlayerReady(socket.id);
            });

            // Leave game
            socket.on('leaveGame', () => {
                this.handleLeaveGame(socket);
            });

            // Disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });

            // Ping/latency measurement
            socket.on('ping', () => {
                socket.emit('pong', Date.now());
            });
        });

        console.log('[SocketManager] Initialized');
    }

    handleJoinGame(socket, data) {
        const { username, roomId } = data;

        try {
            const room = this.roomManager.joinRoom(socket.id, username, roomId);

            socket.join(room.id);
            socket.emit('joinedGame', {
                roomId: room.id,
                players: room.getPlayers().map(p => p.serialize())
            });

            // Notify other players
            socket.to(room.id).emit('playerJoined', {
                player: room.getPlayer(socket.id).serialize()
            });

            console.log(`[Socket] ${username} joined room ${room.id}`);
        } catch (error) {
            socket.emit('joinError', { message: error.message });
            console.error(`[Socket] Join error: ${error.message}`);
        }
    }

    handlePlayerInput(socket, action) {
        const room = this.roomManager.getPlayerRoom(socket.id);
        if (!room) return;

        room.addInput({
            playerId: socket.id,
            action: action,
            timestamp: Date.now()
        });
    }

    handleLeaveGame(socket) {
        const room = this.roomManager.getPlayerRoom(socket.id);
        if (!room) return;

        this.roomManager.leaveRoom(socket.id);
        socket.leave(room.id);

        // Notify other players
        socket.to(room.id).emit('playerLeft', {
            playerId: socket.id
        });

        console.log(`[Socket] Player ${socket.id} left room ${room.id}`);
    }

    handleDisconnect(socket) {
        console.log(`[Socket] Player disconnected: ${socket.id}`);
        this.handleLeaveGame(socket);
    }
}

module.exports = SocketManager;
```

---

## Client-Side Implementation

### 1. Socket Context (`client/src/context/SocketContext.jsx`)

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [ping, setPing] = useState(0);

    useEffect(() => {
        const serverURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
        const newSocket = io(serverURL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
            console.log('[Socket] Connected to server');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected from server');
            setConnected(false);
        });

        // Ping measurement
        const pingInterval = setInterval(() => {
            const start = Date.now();
            newSocket.emit('ping');
            newSocket.once('pong', () => {
                setPing(Date.now() - start);
            });
        }, 2000);

        setSocket(newSocket);

        return () => {
            clearInterval(pingInterval);
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected, ping }}>
            {children}
        </SocketContext.Provider>
    );
};
```

### 2. Game Scene (`client/src/game/scenes/GameScene.js`)

```javascript
import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class GameScene extends Scene {
    constructor() {
        super('GameScene');
        this.players = new Map();
        this.obstacles = new Map();
        this.groundY = 600;
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor(0xf7f7f7);

        // Ground
        this.ground = this.add.rectangle(
            this.cameras.main.width / 2,
            this.groundY,
            this.cameras.main.width,
            4,
            0x535353
        );

        // Listen for game state updates from server
        EventBus.on('gameState', this.updateGameState, this);
        EventBus.on('playerDied', this.onPlayerDied, this);

        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.spaceKey.on('down', () => {
            EventBus.emit('playerJump');
        });

        // Score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            color: '#535353',
            fontFamily: 'monospace'
        });

        EventBus.emit('current-scene-ready', this);
    }

    updateGameState(state) {
        // Update players
        state.players.forEach(playerData => {
            this.updatePlayer(playerData);
        });

        // Remove players not in state
        this.players.forEach((sprite, id) => {
            if (!state.players.find(p => p.id === id)) {
                sprite.destroy();
                this.players.delete(id);
            }
        });

        // Update obstacles
        state.obstacles.forEach(obstacleData => {
            this.updateObstacle(obstacleData);
        });

        // Remove obstacles not in state
        this.obstacles.forEach((sprite, id) => {
            if (!state.obstacles.find(o => o.id === id)) {
                sprite.destroy();
                this.obstacles.delete(id);
            }
        });

        // Update score (show local player's score)
        const localPlayer = state.players.find(p => p.isLocal);
        if (localPlayer) {
            this.scoreText.setText(`Score: ${Math.round(localPlayer.score)}`);
        }
    }

    updatePlayer(playerData) {
        let playerSprite = this.players.get(playerData.id);

        if (!playerSprite) {
            // Create new player sprite
            playerSprite = this.add.sprite(playerData.x, playerData.y, 'dino');
            playerSprite.setOrigin(0, 0);

            // Add username text
            playerSprite.nameText = this.add.text(
                playerData.x + 22,
                playerData.y - 20,
                playerData.username,
                {
                    fontSize: '12px',
                    color: '#535353',
                    fontFamily: 'monospace'
                }
            ).setOrigin(0.5, 0);

            this.players.set(playerData.id, playerSprite);
        }

        // Smooth interpolation
        this.tweens.add({
            targets: playerSprite,
            x: playerData.x,
            y: playerData.y,
            duration: 16, // ~60 FPS
            ease: 'Linear'
        });

        // Update username position
        if (playerSprite.nameText) {
            playerSprite.nameText.setPosition(playerData.x + 22, playerData.y - 20);
        }

        // Animation state
        if (!playerData.alive) {
            playerSprite.setTint(0xff0000);
        } else if (playerData.isOnGround) {
            playerSprite.play('dino-run', true);
        } else {
            playerSprite.play('dino-jump', true);
        }
    }

    updateObstacle(obstacleData) {
        let obstacleSprite = this.obstacles.get(obstacleData.id);

        if (!obstacleSprite) {
            // Create obstacle
            const texture = this.getObstacleTexture(obstacleData.type);
            obstacleSprite = this.add.sprite(
                obstacleData.x,
                obstacleData.y,
                texture
            );
            obstacleSprite.setOrigin(0, 0);
            this.obstacles.set(obstacleData.id, obstacleSprite);
        }

        // Update position (no interpolation for obstacles - immediate update)
        obstacleSprite.setPosition(obstacleData.x, obstacleData.y);
    }

    getObstacleTexture(type) {
        switch (type) {
            case 'CACTUS_SMALL': return 'cactus-small';
            case 'CACTUS_LARGE': return 'cactus-large';
            case 'PTERODACTYL_HIGH':
            case 'PTERODACTYL_LOW': return 'pterodactyl';
            default: return 'cactus-small';
        }
    }

    onPlayerDied(data) {
        console.log(`Player ${data.playerId} died with score ${data.score}`);
        // Play death sound/animation
        this.sound.play('death');
    }

    shutdown() {
        EventBus.off('gameState', this.updateGameState, this);
        EventBus.off('playerDied', this.onPlayerDied, this);
    }
}
```

### 3. React App with Socket Integration (`client/src/App.jsx`)

```jsx
import { useRef, useState, useEffect } from 'react';
import { PhaserGame } from './PhaserGame';
import { useSocket } from './context/SocketContext';
import { EventBus } from './game/EventBus';
import Lobby from './components/Lobby';
import HUD from './components/HUD';
import Leaderboard from './components/Leaderboard';

function App() {
    const phaserRef = useRef();
    const { socket, connected, ping } = useSocket();

    const [gameState, setGameState] = useState('lobby'); // 'lobby', 'playing', 'gameover'
    const [players, setPlayers] = useState([]);
    const [myScore, setMyScore] = useState(0);
    const [roomId, setRoomId] = useState(null);

    useEffect(() => {
        if (!socket) return;

        // Socket event listeners
        socket.on('joinedGame', (data) => {
            setRoomId(data.roomId);
            setPlayers(data.players);
            setGameState('lobby');
        });

        socket.on('gameStarting', () => {
            setGameState('playing');
        });

        socket.on('gameState', (state) => {
            // Forward to Phaser
            EventBus.emit('gameState', {
                ...state,
                players: state.players.map(p => ({
                    ...p,
                    isLocal: p.id === socket.id
                }))
            });

            // Update local player score
            const localPlayer = state.players.find(p => p.id === socket.id);
            if (localPlayer) {
                setMyScore(localPlayer.score);
            }

            setPlayers(state.players);
        });

        socket.on('playerDied', (data) => {
            EventBus.emit('playerDied', data);
            if (data.playerId === socket.id) {
                setGameState('gameover');
            }
        });

        socket.on('gameOver', () => {
            setGameState('gameover');
        });

        return () => {
            socket.off('joinedGame');
            socket.off('gameStarting');
            socket.off('gameState');
            socket.off('playerDied');
            socket.off('gameOver');
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        // Forward Phaser input to server
        EventBus.on('playerJump', () => {
            socket.emit('jump');
        });

        return () => {
            EventBus.off('playerJump');
        };
    }, [socket]);

    const handleJoinGame = (username) => {
        if (socket && connected) {
            socket.emit('joinGame', { username });
        }
    };

    const handleReady = () => {
        if (socket) {
            socket.emit('playerReady');
        }
    };

    const handlePlayAgain = () => {
        setGameState('lobby');
        setMyScore(0);
    };

    return (
        <div id="app">
            {gameState === 'lobby' && (
                <Lobby
                    onJoin={handleJoinGame}
                    onReady={handleReady}
                    players={players}
                    connected={connected}
                />
            )}

            <PhaserGame ref={phaserRef} />

            {gameState === 'playing' && (
                <HUD
                    score={myScore}
                    ping={ping}
                    alivePlayers={players.filter(p => p.alive).length}
                />
            )}

            {gameState === 'gameover' && (
                <div className="game-over-overlay">
                    <h1>Game Over</h1>
                    <p>Final Score: {Math.round(myScore)}</p>
                    <button onClick={handlePlayAgain}>Play Again</button>
                    <Leaderboard players={players} />
                </div>
            )}
        </div>
    );
}

export default App;
```

---

## Communication Protocol

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joinGame` | `{ username: string, roomId?: string }` | Join game room |
| `playerReady` | - | Mark player as ready |
| `jump` | - | Jump input |
| `duck` | - | Duck input |
| `unduck` | - | Stand up from duck |
| `leaveGame` | - | Leave current room |
| `ping` | - | Latency measurement |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ playerId: string, serverTime: number }` | Initial connection |
| `joinedGame` | `{ roomId: string, players: Player[] }` | Successfully joined |
| `joinError` | `{ message: string }` | Join failed |
| `playerJoined` | `{ player: Player }` | New player joined room |
| `playerLeft` | `{ playerId: string }` | Player left room |
| `gameStarting` | `{ countdown: number }` | Game countdown started |
| `gameState` | `GameState` | Full game state update (60 FPS) |
| `playerDied` | `{ playerId: string, score: number }` | Player died |
| `gameOver` | `{ leaderboard: Player[] }` | All players dead |
| `pong` | `number` | Server timestamp for ping |

### Game State Structure

```typescript
interface GameState {
    players: Player[];
    obstacles: Obstacle[];
    gameSpeed: number;
    frameCount: number;
}

interface Player {
    id: string;
    username: string;
    x: number;
    y: number;
    velocityY: number;
    isOnGround: boolean;
    isDucking: boolean;
    alive: boolean;
    score: number;
    ready: boolean;
}

interface Obstacle {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    points: number;
}
```

---

## Security & Anti-Cheat

### Server-Side Validation

```javascript
// Input validation
class InputValidator {
    validateJump(player, timestamp) {
        const now = Date.now();

        // Check cooldown
        if (now - player.lastJumpTime < JUMP_COOLDOWN) {
            return { valid: false, reason: 'Jump on cooldown' };
        }

        // Check if on ground
        if (!player.isOnGround) {
            return { valid: false, reason: 'Not on ground' };
        }

        // Check rate limiting
        if (this.exceedsRateLimit(player)) {
            return { valid: false, reason: 'Rate limit exceeded' };
        }

        // Check timestamp (detect speedhacks)
        const timeDiff = now - timestamp;
        if (Math.abs(timeDiff) > 1000) {
            return { valid: false, reason: 'Invalid timestamp' };
        }

        return { valid: true };
    }

    exceedsRateLimit(player) {
        const now = Date.now();
        player.inputHistory = player.inputHistory || [];

        // Remove old inputs (older than 1 second)
        player.inputHistory = player.inputHistory.filter(
            time => now - time < 1000
        );

        // Add current input
        player.inputHistory.push(now);

        // Check if exceeded max inputs per second
        return player.inputHistory.length > MAX_INPUT_RATE;
    }
}
```

### Anti-Cheat Measures

1. **Server Authoritative** - All physics on server
2. **Input Validation** - Reject impossible inputs
3. **Rate Limiting** - Max actions per second
4. **Timestamp Verification** - Detect speedhacks
5. **Hitbox Validation** - Server calculates all collisions
6. **State Sanitization** - Send only necessary data
7. **Logging & Monitoring** - Track suspicious behavior

---

## Performance Optimization

### Server Optimizations

```javascript
// Delta compression - send only changes
class StateSerializer {
    constructor() {
        this.lastState = {};
    }

    compressDelta(currentState, playerId) {
        const delta = {};

        // Only send players near the client's view
        delta.players = currentState.players.map(p => {
            const prev = this.lastState.players?.find(old => old.id === p.id);

            if (!prev) return p; // New player, send full data

            // Send only changed fields
            const changes = {};
            if (p.x !== prev.x) changes.x = p.x;
            if (p.y !== prev.y) changes.y = p.y;
            if (p.alive !== prev.alive) changes.alive = p.alive;
            if (p.score !== prev.score) changes.score = p.score;

            return Object.keys(changes).length > 0
                ? { id: p.id, ...changes }
                : null;
        }).filter(Boolean);

        // Only send visible obstacles
        delta.obstacles = currentState.obstacles.filter(
            obs => obs.x > -100 && obs.x < 1300
        );

        this.lastState = currentState;
        return delta;
    }
}
```

### Client Optimizations

```javascript
// Client-side prediction & interpolation
class MovementInterpolator {
    constructor() {
        this.buffer = [];
        this.renderDelay = 100; // ms
    }

    addSnapshot(snapshot) {
        this.buffer.push({
            state: snapshot,
            timestamp: Date.now()
        });

        // Keep buffer small
        if (this.buffer.length > 10) {
            this.buffer.shift();
        }
    }

    getInterpolatedPosition(playerId) {
        const now = Date.now() - this.renderDelay;

        // Find two snapshots to interpolate between
        let before = null;
        let after = null;

        for (let i = 0; i < this.buffer.length - 1; i++) {
            if (this.buffer[i].timestamp <= now &&
                this.buffer[i + 1].timestamp >= now) {
                before = this.buffer[i];
                after = this.buffer[i + 1];
                break;
            }
        }

        if (!before || !after) {
            return this.buffer[this.buffer.length - 1]?.state.players
                .find(p => p.id === playerId);
        }

        // Linear interpolation
        const t = (now - before.timestamp) /
                  (after.timestamp - before.timestamp);

        const playerBefore = before.state.players.find(p => p.id === playerId);
        const playerAfter = after.state.players.find(p => p.id === playerId);

        return {
            ...playerAfter,
            x: playerBefore.x + (playerAfter.x - playerBefore.x) * t,
            y: playerBefore.y + (playerAfter.y - playerBefore.y) * t
        };
    }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Setup project structure (client/server folders)
- [ ] Install dependencies
- [ ] Configure concurrently for dev workflow
- [ ] Setup basic Express server
- [ ] Setup Socket.io connection
- [ ] Test client-server communication

### Phase 2: Core Server Logic (Week 2)
- [ ] Implement Player entity
- [ ] Implement Obstacle entity
- [ ] Create GameLoop with physics
- [ ] Implement ObstacleSpawner
- [ ] Add collision detection
- [ ] Test game loop independently

### Phase 3: Networking (Week 3)
- [ ] Implement SocketManager
- [ ] Create input validation
- [ ] Add state serialization
- [ ] Implement RoomManager for multiple games
- [ ] Test multiplayer with 2+ clients

### Phase 4: Client Rendering (Week 4)
- [ ] Create GameScene in Phaser
- [ ] Implement sprite rendering
- [ ] Add animations (run, jump, death)
- [ ] Create interpolation system
- [ ] Test smooth rendering

### Phase 5: UI & Polish (Week 5)
- [ ] Create Lobby component
- [ ] Create HUD component
- [ ] Create Leaderboard component
- [ ] Add sound effects
- [ ] Polish animations

### Phase 6: Security & Testing (Week 6)
- [ ] Implement all anti-cheat measures
- [ ] Add comprehensive input validation
- [ ] Load testing (50+ concurrent players)
- [ ] Fix bugs and edge cases

### Phase 7: Deployment (Week 7)
- [ ] Setup production build
- [ ] Configure environment variables
- [ ] Deploy to cloud (AWS/Heroku/DigitalOcean)
- [ ] Setup monitoring & logging
- [ ] Performance optimization

---

## Package.json Configuration

```json
{
  "name": "multiplayer-dino-game",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "cd server && nodemon src/index.js",
    "client:dev": "cd client && vite",
    "build": "npm run client:build && npm run server:build",
    "client:build": "cd client && vite build",
    "server:build": "echo 'No build needed for server'",
    "start": "node server/src/index.js",
    "test": "echo 'Tests not implemented yet'"
  },
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "phaser": "^3.90.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "concurrently": "^8.2.0",
    "nodemon": "^3.0.0",
    "vite": "^6.3.1"
  }
}
```

---

## Deployment Checklist

### Environment Variables

```bash
# .env.example
NODE_ENV=production
PORT=3000
CLIENT_URL=https://yourdomain.com

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/dinogame
```

### Production Optimizations

1. **Enable compression**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Rate limiting**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

3. **Helmet for security**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

4. **HTTPS redirect**
```javascript
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' &&
        process.env.NODE_ENV === 'production') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});
```

---

## Next Steps

1. **Read this document thoroughly**
2. **Setup development environment**
3. **Start with Phase 1 tasks**
4. **Test incrementally at each phase**
5. **Ask questions when stuck**

Good luck building your multiplayer Chrome Dino game! 🦖🎮
