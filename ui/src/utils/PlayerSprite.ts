import Phaser from 'phaser';
import type { Vector2D } from '../types';

export class PlayerSprite {
  private sprite: Phaser.GameObjects.Sprite;
  private playerLabel: Phaser.GameObjects.Text;
  private playerId: string;
  private spriteWidth: number;
  private spriteHeight: number;
  private eliminated = false;
  private currentAnim = '';

  constructor(
    scene: Phaser.Scene,
    playerId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    isLocalPlayer: boolean = false
  ) {
    this.playerId = playerId;
    this.spriteWidth = width;
    this.spriteHeight = height;

    // Create sprite with run1 as initial texture
    this.sprite = scene.add.sprite(x, y, 'player_run1');
    this.sprite.setOrigin(0, 1);
    this.sprite.setDisplaySize(width, height);
    this.sprite.setDepth(20);

    // Tint non-local players to distinguish them
    if (!isLocalPlayer) {
      this.sprite.setTint(0xff6600);
      this.sprite.setAlpha(0.8);
    }

    // Start run animation
    this.sprite.play('player_run');
    this.currentAnim = 'player_run';

    // Add label above player
    const labelText = isLocalPlayer ? 'YOU' : playerId.substring(0, 8);
    this.playerLabel = scene.add.text(x + width / 2, y - height + 10, labelText, {
      fontSize: '12px',
      color: isLocalPlayer ? '#00ff00' : '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    this.playerLabel.setOrigin(0.5);
    this.playerLabel.setDepth(25);
  }

  public updatePosition(position: Vector2D, velocity: Vector2D): void {
    this.sprite.x = position.x;
    this.sprite.y = position.y;

    // Update animation state (skip if eliminated)
    if (!this.eliminated) {
      const isAirborne = Math.abs(velocity.y) > 0.5;

      if (isAirborne && this.currentAnim !== 'jump') {
        this.sprite.stop();
        this.sprite.setTexture('player_jump');
        this.sprite.setDisplaySize(this.spriteWidth, this.spriteHeight);
        this.currentAnim = 'jump';
      } else if (!isAirborne && this.currentAnim !== 'player_run') {
        this.sprite.play('player_run');
        this.sprite.setDisplaySize(this.spriteWidth, this.spriteHeight);
        this.currentAnim = 'player_run';
      }
    }

    // Update label position
    this.playerLabel.x = this.sprite.x + this.spriteWidth / 2;
    this.playerLabel.y = this.sprite.y - this.spriteHeight + 10;
  }

  public eliminate(): void {
    this.eliminated = true;
    this.sprite.setTint(0xff0000);
    this.sprite.setAlpha(0.5);
    this.sprite.stop();
    this.sprite.setTexture('player_run1');
    this.sprite.setDisplaySize(this.spriteWidth, this.spriteHeight);
  }

  public wasEliminated(): boolean {
    return this.eliminated;
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  public destroy(): void {
    this.playerLabel.destroy();
    this.sprite.destroy();
  }
}
