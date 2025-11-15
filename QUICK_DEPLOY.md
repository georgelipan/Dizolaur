# 🚀 Quick Deploy Guide - Render.com

## ✅ Verificare Înainte de Deploy

Asigură-te că ai:
- [ ] Commit-at toate modificările
- [ ] Push la GitHub pe branch `main`

## 📝 Pași Deploy

### 1. Push la GitHub
```bash
git add .
git commit -m "Ready for Render.com deployment"
git push origin main
```

### 2. Deploy pe Render.com

1. Mergi la https://render.com/dashboard
2. Click **"New +"** → **"Blueprint"**
3. Conectează repository-ul `Dizolaur`
4. Render va detecta `render.yaml`
5. **Verifică configurația:**
   - Backend: `dizolaur-backend`
   - Frontend: `dizolaur-frontend`
6. Click **"Apply"**

### 3. Așteaptă Deploy-ul

- Backend: ~2-3 minute
- Frontend: ~1-2 minute

### 4. Verificare

După deploy, vei primi 2 URL-uri:

**Backend:**
```
https://dizolaur-backend.onrender.com
```

**Frontend:**
```
https://dizolaur-frontend.onrender.com
```

Testează:
1. Deschide frontend-ul în browser
2. Verifică Console pentru conexiune WebSocket
3. Ar trebui să vezi: `✅ Connected to game server`

## ⚠️ Note Importante

### URL-uri Predefinite
În `render.yaml` am setat:
- `CORS_ORIGINS` = `https://dizolaur-frontend.onrender.com`
- `VITE_BACKEND_URL` = `https://dizolaur-backend.onrender.com`

**Dacă Render îți dă URL-uri diferite**, trebuie să le actualizezi manual în Dashboard:

1. **Backend** → Environment → Editează `CORS_ORIGINS`
2. **Frontend** → Environment → Editează `VITE_BACKEND_URL`
3. Salvează (serviciile vor reporni automat)

### Free Tier Limitations
- Backend-ul va dormi după 15 min de inactivitate
- Prima conexiune după sleep: ~30 secunde
- Frontend-ul (static) este instant

## 🐛 Troubleshooting

**Build fails:**
```
Error: Cannot find module
```
→ Verifică că ai `package.json` în ambele foldere (`backend/` și `ui/`)

**CORS errors:**
```
Access to XMLHttpRequest blocked by CORS
```
→ Verifică că `CORS_ORIGINS` în backend = URL-ul frontend-ului exact

**WebSocket connection fails:**
→ Verifică că `VITE_BACKEND_URL` în frontend = URL-ul backend-ului exact

**"Service Unavailable":**
→ Backend-ul probabil doarme (free tier). Așteaptă 30s pentru wake-up.

## 🔄 Re-deploy

Render are **auto-deploy** activat by default:
- Orice push la `main` → deploy automat
- Poți dezactiva în Settings → "Auto-Deploy"

Deploy manual:
- Dashboard → Service → "Manual Deploy" → "Deploy latest commit"

---

**Gata! Jocul ar trebui să fie live! 🎮**
