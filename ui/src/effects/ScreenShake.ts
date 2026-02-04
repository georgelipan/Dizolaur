import Phaser from 'phaser';

/**
 * Camera shake effects.
 * - Elimination: 4px amplitude, 300ms
 * - Pixel perfect near-miss: 2px, 150ms
 * Never during normal gameplay.
 */
export class ScreenShake {
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(camera: Phaser.Cameras.Scene2D.Camera) {
    this.camera = camera;
  }

  public onElimination(): void {
    this.camera.shake(300, 0.005);
  }

  public onPixelPerfect(): void {
    this.camera.shake(150, 0.0025);
  }
}
