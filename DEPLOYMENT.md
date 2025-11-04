# 🌐 Deploying Dizolaur Multiplayer Server

## ✅ Step 1: Deploy to Render.com

### A. Sign Up
1. Go to https://render.com/
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account**
4. Authorize Render to access your repositories

### B. Create Web Service
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Find and connect your **Dizolaur** repository
3. Select the **`multiplayer`** branch
4. Fill in the configuration:

```
Name:              dizolaur-server
Region:            US West (Oregon) - or closest to you
Branch:            multiplayer
Root Directory:    (leave blank)
Runtime:           Node
Build Command:     npm install
Start Command:     node server.js
Instance Type:     Free
```

5. Click **"Create Web Service"**
6. Wait 2-3 minutes for deployment to complete

### C. Get Your Server URL
After deployment, you'll see a URL like:
```
https://dizolaur-server.onrender.com
```

**Copy this URL!** You'll need it for the next step.

---

## ✅ Step 2: Update Game Client

After getting your Render URL, update the game to connect to your deployed server:

### Edit `src/MultiplayerManager.js`

Find line 13 and change:
```javascript
this.serverUrl = 'http://localhost:3000'; // Change for production
```

To your Render URL:
```javascript
this.serverUrl = 'https://dizolaur-server.onrender.com'; // Your actual URL
```

### Commit and Push:
```powershell
git add src/MultiplayerManager.js
git commit -m "Update server URL for production"
git push origin multiplayer
```

---

## ✅ Step 3: Deploy Your Game Client

You have two options to host the game client:

### Option A: GitHub Pages (Easiest)

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `multiplayer`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes
6. Your game will be at: `https://georgelipan.github.io/Dizolaur/`

### Option B: Netlify (Alternative)

1. Go to https://netlify.com/
2. Sign in with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Select your **Dizolaur** repository
5. Branch: `multiplayer`
6. Build settings: (leave blank for static site)
7. Click **Deploy**
8. Your game will be at: `https://[random-name].netlify.app`

---

## ✅ Step 4: Share with Friends!

Once both are deployed:

1. **Send your friends the game URL**:
   - GitHub Pages: `https://georgelipan.github.io/Dizolaur/`
   - Netlify: `https://[your-site].netlify.app`

2. **To play together**:
   - You: Click "Multiplayer" → "Create Room"
   - Share the room code with friends
   - Friends: Open the same game URL → "Multiplayer" → "Join Room" → Enter code
   - You: Click "Start Game"
   - Play together! 🎮

---

## 🐛 Troubleshooting

### Server goes to sleep (Free tier limitation)
**Problem**: Render free tier puts services to sleep after 15 min of inactivity
**Solution**: First connection takes 30-60 seconds to "wake up" the server

### Can't connect to server
**Problem**: Game says "Could not connect to server"
**Solutions**:
1. Check if Render service is running (visit your Render dashboard)
2. Verify the URL in `MultiplayerManager.js` is correct
3. Make sure URL starts with `https://` not `http://`
4. Check browser console (F12) for errors

### CORS errors in console
**Problem**: Browser blocks connection
**Solution**: The server.js already has CORS configured. If you still see errors:
1. Make sure you deployed the latest code
2. Restart the Render service
3. Clear browser cache (Ctrl+Shift+R)

---

## 📊 Monitoring Your Server

### Check Server Status
Visit your Render URL in a browser:
```
https://dizolaur-server.onrender.com
```

You should see:
```json
{
  "message": "Dizolaur Multiplayer Server",
  "activeRooms": 0,
  "activePlayers": 0
}
```

### View Logs
In Render dashboard:
1. Click on your service
2. Click **"Logs"** tab
3. See real-time server activity

---

## 💰 Costs

- **Render.com**: Free tier (750 hours/month - plenty for testing!)
- **GitHub Pages**: Completely free
- **Netlify**: Free tier (100GB bandwidth/month)

**Total Cost: $0** 🎉

---

## 🚀 What's Next?

### For Better Performance (Optional):
1. **Upgrade Render**: $7/month for always-on service (no sleep)
2. **Custom Domain**: Add your own domain to GitHub Pages or Netlify
3. **CDN**: Use Cloudflare for faster global access

### Add More Features:
- Private rooms with passwords
- Spectator mode
- In-game chat
- Leaderboard API
- Tournament mode

---

## 📝 Quick Reference

**Server Code**: `server.js`
**Client Code**: `src/MultiplayerManager.js`
**Server URL**: Change line 13 in MultiplayerManager.js

**Deployment Commands**:
```powershell
# Update code
git add .
git commit -m "Your message"
git push origin multiplayer

# Render auto-deploys on push! 🎉
```

---

**You're ready to play with friends worldwide! 🌍🎮**
