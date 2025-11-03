# Dizolaur - AI Coding Agent Instructions

## Project Overview
Dizolaur is a 2D skill-based game built with **Phaser 3.88.2** (bundled locally as `phaser.js`). This is a static web project with no build step—ES6 modules are loaded directly in the browser via HTTP server.

## Architecture & Entry Points
- **Entry HTML**: `index.html` loads `phaser.js` (framework) then `src/main.js` (module entry)
- **Game Bootstrap**: `src/main.js` defines Phaser config (1280×720, FIT scale mode, centered) and registers scenes
- **Scene Pattern**: All game scenes extend `Phaser.Scene` and live in `src/scenes/`. Currently: `Start.js`
- **Assets**: `assets/` contains images/spritesheets (e.g., `background.png`, `player.png`). Reference from preload as `'assets/filename.png'`

## Critical Workflow: Running the Project
**No build step exists.** ES6 modules require an HTTP server (not `file://`):

1. Start server from workspace root:
   ```powershell
   python -m http.server 8000
   # or: npx http-server -p 8000
   ```
2. Open `http://localhost:8000` in browser
3. **Cache issues**: Use Ctrl+Shift+R or DevTools → Network → "Disable cache" to see asset/code changes

Debug config exists in `.vscode/launch.json` (Chrome launch on port 8000)—requires server running first.

## Code Conventions
- **Scene Lifecycle**: `preload()` loads assets, `create()` initializes game objects, `update()` runs per frame
- **Asset Loading**: Use `this.load.image('key', 'assets/filename.png')` in preload; reference by key in create
- **Sprite Animations**: Define with `ship.anims.create()` (see `Start.js:22-27` for pattern)
- **Module Imports**: Always use `.js` extension in imports (e.g., `import { Start } from './scenes/Start.js'`)

## Project-Specific Patterns (Start.js)
- **Scrolling Background**: `this.add.tileSprite()` in create + `this.background.tilePositionX += 2` in update
- **Logo Animation**: Tweens used for y-axis oscillation (`yoyo: true, loop: -1`)
- **Ship Sprite**: 24×24 frameWidth spritesheet with 3-frame fly animation (0-2, 15fps loop)

## Adding New Scenes
1. Create scene class in `src/scenes/YourScene.js` extending `Phaser.Scene`
2. Import and register in `src/main.js` config's `scene: []` array
3. Scene key (constructor super) controls `this.scene.start('key')` transitions

## Configuration Files
- `project.config`: Editor metadata (Phaser version, canvas size)—edit `src/main.js` config for actual game settings
- Canvas size: 1280×720 (defined in both files but `main.js` is authoritative)

## Browser Debugging
- Phaser logs to console—check for asset load errors, scene transitions
- Use browser DevTools → Sources to set breakpoints in `src/**/*.js` files
- Network tab shows asset requests (watch for 404s if paths wrong)
