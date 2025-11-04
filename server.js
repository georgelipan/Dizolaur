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

// Utility function to generate room codes
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Create a new room
    socket.on('createRoom', (playerName) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            host: socket.id,
            players: {},
            gameStarted: false,
            obstaclesSeed: Math.random() // Seed for synchronized obstacles
        };
        
        // Add host as first player
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
        
        socket.emit('roomCreated', {
            roomCode: roomCode,
            playerId: socket.id
        });
        
        console.log(`Room ${roomCode} created by ${playerName}`);
    });

    // Join an existing room
    socket.on('joinRoom', (data) => {
        const { roomCode, playerName } = data;
        
        if (!rooms[roomCode]) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        if (rooms[roomCode].gameStarted) {
            socket.emit('error', { message: 'Game already in progress' });
            return;
        }
        
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
        
        // Notify all players in room
        io.to(roomCode).emit('playerJoined', {
            playerId: socket.id,
            playerName: playerName,
            players: rooms[roomCode].players
        });
        
        console.log(`${playerName} joined room ${roomCode}`);
    });

    // Start the game
    socket.on('startGame', (roomCode) => {
        if (!rooms[roomCode] || rooms[roomCode].host !== socket.id) {
            socket.emit('error', { message: 'Only host can start the game' });
            return;
        }
        
        rooms[roomCode].gameStarted = true;
        io.to(roomCode).emit('gameStarted', {
            seed: rooms[roomCode].obstaclesSeed,
            players: rooms[roomCode].players
        });
        
        console.log(`Game started in room ${roomCode}`);
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
    });

    // Get room info
    socket.on('getRoomInfo', (roomCode) => {
        if (!rooms[roomCode]) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        socket.emit('roomInfo', {
            roomCode: roomCode,
            players: rooms[roomCode].players,
            gameStarted: rooms[roomCode].gameStarted,
            isHost: rooms[roomCode].host === socket.id
        });
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
        
        // Notify other players
        io.to(roomCode).emit('playerLeft', {
            playerId: socket.id,
            playerName: playerInfo.name
        });
        
        // If room is empty or host left, delete room
        if (Object.keys(rooms[roomCode].players).length === 0 || rooms[roomCode].host === socket.id) {
            delete rooms[roomCode];
            console.log(`Room ${roomCode} deleted`);
        }
        
        delete players[socket.id];
    });
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
