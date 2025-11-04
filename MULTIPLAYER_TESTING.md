# 🎮 Multiplayer Testing Guide

## ✅ Implementation Complete!

All multiplayer features have been implemented:
- ✅ Server infrastructure (Socket.io)
- ✅ Start scene with room creation/joining
- ✅ Real-time player synchronization in Game scene
- ✅ Multiplayer rankings in GameOver scene

---

## 🚀 Quick Start (2-Player Local Test)

### Step 1: Start the Server
Open a terminal and run:
```powershell
node server.js
```

**Expected output:**
```
🎮 Dizolaur Multiplayer Server running on port 3000
Server URL: http://localhost:3000
```

**Keep this terminal open!**

---

### Step 2: Start the Game Client
Open **another terminal** and run:
```powershell
python -m http.server 8000
```

---

### Step 3: Test with 2 Players

#### Player 1 (Host):
1. Open browser: `http://localhost:8000`
2. Click **"👥 MULTIPLAYER"**
3. Enter your name (e.g., "Alice")
4. Click **"🎲 CREATE ROOM"**
5. You'll see a **Room Code** (e.g., "ABC123")
6. Wait for Player 2 to join

#### Player 2 (Guest):
1. Open **new browser window/tab**: `http://localhost:8000`
2. Click **"👥 MULTIPLAYER"**
3. Enter your name (e.g., "Bob")
4. Enter the **Room Code** from Player 1
5. Click **"🚪 JOIN ROOM"**

#### Start Playing:
1. Player 1 clicks **"▶️ START GAME"**
2. Both players start playing simultaneously
3. You'll see each other as **blue ghost players** with names
4. When someone dies, the game continues for others
5. Final rankings show at the end

---

## 🌐 Test with Friends (Remote)

### Option 1: Use ngrok (Easiest)
1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Share the ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Update `MultiplayerManager.js` line 11:
   ```javascript
   this.serverUrl = 'https://YOUR-NGROK-URL';
   ```
5. Friends open your game URL (`http://YOUR-IP:8000`)

### Option 2: Deploy to Render.com (Free)
1. Push code to GitHub
2. Create account on Render.com
3. Create new Web Service
4. Connect your repo
5. Build: `npm install`
6. Start: `node server.js`
7. Update `serverUrl` in `MultiplayerManager.js` with Render URL

---

## 🎮 Gameplay Features

### In-Game Multiplayer:
- **Ghost Players**: See other players as transparent blue sprites
- **Name Tags**: Each player's name appears above their character
- **Real-time Sync**: Positions update 20 times per second
- **Death Indication**: Dead players appear faded
- **Smooth Movement**: Interpolation prevents jittery movement

### End Screen:
- **Rankings**: All players sorted by score
- **Medals**: 🥇 🥈 🥉 for top 3
- **Highlight**: Your score is highlighted in green
- **High Score**: Still tracks personal best

---

## 🐛 Troubleshooting

### Server won't start
**Error**: `Error: listen EADDRINUSE`
**Fix**: Port 3000 is in use. Kill the process:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Client can't connect
**Error**: `Could not connect to server!`
**Fix**: 
1. Make sure server is running (check terminal)
2. Check `serverUrl` in `MultiplayerManager.js`
3. Try refreshing the page (Ctrl+Shift+R)

### Players not syncing
**Fix**:
1. Check browser console (F12) for errors
2. Verify both players are in the same room
3. Check server terminal for connection logs

### Game crashes
**Fix**:
1. Refresh browser (Ctrl+Shift+R)
2. Restart server
3. Check browser console for errors

---

## 📊 Server Monitoring

### Check Server Status
Visit: `http://localhost:3000`

You'll see:
```json
{
  "message": "Dizolaur Multiplayer Server",
  "activeRooms": 2,
  "activePlayers": 4
}
```

### Server Logs
The terminal running `node server.js` shows:
- Player connections
- Room creations
- Player joins/leaves
- Game starts

---

## 🎯 Next Steps

### Ready for Production?
1. **Deploy Server**: Use Render.com or Railway.app (free tier)
2. **Update URL**: Change `serverUrl` in `MultiplayerManager.js`
3. **Add Features**:
   - Private rooms with passwords
   - Spectator mode
   - Chat system
   - Custom game modes
   - Leaderboard API

### Future Enhancements:
- Matchmaking system
- Tournament mode
- Power-ups synchronization
- Replay system
- Anti-cheat measures

---

## 📝 Code Structure

### Server (`server.js`):
- Room management
- Player state synchronization
- Event handling

### Client (`MultiplayerManager.js`):
- Connection handling
- Room operations
- Data synchronization

### Scenes:
- **Start.js**: Room creation/joining UI
- **Game.js**: Real-time player rendering
- **GameOver.js**: Multiplayer rankings

---

## 🔥 Tips for Best Experience

1. **Use Chrome/Edge**: Best WebSocket performance
2. **Low Latency**: Play on good internet connection
3. **Close Tabs**: Reduce browser load
4. **Disable Extensions**: Prevent interference
5. **Refresh Often**: Clear cache (Ctrl+Shift+R)

---

## 📞 Testing Checklist

Before playing with friends:
- [ ] Server is running (`node server.js`)
- [ ] Client is running (`python -m http.server 8000`)
- [ ] Can create a room
- [ ] Room code displays correctly
- [ ] Can join with room code
- [ ] Both players appear in lobby
- [ ] Host can start the game
- [ ] Players see each other in-game
- [ ] Scores sync correctly
- [ ] Rankings display at end

---

**Happy Gaming! 🎮**
