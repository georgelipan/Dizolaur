/**
 * F12 — Enhanced Results Screen (Vegas Casino Neon Style)
 * - Uses HTML/CSS overlay matching WaitingScene style
 * - Rankings with survival times
 * - Animated winnings count-up
 * - Personal best comparison (localStorage)
 * - Near-miss count & stats
 * - Buttons: PLAY AGAIN (prominent), CHANGE BET, LOBBY
 * - Auto-return to lobby after 15s without interaction
 */

import Phaser from 'phaser';
import type { GameSession } from '../services/GameSession';
import type { MatchResult } from '../types';
import { AudioManager } from '../services/AudioManager';
import { ResultsOverlay } from '../ui/ResultsOverlay';

interface GameStats {
  survivalTime: number;
  obstaclesCleared: number;
  nearMissCount: number;
}

const PERSONAL_BEST_KEY = 'dizolaur_personal_best';

export class ResultsScene extends Phaser.Scene {
  private gameSession!: GameSession;
  private result!: MatchResult;
  private stats: GameStats | null = null;
  private audioManager!: AudioManager;
  private overlay!: ResultsOverlay;
  private autoReturnSeconds = 15;
  private autoReturnTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'ResultsScene' });
  }

  init(data: { result: MatchResult; stats?: GameStats }) {
    this.result = data.result;
    this.stats = data.stats || null;
    this.gameSession = this.registry.get('gameSession');
  }

  create() {
    this.autoReturnSeconds = 15;

    // Dark background
    this.cameras.main.setBackgroundColor('#0a0015');

    // Validate result data
    if (!this.result || !Array.isArray(this.result.players)) {
      console.error('Invalid result data');
      this.returnToLobby();
      return;
    }

    const myPlayerId = this.gameSession.getPlayerId();
    const myResult = this.result.players.find(p => p.playerId === myPlayerId);
    const isWinner = myResult?.playerId === this.result.winnerId;
    const currency = this.gameSession.getCurrency();

    // Personal best
    const currentScore = myResult ? Math.round(myResult.score) : 0;
    const prevBest = this.getPersonalBest();
    const isNewBest = currentScore > prevBest;
    if (isNewBest) {
      this.setPersonalBest(currentScore);
    }

    // Victory/defeat sound
    this.audioManager = new AudioManager();
    this.audioManager.resume();

    // Get sound duration for count-up animation sync
    let countUpDuration = 1200; // default
    if (isWinner) {
      // Play jackpot sounds (coins + jingle) and get duration
      countUpDuration = this.audioManager.playJackpotWin();
    } else {
      this.audioManager.playDefeat();
    }

    // Create overlay
    this.overlay = new ResultsOverlay();
    this.overlay.show({
      isWinner,
      winnings: myResult?.winnings || 0,
      currency,
      players: this.result.players.map(p => ({
        playerId: p.playerId,
        ranking: p.ranking,
        score: p.score,
        winnings: p.winnings || 0,
      })),
      myPlayerId,
      survivalTime: this.stats?.survivalTime,
      obstaclesCleared: this.stats?.obstaclesCleared,
      nearMissCount: this.stats?.nearMissCount,
      personalBest: prevBest > 0 || isNewBest ? (isNewBest ? currentScore : prevBest) : undefined,
      isNewBest,
      countUpDuration, // Sync animation with sound duration
    });

    // Wire button callbacks
    this.overlay.onPlayAgain(() => {
      this.playAgain();
    });

    this.overlay.onChangeBet(() => {
      this.returnToLobby();
    });

    this.overlay.onLobby(() => {
      this.returnToLobby();
    });

    this.overlay.onInteraction(() => {
      this.resetAutoReturn();
    });

    // Auto-return timer
    this.autoReturnTimer = this.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        this.autoReturnSeconds--;
        this.overlay.updateAutoReturn(this.autoReturnSeconds);
        if (this.autoReturnSeconds <= 0) {
          this.returnToLobby();
        }
      },
    });

    this.events.once('shutdown', this.shutdown, this);
  }

  private getPersonalBest(): number {
    try {
      const stored = localStorage.getItem(PERSONAL_BEST_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private setPersonalBest(score: number): void {
    try {
      localStorage.setItem(PERSONAL_BEST_KEY, String(score));
    } catch {
      // localStorage may be unavailable
    }
  }

  private resetAutoReturn(): void {
    this.autoReturnSeconds = 15;
    this.overlay.updateAutoReturn(15);
  }

  private playAgain(): void {
    this.overlay.hide();
    this.gameSession.reset();
    this.scene.start('BootScene');
  }

  private returnToLobby(): void {
    this.overlay.hide();
    this.gameSession.reset();
    this.scene.start('BootScene');
  }

  shutdown() {
    if (this.autoReturnTimer) {
      this.autoReturnTimer.destroy();
    }
    this.overlay.destroy();
  }
}
