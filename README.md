# 💎 Dizolaur

**A premium 2D skill-based runner game with casino aesthetics, built for real-money competitive multiplayer.**

[📄 Google Docs Design Document](https://docs.google.com/document/d/1_kOpwrOfPp0BgnaTXn4q1uMJS-NrMBHL0xOE_cljx1o/edit?usp=sharing)

---

## 🎮 About the Game

Dizolaur is a Chrome Dino-inspired endless runner with casino-themed premium visuals. Players control a character that runs automatically, jumping to avoid obstacles and land on platforms while collecting points. The game features:

- **Single-player mode** (currently implemented)
- **Premium casino UI** with gold accents and smooth animations
- **Precise hitbox system** for fair gameplay
- **Progressive difficulty** that increases with score
- **Visual effects** including particle systems, glows, and celebrations
- **High score persistence** using localStorage
- **Planned multiplayer** for competitive real-money matches

---

## 🏗️ Project Structure

```
Dizolaur/
├── index.html              # Entry point, loads Phaser and main.js
├── phaser.js              # Phaser 3.88.2 framework (bundled, no CDN)
├── project.config         # Editor metadata
├── README.md              # This file
├── .vscode/
│   └── launch.json        # Chrome debugging configuration
├── .github/
│   └── copilot-instructions.md  # AI coding agent instructions
├── assets/                # Game assets
│   ├── background.png
│   ├── coin.png
│   ├── obstacle.png / obstacleV3.png
│   ├── platform.png
│   ├── player.png         # Spritesheet (24×24, 3 frames)
│   ├── tilesV2.png        # Ground tiles
│   └── Sound effects/
│       ├── combined_slot_machine_mix.mp3
│       ├── game_background.mp3
│       ├── jump.mp3
│       └── start_page.mp3
└── src/                   # Source code (ES6 modules)
    ├── main.js            # Game configuration & scene registration
    └── scenes/
        ├── Start.js       # Main menu / landing page
        ├── Game.js        # Main gameplay scene
        └── GameOver.js    # End screen with score animation
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.x** (for local HTTP server)
  - OR **Node.js** (alternative: `npx http-server`)
- Modern web browser (Chrome, Firefox, Edge)

### Running Locally

1. **Start HTTP Server** (from project root):
   ```bash
   python -m http.server 8000
   ```
   *Why HTTP server?* ES6 modules require HTTP protocol; `file://` won't work.

2. **Open in Browser**:
   ```
   http://localhost:8000
   ```

3. **Clear Cache After Changes**:
   - Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - Or: Open DevTools → Network tab → Check "Disable cache"

### Debugging in VS Code

1. Ensure HTTP server is running (`python -m http.server 8000`)
2. Press `F5` or go to Run & Debug
3. Select "Launch Chrome" configuration
4. Game opens in Chrome with debugging enabled

---

## 🎯 Game Mechanics

### Controls
- **Space Bar** or **Mouse Click** - Jump
- **D Key** - Toggle debug hitboxes (development only)

### Gameplay
- **Objective**: Survive as long as possible, avoid obstacles, use platforms strategically
- **Scoring**: +0.1 points per frame (≈6 points/second)
- **Speed Multiplier**: Increases every 100 points
- **Obstacles**: Red-tinted hazards on the ground (instant game over on collision)
- **Platforms**: Golden floating platforms (1-3 merged together)
  - Land on top to continue jumping
  - Hit from below = head collision (stops upward movement)
  - Fall off edges = start falling

### Physics Parameters
```javascript
jumpPower: -15       // Initial jump velocity
gravity: 0.6         // Acceleration downward
gameSpeed: 6         // Base scrolling speed (increases over time)
groundY: 600        // Ground level position
platformHeight: 100  // Fixed platform height above ground
```

---

## 🛠️ Technical Architecture

### Framework
- **Phaser 3.88.2** (game engine, bundled locally)
- **Vanilla JavaScript** (ES6 modules)
- **No build step** - runs directly in browser

### Scene Flow
```
Start → Game → GameOver
  ↑      ↓         ↓
  └──────┴─────────┘
```

### Game.js Structure (Refactored)
The main game scene is organized into 10 logical sections:

1. **Scene Lifecycle** - `preload()`, `create()`, `update()`
2. **Initialization** - Asset loading, state setup
3. **Background & Visuals** - Clouds, stars, decorations
4. **Player Controls** - Jump mechanics
5. **Particle Effects** - Jump dust, sparkles, explosions
6. **Update Loop** - Physics, scoring, spawning
7. **Spawning** - Obstacles, platforms, birds
8. **Collision Detection** - Precise hitbox system
9. **UI Creation** - Score, speed, title panels
10. **Game Over & Celebrations** - Milestones, explosions

### Hitbox System
Custom hitbox dimensions for pixel-perfect collision:

| Element   | Visual Size | Hitbox Size | Notes |
|-----------|-------------|-------------|-------|
| Player    | 100%        | 60% width, 70% height | Forgiving on sides |
| Obstacles | 100%        | 65% width, 75% height | Fair collision |
| Platforms | 100%        | 95% width, 30% height | Top surface only |

---

## 🎨 Visual Features

### Premium UI Elements
- Gold borders with pulsing glow animation
- Dark overlay with vignette effect
- Score panel with shadow text
- Speed multiplier indicator
- Corner accent decorations

### Particle Systems
- **Jump Dust**: Gold particles on takeoff
- **Player Trail**: Green fading circles
- **Random Sparkles**: Ambient gold sparkles
- **Explosion**: Red burst on collision (20 particles)
- **Milestone Fireworks**: Gold particles every 100 points
- **Minor Celebrations**: Green burst every 50 points

### Environmental Decorations
- 5 slow-moving clouds (40-60s cycles)
- 15 twinkling stars with pulse animation
- Flying birds with flapping wings and bobbing motion
- Ground shadow for depth effect

---

## 🔊 Audio

| Sound | File | Usage |
|-------|------|-------|
| Jump | `jump.mp3` | Player jump action |
| Background | `game_background.mp3` | Loops during gameplay (0.5 volume) |
| Start Page | `start_page.mp3` | Loops on main menu |
| Score Reveal | `combined_slot_machine_mix.mp3` | Game over screen |

---

## 💾 Data Persistence

### localStorage Keys
- `dizolaur_highscore` - Stores best score (integer)

### Saving High Score
```javascript
// Automatically saved in GameOver scene
if (finalScore > currentHighScore) {
    localStorage.setItem('dizolaur_highscore', finalScore);
}
```

---

## 🐛 Known Issues & Solutions

### ✅ Resolved Issues
- Hitbox larger than visual object
- Player falling through platforms
- Impossible obstacle/platform combinations

### 🔄 Current Considerations
- **Milestone flash**: Quick flash effect at 100-point intervals (subtle, non-blocking)
- **Platform difficulty**: Fixed height ensures consistent gameplay
- **Performance**: All particles auto-destroy to prevent memory leaks

---

## 🎯 Roadmap

### ✅ Completed (Phase 1 - Single Player)
- [x] Core runner mechanics (jump, physics, scrolling)
- [x] Obstacle spawning with collision detection
- [x] Platform system (landing, head collision, edge fall)
- [x] Score tracking with high score persistence
- [x] Premium casino UI design
- [x] Visual effects and particle systems
- [x] Sound effects and background music
- [x] Precise hitbox system
- [x] Code refactoring for maintainability

### 🚧 In Progress (Phase 2 - Multiplayer)
- [ ] **Architecture Design**: Choose backend (Socket.io / Colyseus / Firebase)
- [ ] **Server Development**: WebSocket server, room management, state sync
- [ ] **Client Integration**: Multiplayer sync, ghost players, disconnect handling
- [ ] **Leaderboard**: Live rankings, match results, player statistics

### 📋 Planned Features
- Real-money betting system
- Match lobbies and matchmaking
- Replay system
- Power-ups and collectibles
- Additional obstacle types
- More platform patterns
- Mobile responsive controls

---

## 👥 Development Team

### Getting Started as a New Developer

1. **Read this README** thoroughly
2. **Check `.github/copilot-instructions.md`** for coding guidelines
3. **Run the game locally** and play a few rounds
4. **Press 'D' in-game** to see debug hitboxes
5. **Read `Game.js` structure** (well-commented sections)
6. **Check browser console** for Phaser logs and errors

### Code Conventions

- **ES6 modules**: Always include `.js` extension in imports
  ```javascript
  import { Start } from './scenes/Start.js';  // ✅ Correct
  import { Start } from './scenes/Start';     // ❌ Wrong
  ```

- **Scene lifecycle**: Use `preload()` → `create()` → `update()` pattern
  ```javascript
  preload() { /* Load assets */ }
  create()  { /* Initialize game objects */ }
  update()  { /* Run every frame */ }
  ```

- **Asset paths**: Relative to project root
  ```javascript
  this.load.image('sprite', 'assets/sprite.png');  // ✅
  ```

- **Method organization**: Group related methods with section headers
  ```javascript
  // ============================================================================
  // SECTION NAME
  // ============================================================================
  ```

### Testing Changes

1. Make code changes
2. Save files
3. Refresh browser with `Ctrl + Shift + R`
4. Check console for errors
5. Test gameplay thoroughly
6. Verify hitboxes with 'D' key if needed

---

## 📚 Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 Examples](https://phaser.io/examples)
- [ES6 Modules Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Project Design Document](https://docs.google.com/document/d/1_kOpwrOfPp0BgnaTXn4q1uMJS-NrMBHL0xOE_cljx1o/edit?usp=sharing)

---

## 📝 License

*Add license information here*

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes following code conventions
3. Test thoroughly (including cache refresh)
4. Submit pull request with detailed description

---

**Built with ❤️ and Phaser 3**