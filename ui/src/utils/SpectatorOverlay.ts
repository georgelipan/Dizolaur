/**
 * F10 — Spectator Mode Overlay
 * Shows remaining players counter, live scores, own score dimmed,
 * player names above dinos, and a "Play Again" button after elimination.
 */

import Phaser from 'phaser';
import type { PlayerSnapshot } from '../types';
import { PlayerState } from '../types';

export class SpectatorOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  // UI elements
  private remainingText: Phaser.GameObjects.Text;
  private ownScoreText: Phaser.GameObjects.Text;
  private scoreEntries: Map<string, Phaser.GameObjects.Text> = new Map();
  private playAgainBtn: Phaser.GameObjects.Rectangle;
  private playAgainLabel: Phaser.GameObjects.Text;
  private spectatingLabel: Phaser.GameObjects.Text;

  private myPlayerId: string;
  private myFinalScore: number;
  private visible = false;

  constructor(
    scene: Phaser.Scene,
    myPlayerId: string,
    myFinalScore: number,
    worldWidth: number,
    worldHeight: number,
    onPlayAgain: () => void,
  ) {
    this.scene = scene;
    this.myPlayerId = myPlayerId;
    this.myFinalScore = myFinalScore;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);
    this.container.setAlpha(0);

    // "SPECTATING" label top-center
    this.spectatingLabel = scene.add.text(worldWidth / 2, 60, 'SPECTATING', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 16, y: 8 },
    });
    this.spectatingLabel.setOrigin(0.5);
    this.container.add(this.spectatingLabel);

    // Remaining players counter
    this.remainingText = scene.add.text(worldWidth / 2, 100, '', {
      fontSize: '20px',
      color: '#ffcc00',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 12, y: 4 },
    });
    this.remainingText.setOrigin(0.5);
    this.container.add(this.remainingText);

    // Own score dimmed (right side)
    this.ownScoreText = scene.add.text(worldWidth - 16, 100, `Your Score: ${myFinalScore}`, {
      fontSize: '18px',
      color: '#999999',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: { x: 8, y: 4 },
    });
    this.ownScoreText.setOrigin(1, 0);
    this.container.add(this.ownScoreText);

    // Play Again button (bottom center, unobtrusive)
    const btnY = worldHeight - 50;
    this.playAgainBtn = scene.add.rectangle(worldWidth / 2, btnY, 180, 40, 0x0066cc, 0.85);
    this.playAgainBtn.setStrokeStyle(2, 0xffffff);
    this.playAgainBtn.setInteractive({ useHandCursor: true });
    this.container.add(this.playAgainBtn);

    this.playAgainLabel = scene.add.text(worldWidth / 2, btnY, 'PLAY AGAIN', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.playAgainLabel.setOrigin(0.5);
    this.container.add(this.playAgainLabel);

    this.playAgainBtn.on('pointerdown', onPlayAgain);
    this.playAgainBtn.on('pointerover', () => this.playAgainBtn.setFillStyle(0x0088ff, 0.95));
    this.playAgainBtn.on('pointerout', () => this.playAgainBtn.setFillStyle(0x0066cc, 0.85));
  }

  /** Fade in the overlay */
  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
    });
  }

  /** Update live scores and remaining count from snapshot */
  update(players: PlayerSnapshot[]): void {
    if (!this.visible) return;

    // Count remaining (non-eliminated) players
    const activePlayers = players.filter(p => p.state !== PlayerState.ELIMINATED);
    const remaining = activePlayers.length;
    this.remainingText.setText(`${remaining} PLAYER${remaining !== 1 ? 'S' : ''} REMAINING`);

    // Update score list for active players (left side)
    const trackedIds = new Set<string>();
    let yPos = 130;

    // Sort by score descending
    const sorted = [...activePlayers].sort((a, b) => b.score - a.score);

    for (const player of sorted) {
      trackedIds.add(player.playerId);
      const label = player.playerId === this.myPlayerId
        ? 'YOU'
        : player.playerId.substring(0, 10);
      const text = `${label}: ${Math.floor(player.score)}`;

      if (this.scoreEntries.has(player.playerId)) {
        this.scoreEntries.get(player.playerId)!.setText(text);
        this.scoreEntries.get(player.playerId)!.setY(yPos);
      } else {
        const entry = this.scene.add.text(16, yPos, text, {
          fontSize: '16px',
          color: '#00ff00',
          backgroundColor: 'rgba(0,0,0,0.4)',
          padding: { x: 6, y: 2 },
        });
        entry.setDepth(100);
        this.container.add(entry);
        this.scoreEntries.set(player.playerId, entry);
      }
      yPos += 26;
    }

    // Remove entries for eliminated/disconnected players
    for (const [id, entry] of this.scoreEntries) {
      if (!trackedIds.has(id)) {
        entry.destroy();
        this.scoreEntries.delete(id);
      }
    }
  }

  destroy(): void {
    for (const [, entry] of this.scoreEntries) {
      entry.destroy();
    }
    this.scoreEntries.clear();
    this.container.destroy();
  }
}
