// Dizolaur Multiplayer Server
// Simple Socket.io server for testing multiplayer functionality

const express = require('express');
const app = express();
const cors = require('cors');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*", // Allow all origins for testing (restrict in production)
        methods: ["GET", "POST"]
    }
});

// Enable CORS for Express
app.use(cors());

// Store game state
const rooms = {};
const players = {};
const MAX_LOBBY_SIZE = 5;
const COUNTDOWN_TIME = 60; // seconds

// Utility function to generate room codes
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Find or create an available lobby
function findAvailableLobby() {
    // Find a lobby that's not full, hasn't started, and hasn't ended
    for (const [roomCode, room] of Object.entries(rooms)) {
        const playerCount = Object.keys(room.players).length;
        if (!room.gameStarted && !room.gameEnded && playerCount < MAX_LOBBY_SIZE) {
            return roomCode;
        }
    }
    
    // No available lobby, create a new one
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
        players: {},
        gameStarted: false,
        gameEnded: false,
        countdown: null,
        countdownStarted: false,
        obstaclesSeed: Math.random()
    };
    
    console.log(`Created new lobby: ${roomCode}`);
    return roomCode;
}

// Start countdown for a lobby
function startCountdown(roomCode) {
    if (!rooms[roomCode]) return;
    
    let timeLeft = COUNTDOWN_TIME;
    console.log(`Starting ${COUNTDOWN_TIME}s countdown in lobby ${roomCode}`);
    
    // Notify players countdown started
    io.to(roomCode).emit('countdownStarted', { seconds: timeLeft });
    
    rooms[roomCode].countdown = setInterval(() => {
        timeLeft--;
        
        // Send countdown update
        io.to(roomCode).emit('countdownUpdate', { seconds: timeLeft });
        
        if (timeLeft <= 0) {
            clearInterval(rooms[roomCode].countdown);
            rooms[roomCode].countdown = null;
            
            // Reset all players to alive state before starting
            Object.keys(rooms[roomCode].players).forEach(playerId => {
                rooms[roomCode].players[playerId].isAlive = true;
                rooms[roomCode].players[playerId].score = 0;
            });
            
            // Start the game
            rooms[roomCode].gameStarted = true;
            console.log(`🎲 Sending seed to all players: ${rooms[roomCode].obstaclesSeed}`);
            io.to(roomCode).emit('gameStarted', {
                seed: rooms[roomCode].obstaclesSeed,
                players: rooms[roomCode].players
            });
            
            console.log(`Game started in lobby ${roomCode}`);
        }
    }, 1000);
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Join matchmaking (automatic lobby)
    socket.on('joinMatchmaking', (playerName) => {
        // Find or create an available lobby
        const roomCode = findAvailableLobby();
        
        // Add player to room
        rooms[roomCode].players[socket.id] = {
            id: socket.id,
            name: playerName,
            x: 200,
            y: 600,
            score: 0,
            isAlive: true,
            isJumping: false
        };
        
        players[socket.id] = { room: roomCode, name: playerName };
        socket.join(roomCode);
        
        const playerCount = Object.keys(rooms[roomCode].players).length;
        
        // Notify all players in room
        io.to(roomCode).emit('lobbyJoined', {
            roomCode: roomCode,
            playerId: socket.id,
            playerName: playerName,
            players: rooms[roomCode].players,
            playerCount: playerCount,
            maxPlayers: MAX_LOBBY_SIZE
        });
        
        console.log(`${playerName} joined lobby ${roomCode} (${playerCount}/${MAX_LOBBY_SIZE})`);
        
        // Start countdown if we have at least 2 players and countdown not started
        if (playerCount >= 2 && !rooms[roomCode].countdownStarted) {
            rooms[roomCode].countdownStarted = true;
            startCountdown(roomCode);
        }
    });

    // Manual start game (skip countdown)
    socket.on('startGameNow', () => {
        const playerInfo = players[socket.id];
        if (!playerInfo) return;
        
        const roomCode = playerInfo.room;
        if (!rooms[roomCode]) return;
        
        const playerCount = Object.keys(rooms[roomCode].players).length;
        
        // Need at least 2 players to start
        if (playerCount < 2) {
            socket.emit('error', { message: 'Need at least 2 players to start' });
            return;
        }
        
        // Cancel existing countdown if any
        if (rooms[roomCode].countdown) {
            clearInterval(rooms[roomCode].countdown);
            rooms[roomCode].countdown = null;
        }
        
        // Reset all players to alive state before starting
        Object.keys(rooms[roomCode].players).forEach(playerId => {
            rooms[roomCode].players[playerId].isAlive = true;
            rooms[roomCode].players[playerId].score = 0;
        });
        
        // Start the game immediately
        rooms[roomCode].gameStarted = true;
        console.log(`🎲 [START NOW] Sending seed to all players: ${rooms[roomCode].obstaclesSeed}`);
        io.to(roomCode).emit('gameStarted', {
            seed: rooms[roomCode].obstaclesSeed,
            players: rooms[roomCode].players
        });
        
        console.log(`Game started manually in lobby ${roomCode}`);
    });

    // Player position update
    socket.on('playerUpdate', (data) => {
        const playerInfo = players[socket.id];
        if (!playerInfo) return;
        
        const roomCode = playerInfo.room;
        if (!rooms[roomCode] || !rooms[roomCode].players[socket.id]) return;
        
        // Update player data
        rooms[roomCode].players[socket.id] = {
            ...rooms[roomCode].players[socket.id],
            x: data.x,
            y: data.y,
            score: data.score,
            isAlive: data.isAlive,
            isJumping: data.isJumping
        };
        
        // Broadcast to other players in the room (not sender)
        socket.to(roomCode).emit('playerMoved', {
            playerId: socket.id,
            x: data.x,
            y: data.y,
            score: data.score,
            isAlive: data.isAlive,
            isJumping: data.isJumping
        });
    });

    // Player game over
    socket.on('playerDied', (data) => {
        const playerInfo = players[socket.id];
        if (!playerInfo) return;
        
        const roomCode = playerInfo.room;
        if (!rooms[roomCode]) return;
        
        rooms[roomCode].players[socket.id].isAlive = false;
        rooms[roomCode].players[socket.id].score = data.score;
        
        // Notify other players
        io.to(roomCode).emit('playerDied', {
            playerId: socket.id,
            score: data.score
        });
        
        console.log(`Player ${socket.id} died with score ${data.score}`);
        
        // Check if only one player remains alive (winner)
        const alivePlayers = Object.values(rooms[roomCode].players).filter(p => p.isAlive);
        if (alivePlayers.length === 1 && rooms[roomCode].gameStarted) {
            // Game over - we have a winner
            const winner = alivePlayers[0];
            console.log(`Game over in ${roomCode}. Winner: ${winner.name}`);
            
            // Mark room as ended immediately to prevent reuse
            rooms[roomCode].gameEnded = true;
            
            io.to(roomCode).emit('gameEnded', {
                winner: winner,
                allPlayers: rooms[roomCode].players
            });
            
            // Delete room after delay (players need time to see results)
            setTimeout(() => {
                if (rooms[roomCode]) {
                    delete rooms[roomCode];
                    console.log(`Room ${roomCode} cleaned up`);
                }
            }, 5000);
        } else if (alivePlayers.length === 0 && rooms[roomCode].gameStarted) {
            // All players died somehow
            console.log(`All players died in ${roomCode}`);
            
            // Mark room as ended immediately to prevent reuse
            rooms[roomCode].gameEnded = true;
            
            io.to(roomCode).emit('gameEnded', {
                winner: null,
                allPlayers: rooms[roomCode].players
            });
            
            setTimeout(() => {
                if (rooms[roomCode]) {
                    delete rooms[roomCode];
                }
            }, 5000);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        const playerInfo = players[socket.id];
        if (!playerInfo) return;
        
        const roomCode = playerInfo.room;
        if (!rooms[roomCode]) return;
        
        // Remove player from room
        delete rooms[roomCode].players[socket.id];
        
        const remainingPlayers = Object.keys(rooms[roomCode].players).length;
        
        // Notify other players
        io.to(roomCode).emit('playerLeft', {
            playerId: socket.id,
            playerName: playerInfo.name,
            playerCount: remainingPlayers
        });
        
        // If room is empty, delete it
        if (remainingPlayers === 0) {
            if (rooms[roomCode].countdown) {
                clearInterval(rooms[roomCode].countdown);
            }
            delete rooms[roomCode];
            console.log(`Room ${roomCode} deleted (empty)`);
        } 
        // If less than 2 players and game not started, cancel countdown
        else if (remainingPlayers < 2 && !rooms[roomCode].gameStarted && rooms[roomCode].countdown) {
            clearInterval(rooms[roomCode].countdown);
            rooms[roomCode].countdown = null;
            rooms[roomCode].countdownStarted = false;
            io.to(roomCode).emit('countdownCancelled');
            console.log(`Countdown cancelled in ${roomCode} (not enough players)`);
        }
        
        delete players[socket.id];
    });
});

// Health check endpoint for faster deployment detection
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Basic route for testing
app.get('/', (req, res) => {
    res.json({
        message: 'Dizolaur Multiplayer Server',
        activeRooms: Object.keys(rooms).length,
        activePlayers: Object.keys(players).length
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 Dizolaur Multiplayer Server running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
});
