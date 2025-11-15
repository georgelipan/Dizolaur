# ✅ Checklist Rapid Deploy Render.com

## 🔄 Ordinea de Deploy (IMPORTANT!)

**BACKEND PRIMUL, APOI FRONTEND!**

---

## 📋 PAȘI RAPIDI

### 1️⃣ Push pe GitHub
```bash
git add .
git commit -m "feat: add Render deployment"
git push origin main
```

### 2️⃣ Deploy Backend

**Render Dashboard** → **New +** → **Web Service**

| Setting | Value |
|---------|-------|
| **Repository** | Your GitHub repo |
| **Name** | `dizolaur-backend` |
| **Region** | Frankfurt / Oregon |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

**Environment Variables:**
```env
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
CORS_ORIGINS=https://dizolaur-frontend.onrender.com
MAX_PLAYERS=4
GRAVITY=800
JUMP_VELOCITY=400
DINO_SPEED=200
OBSTACLE_SPAWN_RATE=2000
TICK_RATE=16
```

**Click "Create Web Service"** → Așteaptă deploy

**NOTEAZĂ URL-ul**: `https://dizolaur-backend.onrender.com`

---

### 3️⃣ Deploy Frontend

**Render Dashboard** → **New +** → **Static Site**

| Setting | Value |
|---------|-------|
| **Repository** | Your GitHub repo |
| **Name** | `dizolaur-frontend` |
| **Region** | Frankfurt / Oregon |
| **Root Directory** | `ui` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Plan** | Free |

**Environment Variables:**
```env
VITE_BACKEND_URL=https://dizolaur-backend.onrender.com
VITE_DEBUG_MODE=false
```

⚠️ **Înlocuiește URL-ul cu cel real din Pasul 2!**

**Click "Create Static Site"** → Așteaptă deploy

**NOTEAZĂ URL-ul**: `https://dizolaur-frontend.onrender.com`

---

### 4️⃣ Actualizează CORS

**Backend Service** → **Environment** → Editează `CORS_ORIGINS`:

```env
CORS_ORIGINS=https://dizolaur-frontend.onrender.com
```

⚠️ **Înlocuiește cu URL-ul real din Pasul 3!**

**Save Changes** → Backend va face re-deploy automat

---

### 5️⃣ Testare

1. **Deschide Frontend**: `https://dizolaur-frontend.onrender.com`
2. **F12** → Console → Verifică:
   ```
   ✅ Connected to game server
   ```
3. **Network tab** → **WS** → Verifică conexiune WebSocket

---

## 🎯 URL-uri Finale

După deploy, vei avea:

- **Backend**: `https://dizolaur-backend.onrender.com`
- **Frontend**: `https://dizolaur-frontend.onrender.com`

**Joacă jocul la URL-ul frontend-ului!** 🎮

---

## ⚠️ Notițe Importante

1. **Free Tier**: Serviciile se opresc după 15 min inactivitate
   - Prima încărcare poate dura 30-60 sec (cold start)

2. **CORS**: URL-urile TREBUIE să fie exacte (inclusiv https://)

3. **Environment Variables**:
   - Backend: Sunt în `.env` local, dar trebuie setate manual pe Render
   - Frontend: La fel - setează manual pe Render

4. **Auto-Deploy**:
   - Orice push pe GitHub → Render face auto re-deploy
   - Poți dezactiva în Settings

---

## 🔥 Quick Troubleshooting

| Problemă | Soluție |
|----------|---------|
| Backend nu pornește | Verifică Logs → Environment Variables corecte? |
| CORS error | Actualizează `CORS_ORIGINS` cu URL exact frontend |
| Frontend nu se conectează | Verifică `VITE_BACKEND_URL` - URL corect backend? |
| Service Unavailable | Free tier - așteaptă 30-60 sec (cold start) |
| Build failed | Verifică Root Directory și Build Command |

---

## 📞 Logs în Timp Real

**Dashboard** → **Service** → **Logs**

Vei vedea tot ce se întâmplă! 👀
