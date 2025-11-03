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
export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    // ============================================================================
    // SCENE LIFECYCLE METHODS
    // ============================================================================

    preload() {
        this.loadAssets();
        this.loadSounds();
    }

    create() {
        this.initializeGameState();
        this.createBackground();
        this.createGround();
        this.createPlayer();
        this.setupInput();
        this.createPremiumUI();
        this.setupGameObjects();
        this.setupSounds();
        this.setupDebugMode();
        this.setupVisualEnhancements();
    }

    update() {
        if (this.isGameOver) return;

        this.updateBackground();
        this.updatePlayerTrail();
        this.updatePlayerPhysics();
        this.updateScore();
        this.spawnGameObjects();
        this.updateGameObjects();
        this.renderDebugHitboxes();
    }

    // ============================================================================
    // INITIALIZATION METHODS
    // ============================================================================

    loadAssets() {
        this.load.image('ground', 'assets/tilesV2.png');
        this.load.image('obstacle', 'assets/obstacleV3.png');
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
        this.input.keyboard.on('keydown-SPACE', () => this.jump());
        this.input.on('pointerdown', () => this.jump());
    }

    setupGameObjects() {
        // Obstacles
        this.obstacles = this.add.group();
        this.obstacleTimer = 0;
        this.minObstacleInterval = 80;
        this.maxObstacleInterval = 150;
        this.nextObstacleTime = Phaser.Math.Between(this.minObstacleInterval, this.maxObstacleInterval);
        
        // Platforms
        this.platforms = this.add.group();
        this.platformTimer = 0;
        this.minPlatformInterval = 100;
        this.maxPlatformInterval = 200;
        this.nextPlatformTime = Phaser.Math.Between(this.minPlatformInterval, this.maxPlatformInterval);
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

    jump() {
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
            this.player.velocityY += this.gravity;
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
                
                // Check if player is horizontally aligned with platform
                if (this.player.x > platformLeft && this.player.x < platformRight) {
                    
                    // Landing on top of platform (falling down)
                    if (this.player.velocityY > 0 && 
                        playerBottom >= platformTop &&
                        playerBottom <= platformTop + platform.collisionPadding) {
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
        this.spawnPlatforms();
        this.spawnBirds();
        this.spawnSparkles();
    }

    spawnObstacles() {
        // Spawn obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer >= this.nextObstacleTime) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
            // Calculate next spawn time (gets faster as game progresses)
            const speedFactor = Math.max(0.5, 1 - (this.score / 1000));
            this.nextObstacleTime = Phaser.Math.Between(
                Math.floor(this.minObstacleInterval * speedFactor),
                Math.floor(this.maxObstacleInterval * speedFactor)
            );
        }
    }

    spawnPlatforms() {
        this.platformTimer++;
        if (this.platformTimer >= this.nextPlatformTime) {
            this.spawnPlatform();
            this.platformTimer = 0;
            const speedFactor = Math.max(0.6, 1 - (this.score / 1500));
            this.nextPlatformTime = Phaser.Math.Between(
                Math.floor(this.minPlatformInterval * speedFactor),
                Math.floor(this.maxPlatformInterval * speedFactor)
            );
        }
    }

    spawnBirds() {
        this.birdTimer++;
        if (this.birdTimer >= this.nextBirdTime) {
            this.spawnBird();
            this.birdTimer = 0;
            this.nextBirdTime = Phaser.Math.Between(100, 200);
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
            
            // Draw obstacle hitboxes
            this.obstacles.children.entries.forEach(obstacle => {
                this.debugGraphics.lineStyle(2, 0xff0000, 1);
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

    spawnObstacle() {
        // Spawn obstacle at same Y position as player (on ground level)
        const obstacle = this.add.sprite(1280 + 50, this.player.groundY, 'obstacle');
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
    }

    spawnPlatform() {
        // Fixed height for all platforms
        const platformY = this.groundY - 100;
        
        // Random number of platforms to spawn (1, 2, or 3 merged together)
        const numPlatforms = Phaser.Math.Between(1, 3);
        
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
            
            // Set precise hitbox for platform (use full width but exact top surface)
            platform.hitboxWidth = 48 * platformScale * 0.95; // 95% of width for slight edge tolerance
            platform.hitboxHeight = 48 * platformScale * 0.3; // Only top 30% for landing
            platform.collisionPadding = 8; // Extra padding for landing detection
            
            // Add subtle glow to platforms
            platform.preFX.addGlow(0xffd700, 1, 0, false, 0.1, 6);
            
            this.platforms.add(platform);
        }
    }
    
    spawnBird() {
        // Spawn flying bird at random height in sky
        const birdY = Phaser.Math.Between(100, 350);
        const birdSize = Phaser.Math.Between(15, 25);
        
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
        bird.moveSpeed = Phaser.Math.FloatBetween(2, 4);
        
        // Flapping animation
        this.tweens.add({
            targets: [leftWing, rightWing],
            y: -birdSize * 0.2,
            duration: 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        // Bobbing animation
        this.tweens.add({
            targets: bird,
            y: birdY + Phaser.Math.Between(-10, 10),
            duration: Phaser.Math.Between(800, 1200),
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
        
        // Screen shake effect on collision
        this.cameras.main.shake(300, 0.01);
        
        // Create explosion effect at collision point
        this.createExplosionEffect(this.player.x, this.player.y);
        
        // Stop background music
        this.bgMusic.stop();
        
        // Slight delay before transition
        this.time.delayedCall(400, () => {
            this.scene.start('GameOver', { score: this.score });
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
}
