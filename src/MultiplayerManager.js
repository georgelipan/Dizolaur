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
        // Room created
        this.socket.on('roomCreated', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this.isHost = true;
            console.log('Room created:', this.roomCode);
        });

        // Player joined
        this.socket.on('playerJoined', (data) => {
            console.log('Player joined:', data.playerName);
            this.remotePlayers = data.players;
            // Remove self from remote players
            delete this.remotePlayers[this.playerId];
        });

        // Game started
        this.socket.on('gameStarted', (data) => {
            console.log('Game started with seed:', data.seed);
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

    createRoom(playerName) {
        if (!this.isConnected) {
            console.error('Not connected to server');
            return;
        }
        this.playerName = playerName;
        this.socket.emit('createRoom', playerName);
    }

    joinRoom(roomCode, playerName) {
        if (!this.isConnected) {
            console.error('Not connected to server');
            return;
        }
        this.playerName = playerName;
        this.roomCode = roomCode;
        console.log(`Attempting to join room: ${roomCode} as ${playerName}`);
        this.socket.emit('joinRoom', { roomCode, playerName });
    }

    startGame() {
        if (!this.isHost) {
            console.error('Only host can start game');
            return;
        }
        this.socket.emit('startGame', this.roomCode);
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
