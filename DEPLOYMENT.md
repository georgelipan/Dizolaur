# 🚀 Deployment Guide

Acest ghid explică cum să configurezi și să faci deploy pentru aplicația Dino Game pe un server de producție.

## 📋 Configurare Variabile de Mediu

### Backend Configuration

1. **Creează fișierul `.env` în directorul `backend/`:**

```bash
cd backend
cp .env.example .env
```

2. **Editează `.env` cu configurațiile tale:**

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# CORS Configuration - Adaugă URL-urile frontend-ului tău
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Platform Integration (opțional)
PLATFORM_CALLBACK_URL=https://your-gambling-platform.com/api/game-results
PLATFORM_API_KEY=your-api-key-here

# Game Configuration
MAX_PLAYERS=4
GRAVITY=800
JUMP_VELOCITY=400
DINO_SPEED=200
OBSTACLE_SPAWN_RATE=2000
TICK_RATE=16
```

**Variabile importante:**
- `PORT`: Portul pe care va asculta serverul (default: 3000)
- `HOST`: Host-ul serverului (default: 0.0.0.0 pentru a accepta conexiuni din exterior)
- `CORS_ORIGINS`: Lista de URL-uri permise să se conecteze (separată prin virgulă)

### Frontend (UI) Configuration

1. **Creează fișierul `.env` în directorul `ui/`:**

```bash
cd ui
cp .env.example .env
```

2. **Editează `.env` cu configurațiile tale:**

```env
# Backend API Configuration
VITE_BACKEND_URL=http://localhost:3000

# Pentru production:
# VITE_BACKEND_URL=https://api.your-domain.com

# Game Configuration
VITE_DEBUG_MODE=false
```

**Variabile importante:**
- `VITE_BACKEND_URL`: URL-ul complet către backend-ul tău (inclusiv protocol: http/https)
- `VITE_DEBUG_MODE`: Activează modul debug (true/false)

**IMPORTANT:** Toate variabilele pentru Vite TREBUIE să înceapă cu prefixul `VITE_`!

## 🏗️ Build pentru Production

### Backend

```bash
cd backend
npm install
npm run build
npm start
```

### Frontend (UI)

```bash
cd ui
npm install
npm run build
```

Fișierele generate vor fi în directorul `ui/dist/` și pot fi servite de un server static (nginx, Apache, etc.)

## 🌐 Deployment Scenarios

### Scenario 1: Backend și Frontend pe același server

**Backend:**
```env
PORT=3000
HOST=localhost
CORS_ORIGINS=https://your-domain.com
```

**Frontend:**
```env
VITE_BACKEND_URL=https://your-domain.com:3000
```

**Nginx config exemplu:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/ui/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy la backend
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Scenario 2: Backend și Frontend pe servere separate

**Backend (api.your-domain.com):**
```env
PORT=3000
HOST=0.0.0.0
CORS_ORIGINS=https://game.your-domain.com
```

**Frontend (game.your-domain.com):**
```env
VITE_BACKEND_URL=https://api.your-domain.com
```

## 🔒 Security Checklist

- [ ] Actualizează `CORS_ORIGINS` cu URL-urile corecte (nu lăsa `*`)
- [ ] Folosește HTTPS în producție
- [ ] Setează `VITE_DEBUG_MODE=false` în producție
- [ ] Nu commite fișierele `.env` în git (sunt deja în `.gitignore`)
- [ ] Folosește variabile de mediu pentru chei API și secrete
- [ ] Configurează un firewall pentru a permite doar traficul necesar

## 🧪 Testare după Deployment

1. **Verifică Backend:**
```bash
curl http://your-backend-url:3000
```

2. **Verifică Frontend:**
- Deschide browser-ul la URL-ul frontend-ului
- Verifică console-ul browser-ului pentru erori
- Verifică că se conectează la backend (vezi mesajul "🔌 NetworkService initialized with URL: ...")

3. **Verifică Comunicarea:**
- Încearcă să te autentifici în joc
- Verifică că primești actualizări în timp real

## 📝 Notițe

- Backend-ul folosește fișierul `.env` din directorul `backend/`
- Frontend-ul folosește fișierul `.env` din directorul `ui/`
- Pentru build-uri de producție, Vite va încorpora valorile din `.env` în codul JavaScript generat
- După modificarea `.env` pentru UI, trebuie să rulezi din nou `npm run build`
- După modificarea `.env` pentru backend, trebuie să restartezi serverul

## 🔄 Cum Comunică UI-ul cu Backend-ul

### Arhitectură

```
┌─────────────────┐          WebSocket/Socket.IO          ┌─────────────────┐
│                 │ ◄──────────────────────────────────► │                 │
│   Frontend (UI) │                                        │  Backend Server │
│   (Phaser 3)    │         Real-time Communication        │   (Node.js)     │
│                 │                                        │                 │
└─────────────────┘                                        └─────────────────┘
     │                                                              │
     │ Config: VITE_BACKEND_URL                                   │ Config: PORT, HOST
     │ Ex: https://api.domain.com                                 │ Ex: 3000, 0.0.0.0
     └───────────────────────────────────────────────────────────┘
```

### Flow de Comunicare

1. **Frontend (UI):**
   - Citește `VITE_BACKEND_URL` din `.env`
   - `NetworkService.ts` se conectează la backend folosind Socket.IO
   - Trimite evenimente: `authenticate`, `player_ready`, `player_input`
   - Primește evenimente: `authenticated`, `game_update`, `match_ended`, etc.

2. **Backend:**
   - Citește `PORT` și `HOST` din `.env`
   - Configurează CORS folosind `CORS_ORIGINS` din `.env`
   - Ascultă conexiuni Socket.IO
   - Procesează input-ul jucătorilor
   - Trimite actualizări de stare către toți clienții conectați

### Exemplu de Flux Complet

```
User Action → Frontend Phaser Scene → NetworkService.sendInput()
                                              ↓
                                        Socket.IO emit
                                              ↓
Backend SocketHandler.on('player_input') → MatchManager.processInput()
                                              ↓
                                        Game Physics Update
                                              ↓
Backend emits 'game_update' → Socket.IO broadcast
                                              ↓
Frontend NetworkService.on('game_update') → GameScene.handleUpdate()
                                              ↓
                                        Phaser Rendering
```

## 💡 Tips

- Folosește o soluție de process manager pentru backend (ex: PM2)
- Configurează logging pentru ambele aplicații
- Monitorizează performanța și latența
- Consideră folosirea unui CDN pentru fișierele statice ale frontend-ului
