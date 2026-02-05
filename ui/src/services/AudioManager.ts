/**
 * F08 — Sound Design
 * Centralized audio manager using Web Audio API for synthesized sounds.
 * Handles sound effects, background music with phase-synced tempo, and mute toggle.
 */

const STORAGE_KEY = 'dizolaur_muted';

// BPM per phase (interpolated gradually between phases)
const PHASE_BPM: readonly number[] = [120, 130, 145, 160, 175];

// Pentatonic scale frequencies for musical sounds
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5 D5 E5 G5 A5

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted: boolean;

  // Background music state
  private musicPlaying = false;
  private currentBPM = 120;
  private targetBPM = 120;
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private beatIndex = 0;

  // Sound priority: prevent chaotic overlap
  private lastSfxTime = 0;
  private readonly MIN_SFX_GAP = 50; // ms between sounds

  constructor() {
    this.muted = localStorage.getItem(STORAGE_KEY) === 'true';
  }

  /** Initialize AudioContext (must be called after user gesture) */
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.3;
      this.sfxGain.connect(this.masterGain);

      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Resume context if suspended (browsers require user gesture) */
  resume(): void {
    const ctx = this.ensureContext();
    if (ctx?.state === 'suspended') {
      ctx.resume();
    }
  }

  // ─── Mute Toggle ─────────────────────────────────────────

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem(STORAGE_KEY, String(this.muted));
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  // ─── Sound Effects ───────────────────────────────────────

  /** Jump: short "boing" with pitch variation */
  playJump(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    if (!this.throttle()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 400 + Math.random() * 100; // pitch variation
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Duck: low "swoosh" */
  playDuck(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    if (!this.throttle()) return;

    const now = ctx.currentTime;
    // Noise-like swoosh using filtered oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Obstacle cleared: subtle pentatonic "ding" */
  playObstacleCleared(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    if (!this.throttle()) return;

    const now = ctx.currentTime;
    const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Near-miss close: quick "whoosh" */
  playNearMissClose(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Near-miss pixel perfect: dramatic whoosh + sparkle + gasp */
  playNearMissPixelPerfect(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    // Dramatic whoosh
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(150, now + 0.4);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Sparkle (high pitched shimmer)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2000, now + 0.1);
    osc2.frequency.setValueAtTime(2400, now + 0.2);
    osc2.frequency.setValueAtTime(2800, now + 0.3);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);

    // "Gasp" — noise burst through bandpass
    this.playNoiseBurst(now + 0.05, 0.15, 800, 0.15);
  }

  /** Score multiplier: ascending chime */
  playMultiplier(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    // Three ascending tones
    const freqs = [523.25, 659.25, 880.0]; // C5 E5 A5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.12;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  /** Other player eliminated: deep impact + dramatic sting */
  playOtherEliminated(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    // Deep impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);

    // Dramatic sting (minor chord)
    [220, 261.63, 329.63].forEach((freq) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, now + 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(now + 0.1);
      o.stop(now + 0.6);
    });
  }

  /** Own elimination: crash + descending tone */
  playOwnElimination(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    // Crash noise burst
    this.playNoiseBurst(now, 0.3, 2000, 0.4);

    // Descending tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);
    gain.gain.setValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now + 0.1);
    osc.stop(now + 0.8);
  }

  /** Victory: fanfare + cheer-like noise */
  playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    // Fanfare — ascending major chord arpeggiated
    const fanfare = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    fanfare.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.2;
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.setValueAtTime(0.2, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.8);
    });

    // Sustained chord at the end
    const chordStart = now + 0.8;
    [523.25, 659.25, 783.99].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, chordStart);
      gain.gain.exponentialRampToValueAtTime(0.01, chordStart + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(chordStart);
      osc.stop(chordStart + 1.2);
    });

    // Crowd cheer (filtered noise)
    this.playNoiseBurst(now + 0.3, 1.5, 3000, 0.12);
  }

  /** Defeat sound: low rumble + sad descending tone */
  playDefeat(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    // Low rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.8);

    // Sad descending minor thirds
    const notes = [440, 349.23, 293.66]; // A4 F4 D4
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = now + 0.2 + i * 0.3;
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(t);
      o.stop(t + 0.4);
    });
  }

  // ─── Background Music ────────────────────────────────────

  /** Start background music. Call once when game starts. */
  startMusic(): void {
    if (this.musicPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.musicPlaying = true;
    this.currentBPM = PHASE_BPM[0];
    this.targetBPM = PHASE_BPM[0];
    this.nextNoteTime = ctx.currentTime;
    this.beatIndex = 0;
    this.scheduleMusicLoop();
  }

  /** Stop background music */
  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /** Update music tempo based on current phase (called every frame) */
  updateTempo(phase: number): void {
    const idx = Math.max(0, Math.min(4, phase - 1));
    this.targetBPM = PHASE_BPM[idx];
  }

  private scheduleMusicLoop(): void {
    if (!this.musicPlaying || !this.ctx || !this.musicGain) return;

    const ctx = this.ctx;

    // Gradually interpolate BPM (smooth, not stepped)
    const bpmDiff = this.targetBPM - this.currentBPM;
    if (Math.abs(bpmDiff) > 0.5) {
      this.currentBPM += bpmDiff * 0.02; // converge ~2% per beat
    }

    const beatDuration = 60 / this.currentBPM;

    // Schedule notes ahead of time for precision
    while (this.nextNoteTime < ctx.currentTime + 0.1) {
      this.playMusicNote(this.nextNoteTime, this.beatIndex);
      this.nextNoteTime += beatDuration;
      this.beatIndex = (this.beatIndex + 1) % 16;
    }

    // Check again in 25ms
    this.musicTimer = window.setTimeout(() => this.scheduleMusicLoop(), 25);
  }

  private playMusicNote(time: number, beat: number): void {
    const ctx = this.ctx!;
    const dest = this.musicGain!;

    // Simple electronic pattern: kick on 0,4,8,12 — hi-hat on even — bass on 0,8
    const isKick = beat % 4 === 0;
    const isHiHat = beat % 2 === 0;
    const isBass = beat % 8 === 0;
    const isMelody = beat % 4 === 2;

    if (isKick) {
      // Kick: sine sweep down
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
      gain.gain.setValueAtTime(0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.15);
    }

    if (isHiHat) {
      // Hi-hat: short noise burst
      const bufferSize = ctx.sampleRate * 0.03;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      src.start(time);
    }

    if (isBass) {
      // Bass note
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 65.41; // C2
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.2);
    }

    if (isMelody) {
      // Melody: random pentatonic note
      const freq = PENTATONIC[beat % PENTATONIC.length] * 0.5; // one octave lower
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.12);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────

  /** Noise burst through bandpass filter (used for whoosh/crash/cheer) */
  private playNoiseBurst(
    time: number,
    duration: number,
    filterFreq: number,
    volume: number,
  ): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(time);
  }

  /** Throttle SFX to prevent chaotic overlap */
  private throttle(): boolean {
    const now = performance.now();
    if (now - this.lastSfxTime < this.MIN_SFX_GAP) return false;
    this.lastSfxTime = now;
    return true;
  }

  /** Clean up all audio resources */
  destroy(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
  }
}