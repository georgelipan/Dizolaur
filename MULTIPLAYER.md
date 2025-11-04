# Dizolaur Multiplayer Setup Guide

## Quick Start

### 1. Start the Multiplayer Server
Open a terminal in the project root and run:
```powershell
node server.js
```

You should see:
```
🎮 Dizolaur Multiplayer Server running on port 3000
Server URL: http://localhost:3000
```

### 2. Start the Game Client
Open another terminal and run:
```powershell
python -m http.server 8000
```

### 3. Play Multiplayer
1. Open `http://localhost:8000` in your browser
2. You'll need to update the Start scene to add multiplayer UI (room creation/joining)
3. Open another browser tab or share the room code with a friend

## Testing Locally

### Test with 2 Browser Windows
1. Start server: `node server.js`
2. Start game: `python -m http.server 8000`
3. Open two browser windows:
   - Window 1: Create room
   - Window 2: Join with the room code
4. Both players will see each other in the game

## Architecture

### Server (server.js)
- **Port**: 3000
- **Technology**: Express + Socket.io
- **Features**:
  - Room creation with random codes
  - Player join/leave handling
  - Real-time position synchronization
  - Game state management

### Client (MultiplayerManager.js)
- **Methods**:
  - `connect()` - Connect to server
  - `createRoom(playerName)` - Create new game room
  - `joinRoom(roomCode, playerName)` - Join existing room
  - `startGame()` - Start game (host only)
  - `sendPlayerUpdate(x, y, score, isAlive, isJumping)` - Send position
  - `getRemotePlayers()` - Get other players data

## Next Steps

### 1. Update Start.js Scene
Add UI for:
- Player name input
- "Create Room" button
- "Join Room" button with room code input
- Display room code when created

### 2. Update Game.js Scene
- Import MultiplayerManager
- Send player position every frame (throttled)
- Render ghost players for other players
- Synchronize obstacles using seed

### 3. Update GameOver.js Scene
- Show all players' scores
- Display winner
- Allow rematch or return to lobby

## Events Reference

### Client → Server
- `createRoom` - Create new room
- `joinRoom` - Join existing room
- `startGame` - Start the game
- `playerUpdate` - Send player position/state
- `playerDied` - Notify death

### Server → Client
- `roomCreated` - Room was created
- `playerJoined` - Someone joined
- `gameStarted` - Game started
- `playerMoved` - Someone moved
- `playerDied` - Someone died
- `playerLeft` - Someone disconnected

## Deployment (Later)

### Free Options:
1. **Render.com** (Recommended)
   - Free tier: 750 hours/month
   - Auto-deploy from GitHub
   - Custom domain support

2. **Railway.app**
   - $5/month free credit
   - Easy deployment
   - Good performance

3. **Fly.io**
   - Free tier available
   - Global deployment

### Deploy to Render.com:
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Update `serverUrl` in MultiplayerManager.js

## Troubleshooting

### Server won't start
- Check if port 3000 is in use: `netstat -ano | findstr :3000`
- Kill process or change port in server.js

### Client can't connect
- Ensure server is running
- Check console for errors
- Verify serverUrl in MultiplayerManager.js matches server address

### Players not syncing
- Check browser console for Socket.io errors
- Verify both players are in same room
- Check server logs for connection issues

## Performance Tips

### Throttle Updates
Don't send position every frame. Send every 3-5 frames:
```javascript
this.updateCounter = 0;
// In update():
this.updateCounter++;
if (this.updateCounter % 3 === 0) {
    multiplayer.sendPlayerUpdate(...);
}
```

### Interpolation
Smooth remote player movement:
```javascript
// Instead of: remotePlayer.x = data.x
remotePlayer.targetX = data.x;
// Then in update():
remotePlayer.x += (remotePlayer.targetX - remotePlayer.x) * 0.2;
```

## Current Status
- ✅ Server created
- ✅ MultiplayerManager created
- ✅ Socket.io client added to index.html
- ⏳ Need to integrate into Start.js (room UI)
- ⏳ Need to integrate into Game.js (sync players)
- ⏳ Need to update GameOver.js (show all scores)
