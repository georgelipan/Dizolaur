# 🎮 Quick Start Guide - Rulare Joc Local

## Pași pentru a rula jocul complet

### ✅ Prerequisite
- Node.js v18+ instalat
- npm instalat
- Două ferestre de terminal/command prompt

---

## 📝 Pașii Detaliați

### PASUL 1: Pornește Backend-ul (Serverul)

Deschide **primul terminal** și execută:

```bash
# Navighează în folderul backend
cd backend

# Pornește serverul
npm start
```

**Ce ar trebui să vezi:**
```
🦖 Dino Game Server starting...
📝 Configuration loaded
   - Port: 3000
   - Max Players: 4
   - Tick Rate: 16ms
🔌 Socket.IO initialized
⚙️  Services initialized
🎮 Socket handlers registered
🔄 Game loop started

🚀 Server running on 0.0.0.0:3000
   Socket.IO endpoint: ws://0.0.0.0:3000

✅ Ready to accept connections!
```

✅ **Serverul rulează acum pe `http://localhost:3000`**

**NU închide acest terminal!** Lasă-l să ruleze.

---

### PASUL 2: Pornește Frontend-ul (UI-ul)

Deschide **al doilea terminal** și execută:

```bash
# Navighează în folderul ui
cd ui

# Pornește UI-ul în development mode
npm run dev
```

**Ce ar trebui să vezi:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

Browser-ul ar trebui să se deschidă automat la `http://localhost:5173`

Dacă nu se deschide automat:
- Deschide manual browser-ul
- Navighează la `http://localhost:5173`

✅ **UI-ul rulează acum!**

---

### PASUL 3: Testează Jocul Multiplayer

Pentru a juca multiplayer (2-4 jucători), deschide **mai multe tab-uri** în browser:

#### Jucător 1 (Tab 1):
1. Deschide: `http://localhost:5173`
2. Așteptă să se conecteze ("Connecting to server...")
3. Când vezi "Waiting for players...", apasă butonul verde **READY**

#### Jucător 2 (Tab 2):
1. Deschide un **nou tab**: `http://localhost:5173`
2. Așteptă conexiunea
3. Apasă butonul verde **READY**

#### Opțional - Jucător 3 și 4:
- Repetă pașii de mai sus în noi tab-uri

**CE SE ÎNTÂMPLĂ:**
- Când **minimum 2 jucători** sunt READY
- Meciul va începe automat în 1 secundă
- Vei vedea "Match starting!"

---

## 🎯 Controale în Joc

### Taste:
- **SPACE** sau **↑ (Sus)**: Sari
- **↓ (Jos)**: Ghemuit (duck) - doar în timp ce sari

### Obiectiv:
- Evită obstacolele (cactuși verzi și păsări roșii)
- Supraviețuiește cât mai mult timp
- Ultimul jucător rămas câștigă!

### Visual:
- **Verde**: Tu (jucătorul local)
- **Portocaliu**: Alți jucători
- **Verde (obstacole)**: Cactuși (la sol)
- **Roșu (obstacole)**: Păsări (în aer)

---

## 🏆 Sfârșitul Meciului

Când meciul se termină:
- Vei vedea **ecranul de rezultate**
- Clasamentul jucătorilor
- Câștigurile fiecăruia
- Buton **Play Again** pentru un nou meci

---

## 🐛 Probleme Comune

### "Failed to connect to server"
**Soluție:**
- Verifică că backend-ul rulează (Pasul 1)
- Backend-ul trebuie să afișeze "Ready to accept connections!"

### "Waiting for players..." nu se termină
**Soluție:**
- Trebuie **minim 2 jucători** ready
- Deschide un al 2-lea tab și apasă READY

### Backend-ul nu pornește
**Soluție:**
```bash
cd backend
npm install
npm run build
npm start
```

### UI-ul nu pornește
**Soluție:**
```bash
cd ui
npm install
npm run dev
```

---

## 🎨 Features

### Implementate:
✅ Multiplayer real-time (2-4 jucători)
✅ Sync automat între jucători
✅ Coliziune detection
✅ Score tracking
✅ Results și winnings
✅ Reconnection handling

---

## 🛑 Cum Oprești Jocul

### Pentru a opri serverele:

**În terminalul backend:**
- Apasă `Ctrl + C`

**În terminalul UI:**
- Apasă `Ctrl + C`

---

## 📊 Structura Rapidă

```
Dizolaur/
├── backend/          # Serverul (Node.js + TypeScript)
│   ├── src/         # Cod sursă
│   ├── dist/        # Build output
│   └── package.json
│
├── ui/              # Frontend (Phaser 3 + Vite)
│   ├── src/        # Cod sursă
│   └── package.json
│
├── README.md        # Documentație detaliată
└── QUICK_START.md   # Acest fișier
```

---

## 🆘 Ajutor Suplimentar

Pentru mai multe detalii, vezi:
- **README.md** - Documentație completă
- **backend/README.md** - Detalii backend
- **ui/README.md** - Detalii frontend

---

**Happy Gaming! 🦖🎮**

Dacă întâmpini probleme, verifică:
1. Node.js este instalat: `node --version`
2. npm este instalat: `npm --version`
3. Ambele terminale rulează
4. Browser-ul permite WebSocket connections
