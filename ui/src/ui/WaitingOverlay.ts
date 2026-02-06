/**
 * Vegas Casino Neon WaitingScene Overlay
 * Full neon glow effects, animated borders, pulsing lights, casino decorations
 */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

#waiting-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 100;
  background: linear-gradient(180deg, #0a0015 0%, #1a0a2e 50%, #0d0020 100%);
  display: none;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-family: 'Orbitron', 'Arial', sans-serif;
}
#waiting-overlay.visible { display: flex; }

/* ══════ Animated background particles ══════ */
.wo-particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: wo-float 8s infinite ease-in-out;
}
@keyframes wo-float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
  50% { transform: translateY(-30px) scale(1.2); opacity: 0.7; }
}

/* ══════ Animated stars ══════ */
.wo-star {
  position: absolute;
  font-size: 20px;
  animation: wo-star-pulse 1.5s infinite ease-in-out;
  pointer-events: none;
}
@keyframes wo-star-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; filter: drop-shadow(0 0 5px currentColor); }
  50% { transform: scale(1.3) rotate(20deg); opacity: 1; filter: drop-shadow(0 0 15px currentColor) drop-shadow(0 0 25px currentColor); }
}

/* ══════ Side marquee bulbs - Hollywood/Vegas style ══════ */
.wo-side-bulbs {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 12px 0;
  pointer-events: none;
}
.wo-side-bulbs.left { left: 8px; }
.wo-side-bulbs.right { right: 8px; }

.wo-bulb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  position: relative;
  background: radial-gradient(ellipse at 30% 20%, #fffef0 0%, #fff8dc 15%, #ffd700 40%, #daa520 70%, #b8860b 100%);
  border: 2px solid #8b7355;
  box-shadow:
    0 0 8px #ffd700,
    0 0 16px #ffaa00,
    0 0 24px rgba(255, 170, 0, 0.6),
    inset 0 -3px 6px rgba(139, 115, 85, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.8);
  animation: wo-bulb-pulse 0.8s infinite ease-in-out;
}
.wo-bulb::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 4px;
  width: 6px;
  height: 4px;
  background: radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%);
  border-radius: 50%;
}
@keyframes wo-bulb-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.95);
    box-shadow:
      0 0 4px #ffd700,
      0 0 8px rgba(255, 170, 0, 0.4),
      inset 0 -3px 6px rgba(139, 115, 85, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.6);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
    box-shadow:
      0 0 12px #ffd700,
      0 0 24px #ffaa00,
      0 0 36px rgba(255, 170, 0, 0.7),
      0 0 48px rgba(255, 200, 0, 0.4),
      inset 0 -3px 6px rgba(139, 115, 85, 0.3),
      inset 0 2px 4px rgba(255, 255, 255, 0.9);
  }
}

/* ══════ Card suits decoration ══════ */
.wo-suits {
  position: absolute;
  display: flex;
  gap: 12px;
  pointer-events: none;
}
.wo-suits.top { top: 8px; left: 50%; transform: translateX(-50%); }
.wo-suits.bottom { bottom: 8px; left: 50%; transform: translateX(-50%); }
.wo-suit {
  font-size: 18px;
  animation: wo-suit-float 2s infinite ease-in-out;
}
.wo-suit:nth-child(1) { color: #ff3366; animation-delay: 0s; }
.wo-suit:nth-child(2) { color: #ffffff; animation-delay: 0.3s; }
.wo-suit:nth-child(3) { color: #ff3366; animation-delay: 0.6s; }
.wo-suit:nth-child(4) { color: #ffffff; animation-delay: 0.9s; }
@keyframes wo-suit-float {
  0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 5px currentColor); }
  50% { transform: translateY(-5px); filter: drop-shadow(0 0 15px currentColor); }
}

/* ══════ Neon light bars ══════ */
.wo-light-bar {
  position: absolute;
  height: 3px;
  background: linear-gradient(90deg, transparent, #ff00ff, #00ffff, #ff00ff, transparent);
  box-shadow: 0 0 10px #ff00ff, 0 0 20px #00ffff;
  animation: wo-light-bar-pulse 2s infinite;
}
.wo-light-bar.top { top: 0; left: 10%; right: 10%; }
.wo-light-bar.bottom { bottom: 0; left: 10%; right: 10%; }
@keyframes wo-light-bar-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; box-shadow: 0 0 20px #ff00ff, 0 0 40px #00ffff, 0 0 60px #ff00ff; }
}

/* ══════ Main card ══════ */
.wo-main-card {
  position: relative;
  width: 88%;
  max-width: 780px;
  background: linear-gradient(145deg, #1a0a30 0%, #2d1050 50%, #1a0a30 100%);
  border-radius: 24px;
  padding: 4px;
  z-index: 2;
}

/* Neon border glow */
.wo-main-card::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 28px;
  background: linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff, #ffff00, #ff00ff);
  background-size: 400% 100%;
  animation: wo-border-glow 3s linear infinite;
  z-index: -1;
  filter: blur(10px);
  opacity: 0.9;
}
.wo-main-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  border: 3px solid transparent;
  background: linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: wo-border-glow 3s linear infinite;
  background-size: 400% 100%;
}
@keyframes wo-border-glow {
  0% { background-position: 0% 50%; }
  100% { background-position: 400% 50%; }
}

.wo-card-inner {
  background: linear-gradient(180deg, #150525 0%, #1f0a3a 100%);
  border-radius: 20px;
  padding: 16px 24px;
  position: relative;
  overflow: hidden;
}

/* Scanlines effect */
.wo-card-inner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.1) 2px,
    rgba(0,0,0,0.1) 4px
  );
  pointer-events: none;
}

/* ══════ Top banner - stars and title ══════ */
.wo-top-banner {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}
.wo-banner-star {
  font-size: 24px;
  color: #00ffff;
  filter: drop-shadow(0 0 10px #00ffff);
  animation: wo-banner-star-spin 3s linear infinite;
}
@keyframes wo-banner-star-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

/* ══════ Title section with neon box ══════ */
.wo-title-box {
  position: relative;
  display: inline-block;
  padding: 8px 40px;
  margin: 0 auto 8px;
  text-align: center;
}
.wo-title-box::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 3px solid #ffd700;
  border-radius: 12px;
  box-shadow: 0 0 15px #ffd700, 0 0 30px #ffd700, inset 0 0 15px rgba(255,215,0,0.1);
  animation: wo-title-box-pulse 2s infinite;
}
@keyframes wo-title-box-pulse {
  0%, 100% { box-shadow: 0 0 15px #ffd700, 0 0 30px #ffd700, inset 0 0 15px rgba(255,215,0,0.1); }
  50% { box-shadow: 0 0 25px #ffd700, 0 0 50px #ffd700, 0 0 75px #ff8800, inset 0 0 25px rgba(255,215,0,0.2); }
}

.wo-title-section {
  text-align: center;
  margin-bottom: 6px;
}
.wo-title {
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 8px;
  margin: 0;
  background: linear-gradient(180deg, #ffd700 0%, #ffaa00 40%, #ff6600 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 10px #ffd700) drop-shadow(0 0 20px #ff8800) drop-shadow(0 0 40px #ff4400);
  animation: wo-title-glow 2s infinite ease-in-out;
  text-transform: uppercase;
}
@keyframes wo-title-glow {
  0%, 100% { filter: drop-shadow(0 0 10px #ffd700) drop-shadow(0 0 20px #ff8800); }
  50% { filter: drop-shadow(0 0 20px #ffd700) drop-shadow(0 0 40px #ff8800) drop-shadow(0 0 60px #ff4400); }
}

/* ══════ Jackpot banner ══════ */
.wo-jackpot-banner {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  padding: 6px 20px;
  background: linear-gradient(90deg, transparent, rgba(255,0,102,0.3), transparent);
  border-top: 1px solid #ff0066;
  border-bottom: 1px solid #ff0066;
}
.wo-jackpot-text {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #ff0066;
  text-shadow: 0 0 10px #ff0066, 0 0 20px #ff0066;
  animation: wo-jackpot-flash 0.5s infinite;
}
@keyframes wo-jackpot-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.wo-jackpot-icon {
  font-size: 16px;
  color: #ffff00;
  filter: drop-shadow(0 0 8px #ffff00);
  animation: wo-coin-spin 1s linear infinite;
}
@keyframes wo-coin-spin {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

/* ══════ Neon line separator ══════ */
.wo-neon-line {
  height: 2px;
  margin: 10px auto;
  width: 80%;
  background: linear-gradient(90deg, transparent, #00ffff, #ff00ff, #00ffff, transparent);
  box-shadow: 0 0 10px #00ffff, 0 0 20px #ff00ff;
  animation: wo-line-pulse 2s infinite;
}
@keyframes wo-line-pulse {
  0%, 100% { opacity: 0.7; box-shadow: 0 0 10px #00ffff, 0 0 20px #ff00ff; }
  50% { opacity: 1; box-shadow: 0 0 20px #00ffff, 0 0 40px #ff00ff, 0 0 60px #00ffff; }
}

/* ══════ Dot lights row ══════ */
.wo-dot-lights {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 8px 0;
}
.wo-dot-light {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: wo-dot-light-chase 1.5s infinite;
}
@keyframes wo-dot-light-chase {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* ══════ Content grid - 2 columns ══════ */
.wo-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

/* ══════ Bet display - slot machine style ══════ */
.wo-bet-section {
  background: linear-gradient(180deg, #0a0a20 0%, #151535 100%);
  border-radius: 16px;
  padding: 14px;
  border: 2px solid #00aaff;
  box-shadow: inset 0 0 30px rgba(0, 100, 255, 0.2), 0 0 20px rgba(0, 150, 255, 0.4);
  position: relative;
  overflow: hidden;
}
.wo-bet-section::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: wo-shimmer 3s infinite;
  pointer-events: none;
}
@keyframes wo-shimmer {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(50%); }
}

.wo-bet-label {
  text-align: center;
  color: #00ffff;
  font-size: 10px;
  letter-spacing: 3px;
  margin-bottom: 6px;
  text-shadow: 0 0 10px #00ffff;
}

.wo-bet-display {
  background: #000;
  border-radius: 10px;
  padding: 10px 16px;
  text-align: center;
  border: 2px solid #00aaff;
  box-shadow: inset 0 0 20px rgba(0, 170, 255, 0.3), 0 0 10px rgba(0, 170, 255, 0.5);
}
.wo-bet-currency {
  color: #00ff88;
  font-size: 16px;
  font-weight: 700;
  text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88;
  margin-right: 6px;
}
.wo-bet-amount {
  color: #ffff00;
  font-size: 28px;
  font-weight: 900;
  text-shadow: 0 0 10px #ffff00, 0 0 20px #ffaa00, 0 0 30px #ff8800;
  animation: wo-amount-pulse 1.5s infinite;
}
@keyframes wo-amount-pulse {
  0%, 100% { text-shadow: 0 0 10px #ffff00, 0 0 20px #ffaa00; }
  50% { text-shadow: 0 0 20px #ffff00, 0 0 40px #ffaa00, 0 0 60px #ff8800; }
}

/* ══════ Players section ══════ */
.wo-players-section {
  background: linear-gradient(180deg, #200a30 0%, #301050 100%);
  border-radius: 16px;
  padding: 14px;
  border: 2px solid #ff00ff;
  box-shadow: inset 0 0 30px rgba(150, 0, 150, 0.2), 0 0 20px rgba(255, 0, 255, 0.4);
}

.wo-players-label {
  text-align: center;
  color: #ff00ff;
  font-size: 10px;
  letter-spacing: 3px;
  margin-bottom: 6px;
  text-shadow: 0 0 10px #ff00ff;
}

.wo-players-count {
  text-align: center;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 0 10px #ffffff;
}
.wo-players-count span {
  color: #00ffff;
  text-shadow: 0 0 15px #00ffff;
}

.wo-dots-container {
  display: flex;
  justify-content: center;
  gap: 14px;
}
.wo-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(180deg, #1a1a3a 0%, #0a0a20 100%);
  border: 3px solid #444466;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.wo-dot.active {
  background: linear-gradient(180deg, #00ff88 0%, #00aa55 100%);
  border-color: #00ffaa;
  box-shadow: 0 0 20px #00ff88, 0 0 40px #00ff88, inset 0 0 10px rgba(255,255,255,0.3);
  animation: wo-dot-pulse 1s infinite;
}
@keyframes wo-dot-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px #00ff88, 0 0 40px #00ff88; }
  50% { transform: scale(1.15); box-shadow: 0 0 30px #00ff88, 0 0 60px #00ff88, 0 0 80px #00ffaa; }
}
.wo-dot-inner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}
.wo-dot.active .wo-dot-inner {
  opacity: 1;
  animation: wo-dot-inner-pulse 1s infinite;
}
@keyframes wo-dot-inner-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.6); }
}

/* ══════ Status text ══════ */
.wo-status {
  text-align: center;
  margin-top: 10px;
  font-size: 11px;
  color: #ffaa00;
  letter-spacing: 2px;
  text-shadow: 0 0 10px #ffaa00;
  animation: wo-status-blink 1.5s infinite;
}
@keyframes wo-status-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ══════ Ready button - Vegas style ══════ */
.wo-ready-btn {
  display: block;
  width: 100%;
  padding: 14px 40px;
  border: none;
  border-radius: 14px;
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #00ff88 0%, #00cc66 50%, #009944 100%);
  color: #000;
  text-shadow: 0 1px 0 rgba(255,255,255,0.5);
  box-shadow:
    0 6px 0 #006633,
    0 8px 20px rgba(0, 255, 100, 0.5),
    0 0 40px rgba(0, 255, 100, 0.3),
    inset 0 2px 0 rgba(255,255,255,0.4);
  transition: all 0.15s ease;
  text-transform: uppercase;
  z-index: 10;
}
.wo-ready-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: wo-btn-shimmer 2s infinite;
  pointer-events: none;
}
@keyframes wo-btn-shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
.wo-ready-btn:hover:not(.disabled) {
  transform: translateY(-3px);
  box-shadow:
    0 9px 0 #006633,
    0 12px 30px rgba(0, 255, 100, 0.6),
    0 0 60px rgba(0, 255, 100, 0.5),
    inset 0 2px 0 rgba(255,255,255,0.4);
}
.wo-ready-btn:active:not(.disabled) {
  transform: translateY(3px);
  box-shadow:
    0 3px 0 #006633,
    0 5px 15px rgba(0, 255, 100, 0.4),
    inset 0 2px 0 rgba(255,255,255,0.4);
}
.wo-ready-btn.disabled {
  background: linear-gradient(180deg, #444 0%, #333 50%, #222 100%);
  color: #888;
  box-shadow: 0 4px 0 #111, 0 6px 15px rgba(0,0,0,0.5);
  cursor: not-allowed;
}
.wo-ready-btn.disabled::before {
  display: none;
}


/* ══════ Balance bar ══════ */
.wo-balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 8px 14px;
  background: rgba(0,0,0,0.4);
  border-radius: 8px;
  border: 1px solid #333366;
}
.wo-balance-label {
  color: #8888aa;
  font-size: 10px;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.wo-balance-icon {
  color: #ffcc00;
  font-size: 14px;
  filter: drop-shadow(0 0 5px #ffcc00);
}
.wo-balance-amount {
  color: #00ffff;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 0 10px #00ffff;
}

/* ══════ Match ID ══════ */
.wo-match-id {
  text-align: center;
  margin-top: 6px;
  color: #555577;
  font-size: 9px;
  letter-spacing: 2px;
}

/* ══════ Corner decorations ══════ */
.wo-corner {
  position: absolute;
  width: 50px;
  height: 50px;
  pointer-events: none;
}
.wo-corner-tl { top: 6px; left: 6px; }
.wo-corner-tr { top: 6px; right: 6px; transform: scaleX(-1); }
.wo-corner-bl { bottom: 6px; left: 6px; transform: scaleY(-1); }
.wo-corner-br { bottom: 6px; right: 6px; transform: scale(-1); }

.wo-corner svg {
  width: 100%;
  height: 100%;
  stroke: #ff00ff;
  stroke-width: 2;
  fill: none;
  filter: drop-shadow(0 0 5px #ff00ff);
  animation: wo-corner-pulse 2s infinite;
}
@keyframes wo-corner-pulse {
  0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 5px #ff00ff); }
  50% { opacity: 1; filter: drop-shadow(0 0 15px #ff00ff) drop-shadow(0 0 25px #00ffff); }
}

/* ══════ Bottom neon strip ══════ */
.wo-bottom-strip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff);
  background-size: 200% 100%;
  animation: wo-strip-move 2s linear infinite;
  border-radius: 0 0 20px 20px;
}
@keyframes wo-strip-move {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* ══════ Mobile landscape responsive ══════ */
@media (max-height: 500px) and (orientation: landscape) {
  .wo-main-card { width: 92%; max-width: 680px; }
  .wo-card-inner { padding: 8px 16px; }
  .wo-title { font-size: 28px; letter-spacing: 4px; }
  .wo-title-box { padding: 4px 24px; margin-bottom: 4px; }
  .wo-top-banner { margin-bottom: 4px; gap: 8px; }
  .wo-banner-star { font-size: 16px; }
  .wo-jackpot-banner { margin: 4px 0; padding: 3px 12px; }
  .wo-jackpot-text { font-size: 10px; letter-spacing: 3px; }
  .wo-jackpot-icon { font-size: 12px; }
  .wo-neon-line { margin: 6px auto; }
  .wo-dot-lights { margin: 4px 0; gap: 6px; }
  .wo-dot-light { width: 6px; height: 6px; }
  .wo-content-grid { gap: 12px; margin: 6px 0; }
  .wo-bet-section, .wo-players-section { padding: 10px 14px; }
  .wo-bet-label, .wo-players-label { font-size: 10px; letter-spacing: 2px; margin-bottom: 4px; }
  .wo-bet-display { padding: 6px 16px; margin-bottom: 6px; }
  .wo-bet-currency { font-size: 14px; }
  .wo-bet-amount { font-size: 28px; }
  .wo-player-count { font-size: 28px; margin-bottom: 6px; }
  .wo-player-dots { gap: 8px; margin-bottom: 6px; }
  .wo-player-dot { width: 32px; height: 32px; }
  .wo-player-dot-inner { width: 10px; height: 10px; }
  .wo-waiting-status { font-size: 10px; letter-spacing: 2px; }
  .wo-ready-btn { padding: 12px 50px; font-size: 18px; margin-top: 8px; }
  .wo-suits { display: none; }
  .wo-side-bulbs { padding: 8px 0; }
  .wo-bulb { width: 14px; height: 14px; }
}
`;

export class WaitingOverlay {
  private root: HTMLDivElement;
  private playerCountEl!: HTMLElement;
  private dotsContainer!: HTMLElement;
  private statusEl!: HTMLElement;
  private readyBtn!: HTMLButtonElement;
  private maxPlayers = 4;
  private onReadyCallback: (() => void) | null = null;

  constructor() {
    this.injectStyles();
    this.root = this.buildDOM();
    document.getElementById('game-container')!.appendChild(this.root);
  }

  private injectStyles(): void {
    if (document.getElementById('wo-styles')) return;
    const style = document.createElement('style');
    style.id = 'wo-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  private buildDOM(): HTMLDivElement {
    const root = document.createElement('div');
    root.id = 'waiting-overlay';

    // Background particles
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.className = 'wo-particle';
      const size = 2 + Math.random() * 4;
      const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0088', '#00ff88'];
      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        box-shadow: 0 0 ${size * 2}px currentColor;
        animation-delay: ${Math.random() * 8}s;
        animation-duration: ${6 + Math.random() * 4}s;
      `;
      root.appendChild(particle);
    }

    // Animated stars
    const starPositions = [
      { x: 5, y: 15 }, { x: 95, y: 20 }, { x: 8, y: 80 }, { x: 92, y: 75 },
      { x: 15, y: 5 }, { x: 85, y: 8 }, { x: 12, y: 92 }, { x: 88, y: 88 }
    ];
    const starColors = ['#ffff00', '#00ffff', '#ff00ff', '#ff8800'];
    starPositions.forEach((pos, i) => {
      const star = document.createElement('div');
      star.className = 'wo-star';
      star.textContent = '★';
      star.style.cssText = `
        left: ${pos.x}%;
        top: ${pos.y}%;
        color: ${starColors[i % starColors.length]};
        animation-delay: ${i * 0.2}s;
      `;
      root.appendChild(star);
    });

    // Light bars
    const lightBarTop = document.createElement('div');
    lightBarTop.className = 'wo-light-bar top';
    root.appendChild(lightBarTop);
    const lightBarBottom = document.createElement('div');
    lightBarBottom.className = 'wo-light-bar bottom';
    root.appendChild(lightBarBottom);

    // Card suits top
    const suitsTop = document.createElement('div');
    suitsTop.className = 'wo-suits top';
    suitsTop.innerHTML = '<span class="wo-suit">♠</span><span class="wo-suit">♥</span><span class="wo-suit">♣</span><span class="wo-suit">♦</span>';
    root.appendChild(suitsTop);

    // Card suits bottom
    const suitsBottom = document.createElement('div');
    suitsBottom.className = 'wo-suits bottom';
    suitsBottom.innerHTML = '<span class="wo-suit">♦</span><span class="wo-suit">♣</span><span class="wo-suit">♥</span><span class="wo-suit">♠</span>';
    root.appendChild(suitsBottom);

    // Side marquee bulbs - Hollywood/Vegas style (full height)
    const numBulbs = 20;

    const leftBulbs = document.createElement('div');
    leftBulbs.className = 'wo-side-bulbs left';
    for (let i = 0; i < numBulbs; i++) {
      const bulb = document.createElement('div');
      bulb.className = 'wo-bulb';
      bulb.style.animationDelay = `${i * 0.1}s`;
      leftBulbs.appendChild(bulb);
    }
    root.appendChild(leftBulbs);

    const rightBulbs = document.createElement('div');
    rightBulbs.className = 'wo-side-bulbs right';
    for (let i = 0; i < numBulbs; i++) {
      const bulb = document.createElement('div');
      bulb.className = 'wo-bulb';
      bulb.style.animationDelay = `${(numBulbs - 1 - i) * 0.1}s`;
      rightBulbs.appendChild(bulb);
    }
    root.appendChild(rightBulbs);

    // Main card
    const mainCard = document.createElement('div');
    mainCard.className = 'wo-main-card';

    const cardInner = document.createElement('div');
    cardInner.className = 'wo-card-inner';

    // Corner decorations
    ['tl', 'tr', 'bl', 'br'].forEach(pos => {
      const corner = document.createElement('div');
      corner.className = `wo-corner wo-corner-${pos}`;
      corner.innerHTML = `<svg viewBox="0 0 60 60"><path d="M5 55 L5 20 Q5 5 20 5 L55 5" /></svg>`;
      cardInner.appendChild(corner);
    });

    // Top banner with stars
    const topBanner = document.createElement('div');
    topBanner.className = 'wo-top-banner';
    topBanner.innerHTML = `
      <span class="wo-banner-star">✦</span>
      <span class="wo-banner-star">★</span>
      <span class="wo-banner-star">✦</span>
    `;
    cardInner.appendChild(topBanner);

    // Title with neon box
    const titleSection = document.createElement('div');
    titleSection.className = 'wo-title-section';
    titleSection.innerHTML = `
      <div class="wo-title-box">
        <h1 class="wo-title">DIZOLAUR</h1>
      </div>
    `;
    cardInner.appendChild(titleSection);

    // Jackpot banner
    const jackpotBanner = document.createElement('div');
    jackpotBanner.className = 'wo-jackpot-banner';
    jackpotBanner.innerHTML = `
      <span class="wo-jackpot-icon">🪙</span>
      <span class="wo-jackpot-text">MULTIPLAYER ARENA</span>
      <span class="wo-jackpot-icon">🪙</span>
    `;
    cardInner.appendChild(jackpotBanner);

    // Dot lights row
    const dotLights = document.createElement('div');
    dotLights.className = 'wo-dot-lights';
    const lightColors = ['#ff0066', '#ffff00', '#00ffff', '#ff00ff', '#00ff88', '#ff8800', '#ff0066', '#ffff00', '#00ffff', '#ff00ff'];
    lightColors.forEach((color, i) => {
      const light = document.createElement('div');
      light.className = 'wo-dot-light';
      light.style.cssText = `background: ${color}; box-shadow: 0 0 8px ${color}; animation-delay: ${i * 0.1}s;`;
      dotLights.appendChild(light);
    });
    cardInner.appendChild(dotLights);

    // Neon line
    const neonLine = document.createElement('div');
    neonLine.className = 'wo-neon-line';
    cardInner.appendChild(neonLine);

    // Content grid
    const contentGrid = document.createElement('div');
    contentGrid.className = 'wo-content-grid';

    // Bet section
    const betSection = document.createElement('div');
    betSection.className = 'wo-bet-section';
    betSection.innerHTML = `
      <div class="wo-bet-label">💰 YOUR BET 💰</div>
      <div class="wo-bet-display">
        <span class="wo-bet-currency" id="wo-currency">USD</span>
        <span class="wo-bet-amount" id="wo-bet-amount">10.00</span>
      </div>
    `;
    contentGrid.appendChild(betSection);

    // Players section
    const playersSection = document.createElement('div');
    playersSection.className = 'wo-players-section';
    playersSection.innerHTML = `
      <div class="wo-players-label">👥 PLAYERS 👥</div>
      <div class="wo-players-count"><span id="wo-player-count">1</span> / <span id="wo-max-players">4</span></div>
      <div class="wo-dots-container" id="wo-dots"></div>
      <div class="wo-status" id="wo-status">⏳ WAITING FOR PLAYERS...</div>
    `;
    contentGrid.appendChild(playersSection);

    cardInner.appendChild(contentGrid);

    // Ready button
    const readyBtn = document.createElement('button');
    readyBtn.className = 'wo-ready-btn';
    readyBtn.id = 'wo-ready-btn';
    readyBtn.innerHTML = '🎰 READY 🎰';
    cardInner.appendChild(readyBtn);

    // Balance bar
    const balanceBar = document.createElement('div');
    balanceBar.className = 'wo-balance-bar';
    balanceBar.innerHTML = `
      <span class="wo-balance-label"><span class="wo-balance-icon">💳</span> BALANCE</span>
      <span class="wo-balance-amount">$10,000</span>
    `;
    cardInner.appendChild(balanceBar);

    // Match ID
    const matchId = document.createElement('div');
    matchId.className = 'wo-match-id';
    matchId.id = 'wo-match-id';
    matchId.textContent = '🎫 MATCH #--------';
    cardInner.appendChild(matchId);

    // Bottom strip
    const bottomStrip = document.createElement('div');
    bottomStrip.className = 'wo-bottom-strip';
    cardInner.appendChild(bottomStrip);

    mainCard.appendChild(cardInner);
    root.appendChild(mainCard);

    // Cache refs
    this.playerCountEl = root.querySelector('#wo-player-count')!;
    this.dotsContainer = root.querySelector('#wo-dots')!;
    this.statusEl = root.querySelector('#wo-status')!;
    this.readyBtn = root.querySelector('#wo-ready-btn')!;

    this.readyBtn.addEventListener('click', () => {
      if (!this.readyBtn.classList.contains('disabled') && this.onReadyCallback) {
        this.onReadyCallback();
      }
    });

    return root;
  }

  show(data: { betAmount: number; currency: string; matchId: string; playerCount: number; maxPlayers: number }): void {
    this.maxPlayers = data.maxPlayers;

    const currEl = this.root.querySelector('#wo-currency') as HTMLElement;
    const amountEl = this.root.querySelector('#wo-bet-amount') as HTMLElement;
    const maxEl = this.root.querySelector('#wo-max-players') as HTMLElement;
    const matchEl = this.root.querySelector('#wo-match-id') as HTMLElement;

    if (currEl) currEl.textContent = data.currency;
    if (amountEl) amountEl.textContent = data.betAmount.toFixed(2);
    if (maxEl) maxEl.textContent = String(data.maxPlayers);
    if (matchEl) matchEl.textContent = `🎫 MATCH #${data.matchId.substring(0, 8).toUpperCase()}`;

    // Build dots
    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < this.maxPlayers; i++) {
      const dot = document.createElement('div');
      dot.className = 'wo-dot';
      dot.innerHTML = '<div class="wo-dot-inner"></div>';
      dot.style.animationDelay = `${i * 0.15}s`;
      this.dotsContainer.appendChild(dot);
    }

    this.updatePlayers(data.playerCount);
    this.readyBtn.classList.remove('disabled');
    this.readyBtn.innerHTML = '🎰 READY 🎰';
    this.statusEl.textContent = '⏳ WAITING FOR PLAYERS...';
    this.statusEl.style.color = '#ffaa00';

    this.root.classList.add('visible');
  }

  hide(): void {
    this.root.classList.remove('visible');
  }

  updatePlayers(count: number): void {
    this.playerCountEl.textContent = String(count);
    const dots = this.dotsContainer.querySelectorAll('.wo-dot');
    dots.forEach((dot, i) => {
      if (i < count) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  setReady(): void {
    this.readyBtn.classList.add('disabled');
    this.readyBtn.innerHTML = '⏳ WAITING...';
  }

  setReadyConfirmed(): void {
    this.statusEl.textContent = '✅ READY! WAITING FOR OTHERS...';
    this.statusEl.style.color = '#00ff88';
    this.statusEl.style.animation = 'none';
  }

  setMatchStarting(): void {
    this.statusEl.textContent = '🎰 MATCH STARTING! 🎰';
    this.statusEl.style.color = '#ffff00';
    this.statusEl.style.fontSize = '14px';
    this.statusEl.style.animation = 'none';
  }

  onReady(callback: () => void): void {
    this.onReadyCallback = callback;
  }

  destroy(): void {
    this.root.remove();
    document.getElementById('wo-styles')?.remove();
  }
}
