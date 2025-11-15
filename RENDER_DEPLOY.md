# 🚀 Deploy pe Render.com - Ghid Complet

Acest ghid te va ajuta să faci deploy pe Render.com cu **servicii separate** pentru Backend și Frontend.

## 📋 Ce vei obține:

- **Backend**: Web Service la `https://dizolaur-backend.onrender.com`
- **Frontend**: Static Site la `https://dizolaur-frontend.onrender.com`
- **Auto-deploy**: La fiecare push pe GitHub
- **Free tier**: Poți folosi planul gratuit pentru început

---

## 🔧 Prerequisite

1. **Cont GitHub** și repository-ul tău push-uit
2. **Cont Render.com** (gratuit) - https://render.com
3. **Conectează Render cu GitHub** (la primul deploy)

---

## 📝 PAȘI PENTRU DEPLOY

### Pasul 1: Pregătire Locală (FACUT ✅)

Am pregătit deja totul! Fișierele create:
- ✅ `render.yaml` - Blueprint pentru ambele servicii
- ✅ `backend/package.json` - Actualizat cu engines
- ✅ `ui/package.json` - Actualizat cu engines
- ✅ Config files pentru variabile de mediu

**Important**: Push-ul pe GitHub este necesar!

```bash
git add .
git commit -m "feat: add Render.com deployment configuration"
git push origin main
```

---

### Pasul 2: Deploy Backend (PRIMUL!)

#### 2.1. Creează Backend Service

1. **Login pe Render.com**: https://dashboard.render.com
2. Click pe **"New +"** → **"Web Service"**
3. **Connect repository**: Selectează repo-ul tău GitHub
4. **Configurare**:
   ```
   Name: dizolaur-backend
   Region: Frankfurt (EU) sau Oregon (US)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Plan: Free (sau Starter pentru mai multă putere)
   ```

#### 2.2. Setează Environment Variables pentru Backend

În secțiunea **Environment Variables**, adaugă:

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

**FOARTE IMPORTANT**:
- `CORS_ORIGINS` trebuie să fie URL-ul EXACT al frontend-ului
- Îl vom actualiza după ce frontend-ul este deployed
- Deocamdată poți pune: `https://dizolaur-frontend.onrender.com`

#### 2.3. Deploy Backend

1. Click **"Create Web Service"**
2. Așteaptă deploy-ul (2-5 minute)
3. **Notează URL-ul backend-ului**: `https://dizolaur-backend.onrender.com`

---

### Pasul 3: Deploy Frontend (AL DOILEA!)

#### 3.1. Creează Frontend Service

1. **Înapoi pe Dashboard**: Click **"New +"** → **"Static Site"**
2. **Connect repository**: Selectează același repo GitHub
3. **Configurare**:
   ```
   Name: dizolaur-frontend
   Region: Frankfurt (EU) sau Oregon (US)
   Root Directory: ui
   Build Command: npm install && npm run build
   Publish Directory: dist
   Plan: Free
   ```

#### 3.2. Setează Environment Variables pentru Frontend

În secțiunea **Environment Variables**, adaugă:

```env
VITE_BACKEND_URL=https://dizolaur-backend.onrender.com
VITE_DEBUG_MODE=false
```

**FOARTE IMPORTANT**:
- Înlocuiește `dizolaur-backend` cu numele REAL al serviciului tău backend
- URL-ul trebuie să fie URL-ul EXACT primit la Pasul 2.3

#### 3.3. Deploy Frontend

1. Click **"Create Static Site"**
2. Așteaptă deploy-ul (3-7 minute)
3. **Notează URL-ul frontend-ului**: `https://dizolaur-frontend.onrender.com`

---

### Pasul 4: Actualizează CORS pe Backend

#### 4.1. Actualizează Environment Variable

1. **Mergi la Backend Service** pe Dashboard
2. Click pe **"Environment"** (tab-ul din stânga)
3. **Editează** variabila `CORS_ORIGINS`
4. Setează cu URL-ul EXACT al frontend-ului:
   ```
   CORS_ORIGINS=https://dizolaur-frontend.onrender.com
   ```
5. Click **"Save Changes"**

#### 4.2. Backend-ul va face Re-deploy Automat

Render va detecta schimbarea și va reporni serviciul (30 secunde - 1 minut)

---

### Pasul 5: Testare

#### 5.1. Verifică Backend

1. Deschide: `https://dizolaur-backend.onrender.com`
2. Ar trebui să vezi ceva (chiar dacă e 404/error page - înseamnă că serverul rulează)
3. Verifică logs în Render Dashboard → Backend Service → Logs

**Ce să cauți în logs:**
```
🦖 Dino Game Server starting...
📝 Configuration loaded
   - Port: 10000
🚀 Server running on 0.0.0.0:10000
✅ Ready to accept connections!
```

#### 5.2. Verifică Frontend

1. Deschide: `https://dizolaur-frontend.onrender.com`
2. Ar trebui să vezi jocul (loading screen)
3. Deschide **Browser Console** (F12)

**Ce să cauți în console:**
```
🦖 Dino Game UI v1.0.0
Phaser Version: 3.80.1
📝 Configuration:
   - Backend URL: https://dizolaur-backend.onrender.com
🔌 NetworkService initialized with URL: https://dizolaur-backend.onrender.com
✅ Connected to game server
```

#### 5.3. Verifică Conexiunea

1. În Browser Console, verifică tab-ul **Network** → filtrează după **WS**
2. Ar trebui să vezi o conexiune WebSocket activă către backend
3. Status: **101 Switching Protocols** (good!) sau **Connected**

---

## 🎯 LISTĂ COMPLETĂ - Ce Trebuie Să Faci

### ✅ Pregătire (FĂCUT)
- [x] Fișiere de configurare create
- [x] Package.json actualizate
- [x] Environment variables configurate

### 📤 Deploy (FA ASTA ACUM!)

- [ ] **1. Push pe GitHub**
  ```bash
  git add .
  git commit -m "feat: add Render deployment config"
  git push origin main
  ```

- [ ] **2. Creează cont Render.com**
  - Mergi la https://render.com
  - Sign up (folosește GitHub pentru autentificare)

- [ ] **3. Deploy Backend PRIMUL**
  - New → Web Service
  - Connect repository
  - Root Directory: `backend`
  - Build: `npm install && npm run build`
  - Start: `npm start`
  - Adaugă Environment Variables (vezi Pasul 2.2)
  - Deploy și notează URL-ul

- [ ] **4. Deploy Frontend AL DOILEA**
  - New → Static Site
  - Connect repository
  - Root Directory: `ui`
  - Build: `npm install && npm run build`
  - Publish: `dist`
  - Setează `VITE_BACKEND_URL` cu URL-ul backend-ului
  - Deploy și notează URL-ul

- [ ] **5. Actualizează CORS pe Backend**
  - Backend Service → Environment
  - Editează `CORS_ORIGINS` cu URL-ul frontend-ului
  - Save (va face auto re-deploy)

- [ ] **6. Testează**
  - Deschide frontend-ul în browser
  - Verifică Console pentru erori
  - Încearcă să te autentifici în joc

---

## 🔧 Configurație Avansată (Opțional)

### Custom Domains

Poți adăuga domenii custom (ex: `game.yourdomain.com`):

1. **Render Dashboard** → Service → Settings → Custom Domain
2. Adaugă domeniul
3. Configurează DNS (Render îți va da instrucțiunile)
4. **Actualizează**:
   - Frontend `.env`: `VITE_BACKEND_URL=https://api.yourdomain.com`
   - Backend `CORS_ORIGINS`: `https://game.yourdomain.com`

### Auto-Deploy

Render face auto-deploy la fiecare push pe GitHub:
- **Backend**: Orice modificare în `/backend` → auto re-deploy
- **Frontend**: Orice modificare în `/ui` → auto re-deploy

Poți dezactiva auto-deploy în Settings → Auto-Deploy

### Health Checks

Render verifică automat dacă backend-ul răspunde:
- Path: `/` (default)
- Dacă backend-ul nu răspunde → Render va restarta automat

---

## ❌ Troubleshooting

### Backend nu pornește

**Verifică Logs** (Dashboard → Backend → Logs):

```bash
# Eroare comună: PORT not bound
# Fix: Asigură-te că PORT=10000 în Environment Variables

# Eroare comună: Module not found
# Fix: Verifică că build command include npm install
```

### Frontend nu se conectează la Backend

**Verifică Browser Console**:

```javascript
// Eroare: CORS policy blocked
// Fix: Actualizează CORS_ORIGINS pe backend cu URL-ul exact al frontend-ului

// Eroare: Failed to connect to WebSocket
// Fix: Verifică că VITE_BACKEND_URL este corect și backend-ul rulează
```

### "Service Unavailable" după deploy

**Free tier pe Render:**
- Serviciile gratuite se opresc după 15 minute de inactivitate
- La prima cerere, Render le repornește (poate dura 30-60 secunde)
- Soluție: Upgrade la plan Starter ($7/lună) pentru always-on

### Build Failed

**Verifică:**
```bash
# Root Directory este corect?
# Backend: backend/
# Frontend: ui/

# Build Command corect?
# Backend: npm install && npm run build
# Frontend: npm install && npm run build

# Node version?
# package.json trebuie să aibă "engines": {"node": ">=18.0.0"}
```

---

## 💰 Costuri

### Free Tier (Gratis)
- **Backend**: 750 ore/lună (suficient pentru testare)
- **Frontend**: Bandwidth nelimitat
- **Limitare**: Serviciile se opresc după 15 min inactivitate
- **Best for**: Development, testing, demo

### Starter Plan ($7/lună per service)
- **Backend**: Always-on, nu se oprește
- **Frontend**: CDN global
- **Best for**: Production cu trafic moderat

---

## 📞 Support

**Render Documentation**: https://render.com/docs
**Community Forum**: https://community.render.com

**Logs pe Render**: Dashboard → Service → Logs (în timp real!)

---

## ✅ Checklist Final

După deploy, verifică:

- [ ] Backend logs arată "Ready to accept connections!"
- [ ] Frontend se încarcă în browser
- [ ] Browser Console arată "Connected to game server"
- [ ] Tab Network → WS arată conexiune WebSocket activă
- [ ] Poți să te autentifici și să joci

**Dacă totul funcționează: FELICITĂRI! 🎉**

Acum ai un joc multiplayer live pe internet!

---

## 🔄 Updates Viitoare

Pentru a face update la cod:

```bash
git add .
git commit -m "update: ..."
git push origin main
```

Render va detecta automat și va face re-deploy! 🚀
