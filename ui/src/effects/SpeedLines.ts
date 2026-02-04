import Phaser from 'phaser';

/**
 * Speed lines effect — diagonal white/gray lines in the background.
 * Appears from Phase 3 (speed > 300px/s).
 * Density: lineCount = floor((speed - 300) / 20), max 11.
 */
export class SpeedLines {
  private lines: Phaser.GameObjects.Line[] = [];
  private scene: Phaser.Scene;
  private worldWidth: number;
  private worldHeight: number;

  constructor(scene: Phaser.Scene, worldWidth: number, worldHeight: number) {
    this.scene = scene;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  public update(speed: number): void {
    const targetCount = speed > 300
      ? Math.min(11, Math.floor((speed - 300) / 20))
      : 0;

    // Remove excess lines
    while (this.lines.length > targetCount) {
      const line = this.lines.pop()!;
      line.destroy();
    }

    // Add missing lines
    while (this.lines.length < targetCount) {
      const line = this.scene.add.line(
        0, 0, 0, 0, 0, 0, 0xffffff, 0.15 + Math.random() * 0.15
      );
      line.setLineWidth(1);
      line.setDepth(1);
      this.lines.push(line);
    }

    // Animate existing lines
    const intensity = Math.min(1, (speed - 300) / 220); // 0..1
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      // Each line scrolls diagonally from right to left
      const baseX = ((Date.now() * 0.3 + i * 137) % (this.worldWidth + 200)) - 100;
      const y1 = (i * 67) % this.worldHeight;
      const length = 40 + intensity * 80;

      line.setTo(baseX, y1, baseX - length * 0.7, y1 + length);
      line.setAlpha(0.1 + intensity * 0.2);
    }
  }

  public destroy(): void {
    for (const line of this.lines) {
      line.destroy();
    }
    this.lines.length = 0;
  }
}
