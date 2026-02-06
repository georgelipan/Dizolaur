/**
 * Vegas Casino Neon BootScene Overlay
 * Clean, professional design with impactful neon effects
 */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

#boot-overlay {
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
#boot-overlay.visible { display: flex; }

/* ══════ Subtle background glow ══════ */
#boot-overlay::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 600px;
  background: radial-gradient(ellipse, rgba(255,0,255,0.08) 0%, rgba(0,255,255,0.05) 30%, transparent 70%);
  pointer-events: none;
}

/* ══════ Side marquee bulbs ══════ */
.bo-side-bulbs {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 20px 0;
  pointer-events: none;
}
.bo-side-bulbs.left { left: 12px; }
.bo-side-bulbs.right { right: 12px; }

.bo-bulb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(ellipse at 30% 20%, #fffef0 0%, #fff8dc 15%, #ffd700 40%, #daa520 70%, #b8860b 100%);
  border: 2px solid #8b7355;
  box-shadow: 0 0 8px #ffd700, 0 0 16px #ffaa00;
  animation: bo-bulb-pulse 0.8s infinite ease-in-out;
}
@keyframes bo-bulb-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1); box-shadow: 0 0 10px #ffd700, 0 0 20px #ffaa00, 0 0 30px rgba(255,200,0,0.4); }
}

/* ══════ Light bars ══════ */
.bo-light-bar {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff00ff, #00ffff, #ff00ff, transparent);
  box-shadow: 0 0 10px #ff00ff, 0 0 20px #00ffff;
  animation: bo-light-bar-pulse 2s infinite;
}
.bo-light-bar.top { top: 0; left: 0; right: 0; }
.bo-light-bar.bottom { bottom: 0; left: 0; right: 0; }
@keyframes bo-light-bar-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ══════ Main content ══════ */
.bo-main-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ══════ Neon Frame ══════ */
.bo-neon-frame {
  position: relative;
  padding: 50px 80px;
  border-radius: 20px;
  background: rgba(10, 5, 30, 0.6);
  border: 2px solid rgba(255, 0, 255, 0.3);
  box-shadow:
    0 0 40px rgba(255, 0, 255, 0.15),
    inset 0 0 60px rgba(0, 0, 0, 0.5);
}

/* ══════ Welcome text ══════ */
.bo-welcome {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 12px;
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
  margin-bottom: 15px;
  opacity: 0.9;
}

/* ══════ NEON TITLE - DIZOLAUR ══════ */
.bo-title {
  font-size: 80px;
  font-weight: 900;
  letter-spacing: 8px;
  text-transform: uppercase;
  margin: 0 0 20px 0;
  color: #fff;
  text-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #ff00ff,
    0 0 40px #ff00ff,
    0 0 60px #ff00ff,
    0 0 80px #ff00ff,
    0 0 120px #ff0088;
  animation: bo-title-glow 3s ease-in-out infinite;
}
@keyframes bo-title-glow {
  0%, 100% {
    text-shadow:
      0 0 5px #fff,
      0 0 10px #fff,
      0 0 20px #ff00ff,
      0 0 40px #ff00ff,
      0 0 60px #ff00ff,
      0 0 80px #ff00ff,
      0 0 120px #ff0088;
  }
  50% {
    text-shadow:
      0 0 5px #fff,
      0 0 15px #fff,
      0 0 30px #ff00ff,
      0 0 60px #ff00ff,
      0 0 90px #ff00ff,
      0 0 120px #ff00ff,
      0 0 180px #ff0088;
  }
}

/* ══════ Decorative line ══════ */
.bo-line {
  width: 300px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ffd700, transparent);
  box-shadow: 0 0 10px #ffd700;
  margin: 10px 0 25px;
}

/* ══════ TAGLINES ══════ */
.bo-tagline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.bo-tagline {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 8px;
  text-transform: uppercase;
  margin: 0;
  color: #fff;
  text-shadow:
    0 0 5px #fff,
    0 0 10px #00ff88,
    0 0 20px #00ff88,
    0 0 40px #00ff88,
    0 0 60px #00cc66;
}
.bo-tagline.second {
  text-shadow:
    0 0 5px #fff,
    0 0 10px #ffd700,
    0 0 20px #ffd700,
    0 0 40px #ffd700,
    0 0 60px #ffaa00;
}

/* ══════ Status section ══════ */
.bo-status-section {
  margin-top: 40px;
  padding: 12px 40px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 30px;
  border: 1px solid rgba(0, 255, 255, 0.3);
}
.bo-status-text {
  font-size: 14px;
  letter-spacing: 4px;
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff;
  animation: bo-status-pulse 1.5s infinite;
}
.bo-status-text.error {
  color: #ff4466;
  text-shadow: 0 0 10px #ff4466;
  animation: none;
}
.bo-status-text.success {
  color: #00ff88;
  text-shadow: 0 0 10px #00ff88;
  animation: none;
}
@keyframes bo-status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ══════ Corner accents ══════ */
.bo-corner {
  position: absolute;
  width: 40px;
  height: 40px;
  pointer-events: none;
}
.bo-corner.tl { top: 10px; left: 10px; border-top: 2px solid #ff00ff; border-left: 2px solid #ff00ff; }
.bo-corner.tr { top: 10px; right: 10px; border-top: 2px solid #00ffff; border-right: 2px solid #00ffff; }
.bo-corner.bl { bottom: 10px; left: 10px; border-bottom: 2px solid #00ffff; border-left: 2px solid #00ffff; }
.bo-corner.br { bottom: 10px; right: 10px; border-bottom: 2px solid #ff00ff; border-right: 2px solid #ff00ff; }
.bo-corner { box-shadow: 0 0 10px currentColor; }

/* ══════ Subtle floating particles ══════ */
.bo-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  pointer-events: none;
  animation: bo-float 10s infinite ease-in-out;
}
@keyframes bo-float {
  0%, 100% { transform: translateY(0); opacity: 0.3; }
  50% { transform: translateY(-40px); opacity: 0.7; }
}
`;

export class BootOverlay {
  private root: HTMLDivElement;
  private statusEl!: HTMLElement;

  constructor() {
    this.injectStyles();
    this.root = document.createElement('div');
    this.root.id = 'boot-overlay';
    document.getElementById('game-container')!.appendChild(this.root);
    this.buildDOM();
  }

  private injectStyles(): void {
    if (document.getElementById('bo-styles')) return;
    const style = document.createElement('style');
    style.id = 'bo-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  private buildDOM(): void {
    // Subtle particles
    const particleColors = ['#ff00ff', '#00ffff', '#ffd700'];
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'bo-particle';
      particle.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        background: ${particleColors[Math.floor(Math.random() * particleColors.length)]};
        animation-delay: ${Math.random() * 10}s;
        animation-duration: ${8 + Math.random() * 6}s;
      `;
      this.root.appendChild(particle);
    }

    // Light bars
    ['top', 'bottom'].forEach(pos => {
      const bar = document.createElement('div');
      bar.className = `bo-light-bar ${pos}`;
      this.root.appendChild(bar);
    });

    // Side bulbs
    const numBulbs = 18;
    ['left', 'right'].forEach((side, sideIdx) => {
      const bulbs = document.createElement('div');
      bulbs.className = `bo-side-bulbs ${side}`;
      for (let i = 0; i < numBulbs; i++) {
        const bulb = document.createElement('div');
        bulb.className = 'bo-bulb';
        bulb.style.animationDelay = `${(sideIdx === 0 ? i : numBulbs - 1 - i) * 0.1}s`;
        bulbs.appendChild(bulb);
      }
      this.root.appendChild(bulbs);
    });

    // Main content
    const mainContent = document.createElement('div');
    mainContent.className = 'bo-main-content';

    // Neon frame
    const neonFrame = document.createElement('div');
    neonFrame.className = 'bo-neon-frame';

    // Corner accents
    ['tl', 'tr', 'bl', 'br'].forEach(pos => {
      const corner = document.createElement('div');
      corner.className = `bo-corner ${pos}`;
      neonFrame.appendChild(corner);
    });

    // Welcome text
    const welcome = document.createElement('div');
    welcome.className = 'bo-welcome';
    welcome.textContent = 'WELCOME TO';
    neonFrame.appendChild(welcome);

    // Title
    const title = document.createElement('h1');
    title.className = 'bo-title';
    title.textContent = 'DIZOLAUR';
    neonFrame.appendChild(title);

    // Decorative line
    const line = document.createElement('div');
    line.className = 'bo-line';
    neonFrame.appendChild(line);

    // Taglines
    const taglineContainer = document.createElement('div');
    taglineContainer.className = 'bo-tagline-container';

    const tagline1 = document.createElement('p');
    tagline1.className = 'bo-tagline';
    tagline1.textContent = 'PLAY FOR REAL.';
    taglineContainer.appendChild(tagline1);

    const tagline2 = document.createElement('p');
    tagline2.className = 'bo-tagline second';
    tagline2.textContent = 'WIN FOR REAL.';
    taglineContainer.appendChild(tagline2);

    neonFrame.appendChild(taglineContainer);

    // Status section
    const statusSection = document.createElement('div');
    statusSection.className = 'bo-status-section';
    const statusText = document.createElement('div');
    statusText.className = 'bo-status-text';
    statusText.id = 'bo-status';
    statusText.textContent = 'CONNECTING...';
    statusSection.appendChild(statusText);
    neonFrame.appendChild(statusSection);
    this.statusEl = statusText;

    mainContent.appendChild(neonFrame);
    this.root.appendChild(mainContent);
  }

  show(): void {
    this.root.classList.add('visible');
  }

  hide(): void {
    this.root.classList.remove('visible');
  }

  setStatus(text: string, isError = false): void {
    if (this.statusEl) {
      this.statusEl.textContent = text;
      this.statusEl.classList.remove('error', 'success');
      if (isError) {
        this.statusEl.classList.add('error');
      } else if (text.includes('CONNECTED') || text.includes('✅')) {
        this.statusEl.classList.add('success');
      }
    }
  }

  destroy(): void {
    this.root.remove();
    document.getElementById('bo-styles')?.remove();
  }
}
