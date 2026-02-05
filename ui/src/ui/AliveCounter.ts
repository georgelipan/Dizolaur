/**
 * F11 — Alive Counter
 * Displays "N/T ALIVE" top-right with animated transitions:
 * - Red pulse on elimination (500ms)
 * - Slot-machine number roll (200ms)
 * - Amber glow at 2 alive
 * - Explodes into "WINNER!" at 1 alive (local player still playing)
 */

import Phaser from 'phaser';

export class AliveCounter {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private counterText: Phaser.GameObjects.Text;
  private bgRect: Phaser.GameObjects.Rectangle;

  private totalPlayers: number;
  private currentAlive: number;
  private isWinner = false;

  constructor(scene: Phaser.Scene, x: number, y: number, totalPlayers: number) {
    this.scene = scene;
    this.totalPlayers = totalPlayers;
    this.currentAlive = totalPlayers;

    this.container = scene.add.container(x, y);
    this.container.setDepth(60);

    // Background
    this.bgRect = scene.add.rectangle(0, 0, 130, 36, 0x000000, 0.6);
    this.bgRect.setStrokeStyle(2, 0xffffff);
    this.container.add(this.bgRect);

    // Counter text
    this.counterText = scene.add.text(0, 0, `${totalPlayers}/${totalPlayers} ALIVE`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.counterText.setOrigin(0.5);
    this.container.add(this.counterText);
  }

  /** Update with new alive count. Returns true if count changed. */
  update(alive: number, localPlayerAlive: boolean): boolean {
    if (alive === this.currentAlive) return false;

    const oldAlive = this.currentAlive;
    this.currentAlive = alive;

    // Slot-machine number roll animation (200ms)
    this.animateNumberRoll(oldAlive, alive);

    // Red pulse (500ms)
    this.pulseRed();

    // Amber glow at 2 remaining
    if (alive === 2) {
      this.setAmberGlow();
    }

    // Winner explosion at 1 remaining (only if local player is still alive)
    if (alive === 1 && localPlayerAlive && !this.isWinner) {
      this.isWinner = true;
      this.explodeWinner();
    }

    return true;
  }

  private animateNumberRoll(from: number, to: number): void {
    // Quick roll through intermediate numbers
    const steps = Math.abs(from - to);
    const stepDuration = Math.min(200 / Math.max(steps, 1), 80);

    for (let i = 0; i < steps; i++) {
      const value = from - (i + 1);
      this.scene.time.delayedCall(stepDuration * i, () => {
        if (this.counterText?.active) {
          this.counterText.setText(`${value}/${this.totalPlayers} ALIVE`);
        }
      });
    }

    // Final value
    this.scene.time.delayedCall(stepDuration * steps, () => {
      if (this.counterText?.active) {
        this.counterText.setText(`${to}/${this.totalPlayers} ALIVE`);
      }
    });
  }

  private pulseRed(): void {
    // Flash background red then back
    this.bgRect.setFillStyle(0x880000, 0.9);
    this.counterText.setColor('#ff4444');

    // Scale pulse
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Return to normal after 500ms
    this.scene.time.delayedCall(500, () => {
      if (!this.bgRect?.active) return;
      if (this.currentAlive === 2) {
        this.setAmberGlow();
      } else {
        this.bgRect.setFillStyle(0x000000, 0.6);
        this.counterText.setColor('#ffffff');
      }
    });
  }

  private setAmberGlow(): void {
    this.bgRect.setFillStyle(0x664400, 0.8);
    this.bgRect.setStrokeStyle(2, 0xffaa00);
    this.counterText.setColor('#ffcc00');
  }

  private explodeWinner(): void {
    // Replace text with WINNER!
    this.counterText.setText('WINNER!');
    this.counterText.setColor('#00ff00');
    this.bgRect.setFillStyle(0x003300, 0.9);
    this.bgRect.setStrokeStyle(2, 0x00ff00);

    // Scale up with bounce
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Settle back slightly
        this.scene.tweens.add({
          targets: this.container,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 300,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
