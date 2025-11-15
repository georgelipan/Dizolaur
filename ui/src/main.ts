import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WaitingScene } from './scenes/WaitingScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  scene: [BootScene, WaitingScene, GameScene, ResultsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Create game instance
const game = new Phaser.Game(config);

// Hide loading screen once game is ready
game.events.once('ready', () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
  }
});

// Log game version
console.log('🦖 Dino Game UI v1.0.0');
console.log('Phaser Version:', Phaser.VERSION);

// Export for debugging
(window as any).game = game;
