// MultiplayerManager.js
// Handles all multiplayer communication with Socket.io server

export class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.roomCode = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        this.remotePlayers = {}; // Other players in the room
        this.serverUrl = 'https://dizolaur.onrender.com';
    }

    connect() {
        return new Promise((resolve, reject) => {
            // Load Socket.io client library
            if (typeof io === 'undefined') {
                console.error('Socket.io client not loaded');
                reject('Socket.io not loaded');
                return;
            }

            this.socket = io(this.serverUrl);

            this.socket.on('connect', () => {
                console.log('Connected to multiplayer server');
                this.isConnected = true;
                this.playerId = this.socket.id;
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
            });

            // Set up event listeners
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Lobby joined
        this.socket.on('lobbyJoined', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = this.socket.id; // Always use current socket ID
            this.remotePlayers = data.players;
            // Remove self from remote players using current socket ID
            delete this.remotePlayers[this.socket.id];
            console.log(`Joined lobby ${data.roomCode} (${data.playerCount}/${data.maxPlayers})`);
            console.log(`My socket ID: ${this.socket.id}`);
        });

        // Countdown started
        this.socket.on('countdownStarted', (data) => {
            console.log(`Countdown started: ${data.timeLeft} seconds`);
        });

        // Countdown update
        this.socket.on('countdownUpdate', (data) => {
            console.log(`Countdown: ${data.timeLeft} seconds remaining`);
        });

        // Countdown cancelled
        this.socket.on('countdownCancelled', () => {
            console.log('Countdown cancelled (not enough players)');
        });

        // Game started
        this.socket.on('gameStarted', (data) => {
            console.log('Game started with seed:', data.seed);
            // Update remote players with fresh data from server (reset isAlive, score)
            if (data.players) {
                this.remotePlayers = data.players;
                // Remove self from remote players
                delete this.remotePlayers[this.socket.id];
            }
        });

        // Player moved
        this.socket.on('playerMoved', (data) => {
            if (this.remotePlayers[data.playerId]) {
                this.remotePlayers[data.playerId].x = data.x;
                this.remotePlayers[data.playerId].y = data.y;
                this.remotePlayers[data.playerId].score = data.score;
                this.remotePlayers[data.playerId].isAlive = data.isAlive;
                this.remotePlayers[data.playerId].isJumping = data.isJumping;
            }
        });

        // Player died
        this.socket.on('playerDied', (data) => {
            console.log(`Player ${data.playerId} died with score ${data.score}`);
            if (this.remotePlayers[data.playerId]) {
                this.remotePlayers[data.playerId].isAlive = false;
                this.remotePlayers[data.playerId].score = data.score;
            }
        });

        // Player left
        this.socket.on('playerLeft', (data) => {
            console.log('Player left:', data.playerName);
            delete this.remotePlayers[data.playerId];
        });

        // Game ended
        this.socket.on('gameEnded', (data) => {
            console.log('Game ended. Winner:', data.winner ? data.winner.name : 'No winner');
        });

        // Error
        this.socket.on('error', (data) => {
            console.error('Server error:', data.message);
            // Don't alert here - let the calling code handle it
        });

        // Room info
        this.socket.on('roomInfo', (data) => {
            this.roomCode = data.roomCode;
            this.isHost = data.isHost;
            this.remotePlayers = data.players;
            delete this.remotePlayers[this.playerId];
        });
    }

    joinMatchmaking(playerName) {
        if (!this.isConnected) {
            console.error('Not connected to server');
            return;
        }
        this.playerName = playerName;
        console.log(`Joining matchmaking as ${playerName}`);
        this.socket.emit('joinMatchmaking', playerName);
    }

    sendPlayerUpdate(x, y, score, isAlive, isJumping) {
        if (!this.isConnected) return;
        
        this.socket.emit('playerUpdate', {
            x: x,
            y: y,
            score: score,
            isAlive: isAlive,
            isJumping: isJumping
        });
    }

    sendPlayerDied(score) {
        if (!this.isConnected) return;
        
        this.socket.emit('playerDied', { score: score });
    }

    getRoomInfo(roomCode) {
        if (!this.isConnected) return;
        this.socket.emit('getRoomInfo', roomCode);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    getRemotePlayers() {
        return this.remotePlayers;
    }

    isInMultiplayer() {
        return this.isConnected && this.roomCode !== null;
    }
}
