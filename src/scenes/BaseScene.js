/**
 * BaseScene - Shared functionality for all game scenes
 * Provides common UI elements like mute button and standardized depth values
 */

// Depth constants for consistent layering across all scenes
export const DEPTH = {
    BACKGROUND: 0,
    GAME_ELEMENTS: 1,
    BLOCKING_OVERLAY: 900,
    MODAL_BACKGROUND: 1000,
    MODAL_CONTENT: 1001,
    MODAL_BUTTONS: 1002,
    MUTE_BUTTON: 2000,
    MUTE_ICON: 2001
};

export class BaseScene extends Phaser.Scene {
    /**
     * Creates a mute button in the top-right corner
     * Persists mute state in localStorage across all scenes
     */
    createMuteButton() {
        // Get mute state from localStorage
        const isMuted = localStorage.getItem('gameMuted') === 'true';
        
        // Create button background
        const muteBg = this.add.rectangle(1230, 30, 50, 50, 0x1a1a2e, 0.8)
            .setStrokeStyle(2, 0xffd700)
            .setInteractive({ useHandCursor: true })
            .setDepth(DEPTH.MUTE_BUTTON);
        
        // Create icon text
        const muteIcon = this.add.text(1230, 30, isMuted ? '🔇' : '🔊', {
            fontSize: '28px'
        }).setOrigin(0.5).setDepth(DEPTH.MUTE_ICON);
        
        // Apply current mute state
        if (isMuted) {
            this.sound.mute = true;
        }
        
        // Toggle mute on click
        muteBg.on('pointerdown', () => {
            this.sound.mute = !this.sound.mute;
            localStorage.setItem('gameMuted', this.sound.mute.toString());
            muteIcon.setText(this.sound.mute ? '🔇' : '🔊');
        });
        
        // Hover effects
        muteBg.on('pointerover', () => {
            muteBg.setScale(1.1);
            muteBg.setFillStyle(0x2a2a4e, 0.9);
        });
        
        muteBg.on('pointerout', () => {
            muteBg.setScale(1);
            muteBg.setFillStyle(0x1a1a2e, 0.8);
        });
    }
}
