import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WaitingScene } from './scenes/WaitingScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scene: [BootScene, WaitingScene, GameScene, ResultsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Constrain container to game aspect ratio at phone-like size
const container = document.getElementById('game-container');
if (container) {
  const w = config.width as number;
  const h = config.height as number;
  container.style.maxWidth = `${w}px`;
  container.style.maxHeight = `${h}px`;
}

// Create game instance
const game = new Phaser.Game(config);

// Hide loading screen once game is ready
game.events.once('ready', () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
  }
});
