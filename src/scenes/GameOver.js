export class GameOver extends Phaser.Scene {

    constructor() {
        super('GameOver');
    }

    preload() {
        // Load sound effect
        this.load.audio('scoreSound', 'assets/Sound effects/combined_slot_machine_mix.mp3');
        
        // Load coin image
        this.load.image('coin', 'assets/coin.png');
    }

    init(data) {
        // Receive score from Game scene
        this.finalScore = data.score || 0;
        this.currentDisplayScore = 0;
        this.scoreAnimationComplete = false;
        
        // Multiplayer data
        this.isMultiplayer = data.isMultiplayer || false;
        this.multiplayer = data.multiplayer || null;
    }

    create() {
        // Scrolling background
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        // Add dark overlay for better text visibility
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.5);

        // Create falling coins animation
        this.coins = [];
        this.createFallingCoins();

        // Create decorative panel background
        const panelWidth = 600;
        const panelHeight = 450;
        const panel = this.add.rectangle(640, 360, panelWidth, panelHeight, 0x1a1a2e, 0.9);
        panel.setStrokeStyle(4, 0xffd700);

        // Add glow effect to panel
        this.tweens.add({
            targets: panel,
            alpha: 0.85,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Version number in bottom-left corner
        this.add.text(10, 710, 'v1.1', {
            fontSize: '14px',
            fill: '#888888',
            fontFamily: 'Arial',
            alpha: 0.7
        }).setOrigin(0, 1);

        // Game Over Title with shadow effect
        const titleShadow = this.add.text(643, 163, 'GAME OVER', {
            fontSize: '80px',
            fill: '#000000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const title = this.add.text(640, 160, 'GAME OVER', {
            fontSize: '80px',
            fill: '#ff3333',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Pulse animation for title
        this.tweens.add({
            targets: title,
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Decorative line
        const line = this.add.rectangle(640, 220, 400, 3, 0xffd700);

        // Score label with icon
        this.add.text(640, 270, '★ YOUR SCORE ★', {
            fontSize: '28px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Score box background
        const scoreBox = this.add.rectangle(640, 335, 300, 90, 0x2a2a3e, 0.8);
        scoreBox.setStrokeStyle(3, 0x4a4a6e);

        // Animated score text (starts at 0) with shadow
        const scoreShadow = this.add.text(643, 338, '0', {
            fontSize: '64px',
            fill: '#000000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scoreText = this.add.text(640, 335, '0', {
            fontSize: '64px',
            fill: '#00ff88',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.scoreShadow = scoreShadow;

        // Play sound and start score animation
        this.scoreSound = this.sound.add('scoreSound');
        this.scoreSound.play();

        // Animate score counting up
        const animationDuration = this.scoreSound.duration * 1000; // Convert to milliseconds
        this.tweens.addCounter({
            from: 0,
            to: this.finalScore,
            duration: animationDuration,
            ease: 'Cubic.out',
            onUpdate: (tween) => {
                this.currentDisplayScore = tween.getValue();
                const displayValue = Math.floor(this.currentDisplayScore).toString();
                this.scoreText.setText(displayValue);
                this.scoreShadow.setText(displayValue);
            },
            onComplete: () => {
                this.scoreAnimationComplete = true;
                this.showHighScoreAndButtons();
            }
        });

    }

    showHighScoreAndButtons() {
        let yOffset = 420;
        
        // Show multiplayer results if in multiplayer mode
        if (this.isMultiplayer && this.multiplayer) {
            this.showMultiplayerResults();
            yOffset = 550; // Move buttons down for multiplayer
        } else {
            // High score (stored in localStorage)
            const highScore = this.getHighScore();
            
            // High score display box
            const highScoreBox = this.add.rectangle(640, 420, 350, 50, 0x2a2a3e, 0.6);
            highScoreBox.setStrokeStyle(2, 0x6a6a8e);
            
            if (this.finalScore > highScore) {
                this.saveHighScore(this.finalScore);
                const newHighScoreText = this.add.text(640, 420, '🏆 NEW HIGH SCORE! 🏆', {
                    fontSize: '26px',
                    fill: '#ffd700',
                    fontFamily: 'Arial',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                
                // Celebratory animation
                this.tweens.add({
                    targets: newHighScoreText,
                    scale: 1.15,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.inOut'
                });
            } else {
                this.add.text(640, 420, `🏆 Best: ${Math.floor(highScore)}`, {
                    fontSize: '24px',
                    fill: '#aaaaaa',
                    fontFamily: 'Arial',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            }
            yOffset = 510;
        }

        // Button container
        const buttonY = yOffset;
        
        // Restart button with background
        const restartBg = this.add.rectangle(640, buttonY, 280, 60, 0x00aa00, 0.9);
        restartBg.setStrokeStyle(3, 0x00ff00);
        
        const restartButton = this.add.text(640, buttonY, '▶ PLAY AGAIN', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        restartBg.setInteractive({ useHandCursor: true });
        restartButton.setInteractive({ useHandCursor: true });

        const restartHoverIn = () => {
            restartBg.setScale(1.05);
            restartButton.setScale(1.05);
            restartBg.setFillStyle(0x00ff00, 1);
        };
        
        const restartHoverOut = () => {
            restartBg.setScale(1);
            restartButton.setScale(1);
            restartBg.setFillStyle(0x00aa00, 0.9);
        };
        
        const restartClick = () => {
            this.scoreSound.stop();
            
            // If multiplayer, rejoin matchmaking instead of starting new game
            if (this.isMultiplayer && this.multiplayer) {
                this.rejoinMatchmaking();
            } else {
                this.scene.start('Game');
            }
        };

        restartBg.on('pointerover', restartHoverIn);
        restartBg.on('pointerout', restartHoverOut);
        restartBg.on('pointerdown', restartClick);
        restartButton.on('pointerover', restartHoverIn);
        restartButton.on('pointerout', restartHoverOut);
        restartButton.on('pointerdown', restartClick);

        // Menu button with background
        const menuY = 585;
        const menuBg = this.add.rectangle(640, menuY, 200, 45, 0x555555, 0.8);
        menuBg.setStrokeStyle(2, 0x888888);
        
        const menuButton = this.add.text(640, menuY, '⌂ MENU', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        menuBg.setInteractive({ useHandCursor: true });
        menuButton.setInteractive({ useHandCursor: true });

        const menuHoverIn = () => {
            menuBg.setScale(1.05);
            menuButton.setScale(1.05);
            menuBg.setFillStyle(0x777777, 1);
        };
        
        const menuHoverOut = () => {
            menuBg.setScale(1);
            menuButton.setScale(1);
            menuBg.setFillStyle(0x555555, 0.8);
        };
        
        const menuClick = () => {
            this.scoreSound.stop();
            this.scene.start('Start');
        };

        menuBg.on('pointerover', menuHoverIn);
        menuBg.on('pointerout', menuHoverOut);
        menuBg.on('pointerdown', menuClick);
        menuButton.on('pointerover', menuHoverIn);
        menuButton.on('pointerout', menuHoverOut);
        menuButton.on('pointerdown', menuClick);

        // Keyboard hint
        this.add.text(640, 650, 'SPACE - Play Again  |  ESC - Menu', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-SPACE', restartClick);
        this.input.keyboard.on('keydown-ESC', menuClick);
    }

    showMultiplayerResults() {
        // Show all players' scores in multiplayer
        const resultsBox = this.add.rectangle(640, 450, 500, 150, 0x2a2a3e, 0.8);
        resultsBox.setStrokeStyle(3, 0x4a4a6e);
        
        const resultsTitle = this.add.text(640, 395, '📊 FINAL RANKINGS', {
            fontSize: '24px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Get all players and sort by score
        const allPlayers = [];
        
        // Add current player
        allPlayers.push({
            name: this.multiplayer.playerName,
            score: Math.floor(this.finalScore),
            isMe: true
        });
        
        // Add remote players
        Object.values(this.multiplayer.remotePlayers).forEach(player => {
            allPlayers.push({
                name: player.name,
                score: player.score,
                isMe: false
            });
        });
        
        // Sort by score (highest first)
        allPlayers.sort((a, b) => b.score - a.score);
        
        // Display rankings
        let yPos = 420;
        allPlayers.forEach((player, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const color = player.isMe ? '#00ff88' : '#ffffff';
            const fontSize = player.isMe ? '22px' : '20px';
            
            const rankText = this.add.text(450, yPos, `${medal} ${player.name}`, {
                fontSize: fontSize,
                fill: color,
                fontFamily: 'Arial',
                fontStyle: player.isMe ? 'bold' : 'normal'
            });
            
            const scoreText = this.add.text(780, yPos, player.score.toString(), {
                fontSize: fontSize,
                fill: color,
                fontFamily: 'Arial',
                fontStyle: player.isMe ? 'bold' : 'normal'
            }).setOrigin(1, 0);
            
            if (player.isMe) {
                // Highlight current player
                const highlight = this.add.rectangle(640, yPos + 10, 320, 28, 0xffd700, 0.2);
            }
            
            yPos += 35;
        });
    }

    createFallingCoins() {
        // Create 80 coins falling from the sky
        const numCoins = 80;
        
        for (let i = 0; i < numCoins; i++) {
            // Random delay for staggered appearance
            const delay = Phaser.Math.Between(0, 3000);
            
            this.time.delayedCall(delay, () => {
                // Create coin sprite
                const coin = this.add.sprite(
                    Phaser.Math.Between(50, 1230), // Random X position
                    -50, // Start above screen
                    'coin'
                );
                
                // Random scale for variety
                const scale = Phaser.Math.FloatBetween(0.5, 1.2);
                coin.setScale(scale);
                coin.setAlpha(0.9);
                
                // Random fall duration for variety (faster)
                const fallDuration = Phaser.Math.Between(1000, 2500);
                const rotation = Phaser.Math.Between(3, 8);
                
                // Animate coin falling
                this.tweens.add({
                    targets: coin,
                    y: 800, // Fall below screen
                    angle: rotation * 360, // Spin while falling
                    duration: fallDuration,
                    ease: 'Cubic.in',
                    onComplete: () => {
                        coin.destroy(); // Remove coin after falling
                    }
                });
                
                // Add horizontal sway for realistic movement
                this.tweens.add({
                    targets: coin,
                    x: coin.x + Phaser.Math.Between(-80, 80),
                    duration: fallDuration / 2,
                    yoyo: true,
                    ease: 'Sine.inOut'
                });
                
                this.coins.push(coin);
            });
        }
    }

    update() {
        // Slow background scroll for visual effect
        this.background.tilePositionX += 1;
    }

    getHighScore() {
        const stored = localStorage.getItem('dizolaur_highscore');
        return stored ? parseFloat(stored) : 0;
    }

    saveHighScore(score) {
        localStorage.setItem('dizolaur_highscore', score.toString());
    }

    async rejoinMatchmaking() {
        // Show loading overlay
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        const loadingText = this.add.text(640, 360, 'Finding new match...', {
            fontSize: '32px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Pulsing animation
        this.tweens.add({
            targets: loadingText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        try {
            // Properly disconnect from current session
            if (this.multiplayer.socket) {
                this.multiplayer.socket.removeAllListeners();
                this.multiplayer.socket.disconnect();
                this.multiplayer.socket = null;
            }
            
            // Clear remote players data from previous game
            this.multiplayer.remotePlayers = {};
            this.multiplayer.roomCode = null;
            this.multiplayer.isConnected = false;

            // Reconnect and rejoin matchmaking
            await this.multiplayer.connect();
            
            // Set up listeners for new lobby
            const joinPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Matchmaking timeout'));
                }, 10000);
                
                this.multiplayer.socket.once('lobbyJoined', (data) => {
                    clearTimeout(timeout);
                    resolve(data);
                });
                
                this.multiplayer.socket.once('error', (data) => {
                    clearTimeout(timeout);
                    reject(new Error(data.message || 'Could not join lobby'));
                });
            });
            
            // Join matchmaking with same player name
            this.multiplayer.joinMatchmaking(this.multiplayer.playerName);
            
            // Wait for lobby assignment
            await joinPromise;

            // Go to Start scene which will show the lobby
            this.registry.set('isMultiplayer', true);
            this.registry.set('multiplayerManager', this.multiplayer);
            this.registry.set('showLobbyDirectly', true); // Flag to skip menu
            this.scene.start('Start');
            
        } catch (error) {
            console.error('Rejoin matchmaking error:', error);
            loadingText.setText('❌ Could not rejoin matchmaking\nReturning to menu...');
            loadingText.setColor('#ff0000');
            
            // Return to menu after error
            this.time.delayedCall(2000, () => {
                this.scene.start('Start');
            });
        }
    }
}
