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

        // Check if coming from rejoin matchmaking
        if (this.registry.get('showLobbyDirectly')) {
            this.registry.set('showLobbyDirectly', false); // Clear flag
            const multiplayer = this.registry.get('multiplayerManager');
            if (multiplayer) {
                this.showLobbyAfterRejoin(multiplayer);
                return; // Skip normal menu creation
            }
        }

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

        // Version number in bottom-left corner
        this.add.text(10, 710, 'v1.5', {
            fontSize: '14px',
            fill: '#000000',
            fontFamily: 'Arial',
            alpha: 0.7
        }).setOrigin(0, 1);

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

        // Single Player button
        const singlePlayerBg = this.add.rectangle(640, 450, 380, 70, 0xff0000, 0.9);
        singlePlayerBg.setStrokeStyle(4, 0xffd700);
        
        const singlePlayerButton = this.add.text(640, 450, '� SINGLE PLAYER', {
            fontSize: '40px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffd700',
            strokeThickness: 2
        }).setOrigin(0.5);

        singlePlayerBg.setInteractive({ useHandCursor: true });
        singlePlayerButton.setInteractive({ useHandCursor: true });

        // Multiplayer button
        const multiplayerBg = this.add.rectangle(640, 540, 380, 70, 0x0066ff, 0.9);
        multiplayerBg.setStrokeStyle(4, 0xffd700);
        
        const multiplayerButton = this.add.text(640, 540, '👥 MULTIPLAYER', {
            fontSize: '40px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffd700',
            strokeThickness: 2
        }).setOrigin(0.5);

        multiplayerBg.setInteractive({ useHandCursor: true });
        multiplayerButton.setInteractive({ useHandCursor: true });

        // Pulsing animation for buttons
        this.tweens.add({
            targets: [singlePlayerBg, multiplayerBg],
            scale: 1.03,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Single Player button effects
        const singlePlayerHoverIn = () => {
            singlePlayerBg.setScale(1.08);
            singlePlayerButton.setScale(1.08);
            singlePlayerBg.setFillStyle(0xff3333, 1);
        };

        const singlePlayerHoverOut = () => {
            singlePlayerBg.setScale(1);
            singlePlayerButton.setScale(1);
            singlePlayerBg.setFillStyle(0xff0000, 0.9);
        };

        const clickSinglePlayer = () => {
            this.startMusic.stop();
            this.registry.set('isMultiplayer', false);
            this.scene.start('Game');
        };

        singlePlayerBg.on('pointerover', singlePlayerHoverIn);
        singlePlayerBg.on('pointerout', singlePlayerHoverOut);
        singlePlayerBg.on('pointerdown', clickSinglePlayer);
        singlePlayerButton.on('pointerover', singlePlayerHoverIn);
        singlePlayerButton.on('pointerout', singlePlayerHoverOut);
        singlePlayerButton.on('pointerdown', clickSinglePlayer);

        // Multiplayer button effects
        const multiplayerHoverIn = () => {
            multiplayerBg.setScale(1.08);
            multiplayerButton.setScale(1.08);
            multiplayerBg.setFillStyle(0x0088ff, 1);
        };

        const multiplayerHoverOut = () => {
            multiplayerBg.setScale(1);
            multiplayerButton.setScale(1);
            multiplayerBg.setFillStyle(0x0066ff, 0.9);
        };

        const clickMultiplayer = () => {
            this.showNameInputAndJoin();
        };

        multiplayerBg.on('pointerover', multiplayerHoverIn);
        multiplayerBg.on('pointerout', multiplayerHoverOut);
        multiplayerBg.on('pointerdown', clickMultiplayer);
        multiplayerButton.on('pointerover', multiplayerHoverIn);
        multiplayerButton.on('pointerout', multiplayerHoverOut);
        multiplayerButton.on('pointerdown', clickMultiplayer);

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

    showNameInputAndJoin() {
        // Dim the main menu
        const dimOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        
        // Multiplayer menu panel
        const menuPanel = this.add.rectangle(640, 360, 600, 400, 0x1a1a2e, 0.95);
        menuPanel.setStrokeStyle(4, 0xffd700);

        // Title
        const menuTitle = this.add.text(640, 220, '👥 JOIN MATCHMAKING', {
            fontSize: '36px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(640, 280, 'You will be placed in a lobby with up to 5 players', {
            fontSize: '18px',
            fill: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Player name input label
        const nameLabel = this.add.text(640, 340, 'Enter Your Name:', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Create HTML input for player name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Your Name';
        nameInput.maxLength = 15;
        nameInput.style.position = 'absolute';
        nameInput.style.left = '50%';
        nameInput.style.top = '54%';
        nameInput.style.transform = 'translate(-50%, -50%)';
        nameInput.style.width = '300px';
        nameInput.style.height = '40px';
        nameInput.style.fontSize = '20px';
        nameInput.style.textAlign = 'center';
        nameInput.style.border = '3px solid #ffd700';
        nameInput.style.borderRadius = '5px';
        nameInput.style.backgroundColor = '#2a2a3e';
        nameInput.style.color = '#ffffff';
        nameInput.style.outline = 'none';
        nameInput.style.zIndex = '1000';
        nameInput.style.pointerEvents = 'auto';
        document.body.appendChild(nameInput);
        nameInput.focus();

        // Prevent clicks on input from triggering game elements below
        nameInput.addEventListener('mousedown', (e) => e.stopPropagation());
        nameInput.addEventListener('click', (e) => e.stopPropagation());

        // Join Matchmaking button
        const joinBg = this.add.rectangle(640, 470, 280, 60, 0x00aa00, 0.9);
        joinBg.setStrokeStyle(3, 0xffd700);
        const joinBtn = this.add.text(640, 470, '🎮 JOIN MATCHMAKING', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        joinBg.setInteractive({ useHandCursor: true });
        joinBtn.setInteractive({ useHandCursor: true });

        // Back button
        const backBg = this.add.rectangle(640, 560, 150, 45, 0xff0000, 0.8);
        backBg.setStrokeStyle(2, 0xffd700);
        const backBtn = this.add.text(640, 560, '← BACK', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        backBg.setInteractive({ useHandCursor: true });
        backBtn.setInteractive({ useHandCursor: true });

        // Store references for cleanup
        const menuElements = [dimOverlay, menuPanel, menuTitle, subtitle, nameLabel, joinBg, joinBtn, backBg, backBtn];

        // Join Matchmaking handler
        const handleJoinMatchmaking = () => {
            const playerName = nameInput.value.trim() || 'Player';
            this.connectAndJoinMatchmaking(playerName, menuElements, [nameInput]);
        };

        // Back handler
        const handleBack = () => {
            menuElements.forEach(el => el.destroy());
            nameInput.remove();
        };

        joinBg.on('pointerdown', handleJoinMatchmaking);
        joinBtn.on('pointerdown', handleJoinMatchmaking);
        backBg.on('pointerdown', handleBack);
        backBtn.on('pointerdown', handleBack);

        // Hover effects
        joinBg.on('pointerover', () => joinBg.setScale(1.05));
        joinBg.on('pointerout', () => joinBg.setScale(1));
        backBg.on('pointerover', () => backBg.setScale(1.05));
        backBg.on('pointerout', () => backBg.setScale(1));
    }

    async connectAndJoinMatchmaking(playerName, menuElements, inputs) {
        // Show loading
        const loadingText = this.add.text(640, 500, 'Connecting to server...', {
            fontSize: '20px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        try {
            // Import and initialize multiplayer manager
            const { MultiplayerManager } = await import('../MultiplayerManager.js');
            const multiplayer = new MultiplayerManager();
            
            await multiplayer.connect();
            
            // Set up listeners BEFORE joining matchmaking
            const joinPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Matchmaking timeout'));
                }, 10000);
                
                multiplayer.socket.once('lobbyJoined', (data) => {
                    clearTimeout(timeout);
                    resolve(data);
                });
                
                multiplayer.socket.once('error', (data) => {
                    clearTimeout(timeout);
                    reject(new Error(data.message || 'Could not join lobby'));
                });
            });
            
            // Join matchmaking
            multiplayer.joinMatchmaking(playerName);
            
            // Wait for lobby assignment
            await joinPromise;

            // Show lobby
            this.showLobby(multiplayer, menuElements, inputs, loadingText);
        } catch (error) {
            console.error('Matchmaking error:', error);
            const errorMsg = error.message || 'Could not connect to matchmaking';
            loadingText.setText(`❌ ${errorMsg}\nPlease try again.`);
            loadingText.setColor('#ff0000');
        }
    }

    showLobby(multiplayer, oldMenuElements, inputs, loadingText) {
        // Clean up old menu
        oldMenuElements.forEach(el => el.destroy());
        inputs.forEach(input => input.remove());
        loadingText.destroy();

        // Lobby panel
        const lobbyPanel = this.add.rectangle(640, 360, 600, 500, 0x1a1a2e, 0.95);
        lobbyPanel.setStrokeStyle(4, 0xffd700);

        // Lobby title
        const lobbyTitle = this.add.text(640, 180, '🎮 MATCHMAKING LOBBY', {
            fontSize: '32px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Players label
        const playersLabel = this.add.text(640, 240, 'Players in Lobby:', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Players list
        const playersText = this.add.text(640, 320, '', {
            fontSize: '20px',
            fill: '#00ff88',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);

        // Countdown text
        const countdownText = this.add.text(640, 440, '', {
            fontSize: '28px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Status text (waiting for players or countdown running)
        const statusText = this.add.text(640, 500, 'Waiting for more players...\n(Need at least 2 to start)', {
            fontSize: '20px',
            fill: '#aaaaaa',
            fontFamily: 'Arial',
            align: 'center',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Pulsing animation for status text
        this.tweens.add({
            targets: statusText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Update players list
        const updatePlayersList = (data) => {
            if (data && data.players) {
                // Update remote players from server data
                multiplayer.remotePlayers = { ...data.players };
                // Always remove self from remote players list using OUR socket ID
                delete multiplayer.remotePlayers[multiplayer.socket.id];
            }
            
            const players = Object.values(multiplayer.remotePlayers);
            const playerNames = [multiplayer.playerName, ...players.map(p => p.name)];
            playersText.setText(playerNames.join('\n'));
        };

        // Initial update - get the current state
        const players = Object.values(multiplayer.remotePlayers);
        const playerNames = [multiplayer.playerName, ...players.map(p => p.name)];
        playersText.setText(playerNames.join('\n'));

        // Start Now button (only show when ≥2 players)
        const startNowBg = this.add.rectangle(640, 500, 200, 50, 0x00aa00, 0.9);
        startNowBg.setStrokeStyle(3, 0x00ff00);
        const startNowBtn = this.add.text(640, 500, '▶️ START NOW', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        startNowBg.setInteractive({ useHandCursor: true });
        startNowBtn.setInteractive({ useHandCursor: true });
        
        // Initially hide if less than 2 players
        const updateStartButtonVisibility = () => {
            const totalPlayers = Object.keys(multiplayer.remotePlayers).length + 1;
            const shouldShow = totalPlayers >= 2;
            startNowBg.setVisible(shouldShow);
            startNowBtn.setVisible(shouldShow);
        };
        
        updateStartButtonVisibility();

        const handleStartNow = () => {
            multiplayer.socket.emit('startGameNow');
        };

        startNowBg.on('pointerdown', handleStartNow);
        startNowBtn.on('pointerdown', handleStartNow);
        startNowBg.on('pointerover', () => {
            startNowBg.setScale(1.05);
            startNowBtn.setScale(1.05);
        });
        startNowBg.on('pointerout', () => {
            startNowBg.setScale(1);
            startNowBtn.setScale(1);
        });

        // Listen for new players joining
        multiplayer.socket.on('lobbyJoined', (data) => {
            updatePlayersList(data);
            updateStartButtonVisibility();
        });

        // Listen for players leaving
        multiplayer.socket.on('playerLeft', (data) => {
            console.log(`${data.playerName} left the lobby (${data.playerCount} remaining)`);
            // Remove the player from remote players
            delete multiplayer.remotePlayers[data.playerId];
            // Update the display
            const players = Object.values(multiplayer.remotePlayers);
            const playerNames = [multiplayer.playerName, ...players.map(p => p.name)];
            playersText.setText(playerNames.join('\n'));
            updateStartButtonVisibility();
        });

        // Listen for countdown start
        multiplayer.socket.on('countdownStarted', (data) => {
            statusText.setText('Game starting soon!');
            countdownText.setText(`Starting in: ${data.seconds}s`);
        });

        // Listen for countdown updates
        multiplayer.socket.on('countdownUpdate', (data) => {
            countdownText.setText(`Starting in: ${data.seconds}s`);
            
            // Flash effect when countdown is low
            if (data.seconds <= 10) {
                countdownText.setColor('#ff0000');
                this.tweens.add({
                    targets: countdownText,
                    scale: 1.2,
                    duration: 100,
                    yoyo: true
                });
            }
        });

        // Listen for countdown cancellation (player left, < 2 players)
        multiplayer.socket.on('countdownCancelled', () => {
            countdownText.setText('');
            statusText.setText('Waiting for more players...\n(Need at least 2 to start)');
            updatePlayersList();
        });

        // Listen for game start
        multiplayer.socket.on('gameStarted', () => {
            this.startMusic.stop();
            this.registry.set('isMultiplayer', true);
            this.registry.set('multiplayerManager', multiplayer);
            this.scene.start('Game');
        });

        // Leave button
        const leaveBg = this.add.rectangle(640, 570, 150, 45, 0xff0000, 0.8);
        leaveBg.setStrokeStyle(2, 0xffd700);
        const leaveBtn = this.add.text(640, 570, '🚪 LEAVE', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        leaveBg.setInteractive({ useHandCursor: true });
        leaveBtn.setInteractive({ useHandCursor: true });

        const handleLeave = () => {
            multiplayer.disconnect();
            this.scene.restart();
        };

        leaveBg.on('pointerdown', handleLeave);
        leaveBtn.on('pointerdown', handleLeave);
        leaveBg.on('pointerover', () => leaveBg.setScale(1.05));
        leaveBg.on('pointerout', () => leaveBg.setScale(1));
    }

    showLobbyAfterRejoin(multiplayer) {
        // Create minimal background
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.3);

        // Show "Joining lobby..." text
        const joiningText = this.add.text(640, 360, 'Joining new lobby...', {
            fontSize: '32px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Pulsing animation
        this.tweens.add({
            targets: joiningText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Wait for lobby to be ready, then show it
        this.time.delayedCall(500, () => {
            joiningText.destroy();
            this.showLobby(multiplayer, [overlay], [], { destroy: () => {} });
        });
    }
    
}
