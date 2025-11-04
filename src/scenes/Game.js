/**
 * Game Scene - Main Gameplay
 * 
 * Structure:
 * 1. Scene Lifecycle Methods (preload, create, update)
 * 2. Initialization Methods (loading, setup, configuration)
 * 3. Background & Visual Decoration Methods
 * 4. Player Control Methods
 * 5. Particle Effect Methods
 * 6. Update Loop Methods (physics, scoring, spawning)
 * 7. Spawning Methods (obstacles, platforms, birds)
 * 8. Collision Detection Methods
 * 9. UI Creation Methods
 * 10. Game Over & Celebration Methods
 */
import { BaseScene, DEPTH } from './BaseScene.js';

export class Game extends BaseScene {

    constructor() {
        super('Game');
    }

    // ============================================================================
    // SCENE LIFECYCLE METHODS
    // ============================================================================

    init() {
        // Force cleanup of any existing game objects from previous runs
        // This runs BEFORE create() and ensures a clean slate
        try {
            if (this.obstacles && this.obstacles.clear) {
                this.obstacles.clear(true, true);
            }
            this.obstacles = null;
            
            if (this.pushObstacles && this.pushObstacles.clear) {
                this.pushObstacles.clear(true, true);
            }
            this.pushObstacles = null;
            
            if (this.platforms && this.platforms.clear) {
                this.platforms.clear(true, true);
            }
            this.platforms = null;
            
            if (this.birds && this.birds.clear) {
                this.birds.clear(true, true);
            }
            this.birds = null;
            
            if (this.remotePlayerSprites) {
                Object.keys(this.remotePlayerSprites).forEach(playerId => {
                    try {
                        if (this.remotePlayerSprites[playerId].sprite) {
                            this.remotePlayerSprites[playerId].sprite.destroy();
                        }
                        if (this.remotePlayerSprites[playerId].nameText) {
                            this.remotePlayerSprites[playerId].nameText.destroy();
                        }
                    } catch (e) {
                        console.warn('Error destroying remote player sprite:', e);
                    }
                });
            }
            this.remotePlayerSprites = null;
            this.remotePlayers = null;
            
            // CRITICAL: Reset seeded RNG state to prevent old seed from persisting
            this.mapSeed = null;
            this.rngState = null;
        } catch (e) {
            console.warn('Error in init cleanup:', e);
        }
    }

    preload() {
        this.loadAssets();
        this.loadSounds();
    }

    create() {
        this.initializeGameState();
        this.initializeMultiplayer();
        this.createBackground();
        this.createGround();
        this.createPlayer();
        this.setupInput();
        this.createPremiumUI();
        this.setupGameObjects();
        this.setupSounds();
        this.setupDebugMode();
        this.setupVisualEnhancements();
        
        // Show start countdown for multiplayer games
        if (this.isMultiplayer) {
            this.showStartCountdown();
        }
    }

    update() {
        if (this.isGameOver) return;

        this.updateBackground();
        this.updatePlayerTrail();
        this.updatePlayerPhysics();
        this.updateScore();
        this.spawnGameObjects();
        this.updateGameObjects();
        this.updateMultiplayer();
        this.renderDebugHitboxes();
    }

    // ============================================================================
    // INITIALIZATION METHODS
    // ============================================================================

    loadAssets() {
        this.load.image('ground', 'assets/tilesV2.png');
        this.load.image('obstacle', 'assets/obstacleV4.png');
        this.load.image('pushObstacle', 'assets/push_obstacle.png');
        this.load.image('platform', 'assets/platform.png');
        this.load.spritesheet('player', 'assets/player.png', { frameWidth: 24, frameHeight: 24 });
        this.load.image('coin', 'assets/coin.png');
    }

    loadSounds() {
        this.load.audio('jumpSound', 'assets/Sound effects/jump.mp3');
        this.load.audio('bgMusic', 'assets/Sound effects/game_background.mp3');
    }

    initializeGameState() {
        // Game state variables
        this.isGameOver = false;
        this.score = 0;
        this.gameSpeed = 6;
        this.groundY = 600;
        
        // Physics constants
        this.jumpPower = -15;
        this.gravity = 0.6;
        
        // Variable jump state
        this.isSpacePressed = false;
        this.jumpHoldTime = 0;
        this.minJumpTime = 100; // Minimum hold time for short hop (ms)
        this.maxJumpTime = 400; // Maximum hold time for full jump (ms)
        
        // Seeded RNG for synchronized multiplayer maps
        this.mapSeed = null;
        this.rngState = null;
    }
    
    /**
     * Seeded random number generator for synchronized obstacle spawning
     * Uses a simple LCG (Linear Congruential Generator) algorithm
     */
    seededRandom() {
        if (this.rngState === null) {
            // Fallback to Math.random if no seed is set (single player)
            return Math.random();
        }
        // LCG formula: (a * state + c) % m
        this.rngState = (this.rngState * 1664525 + 1013904223) % 4294967296;
        return this.rngState / 4294967296;
    }
    
    /**
     * Initialize the seeded RNG with a given seed
     */
    setSeed(seed) {
        this.mapSeed = seed;
        // Convert float seed to integer state
        this.rngState = Math.floor(seed * 4294967296);
        console.log('Map seed set:', seed, '-> state:', this.rngState);
    }

    initializeMultiplayer() {
        // Check if this is a multiplayer game
        this.isMultiplayer = this.registry.get('isMultiplayer') || false;
        this.multiplayer = this.registry.get('multiplayerManager') || null;
        
        // CRITICAL: Get the map seed from registry (set by Start scene)
        const seedFromRegistry = this.registry.get('mapSeed');
        console.log('🎲 Checking for seed in registry:', seedFromRegistry);
        if (seedFromRegistry !== undefined && seedFromRegistry !== null) {
            console.log('✅ Setting seed from registry:', seedFromRegistry);
            this.setSeed(seedFromRegistry);
            // Clear it from registry after reading
            this.registry.set('mapSeed', null);
        } else {
            console.warn('⚠️ NO SEED FOUND IN REGISTRY! Map will be random per player!');
        }
        
        // Remote players container
        this.remotePlayers = {};
        this.remotePlayerSprites = {};
        
        // Throttle multiplayer updates (don't send every frame)
        this.multiplayerUpdateCounter = 0;
        this.multiplayerUpdateInterval = 3; // Send update every 3 frames
        
        // Countdown display element
        this.countdownDisplay = null;
        
        if (this.isMultiplayer && this.multiplayer) {
            console.log('Multiplayer mode enabled');
            
            // Remove any existing event listeners to prevent duplicates
            this.multiplayer.socket.off('countdownUpdate');
            this.multiplayer.socket.off('gameStarted');
            this.multiplayer.socket.off('gameEnded');
            
            // Listen for countdown updates from server (in lobby)
            this.multiplayer.socket.on('countdownUpdate', (data) => {
                this.showCountdownOnScreen(data.seconds);
            });
            
            // Listen for game start (capture seed for synchronized map)
            this.multiplayer.socket.on('gameStarted', (data) => {
                console.log('Game started event received in Game scene', data);
                
                // Set the seed for synchronized obstacle spawning
                if (data && data.seed !== undefined) {
                    this.setSeed(data.seed);
                }
                
                if (this.countdownDisplay) {
                    this.countdownDisplay.destroy();
                    this.countdownDisplay = null;
                }
            });
            
            // Listen for game ended event (winner announcement)
            this.multiplayer.socket.on('gameEnded', (data) => {
                console.log('Game ended!', data);
                
                // Show winner announcement
                if (data.winner) {
                    this.showWinnerAnnouncement(data.winner);
                }
                
                // Transition to GameOver after 3 seconds
                this.time.delayedCall(3000, () => {
                    this.gameOver();
                });
            });
        }
    }

    createBackground() {
        // Scrolling background
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');
        
        // Dark overlay for premium look
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.2);
        
        // Subtle vignette effect
        const vignette = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0);
        vignette.setStrokeStyle(150, 0x000000, 0.3);
    }

    createGround() {
        // Seamless tileSprite with premium styling
        this.ground = this.add.tileSprite(640, this.groundY, 1280, 15, 'ground');
        this.ground.setScale(1, 4);
        this.ground.setTint(0xcccccc);
        
        // Ground shadow/depth effect
        const groundShadow = this.add.rectangle(640, this.groundY - 25, 1280, 8, 0x000000, 0.4);
    }

    createPlayer() {
        const playerY = this.groundY - 24;
        this.player = this.add.sprite(200, playerY, 'player');
        this.player.setScale(2.2);
        
        // Set precise hitbox
        this.player.setDisplaySize(24 * 2.2, 24 * 2.2);
        this.player.hitboxWidth = 24 * 2.2 * 0.6;
        this.player.hitboxHeight = 24 * 2.2 * 0.7;
        this.player.hitboxOffsetY = 2;
        
        // Visual effects
        this.player.setTint(0xffffff);
        this.player.preFX.addGlow(0x00ff88, 2, 0, false, 0.1, 8);
        
        // Animation
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
            frameRate: 12,
            repeat: -1
        });
        this.player.play('run');
        
        // Physics properties
        this.player.isJumping = false;
        this.player.velocityY = 0;
        this.player.groundY = playerY;
    }

    setupInput() {
        // Space key for variable jump
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.keyboard.on('keydown-SPACE', () => this.startJump());
        this.input.keyboard.on('keyup-SPACE', () => this.releaseJump());
        
        // Mouse/touch for full jump (no variable height)
        this.input.on('pointerdown', () => this.jump());
    }

    setupGameObjects() {
        // Regular obstacles (game over on collision)
        this.obstacles = this.add.group();
        this.obstacleTimer = 0;
        this.minObstacleInterval = 80;
        this.maxObstacleInterval = 150;
        this.nextObstacleTime = Phaser.Math.Between(this.minObstacleInterval, this.maxObstacleInterval);
        
        // Push obstacles (push player back on collision)
        this.pushObstacles = this.add.group();
        this.pushObstacleTimer = 0;
        this.minPushObstacleInterval = 200;
        this.maxPushObstacleInterval = 400;
        this.nextPushObstacleTime = Phaser.Math.Between(this.minPushObstacleInterval, this.maxPushObstacleInterval);
        
        // Obstacle spacing control - prevents overlapping
        this.minObstacleDistance = 200; // Minimum horizontal distance between any obstacles (configurable)
        this.lastObstacleX = -1000; // Track X position of last spawned obstacle (start far left)
        this.lastObstacleType = null; // Track type: 'regular' or 'push'
        
        // Platforms
        this.platforms = this.add.group();
        this.platformTimer = 0;
        this.minPlatformInterval = 100;
        this.maxPlatformInterval = 200;
        this.nextPlatformTime = Phaser.Math.Between(this.minPlatformInterval, this.maxPlatformInterval);
        
        // Push effect state
        this.isPushingBack = false;
    }

    setupSounds() {
        this.jumpSound = this.sound.add('jumpSound');
        this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.5 });
        this.bgMusic.play();
    }

    setupDebugMode() {
        this.debugHitboxes = false;
        this.debugGraphics = this.add.graphics();
        this.input.keyboard.on('keydown-D', () => {
            this.debugHitboxes = !this.debugHitboxes;
        });
    }
    
    setupVisualEnhancements() {
        // Birds
        this.birds = this.add.group();
        this.birdTimer = 0;
        this.nextBirdTime = Phaser.Math.Between(100, 200);
        
        // Sparkles
        this.sparkleTimer = 0;
        
        // Create background decorations
        this.createBackgroundDecorations();
    }

    // ============================================================================
    // BACKGROUND & VISUAL DECORATION METHODS
    // ============================================================================

    createBackgroundDecorations() {
        // Create slow-moving decorative elements in background
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(0, 1280);
            const y = Phaser.Math.Between(50, 300);
            const cloud = this.add.ellipse(x, y, 
                Phaser.Math.Between(60, 120), 
                Phaser.Math.Between(30, 50), 
                0xffffff, 0.1);
            
            this.tweens.add({
                targets: cloud,
                x: x - 1500,
                duration: Phaser.Math.Between(40000, 60000),
                ease: 'Linear',
                repeat: -1,
                onRepeat: () => {
                    cloud.x = 1280 + 100;
                    cloud.y = Phaser.Math.Between(50, 300);
                }
            });
        }
        
        // Add twinkling stars/sparkles in background
        for (let i = 0; i < 15; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, 1280),
                Phaser.Math.Between(50, 400),
                2, 0xffd700, 0.6
            );
            
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                scale: 0.5,
                duration: Phaser.Math.Between(1000, 2000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }
    }

    // ============================================================================
    // PLAYER CONTROL METHODS
    // ============================================================================

    startJump() {
        if (this.isGameOver || this.player.isJumping) return;

        this.player.isJumping = true;
        this.player.velocityY = this.jumpPower;
        this.isSpacePressed = true;
        this.jumpHoldTime = 0;
        this.jumpSound.play();
        this.createJumpEffect(this.player.x, this.player.y + 20);
    }

    releaseJump() {
        this.isSpacePressed = false;
        
        // Cut jump short if released early and still moving upward
        if (this.player.isJumping && this.player.velocityY < 0) {
            // Reduce upward velocity to make jump shorter
            this.player.velocityY *= 0.4;
        }
    }

    jump() {
        // Used for mouse/touch input - full jump with no variable height
        if (this.isGameOver || this.player.isJumping) return;

        this.player.isJumping = true;
        this.player.velocityY = this.jumpPower;
        this.jumpSound.play();
        this.createJumpEffect(this.player.x, this.player.y + 20);
    }

    // ============================================================================
    // PARTICLE EFFECT METHODS
    // ============================================================================

    createJumpEffect(x, y) {
        // Create small particles for jump effect
        for (let i = 0; i < 5; i++) {
            const particle = this.add.circle(x + Phaser.Math.Between(-10, 10), y, 3, 0xffd700, 0.8);
            this.tweens.add({
                targets: particle,
                y: y + Phaser.Math.Between(10, 20),
                x: particle.x + Phaser.Math.Between(-20, 20),
                alpha: 0,
                scale: 0,
                duration: 300,
                ease: 'Cubic.out',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createSparkle(x, y) {
        // Create random sparkle effects around the game
        const sparkle = this.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffd700, 0.8);
        this.tweens.add({
            targets: sparkle,
            alpha: 0,
            scale: 0.2,
            duration: 600,
            ease: 'Cubic.out',
            onComplete: () => sparkle.destroy()
        });
    }

    // ============================================================================
    // UPDATE LOOP METHODS
    // ============================================================================

    updateBackground() {
        this.background.tilePositionX += this.gameSpeed * 0.5;
        this.ground.tilePositionX += this.gameSpeed;
    }

    updatePlayerTrail() {
        if (Math.random() < 0.3) {
            const trail = this.add.circle(
                this.player.x - 15,
                this.player.y,
                Phaser.Math.Between(3, 6),
                0x00ff88,
                0.4
            );
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Cubic.out',
                onComplete: () => trail.destroy()
            });
        }
    }

    updatePlayerPhysics() {
        this.checkPlatformStanding();
        this.applyPhysics();
    }

    checkPlatformStanding() {
        // Check if player is on a platform or should fall
        let onPlatform = false;
        if (!this.player.isJumping && this.player.y < this.player.groundY) {
            // Player is above ground and not jumping - check if standing on platform
            this.platforms.children.entries.forEach(platform => {
                const platformTop = platform.y - (platform.hitboxHeight / 2);
                const platformLeft = platform.x - (platform.hitboxWidth / 2);
                const platformRight = platform.x + (platform.hitboxWidth / 2);
                const playerBottom = this.player.y + (this.player.hitboxHeight / 2) + this.player.hitboxOffsetY;
                
                if (Math.abs(playerBottom - platformTop) < platform.collisionPadding && // Player is at platform height
                    this.player.x > platformLeft &&
                    this.player.x < platformRight) {
                    onPlatform = true;
                    // Ensure player is grounded on platform (can jump)
                    this.player.isJumping = false;
                    this.player.velocityY = 0;
                }
            });
            
            // If not on a platform, start falling
            if (!onPlatform) {
                this.player.isJumping = true;
                this.player.velocityY = 0;
            }
        }
    }

    applyPhysics() {
        if (this.player.isJumping || this.player.velocityY !== 0) {
            // Apply variable jump mechanics
            if (this.isSpacePressed && this.player.velocityY < 0) {
                // While space is held and moving upward, reduce gravity effect
                this.jumpHoldTime += 16.67; // Approximate ms per frame (60fps)
                
                if (this.jumpHoldTime < this.maxJumpTime) {
                    // Apply reduced gravity while holding space (allows higher jump)
                    this.player.velocityY += this.gravity * 0.5;
                } else {
                    // Max hold time reached, apply normal gravity
                    this.player.velocityY += this.gravity;
                }
            } else {
                // Normal gravity when not holding space or moving downward
                this.player.velocityY += this.gravity;
            }
            
            // Store previous Y position before applying velocity
            const previousY = this.player.y;
            this.player.y += this.player.velocityY;

            // Check platform collisions using precise hitboxes
            let landedOnPlatform = false;
            this.platforms.children.entries.forEach(platform => {
                const platformTop = platform.y - (platform.hitboxHeight / 2);
                const platformBottom = platform.y + (platform.hitboxHeight / 2);
                const platformLeft = platform.x - (platform.hitboxWidth / 2);
                const platformRight = platform.x + (platform.hitboxWidth / 2);
                
                const playerTop = this.player.y - (this.player.hitboxHeight / 2) + this.player.hitboxOffsetY;
                const playerBottom = this.player.y + (this.player.hitboxHeight / 2) + this.player.hitboxOffsetY;
                const previousPlayerBottom = previousY + (this.player.hitboxHeight / 2) + this.player.hitboxOffsetY;
                
                // Check if player is horizontally aligned with platform
                if (this.player.x > platformLeft && this.player.x < platformRight) {
                    
                    // Landing on top of platform (falling down)
                    // Check if player was above platform in previous frame and is now at or below platform top
                    if (this.player.velocityY > 0 && 
                        previousPlayerBottom <= platformTop &&
                        playerBottom >= platformTop) {
                        // Snap player to platform top
                        this.player.y = platformTop - (this.player.hitboxHeight / 2) - this.player.hitboxOffsetY;
                        this.player.velocityY = 0;
                        this.player.isJumping = false;
                        landedOnPlatform = true;
                    }
                    
                    // Hitting head on bottom of platform (jumping up)
                    if (this.player.velocityY < 0 && 
                        playerTop <= platformBottom &&
                        playerTop >= platformBottom - platform.collisionPadding) {
                        this.player.y = platformBottom + (this.player.hitboxHeight / 2) - this.player.hitboxOffsetY;
                        this.player.velocityY = 0; // Stop upward movement
                    }
                }
            });

            // Land on ground
            if (!landedOnPlatform && this.player.y >= this.player.groundY) {
                this.player.y = this.player.groundY;
                this.player.velocityY = 0;
                this.player.isJumping = false;
            }
        }
    }

    updateScore() {
        const previousScore = Math.floor(this.score);
        this.score += 0.1;
        const displayScore = Math.floor(this.score).toString();
        
        this.scoreText.setText(displayScore);
        this.scoreShadow.setText(displayScore);
        
        this.checkMilestones(previousScore);
    }

    checkMilestones(previousScore) {
        const currentScore = Math.floor(this.score);
        
        // Major milestone (every 100 points)
        if (currentScore % 100 === 0 && currentScore > previousScore) {
            this.gameSpeed += 0.1;
            this.speedText.setText((this.gameSpeed / 6).toFixed(1) + 'x');
            this.createMilestoneCelebration();
        }
        
        // Minor milestone (every 50 points, but not 100)
        if (currentScore % 50 === 0 && currentScore > previousScore && currentScore % 100 !== 0) {
            this.createMinorCelebration();
        }
    }

    spawnGameObjects() {
        this.spawnObstacles();
        this.spawnPushObstacles();
        this.spawnPlatforms();
        this.spawnBirds();
        this.spawnSparkles();
    }

    spawnObstacles() {
        // Spawn regular obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer >= this.nextObstacleTime) {
            // Check if enough distance from last obstacle
            if (this.canSpawnObstacle()) {
                this.spawnObstacle();
                this.obstacleTimer = 0;
                // Calculate next spawn time (gets faster as game progresses)
                const speedFactor = Math.max(0.5, 1 - (this.score / 1000));
                const min = Math.floor(this.minObstacleInterval * speedFactor);
                const max = Math.floor(this.maxObstacleInterval * speedFactor);
                this.nextObstacleTime = Math.floor(this.seededRandom() * (max - min + 1)) + min;
            } else {
                // Not enough distance, wait a few frames before trying again
                this.obstacleTimer = Math.max(0, this.nextObstacleTime - 10);
            }
        }
    }

    spawnPushObstacles() {
        // Spawn push obstacles
        this.pushObstacleTimer++;
        if (this.pushObstacleTimer >= this.nextPushObstacleTime) {
            // Check if enough distance from last obstacle
            if (this.canSpawnObstacle()) {
                this.spawnPushObstacle();
                this.pushObstacleTimer = 0;
                // Less frequent than regular obstacles
                const speedFactor = Math.max(0.7, 1 - (this.score / 1500));
                const min = Math.floor(this.minPushObstacleInterval * speedFactor);
                const max = Math.floor(this.maxPushObstacleInterval * speedFactor);
                this.nextPushObstacleTime = Math.floor(this.seededRandom() * (max - min + 1)) + min;
            } else {
                // Not enough distance, wait a few frames before trying again
                this.pushObstacleTimer = Math.max(0, this.nextPushObstacleTime - 10);
            }
        }
    }

    spawnPlatforms() {
        this.platformTimer++;
        if (this.platformTimer >= this.nextPlatformTime) {
            this.spawnPlatform();
            this.platformTimer = 0;
            const speedFactor = Math.max(0.6, 1 - (this.score / 1500));
            const min = Math.floor(this.minPlatformInterval * speedFactor);
            const max = Math.floor(this.maxPlatformInterval * speedFactor);
            this.nextPlatformTime = Math.floor(this.seededRandom() * (max - min + 1)) + min;
        }
    }

    spawnBirds() {
        this.birdTimer++;
        if (this.birdTimer >= this.nextBirdTime) {
            this.spawnBird();
            this.birdTimer = 0;
            this.nextBirdTime = Math.floor(this.seededRandom() * 100) + 100; // 100-200
        }
    }

    spawnSparkles() {
        this.sparkleTimer++;
        if (this.sparkleTimer >= 15) {
            this.createSparkle(
                this.player.x + Phaser.Math.Between(-100, 100),
                this.player.y + Phaser.Math.Between(-80, 80)
            );
            this.sparkleTimer = 0;
        }
    }

    updateGameObjects() {
        this.updateObstacles();
        this.updatePushObstacles();
        this.updatePlatforms();
        this.updateBirds();
    }

    updateObstacles() {
        this.obstacles.children.entries.forEach(obstacle => {
            obstacle.x -= this.gameSpeed;

            // Remove obstacles that are off screen
            if (obstacle.x < -50) {
                obstacle.destroy();
            }

            // Check collision with player
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
            }
        });
    }

    updatePushObstacles() {
        this.pushObstacles.children.entries.forEach(obstacle => {
            obstacle.x -= this.gameSpeed;

            // Remove obstacles that are off screen
            if (obstacle.x < -50) {
                obstacle.destroy();
            }

            // Check collision with player - push back instead of game over
            if (!this.isPushingBack && this.checkCollision(this.player, obstacle)) {
                this.pushPlayerBack();
            }
        });
    }

    updatePlatforms() {
        this.platforms.children.entries.forEach(platform => {
            platform.x -= this.gameSpeed;

            // Remove platforms that are off screen
            if (platform.x < -100) {
                platform.destroy();
            }
        });
    }

    updateBirds() {
        this.birds.children.entries.forEach(bird => {
            bird.x -= bird.moveSpeed;

            // Remove birds that are off screen
            if (bird.x < -100) {
                bird.destroy();
            }
        });
    }

    updateMultiplayer() {
        if (!this.isMultiplayer || !this.multiplayer) return;

        // Throttle updates - don't send every frame
        this.multiplayerUpdateCounter++;
        if (this.multiplayerUpdateCounter >= this.multiplayerUpdateInterval) {
            this.multiplayerUpdateCounter = 0;
            
            // Send player position to server
            this.multiplayer.sendPlayerUpdate(
                this.player.x,
                this.player.y,
                Math.floor(this.score),
                !this.isGameOver,
                this.player.isJumping
            );
        }

        // Update remote player sprites
        const remotePlayers = this.multiplayer.getRemotePlayers();
        
        // Create or update sprites for each remote player
        Object.keys(remotePlayers).forEach(playerId => {
            const remoteData = remotePlayers[playerId];
            
            if (!this.remotePlayerSprites[playerId]) {
                // Create new sprite for this player
                const sprite = this.add.sprite(remoteData.x, remoteData.y, 'player');
                sprite.setScale(2.2);
                sprite.setAlpha(0.6); // Ghost effect
                sprite.setTint(0x00aaff); // Blue tint for remote players
                sprite.play('run');
                
                // Add name label
                const nameText = this.add.text(remoteData.x, remoteData.y - 50, remoteData.name, {
                    fontSize: '16px',
                    fill: '#00aaff',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
                
                this.remotePlayerSprites[playerId] = {
                    sprite: sprite,
                    nameText: nameText,
                    targetX: remoteData.x,
                    targetY: remoteData.y
                };
            }
            
            // Update sprite position with smooth interpolation
            const remotePlayer = this.remotePlayerSprites[playerId];
            remotePlayer.targetX = remoteData.x;
            remotePlayer.targetY = remoteData.y;
            
            // Smooth movement (interpolation)
            remotePlayer.sprite.x += (remotePlayer.targetX - remotePlayer.sprite.x) * 0.3;
            remotePlayer.sprite.y += (remotePlayer.targetY - remotePlayer.sprite.y) * 0.3;
            remotePlayer.nameText.x = remotePlayer.sprite.x;
            remotePlayer.nameText.y = remotePlayer.sprite.y - 50;
            
            // Update animation based on state
            if (!remoteData.isAlive) {
                remotePlayer.sprite.setAlpha(0.3);
                remotePlayer.nameText.setAlpha(0.3);
            }
        });
        
        // Remove sprites for players who left
        Object.keys(this.remotePlayerSprites).forEach(playerId => {
            if (!remotePlayers[playerId]) {
                this.remotePlayerSprites[playerId].sprite.destroy();
                this.remotePlayerSprites[playerId].nameText.destroy();
                delete this.remotePlayerSprites[playerId];
            }
        });
    }

    renderDebugHitboxes() {
        if (this.debugHitboxes) {
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(2, 0x00ff00, 1);
            
            // Draw player hitbox
            this.debugGraphics.strokeRect(
                this.player.x - (this.player.hitboxWidth / 2),
                this.player.y - (this.player.hitboxHeight / 2) + this.player.hitboxOffsetY,
                this.player.hitboxWidth,
                this.player.hitboxHeight
            );
            
            // Draw obstacle hitboxes (red for deadly)
            this.obstacles.children.entries.forEach(obstacle => {
                this.debugGraphics.lineStyle(2, 0xff0000, 1);
                this.debugGraphics.strokeRect(
                    obstacle.x - (obstacle.hitboxWidth / 2),
                    obstacle.y - obstacle.hitboxHeight + obstacle.hitboxOffsetY,
                    obstacle.hitboxWidth,
                    obstacle.hitboxHeight
                );
            });
            
            // Draw push obstacle hitboxes (orange for push-back)
            this.pushObstacles.children.entries.forEach(obstacle => {
                this.debugGraphics.lineStyle(2, 0xffaa00, 1);
                this.debugGraphics.strokeRect(
                    obstacle.x - (obstacle.hitboxWidth / 2),
                    obstacle.y - obstacle.hitboxHeight + obstacle.hitboxOffsetY,
                    obstacle.hitboxWidth,
                    obstacle.hitboxHeight
                );
            });
            
            // Draw platform hitboxes
            this.platforms.children.entries.forEach(platform => {
                this.debugGraphics.lineStyle(2, 0xffff00, 1);
                this.debugGraphics.strokeRect(
                    platform.x - (platform.hitboxWidth / 2),
                    platform.y - (platform.hitboxHeight / 2),
                    platform.hitboxWidth,
                    platform.hitboxHeight
                );
            });
        } else {
            this.debugGraphics.clear();
        }
    }

    // ============================================================================
    // SPAWNING METHODS
    // ============================================================================

    canSpawnObstacle() {
        // Check if there's enough distance from the rightmost obstacle
        const spawnX = 1280 + 50; // Default spawn position
        
        // Find the rightmost obstacle currently on screen from both types
        let rightmostX = -1000; // Start with far left position
        
        // Check regular obstacles
        this.obstacles.children.entries.forEach(obstacle => {
            if (obstacle.x > rightmostX) {
                rightmostX = obstacle.x;
            }
        });
        
        // Check push obstacles
        this.pushObstacles.children.entries.forEach(obstacle => {
            if (obstacle.x > rightmostX) {
                rightmostX = obstacle.x;
            }
        });
        
        // Calculate distance from rightmost obstacle to spawn point
        const distance = spawnX - rightmostX;
        
        // Allow spawn if distance is greater than minimum
        return distance >= this.minObstacleDistance;
    }

    spawnObstacle() {
        // Spawn obstacle at same Y position as player (on ground level)
        const spawnX = 1280 + 50;
        const obstacle = this.add.sprite(spawnX, this.player.groundY, 'obstacle');
        obstacle.setScale(2.2); // Match player scale for consistency
        obstacle.setOrigin(0.5, 0.8);
        obstacle.setTint(0xff6666); // Red tint for danger
        
        // Set precise hitbox for obstacle (reduce by 25% for fair gameplay)
        obstacle.hitboxWidth = obstacle.width * 2.2 * 0.65; // 65% of visual width
        obstacle.hitboxHeight = obstacle.height * 2.2 * 0.75; // 75% of visual height
        obstacle.hitboxOffsetY = obstacle.height * 2.2 * 0.1; // Account for origin offset
        
        // Add danger glow effect
        obstacle.preFX.addGlow(0xff0000, 2, 0, false, 0.2, 8);
        
        this.obstacles.add(obstacle);
        
        // Track position to prevent overlapping
        this.lastObstacleX = spawnX;
        this.lastObstacleType = 'regular';
    }

    spawnPushObstacle() {
        // Spawn push obstacle at same Y position as player (on ground level)
        const spawnX = 1280 + 50;
        const obstacle = this.add.sprite(spawnX, this.player.groundY, 'pushObstacle');
        obstacle.setScale(2.2);
        obstacle.setOrigin(0.5, 0.8);
        obstacle.setTint(0xffaa00); // Orange tint to differentiate from deadly obstacles
        
        // Set precise hitbox for push obstacle
        obstacle.hitboxWidth = obstacle.width * 2.2 * 0.65;
        obstacle.hitboxHeight = obstacle.height * 2.2 * 0.75;
        obstacle.hitboxOffsetY = obstacle.height * 2.2 * 0.1;
        
        // Add orange glow effect to show it's different
        obstacle.preFX.addGlow(0xffaa00, 2, 0, false, 0.2, 8);
        
        // Add pulsing animation to make it stand out
        this.tweens.add({
            targets: obstacle,
            scaleX: 2.4,
            scaleY: 2.4,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        this.pushObstacles.add(obstacle);
        
        // Track position to prevent overlapping
        this.lastObstacleX = spawnX;
        this.lastObstacleType = 'push';
    }

    spawnPlatform() {
        // Fixed height for all platforms
        const platformY = this.groundY - 200;
        
        // Random number of platforms to spawn (1, 2, or 3 merged together)
        const numPlatforms = Math.floor(this.seededRandom() * 3) + 1; // 1-3 platforms
        
        // Get platform width with scale 3.2 (slightly larger)
        const platformScale = 3.2;
        const platformWidth = 48 * platformScale;
        const startX = 1280 + 100;
        
        // Spawn platforms side by side with premium styling
        for (let i = 0; i < numPlatforms; i++) {
            const platform = this.add.sprite(startX + (i * platformWidth), platformY, 'platform');
            platform.setScale(platformScale);
            platform.setOrigin(0.5, 0.5);
            platform.setTint(0xdddddd); // Slight tint to match ground
            
            // Set hitbox to exact platform dimensions (full image size)
            platform.hitboxWidth = 48 * platformScale;  // 100% of visual width
            platform.hitboxHeight = 5 * platformScale; // 100% of visual height
            platform.collisionPadding = 8; // Extra padding for landing detection
            
            // Add subtle glow to platforms
            platform.preFX.addGlow(0xffd700, 1, 0, false, 0.1, 6);
            
            this.platforms.add(platform);
        }
    }
    
    spawnBird() {
        // Spawn flying bird at random height in sky (using seeded RNG)
        const birdY = Math.floor(this.seededRandom() * 250) + 100; // 100-350
        const birdSize = Math.floor(this.seededRandom() * 10) + 15; // 15-25
        
        // Create bird using simple shapes (animated)
        const bird = this.add.container(1280 + 50, birdY);
        
        // Bird body (ellipse)
        const body = this.add.ellipse(0, 0, birdSize, birdSize * 0.6, 0x333333, 0.8);
        
        // Bird wings (two triangles)
        const leftWing = this.add.triangle(
            -birdSize * 0.3, 0,
            0, -birdSize * 0.4,
            -birdSize * 0.6, 0,
            birdSize * 0.6, birdSize * 0.2,
            0x555555, 0.7
        );
        
        const rightWing = this.add.triangle(
            birdSize * 0.3, 0,
            0, -birdSize * 0.4,
            birdSize * 0.6, 0,
            birdSize * 0.6, birdSize * 0.2,
            0x555555, 0.7
        );
        
        bird.add([body, leftWing, rightWing]);
        bird.moveSpeed = this.seededRandom() * 2 + 2; // 2-4
        
        // Flapping animation
        this.tweens.add({
            targets: [leftWing, rightWing],
            y: -birdSize * 0.2,
            duration: 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        // Bobbing animation (use seeded random for consistency)
        const bobbingOffset = Math.floor(this.seededRandom() * 20) - 10; // -10 to 10
        const bobbingDuration = Math.floor(this.seededRandom() * 400) + 800; // 800-1200
        this.tweens.add({
            targets: bird,
            y: birdY + bobbingOffset,
            duration: bobbingDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        this.birds.add(bird);
    }

    // ============================================================================
    // COLLISION DETECTION METHODS
    // ============================================================================

    checkCollision(player, obstacle) {
        // Precise hitbox collision using custom hitbox dimensions
        const playerBounds = {
            x: player.x - (player.hitboxWidth / 2),
            y: player.y - (player.hitboxHeight / 2) + player.hitboxOffsetY,
            width: player.hitboxWidth,
            height: player.hitboxHeight
        };
        
        const obstacleBounds = {
            x: obstacle.x - (obstacle.hitboxWidth / 2),
            y: obstacle.y - obstacle.hitboxHeight + obstacle.hitboxOffsetY,
            width: obstacle.hitboxWidth,
            height: obstacle.hitboxHeight
        };

        return (
            playerBounds.x < obstacleBounds.x + obstacleBounds.width &&
            playerBounds.x + playerBounds.width > obstacleBounds.x &&
            playerBounds.y < obstacleBounds.y + obstacleBounds.height &&
            playerBounds.y + playerBounds.height > obstacleBounds.y
        );
    }

    pushPlayerBack() {
        // Prevent multiple push effects at once
        if (this.isPushingBack) return;
        
        this.isPushingBack = true;
        
        const pushDistance = 300; // How far the world moves back (increased from 150)
        const pushDuration = 500; // Duration of push effect
        
        // Strong screen shake effect
        this.cameras.main.shake(300, 0.015);
        
        // Push all obstacles backward (move them forward relative to player)
        this.obstacles.children.entries.forEach(obstacle => {
            this.tweens.add({
                targets: obstacle,
                x: obstacle.x + pushDistance,
                duration: pushDuration,
                ease: 'Cubic.out'
            });
        });
        
        // Push all push obstacles backward
        this.pushObstacles.children.entries.forEach(obstacle => {
            this.tweens.add({
                targets: obstacle,
                x: obstacle.x + pushDistance,
                duration: pushDuration,
                ease: 'Cubic.out'
            });
        });
        
        // Push all platforms backward
        this.platforms.children.entries.forEach(platform => {
            this.tweens.add({
                targets: platform,
                x: platform.x + pushDistance,
                duration: pushDuration,
                ease: 'Cubic.out'
            });
        });
        
        // Push all birds backward
        this.birds.children.entries.forEach(bird => {
            this.tweens.add({
                targets: bird,
                x: bird.x + pushDistance,
                duration: pushDuration,
                ease: 'Cubic.out'
            });
        });
        
        // Move background and ground backward (scroll in reverse)
        const pushFrames = pushDuration / 16.67; // Approximate frames in push duration
        const scrollPerFrame = pushDistance / pushFrames;
        
        let frameCount = 0;
        const pushInterval = this.time.addEvent({
            delay: 16.67, // ~60 FPS
            repeat: Math.floor(pushFrames),
            callback: () => {
                this.background.tilePositionX -= scrollPerFrame * 0.5;
                this.ground.tilePositionX -= scrollPerFrame;
                frameCount++;
            }
        });
        
        // Recovery delay before allowing another push
        this.time.delayedCall(pushDuration + 500, () => {
            this.isPushingBack = false;
        });
        
        // Create powerful push effect particles
        for (let i = 0; i < 20; i++) {
            const angle = Phaser.Math.Between(-60, 60) + 180; // Push particles forward
            const particle = this.add.circle(this.player.x + 30, this.player.y, 5, 0xffaa00, 0.9);
            
            this.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle * Math.PI / 180) * Phaser.Math.Between(50, 100),
                y: particle.y + Math.sin(angle * Math.PI / 180) * Phaser.Math.Between(50, 100),
                alpha: 0,
                scale: 0,
                duration: 600,
                ease: 'Cubic.out',
                onComplete: () => particle.destroy()
            });
        }
    }

    // ============================================================================
    // UI CREATION METHODS
    // ============================================================================

    createPremiumUI() {
        // Top bar background
        const topBar = this.add.rectangle(640, 40, 1280, 80, 0x1a1a2e, 0.85);
        const topBorder = this.add.rectangle(640, 80, 1200, 3, 0xffd700);

        // Score panel with casino styling
        const scorePanelBg = this.add.rectangle(1100, 40, 300, 60, 0x2a2a3e, 0.9);
        scorePanelBg.setStrokeStyle(3, 0xffd700);

        // Score label
        this.add.text(1020, 20, '💰 SCORE', {
            fontSize: '16px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });

        // Score value with shadow
        const scoreShadow = this.add.text(1103, 48, '0', {
            fontSize: '28px',
            fill: '#000000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scoreText = this.add.text(1100, 45, '0', {
            fontSize: '28px',
            fill: '#00ff88',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.scoreShadow = scoreShadow;

        // Game title on left
        this.add.text(100, 40, '💎 DIZOLAUR', {
            fontSize: '28px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        // Version number in bottom-left corner
        this.add.text(10, 710, 'v2.1', {
            fontSize: '14px',
            fill: '#000000',
            fontFamily: 'Arial',
            alpha: 0.7
        }).setOrigin(0, 1).setDepth(1000);

        // Mute button
        this.createMuteButton();

        // Speed indicator
        const speedPanelBg = this.add.rectangle(640, 40, 200, 50, 0x2a2a3e, 0.9);
        speedPanelBg.setStrokeStyle(2, 0x4a4a6e);

        this.add.text(580, 20, '⚡ SPEED', {
            fontSize: '14px',
            fill: '#aaaaaa',
            fontFamily: 'Arial'
        });

        this.speedText = this.add.text(640, 45, '1.0x', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Decorative corner accents
        const tl = this.add.rectangle(20, 20, 40, 3, 0xffd700);
        const tl2 = this.add.rectangle(20, 20, 3, 40, 0xffd700);
        const tr = this.add.rectangle(1260, 20, 40, 3, 0xffd700);
        const tr2 = this.add.rectangle(1260, 20, 3, 40, 0xffd700);

        // Subtle glow animation
        this.tweens.add({
            targets: [topBorder, tl, tl2, tr, tr2],
            alpha: 0.6,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    // ============================================================================
    // GAME OVER & CELEBRATION METHODS
    // ============================================================================

    gameOver() {
        this.isGameOver = true;
        this.player.anims.stop();
        
        // Notify server if multiplayer
        if (this.isMultiplayer && this.multiplayer) {
            this.multiplayer.sendPlayerDied(Math.floor(this.score));
        }
        
        // Screen shake effect on collision
        this.cameras.main.shake(300, 0.01);
        
        // Create explosion effect at collision point
        this.createExplosionEffect(this.player.x, this.player.y);
        
        // Stop background music
        this.bgMusic.stop();
        
        // Slight delay before transition
        this.time.delayedCall(400, () => {
            // Pass multiplayer info to GameOver scene
            this.scene.start('GameOver', { 
                score: this.score,
                isMultiplayer: this.isMultiplayer,
                multiplayer: this.multiplayer
            });
        });
    }
    
    createExplosionEffect(x, y) {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = (360 / 20) * i;
            const particle = this.add.circle(x, y, 4, 0xff3333, 0.8);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle * Math.PI / 180) * Phaser.Math.Between(30, 60),
                y: y + Math.sin(angle * Math.PI / 180) * Phaser.Math.Between(30, 60),
                alpha: 0,
                scale: 0,
                duration: 500,
                ease: 'Cubic.out',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createMilestoneCelebration() {
        // Major celebration for 100-point milestones - SUBTLE VERSION
        // Quick, subtle flash that doesn't block view
        this.cameras.main.flash(100, 255, 215, 0, true);
        
        // Create firework effect around the edges (not center)
        for (let i = 0; i < 20; i++) {
            const angle = (360 / 20) * i;
            const startX = 640 + Math.cos(angle * Math.PI / 180) * 100;
            const startY = 300 + Math.sin(angle * Math.PI / 180) * 100;
            
            const particle = this.add.circle(startX, startY, 4, 0xffd700, 0.8);
            
            this.tweens.add({
                targets: particle,
                x: startX + Math.cos(angle * Math.PI / 180) * Phaser.Math.Between(100, 150),
                y: startY + Math.sin(angle * Math.PI / 180) * Phaser.Math.Between(100, 150),
                alpha: 0,
                scale: 0.2,
                duration: 800,
                ease: 'Cubic.out',
                onComplete: () => particle.destroy()
            });
        }
        
        // Show milestone text briefly
        const milestoneText = this.add.text(640, 200, `${Math.floor(this.score)} POINTS! 🎉`, {
            fontSize: '42px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: milestoneText,
            alpha: 1,
            y: 180,
            duration: 150,
            ease: 'Back.out',
            onComplete: () => {
                this.tweens.add({
                    targets: milestoneText,
                    alpha: 0,
                    y: 160,
                    duration: 300,
                    delay: 400,
                    ease: 'Cubic.in',
                    onComplete: () => milestoneText.destroy()
                });
            }
        });
    }
    
    createMinorCelebration() {
        // Minor celebration for 50-point marks
        // Create small burst around score display
        for (let i = 0; i < 8; i++) {
            const angle = (360 / 8) * i;
            const particle = this.add.circle(1100, 50, 3, 0x00ff88, 0.8);
            
            this.tweens.add({
                targets: particle,
                x: 1100 + Math.cos(angle * Math.PI / 180) * 40,
                y: 50 + Math.sin(angle * Math.PI / 180) * 40,
                alpha: 0,
                scale: 0.1,
                duration: 400,
                ease: 'Cubic.out',
                onComplete: () => particle.destroy()
            });
        }
    }

    showWinnerAnnouncement(winner) {
        // Create semi-transparent overlay
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setDepth(1000);

        // Announcement panel
        const panel = this.add.rectangle(640, 360, 700, 350, 0x1a1a2e, 0.95);
        panel.setStrokeStyle(5, 0xffd700);
        panel.setDepth(1001);

        // Trophy icon
        const trophy = this.add.text(640, 250, '🏆', {
            fontSize: '80px'
        }).setOrigin(0.5).setDepth(1002).setAlpha(0);

        // Winner announcement
        const winnerText = this.add.text(640, 360, `${winner.name} WINS!`, {
            fontSize: '48px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(1002).setAlpha(0);

        // Score display
        const scoreText = this.add.text(640, 430, `Final Score: ${winner.score}`, {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(1002).setAlpha(0);

        // Animate trophy entrance
        this.tweens.add({
            targets: trophy,
            alpha: 1,
            scale: 1.5,
            duration: 500,
            ease: 'Back.out'
        });

        // Animate winner text
        this.tweens.add({
            targets: winnerText,
            alpha: 1,
            y: 350,
            duration: 600,
            delay: 200,
            ease: 'Back.out'
        });

        // Animate score text
        this.tweens.add({
            targets: scoreText,
            alpha: 1,
            duration: 400,
            delay: 400
        });

        // Confetti effect
        for (let i = 0; i < 30; i++) {
            const confetti = this.add.circle(
                Phaser.Math.Between(300, 980),
                -20,
                Phaser.Math.Between(3, 6),
                Phaser.Math.Between(0xff0000, 0xffff00),
                1
            );
            confetti.setDepth(999);

            this.tweens.add({
                targets: confetti,
                y: 800,
                x: confetti.x + Phaser.Math.Between(-100, 100),
                alpha: 0,
                duration: Phaser.Math.Between(2000, 3000),
                ease: 'Cubic.in',
                delay: Phaser.Math.Between(0, 500),
                onComplete: () => confetti.destroy()
            });
        }
    }

    showCountdownOnScreen(seconds) {
        // Create or update countdown display
        if (!this.countdownDisplay) {
            // Create countdown text
            this.countdownDisplay = this.add.text(640, 150, '', {
                fontSize: '72px',
                fill: '#ffd700',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 8
            }).setOrigin(0.5).setDepth(1000);
        }

        // Update text
        if (seconds > 10) {
            this.countdownDisplay.setText(`Game starts in: ${seconds}s`);
            this.countdownDisplay.setFontSize('48px');
            this.countdownDisplay.setColor('#ffd700');
        } else if (seconds > 3) {
            this.countdownDisplay.setText(`${seconds}`);
            this.countdownDisplay.setFontSize('96px');
            this.countdownDisplay.setColor('#ffaa00');
        } else {
            this.countdownDisplay.setText(`${seconds}`);
            this.countdownDisplay.setFontSize('120px');
            this.countdownDisplay.setColor('#ff0000');
            
            // Pulse animation for final seconds
            this.tweens.add({
                targets: this.countdownDisplay,
                scale: 1.3,
                duration: 150,
                yoyo: true,
                ease: 'Quad.out'
            });
        }
    }

    showStartCountdown() {
        // Pause game initially
        this.isGameOver = true;
        
        // Semi-transparent overlay
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6);
        overlay.setDepth(999);

        // Create countdown text
        const countdownText = this.add.text(640, 360, '3', {
            fontSize: '180px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 12
        }).setOrigin(0.5).setDepth(1000);

        let count = 3;
        
        // Countdown sequence
        const countdownTimer = this.time.addEvent({
            delay: 1000,
            repeat: 3,
            callback: () => {
                if (count > 1) {
                    count--;
                    countdownText.setText(count.toString());
                    countdownText.setScale(1);
                    
                    // Pulse animation
                    this.tweens.add({
                        targets: countdownText,
                        scale: 1.2,
                        duration: 200,
                        yoyo: true,
                        ease: 'Quad.out'
                    });
                    
                    // Flash effect
                    this.cameras.main.flash(200, 255, 215, 0, false);
                    
                } else if (count === 1) {
                    // Show GO!
                    countdownText.setText('GO!');
                    countdownText.setScale(1);
                    countdownText.setColor('#00ff00');
                    
                    this.tweens.add({
                        targets: countdownText,
                        scale: 1.5,
                        alpha: 0,
                        duration: 500,
                        ease: 'Quad.out'
                    });
                    
                    // Flash green
                    this.cameras.main.flash(300, 0, 255, 0, false);
                    
                    // Remove overlay
                    this.tweens.add({
                        targets: overlay,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            overlay.destroy();
                            countdownText.destroy();
                            // Resume game
                            this.isGameOver = false;
                        }
                    });
                    
                    count--;
                }
            }
        });
    }

    shutdown() {
        console.log('🧹 SHUTDOWN: Aggressive cleanup started...');
        
        // Stop all sounds
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic.destroy();
        }
        if (this.jumpSound) {
            this.jumpSound.destroy();
        }
        
        // Clean up multiplayer event listeners when scene is destroyed
        if (this.isMultiplayer && this.multiplayer && this.multiplayer.socket) {
            this.multiplayer.socket.off('countdownUpdate');
            this.multiplayer.socket.off('gameStarted');
            this.multiplayer.socket.off('gameEnded');
        }
        
        // Destroy all remote player sprites
        if (this.remotePlayerSprites) {
            Object.keys(this.remotePlayerSprites).forEach(playerId => {
                if (this.remotePlayerSprites[playerId].sprite) {
                    this.remotePlayerSprites[playerId].sprite.destroy();
                }
                if (this.remotePlayerSprites[playerId].nameText) {
                    this.remotePlayerSprites[playerId].nameText.destroy();
                }
            });
            this.remotePlayerSprites = null;
        }
        this.remotePlayers = null;
        
        // Destroy all game object groups and their children
        if (this.obstacles) {
            this.obstacles.clear(true, true); // Remove and destroy all
            this.obstacles = null;
        }
        if (this.pushObstacles) {
            this.pushObstacles.clear(true, true);
            this.pushObstacles = null;
        }
        if (this.platforms) {
            this.platforms.clear(true, true);
            this.platforms = null;
        }
        if (this.birds) {
            this.birds.clear(true, true);
            this.birds = null;
        }
        
        // Destroy player
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        
        // Clear any active tweens
        if (this.tweens) {
            this.tweens.killAll();
        }
        
        // Clear any active timers
        if (this.time) {
            this.time.removeAllEvents();
        }
        
        // CRITICAL: Reset ALL game state variables
        this.isGameOver = false;
        this.score = 0;
        this.gameSpeed = 6;
        this.mapSeed = null;
        this.rngState = null;
        this.obstacleTimer = 0;
        this.pushObstacleTimer = 0;
        this.platformTimer = 0;
        this.birdTimer = 0;
        this.lastObstacleX = -999;
        
        console.log('🧹 SHUTDOWN: Complete! Scene is clean.');
    }
    
    destroy() {
        console.log('💀 DESTROY: Scene is being removed from memory');
        // Call shutdown to ensure everything is cleaned
        this.shutdown();
    }
}
