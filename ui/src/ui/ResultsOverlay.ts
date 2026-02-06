/**
 * Vegas Casino Neon ResultsScene Overlay
 * Compact layout to fit all content on screen
 */

export interface PlayerResult {
  playerId: string;
  ranking: number;
  score: number;
  winnings: number;
}

export interface ResultsData {
  isWinner: boolean;
  winnings: number;
  currency: string;
  players: PlayerResult[];
  myPlayerId: string;
  survivalTime?: number;
  obstaclesCleared?: number;
  nearMissCount?: number;
  personalBest?: number;
  isNewBest?: boolean;
  countUpDuration?: number; // Duration of count-up animation in ms (synced with sound)
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

#results-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 100;
  background: linear-gradient(180deg, #0a0015 0%, #12082a 50%, #0a0015 100%);
  display: none;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-family: 'Orbitron', 'Arial', sans-serif;
}
#results-overlay.visible { display: flex; }

/* ══════ Side marquee bulbs ══════ */
.ro-side-bulbs {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 15px 0;
  pointer-events: none;
}
.ro-side-bulbs.left { left: 10px; }
.ro-side-bulbs.right { right: 10px; }

.ro-bulb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(ellipse at 30% 20%, #fffef0 0%, #fff8dc 15%, #ffd700 40%, #daa520 70%, #b8860b 100%);
  border: 2px solid #8b7355;
  box-shadow: 0 0 8px #ffd700, 0 0 16px #ffaa00;
  animation: ro-bulb-pulse 0.8s infinite ease-in-out;
}
@keyframes ro-bulb-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1); box-shadow: 0 0 10px #ffd700, 0 0 20px #ffaa00; }
}

/* ══════ Light bars ══════ */
.ro-light-bar {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff00ff, #00ffff, #ff00ff, transparent);
  box-shadow: 0 0 10px #ff00ff, 0 0 20px #00ffff;
}
.ro-light-bar.top { top: 0; left: 0; right: 0; }
.ro-light-bar.bottom { bottom: 0; left: 0; right: 0; }

/* ══════ Main card ══════ */
.ro-main-card {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 94%;
  max-width: 700px;
  background: rgba(15, 8, 35, 0.95);
  border-radius: 16px;
  border: 2px solid rgba(255, 0, 255, 0.4);
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.2);
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.ro-card-inner {
  flex: 1;
  padding: 12px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* ══════ Title ══════ */
.ro-title-section {
  text-align: center;
  margin-bottom: 8px;
}
.ro-title-box {
  display: inline-block;
  padding: 8px 40px;
  border-radius: 10px;
}
.ro-title-box.victory {
  border: 3px solid #00ff88;
  box-shadow: 0 0 20px #00ff88, inset 0 0 15px rgba(0,255,136,0.15);
}
.ro-title-box.defeat {
  border: 3px solid #ff4466;
  box-shadow: 0 0 20px #ff4466, inset 0 0 15px rgba(255,68,102,0.15);
}

.ro-title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 8px;
  margin: 0;
  text-transform: uppercase;
}
.ro-title.victory {
  color: #00ff88;
  text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 40px #00cc66;
}
.ro-title.defeat {
  color: #ff4466;
  text-shadow: 0 0 10px #ff4466, 0 0 20px #ff4466, 0 0 40px #cc2244;
}

/* ══════ Winner Banner ══════ */
.ro-winner-banner {
  text-align: center;
  padding: 4px 0;
  margin: 6px 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #ffd700;
  text-shadow: 0 0 10px #ffd700;
  border-top: 1px solid rgba(255,215,0,0.3);
  border-bottom: 1px solid rgba(255,215,0,0.3);
}

/* ══════ Payout display ══════ */
.ro-payout-section {
  border-radius: 12px;
  padding: 10px 20px;
  margin: 8px auto;
  max-width: 280px;
}
.ro-payout-section.win {
  background: rgba(0, 50, 30, 0.5);
  border: 3px solid #00ff88;
  box-shadow: 0 0 25px rgba(0, 255, 100, 0.4);
}
.ro-payout-section.lose {
  background: rgba(50, 10, 20, 0.5);
  border: 3px solid #ff4466;
  box-shadow: 0 0 20px rgba(255, 50, 100, 0.3);
}

.ro-payout-label {
  text-align: center;
  font-size: 10px;
  letter-spacing: 3px;
  margin-bottom: 4px;
  color: #888;
}
.ro-payout-amount {
  text-align: center;
  font-size: 32px;
  font-weight: 900;
}
.ro-payout-amount.win {
  color: #00ff88;
  text-shadow: 0 0 15px #00ff88, 0 0 30px #00cc66;
}
.ro-payout-amount.lose {
  color: #ff4466;
  text-shadow: 0 0 10px #ff4466;
}

/* ══════ Neon line ══════ */
.ro-neon-line {
  height: 2px;
  margin: 10px auto;
  width: 80%;
  background: linear-gradient(90deg, transparent, #00ffff, #ff00ff, #00ffff, transparent);
  box-shadow: 0 0 10px #00ffff;
}

/* ══════ Rankings ══════ */
.ro-rankings {
  margin: 0 auto 8px;
}
.ro-ranking-row {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  margin: 4px 0;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
}
.ro-ranking-row.me {
  background: rgba(0, 80, 50, 0.4);
  border: 1px solid #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
}
.ro-rank {
  width: 50px;
  font-size: 14px;
  font-weight: 700;
}
.ro-rank.gold { color: #ffd700; text-shadow: 0 0 8px #ffd700; }
.ro-rank.silver { color: #c0c0c0; }
.ro-rank.bronze { color: #cd7f32; }
.ro-rank.other { color: #64748b; }

.ro-player-name {
  flex: 1;
  font-size: 13px;
  color: #e2e8f0;
}
.ro-player-name.me {
  color: #00ff88;
  font-weight: 700;
}
.ro-player-score {
  width: 60px;
  text-align: center;
  font-size: 13px;
  color: #00ffff;
}
.ro-player-time {
  width: 40px;
  text-align: center;
  font-size: 11px;
  color: #ff00ff;
}
.ro-player-winnings {
  width: 80px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
}
.ro-player-winnings.positive { color: #00ff88; }
.ro-player-winnings.zero { color: #64748b; }

/* ══════ Stats bar ══════ */
.ro-stats-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 8px 0;
  padding: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  font-size: 11px;
  color: #888;
}
.ro-stat-value {
  color: #ffff00;
  font-weight: 700;
  margin-right: 4px;
}

/* ══════ Personal best ══════ */
.ro-personal-best {
  text-align: center;
  margin: 6px 0;
  font-size: 12px;
  color: #666;
}
.ro-personal-best.new-best {
  color: #ffd700;
  font-weight: 700;
  text-shadow: 0 0 10px #ffd700;
}

/* ══════ Buttons ══════ */
.ro-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.ro-btn-row {
  display: flex;
  gap: 12px;
}

.ro-btn {
  padding: 10px 30px;
  border: none;
  border-radius: 10px;
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-transform: uppercase;
}

.ro-btn.primary {
  background: linear-gradient(180deg, #00ff88 0%, #00cc66 50%, #009944 100%);
  color: #000;
  box-shadow: 0 4px 0 #006633, 0 0 20px rgba(0, 255, 100, 0.4);
}
.ro-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #006633, 0 0 30px rgba(0, 255, 100, 0.6);
}
.ro-btn.primary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #006633;
}

.ro-btn.secondary {
  background: linear-gradient(180deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  font-size: 11px;
  padding: 8px 20px;
  box-shadow: 0 3px 0 #3730a3;
}
.ro-btn.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 #3730a3;
}

/* ══════ Auto-return ══════ */
.ro-auto-return {
  text-align: center;
  margin-top: 8px;
  font-size: 10px;
  color: #555;
  letter-spacing: 1px;
}

/* ══════ Confetti ══════ */
.ro-confetti {
  position: absolute;
  width: 8px;
  height: 8px;
  pointer-events: none;
  animation: ro-confetti-fall 3s linear infinite;
}
@keyframes ro-confetti-fall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* ══════ Mobile landscape responsive ══════ */
@media (max-height: 500px) and (orientation: landscape) {
  .ro-main-card { top: 6px; bottom: 6px; width: 96%; max-width: 650px; border-radius: 12px; }
  .ro-card-inner { padding: 8px 16px; }
  .ro-title-section { margin-bottom: 4px; }
  .ro-title-box { padding: 4px 24px; border-radius: 8px; border-width: 2px; }
  .ro-title { font-size: 24px; letter-spacing: 4px; }
  .ro-winner-banner { margin: 4px 0; padding: 2px 0; font-size: 10px; letter-spacing: 4px; }
  .ro-payout-section { padding: 6px 14px; margin: 6px auto; max-width: 220px; border-radius: 10px; border-width: 2px; }
  .ro-payout-label { font-size: 8px; letter-spacing: 2px; margin-bottom: 2px; }
  .ro-payout-amount { font-size: 22px; }
  .ro-neon-line { margin: 6px auto; }
  .ro-rankings { margin-bottom: 6px; }
  .ro-ranking-row { padding: 4px 10px; margin: 3px 0; border-radius: 6px; }
  .ro-rank { width: 45px; font-size: 12px; }
  .ro-player-name { font-size: 11px; }
  .ro-player-score { width: 50px; font-size: 11px; }
  .ro-player-time { width: 35px; font-size: 10px; }
  .ro-player-winnings { width: 70px; font-size: 10px; }
  .ro-stats-bar { margin: 6px 0; padding: 4px; font-size: 10px; gap: 14px; }
  .ro-personal-best { margin: 4px 0; font-size: 10px; }
  .ro-buttons { gap: 6px; margin-top: 6px; }
  .ro-btn.primary { padding: 8px 24px; font-size: 12px; letter-spacing: 2px; border-radius: 8px; }
  .ro-btn.secondary { padding: 6px 16px; font-size: 10px; }
  .ro-btn-row { gap: 10px; }
  .ro-auto-return { margin-top: 6px; font-size: 9px; }
  .ro-side-bulbs { padding: 8px 0; }
  .ro-bulb { width: 12px; height: 12px; }
}
`;

export class ResultsOverlay {
  private root: HTMLDivElement;
  private autoReturnEl!: HTMLElement;
  private onPlayAgainCallback: (() => void) | null = null;
  private onChangeBetCallback: (() => void) | null = null;
  private onLobbyCallback: (() => void) | null = null;
  private onInteractionCallback: (() => void) | null = null;

  constructor() {
    this.injectStyles();
    this.root = document.createElement('div');
    this.root.id = 'results-overlay';
    document.getElementById('game-container')!.appendChild(this.root);
  }

  private injectStyles(): void {
    if (document.getElementById('ro-styles')) return;
    const style = document.createElement('style');
    style.id = 'ro-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  show(data: ResultsData): void {
    this.root.innerHTML = '';
    this.buildDOM(data);
    this.root.classList.add('visible');

    this.root.addEventListener('pointerdown', () => {
      if (this.onInteractionCallback) this.onInteractionCallback();
    });
  }

  private buildDOM(data: ResultsData): void {
    // Confetti for winners
    if (data.isWinner) {
      const colors = ['#ffd700', '#ff00ff', '#00ffff', '#00ff88', '#ff6600'];
      for (let i = 0; i < 25; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'ro-confetti';
        confetti.style.cssText = `
          left: ${Math.random() * 100}%;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          animation-delay: ${Math.random() * 3}s;
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        `;
        this.root.appendChild(confetti);
      }
    }

    // Light bars
    ['top', 'bottom'].forEach(pos => {
      const bar = document.createElement('div');
      bar.className = `ro-light-bar ${pos}`;
      this.root.appendChild(bar);
    });

    // Side bulbs
    const numBulbs = 16;
    ['left', 'right'].forEach((side, sideIdx) => {
      const bulbs = document.createElement('div');
      bulbs.className = `ro-side-bulbs ${side}`;
      for (let i = 0; i < numBulbs; i++) {
        const bulb = document.createElement('div');
        bulb.className = 'ro-bulb';
        bulb.style.animationDelay = `${(sideIdx === 0 ? i : numBulbs - 1 - i) * 0.1}s`;
        bulbs.appendChild(bulb);
      }
      this.root.appendChild(bulbs);
    });

    // Main card
    const mainCard = document.createElement('div');
    mainCard.className = 'ro-main-card';

    const cardInner = document.createElement('div');
    cardInner.className = 'ro-card-inner';

    // Title
    const titleSection = document.createElement('div');
    titleSection.className = 'ro-title-section';
    const titleBox = document.createElement('div');
    titleBox.className = `ro-title-box ${data.isWinner ? 'victory' : 'defeat'}`;
    const title = document.createElement('h1');
    title.className = `ro-title ${data.isWinner ? 'victory' : 'defeat'}`;
    title.textContent = data.isWinner ? 'VICTORY' : 'DEFEATED';
    titleBox.appendChild(title);
    titleSection.appendChild(titleBox);
    cardInner.appendChild(titleSection);

    // Winner banner
    if (data.isWinner) {
      const banner = document.createElement('div');
      banner.className = 'ro-winner-banner';
      banner.textContent = '🎰 JACKPOT WINNER 🎰';
      cardInner.appendChild(banner);
    }

    // Payout
    const payoutSection = document.createElement('div');
    payoutSection.className = `ro-payout-section ${data.winnings > 0 ? 'win' : 'lose'}`;

    const payoutLabel = document.createElement('div');
    payoutLabel.className = 'ro-payout-label';
    payoutLabel.textContent = data.winnings > 0 ? 'YOUR WINNINGS' : 'RESULT';
    payoutSection.appendChild(payoutLabel);

    const payoutAmount = document.createElement('div');
    payoutAmount.className = `ro-payout-amount ${data.winnings > 0 ? 'win' : 'lose'}`;
    const prefix = data.winnings > 0 ? '+' : '';
    payoutAmount.textContent = `${prefix}${data.currency} ${data.winnings.toFixed(2)}`;
    payoutSection.appendChild(payoutAmount);
    cardInner.appendChild(payoutSection);

    // Count-up animation (synced with sound duration)
    if (data.winnings > 0) {
      const target = data.winnings;
      const startTime = Date.now();
      const duration = data.countUpDuration || 1200;
      payoutAmount.textContent = `+${data.currency} 0.00`; // Start from 0
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Easing: ease-out quad for satisfying feel
        const eased = 1 - (1 - t) * (1 - t);
        payoutAmount.textContent = `+${data.currency} ${(target * eased).toFixed(2)}`;
        if (t < 1) requestAnimationFrame(tick);
        else payoutAmount.textContent = `+${data.currency} ${target.toFixed(2)}`;
      };
      requestAnimationFrame(tick);
    }

    // Neon line
    const neonLine = document.createElement('div');
    neonLine.className = 'ro-neon-line';
    cardInner.appendChild(neonLine);

    // Rankings
    const rankings = document.createElement('div');
    rankings.className = 'ro-rankings';

    const sortedPlayers = [...data.players].sort((a, b) => a.ranking - b.ranking);
    const totalPlayers = sortedPlayers.length;

    sortedPlayers.forEach((player) => {
      const isMe = player.playerId === data.myPlayerId;
      const row = document.createElement('div');
      row.className = `ro-ranking-row ${isMe ? 'me' : ''}`;

      const rankClass = player.ranking === 1 ? 'gold' : player.ranking === 2 ? 'silver' : player.ranking === 3 ? 'bronze' : 'other';
      const rankText = player.ranking === 1 ? '🥇 1st' : player.ranking === 2 ? '🥈 2nd' : player.ranking === 3 ? '🥉 3rd' : `${player.ranking}th`;

      row.innerHTML = `
        <div class="ro-rank ${rankClass}">${rankText}</div>
        <div class="ro-player-name ${isMe ? 'me' : ''}">${isMe ? 'YOU' : `Player ${player.ranking}`}</div>
        <div class="ro-player-score">${Math.round(player.score)}</div>
        <div class="ro-player-time">${Math.round((data.survivalTime || 10000) * (totalPlayers - player.ranking + 1) / totalPlayers / 1000)}s</div>
        <div class="ro-player-winnings ${player.winnings > 0 ? 'positive' : 'zero'}">${data.currency} ${player.winnings.toFixed(2)}</div>
      `;
      rankings.appendChild(row);
    });
    cardInner.appendChild(rankings);

    // Stats
    if (data.survivalTime !== undefined) {
      const statsBar = document.createElement('div');
      statsBar.className = 'ro-stats-bar';
      const survSec = Math.floor((data.survivalTime || 0) / 1000);
      statsBar.innerHTML = `
        <span><span class="ro-stat-value">${survSec}s</span>survived</span>
        <span><span class="ro-stat-value">${data.obstaclesCleared || 0}</span>obstacles</span>
        <span><span class="ro-stat-value">${data.nearMissCount || 0}</span>near misses</span>
      `;
      cardInner.appendChild(statsBar);
    }

    // Personal best
    if (data.personalBest !== undefined) {
      const pb = document.createElement('div');
      if (data.isNewBest) {
        pb.className = 'ro-personal-best new-best';
        pb.textContent = `🏆 NEW BEST: ${data.personalBest}`;
      } else {
        pb.className = 'ro-personal-best';
        const myScore = data.players.find(p => p.playerId === data.myPlayerId)?.score || 0;
        pb.textContent = `Best: ${data.personalBest} | This game: ${Math.round(myScore)}`;
      }
      cardInner.appendChild(pb);
    }

    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'ro-buttons';

    const playAgainBtn = document.createElement('button');
    playAgainBtn.className = 'ro-btn primary';
    playAgainBtn.textContent = 'PLAY AGAIN';
    playAgainBtn.addEventListener('click', () => {
      if (this.onPlayAgainCallback) this.onPlayAgainCallback();
    });
    buttons.appendChild(playAgainBtn);

    const btnRow = document.createElement('div');
    btnRow.className = 'ro-btn-row';

    const changeBetBtn = document.createElement('button');
    changeBetBtn.className = 'ro-btn secondary';
    changeBetBtn.textContent = 'CHANGE BET';
    changeBetBtn.addEventListener('click', () => {
      if (this.onChangeBetCallback) this.onChangeBetCallback();
    });
    btnRow.appendChild(changeBetBtn);

    const lobbyBtn = document.createElement('button');
    lobbyBtn.className = 'ro-btn secondary';
    lobbyBtn.textContent = 'LOBBY';
    lobbyBtn.addEventListener('click', () => {
      if (this.onLobbyCallback) this.onLobbyCallback();
    });
    btnRow.appendChild(lobbyBtn);

    buttons.appendChild(btnRow);
    cardInner.appendChild(buttons);

    // Auto-return
    const autoReturn = document.createElement('div');
    autoReturn.className = 'ro-auto-return';
    autoReturn.id = 'ro-auto-return';
    autoReturn.textContent = 'Returning to lobby in 15s...';
    cardInner.appendChild(autoReturn);
    this.autoReturnEl = autoReturn;

    mainCard.appendChild(cardInner);
    this.root.appendChild(mainCard);
  }

  updateAutoReturn(seconds: number): void {
    if (this.autoReturnEl) {
      this.autoReturnEl.textContent = `Returning to lobby in ${seconds}s...`;
    }
  }

  hide(): void {
    this.root.classList.remove('visible');
  }

  onPlayAgain(callback: () => void): void {
    this.onPlayAgainCallback = callback;
  }

  onChangeBet(callback: () => void): void {
    this.onChangeBetCallback = callback;
  }

  onLobby(callback: () => void): void {
    this.onLobbyCallback = callback;
  }

  onInteraction(callback: () => void): void {
    this.onInteractionCallback = callback;
  }

  destroy(): void {
    this.root.remove();
    document.getElementById('ro-styles')?.remove();
  }
}
