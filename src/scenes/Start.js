export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('coin', 'assets/coin.png');
        
        // Load start page music
        this.load.audio('startMusic', 'assets/Sound effects/start_page.mp3');
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        // Start background music
        this.startMusic = this.sound.add('startMusic', { loop: true, volume: 0.5 });
        this.startMusic.play();

        // Dark overlay for luxury feel
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.3);

        // Decorative coin animations (floating coins in corners)
        this.createFloatingCoins();

        // Top decorative banner
        const topBanner = this.add.rectangle(640, 80, 1280, 120, 0x1a1a2e, 0.85);
        const bannerBorder1 = this.add.rectangle(640, 30, 1200, 4, 0xffd700);
        const bannerBorder2 = this.add.rectangle(640, 130, 1200, 4, 0xffd700);

        // Sparkling effect on borders
        this.tweens.add({
            targets: [bannerBorder1, bannerBorder2],
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Main title with better shadow effect
        const titleShadow = this.add.text(645, 85, '💎 DIZOLAUR 💎', {
            fontSize: '88px',
            fill: '#000000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.6);

        const title = this.add.text(640, 80, '💎 DIZOLAUR 💎', {
            fontSize: '88px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle with casino theme
        const subtitle = this.add.text(640, 200, '★★★ PREMIUM RUNNER GAME ★★★', {
            fontSize: '28px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Animated title glow
        this.tweens.add({
            targets: title,
            scale: 1.03,
            duration: 1200,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        // Feature highlights panel
        const featuresPanel = this.add.rectangle(640, 320, 700, 150, 0x2a2a3e, 0.9);
        featuresPanel.setStrokeStyle(3, 0xffd700);

        // Centered feature bullets
        const feature1 = this.add.text(640, 280, '💰 Real Money Rewards', {
            fontSize: '24px',
            fill: '#00ff88',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const feature2 = this.add.text(640, 320, '🎮 Skill-Based Gameplay', {
            fontSize: '24px',
            fill: '#00ff88',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const feature3 = this.add.text(640, 360, '🏆 Compete with Players', {
            fontSize: '24px',
            fill: '#00ff88',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Pulse animation for features
        this.tweens.add({
            targets: [feature1, feature2, feature3],
            alpha: 0.85,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Large Play button with casino styling
        const playButtonBg = this.add.rectangle(640, 480, 380, 90, 0xff0000, 0.9);
        playButtonBg.setStrokeStyle(5, 0xffd700);
        
        const playButtonShadow = this.add.text(643, 483, '🎰 PLAY NOW 🎰', {
            fontSize: '52px',
            fill: '#000000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const playButton = this.add.text(640, 480, '🎰 PLAY NOW 🎰', {
            fontSize: '52px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffd700',
            strokeThickness: 3
        }).setOrigin(0.5);

        playButtonBg.setInteractive({ useHandCursor: true });
        playButton.setInteractive({ useHandCursor: true });

        // Pulsing animation for play button
        this.tweens.add({
            targets: playButtonBg,
            scale: 1.05,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Button hover effects
        const hoverIn = () => {
            playButtonBg.setScale(1.1);
            playButton.setScale(1.1);
            playButtonShadow.setScale(1.1);
            playButtonBg.setFillStyle(0xff3333, 1);
        };

        const hoverOut = () => {
            playButtonBg.setScale(1);
            playButton.setScale(1);
            playButtonShadow.setScale(1);
            playButtonBg.setFillStyle(0xff0000, 0.9);
        };

        const clickPlay = () => {
            this.startMusic.stop();
            this.scene.start('Game');
        };

        playButtonBg.on('pointerover', hoverIn);
        playButtonBg.on('pointerout', hoverOut);
        playButtonBg.on('pointerdown', clickPlay);
        playButton.on('pointerover', hoverIn);
        playButton.on('pointerout', hoverOut);
        playButton.on('pointerdown', clickPlay);

        // Instructions with better styling
        const instructionsBg = this.add.rectangle(640, 590, 500, 50, 0x1a1a2e, 0.8);
        instructionsBg.setStrokeStyle(2, 0x4a4a6e);

        this.add.text(640, 590, '🎯 Press SPACE or CLICK to Jump', {
            fontSize: '20px',
            fill: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Bottom info
        this.add.text(640, 660, 'Test your skills • Win real rewards • Climb the leaderboard', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Decorative corner elements
        this.createCornerDecorations();
    }

    createFloatingCoins() {
        // Create floating coins in corners for ambiance
        const positions = [
            { x: 100, y: 150 }, { x: 200, y: 200 }, { x: 1180, y: 150 }, { x: 1080, y: 200 },
            { x: 150, y: 600 }, { x: 1130, y: 600 }
        ];

        positions.forEach((pos, index) => {
            const coin = this.add.sprite(pos.x, pos.y, 'coin');
            coin.setScale(0.8);
            coin.setAlpha(0.6);

            // Floating animation
            this.tweens.add({
                targets: coin,
                y: pos.y + 20,
                duration: 2000 + (index * 200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });

            // Rotation
            this.tweens.add({
                targets: coin,
                angle: 360,
                duration: 3000 + (index * 300),
                repeat: -1,
                ease: 'Linear'
            });
        });
    }

    createCornerDecorations() {
        // Golden corner decorations
        const cornerSize = 60;
        
        // Top left
        const tl1 = this.add.rectangle(20, 20, cornerSize, 4, 0xffd700);
        const tl2 = this.add.rectangle(20, 20, 4, cornerSize, 0xffd700);
        
        // Top right
        const tr1 = this.add.rectangle(1260, 20, cornerSize, 4, 0xffd700);
        const tr2 = this.add.rectangle(1260, 20, 4, cornerSize, 0xffd700);
        
        // Bottom left
        const bl1 = this.add.rectangle(20, 700, cornerSize, 4, 0xffd700);
        const bl2 = this.add.rectangle(20, 700, 4, cornerSize, 0xffd700);
        
        // Bottom right
        const br1 = this.add.rectangle(1260, 700, cornerSize, 4, 0xffd700);
        const br2 = this.add.rectangle(1260, 700, 4, cornerSize, 0xffd700);

        // Subtle glow effect
        const corners = [tl1, tl2, tr1, tr2, bl1, bl2, br1, br2];
        this.tweens.add({
            targets: corners,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    update() {
        this.background.tilePositionX += 2;
    }
    
}
