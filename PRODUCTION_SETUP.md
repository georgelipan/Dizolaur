# ✅ Status: Local vs Production

## 🟢 Local - Funcționează DIRECT

Am testat și configurat totul pentru dezvoltare locală. **Funcționează out-of-the-box:**

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run build
npm start

# Terminal 2 - UI (dev mode)
cd ui
npm install
npm run dev
```

**Ce se întâmplă:**
- Backend pornește pe `http://localhost:3000`
- UI (Vite dev server) pornește pe `http://localhost:5173`
- UI se conectează automat la backend
- CORS este configurat să permită ambele URL-uri locale

## 🟡 Production - Necesită Configurare

Pentru a funcționa pe server de producție, trebuie să modifici **DOAR fișierele `.env`**:

### 1️⃣ Backend (.env)

Exemple pentru diferite scenarii:

**Scenario A: Backend pe domeniu propriu (recomandat)**
```env
# backend/.env
PORT=3000
HOST=0.0.0.0
CORS_ORIGINS=https://game.your-domain.com,https://www.your-domain.com
```

**Scenario B: Backend pe IP public**
```env
# backend/.env
PORT=3000
HOST=0.0.0.0
CORS_ORIGINS=http://45.123.45.67:8080
```

### 2️⃣ Frontend (.env)

**Scenario A: Backend pe domeniu cu proxy (recomandat)**
```env
# ui/.env
VITE_BACKEND_URL=https://game.your-domain.com
```

**Scenario B: Backend pe domeniu separat**
```env
# ui/.env
VITE_BACKEND_URL=https://api.your-domain.com
```

**Scenario C: Backend pe IP și port**
```env
# ui/.env
VITE_BACKEND_URL=http://45.123.45.67:3000
```

### 3️⃣ Build pentru Production

După ce ai modificat `.env` files:

```bash
# Backend
cd backend
npm run build
npm start  # sau folosește PM2: pm2 start dist/server.js

# Frontend
cd ui
npm run build
# Fișierele vor fi în ui/dist/
# Upload la serverul static (nginx, Apache, etc.)
```

## ⚠️ Lucruri Importante pentru Production

### ✅ Checklist Mandatory:

1. **HTTPS pentru WebSocket**
   - Socket.IO necesită WSS (WebSocket Secure) în producție
   - Configurează un certificat SSL (Let's Encrypt este gratuit)
   - Folosește `https://` în `VITE_BACKEND_URL`, nu `http://`

2. **CORS Configuration**
   - În `backend/.env`, setează `CORS_ORIGINS` cu URL-ul EXACT al frontend-ului
   - ❌ NU lăsa `*` (permite toate originile - risc de securitate)
   - ✅ Folosește URL-uri specifice: `https://your-domain.com`

3. **Environment Variables**
   - Fișierele `.env` NU se urcă pe server prin git (sunt în `.gitignore`)
   - Creează-le manual pe server sau folosește variabile de mediu ale platformei

4. **Build Process**
   - UI: După modificarea `ui/.env`, TREBUIE să rulezi `npm run build` din nou
   - Backend: După modificarea `backend/.env`, doar restartează serverul

### 🔒 Security Best Practices:

```env
# ❌ NU face așa în producție:
CORS_ORIGINS=*
VITE_BACKEND_URL=http://unsecure-domain.com

# ✅ Fă așa:
CORS_ORIGINS=https://your-domain.com
VITE_BACKEND_URL=https://your-domain.com
```

## 🧪 Cum să Testezi pe Production

### 1. Verifică Backend:
```bash
# Pe server, după ce ai pornit backend-ul:
curl http://localhost:3000
# Ar trebui să vezi un răspuns (chiar dacă este un 404 este OK, înseamnă că serverul ascultă)
```

### 2. Verifică Frontend:
- Deschide browser-ul la URL-ul tău
- Deschide Developer Console (F12)
- Verifică secțiunea "Console" pentru:
  - `🔌 NetworkService initialized with URL: ...` - ar trebui să arate URL-ul corect
  - Erori de CORS - dacă vezi, verifică `CORS_ORIGINS` în backend
  - Erori de conexiune - verifică că backend-ul rulează și este accesibil

### 3. Verifică WebSocket Connection:
- În Developer Console, tab "Network", filtrează după "WS"
- Ar trebui să vezi o conexiune WebSocket activă către backend
- Dacă apare "failed" sau "pending", verifică:
  - Firewall-ul serverului (permite portul 3000?)
  - HTTPS/WSS configuration
  - CORS settings

## 📋 Quick Reference

| Configurare | Local | Production |
|-------------|-------|------------|
| **Backend URL** | `http://localhost:3000` | `https://your-domain.com` |
| **Frontend URL** | `http://localhost:5173` | `https://your-domain.com` |
| **Protocol** | HTTP | HTTPS (obligatoriu pentru WSS) |
| **CORS** | `localhost:5173` | URL-ul real al frontend-ului |
| **Build UI** | Nu e necesar (dev mode) | `npm run build` obligatoriu |

## 🆘 Troubleshooting Common Issues

### "WebSocket connection failed"
- ✅ Verifică că backend-ul rulează
- ✅ Verifică firewall-ul (permite portul 3000?)
- ✅ Verifică HTTPS - Socket.IO necesită WSS în producție

### "CORS error in console"
- ✅ Adaugă URL-ul frontend-ului în `CORS_ORIGINS` din backend
- ✅ Asigură-te că folosești protocolul corect (http/https)
- ✅ Restartează backend-ul după modificarea `.env`

### "Can't connect to backend"
- ✅ Verifică `VITE_BACKEND_URL` în `ui/.env`
- ✅ Rebuild UI după modificarea `.env`: `npm run build`
- ✅ Verifică că backend-ul este accesibil de la frontend

### "Works locally but not in production"
- ✅ Verifică că ai rebuild-uit UI-ul cu `.env` de producție
- ✅ Verifică că backend-ul folosește `.env` de producție
- ✅ Verifică certificatul SSL (pentru HTTPS/WSS)

## 💡 Recomandări Arhitectură Production

### Opțiunea 1: Frontend și Backend pe același server (cu Nginx)

```
Internet → Nginx (port 443) → Frontend (static files)
                            → Backend (proxy la :3000)
```

**Avantaje:**
- Un singur domeniu
- CORS mai simplu
- SSL centralizat

**nginx.conf exemplu:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /path/to/ui/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Opțiunea 2: Frontend și Backend pe servere separate

```
Frontend Server → CDN/Static Hosting → Users
Backend Server → Dedicated Node.js Server → Frontend
```

**Avantaje:**
- Scalabilitate independentă
- CDN pentru frontend (mai rapid)
- Backend dedicat pentru game logic

**Configurare:**
- Frontend: `VITE_BACKEND_URL=https://api.your-domain.com`
- Backend: `CORS_ORIGINS=https://game.your-domain.com`

## ✅ Concluzie

**Local: Funcționează 100% direct!**
- Configurația din `.env` este deja setată pentru development local
- `npm install && npm start` și ești gata

**Production: Simplu de configurat!**
- Modifică DOAR `.env` cu URL-urile tale reale
- Rebuild UI-ul
- Deploy și testează

Toate fișierele necesare sunt create și testate! 🚀
