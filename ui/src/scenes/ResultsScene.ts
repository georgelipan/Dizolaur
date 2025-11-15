import Phaser from 'phaser';
import type { GameSession } from '../services/GameSession';
import type { MatchResult } from '../types';

export class ResultsScene extends Phaser.Scene {
  private gameSession!: GameSession;
  private result!: MatchResult;

  constructor() {
    super({ key: 'ResultsScene' });
  }

  init(data: { result: MatchResult }) {
    this.result = data.result;
    this.gameSession = this.registry.get('gameSession');
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(centerX, 80, 'Match Results', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Check if local player won
    const myPlayerId = this.gameSession.getPlayerId();
    const myResult = this.result.players.find((p) => p.playerId === myPlayerId);
    const isWinner = myResult?.playerId === this.result.winnerId;

    // Winner announcement
    if (isWinner) {
      this.add.text(centerX, 140, '🏆 YOU WON! 🏆', {
        fontSize: '32px',
        color: '#00ff00',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    } else {
      const winnerName = this.result.winnerId?.substring(0, 10) || 'No one';
      this.add.text(centerX, 140, `Winner: ${winnerName}`, {
        fontSize: '24px',
        color: '#ffaa00',
      }).setOrigin(0.5);
    }

    // Player results table
    let yPos = 200;
    this.add.text(centerX, yPos, 'Rankings', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    yPos += 40;

    // Sort players by ranking
    const sortedPlayers = [...this.result.players].sort((a, b) => a.ranking - b.ranking);

    sortedPlayers.forEach((player, index) => {
      const isMe = player.playerId === myPlayerId;
      const rank = player.ranking;
      const name = isMe ? 'YOU' : player.playerId.substring(0, 10);
      const score = player.score;
      const winnings = player.winnings.toFixed(2);

      const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

      const text = `${rankEmoji} ${name} - Score: ${score} - Won: ${winnings} ${this.gameSession.getCurrency()}`;

      this.add.text(centerX, yPos + (index * 35), text, {
        fontSize: '18px',
        color: isMe ? '#00ff00' : '#ffffff',
        backgroundColor: isMe ? '#003300' : undefined,
        padding: isMe ? { x: 8, y: 4 } : undefined,
      }).setOrigin(0.5);
    });

    // Your winnings
    if (myResult) {
      yPos += sortedPlayers.length * 35 + 40;

      this.add.text(centerX, yPos, `Your Winnings: ${myResult.winnings.toFixed(2)} ${this.gameSession.getCurrency()}`, {
        fontSize: '24px',
        color: myResult.winnings > 0 ? '#00ff00' : '#ff0000',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 12, y: 6 },
      }).setOrigin(0.5);
    }

    // Play again button
    const playAgainBtn = this.add.rectangle(centerX, centerY + 180, 200, 50, 0x0066cc);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.setStrokeStyle(2, 0xffffff);

    this.add.text(centerX, centerY + 180, 'Play Again', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    playAgainBtn.on('pointerdown', () => {
      // Reset session and restart
      this.gameSession.reset();
      this.scene.start('BootScene');
    });

    playAgainBtn.on('pointerover', () => {
      playAgainBtn.setFillStyle(0x0088ff);
    });

    playAgainBtn.on('pointerout', () => {
      playAgainBtn.setFillStyle(0x0066cc);
    });
  }
}
