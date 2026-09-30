import { SoundscapeId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMusicPlaying: boolean = false;
  private sfxEnabled: boolean = true;
  private musicVolume: number = 0.38;
  private currentSoundscape: SoundscapeId = 'embun-pagi';
  private masterGain: GainNode | null = null;
  private musicIntervalId: number | null = null;
  private activeNodes: AudioNode[] = [];

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.musicVolume;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMusicPlaying ? this.musicVolume : 0,
        this.ctx.currentTime,
        0.15
      );
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public getSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public setSoundscape(id: SoundscapeId) {
    if (this.currentSoundscape === id) return;
    this.currentSoundscape = id;
    if (this.isMusicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  public getSoundscape(): SoundscapeId {
    return this.currentSoundscape;
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public startMusic() {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    this.stopMusicInternal();
    this.isMusicPlaying = true;
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.musicVolume, ctx.currentTime + 1.2);

    // Play immediate ambient chord/note and schedule generative loop
    this.triggerGenerativeCycle();
    const cycleMs = this.currentSoundscape === 'taman-bambu' ? 1800 : 4200;
    this.musicIntervalId = window.setInterval(() => {
      if (this.isMusicPlaying) {
        this.triggerGenerativeCycle();
      }
    }, cycleMs);
  }

  private stopMusicInternal() {
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // ignore already disconnected
      }
    });
    this.activeNodes = [];
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
    window.setTimeout(() => {
      if (!this.isMusicPlaying) {
        this.stopMusicInternal();
      }
    }, 350);
  }

  private triggerGenerativeCycle() {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain || !this.isMusicPlaying) return;

    const now = ctx.currentTime;

    if (this.currentSoundscape === 'embun-pagi') {
      // Warm Fmaj9 / Cmaj9 / Am9 / G6 soothing pads + gentle bell droplet
      const progressions = [
        [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
        [130.81, 196.0, 246.94, 293.66, 329.63], // Cmaj9
        [146.83, 220.0, 261.63, 329.63, 392.0], // Dm9
        [196.0, 246.94, 293.66, 329.63, 440.0], // G6/9
      ];
      const chord = progressions[Math.floor(Math.random() * progressions.length)];

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        const peakGain = 0.045 / Math.sqrt(idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 1.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 4.9);
      });

      // Occasional high soft bell droplet
      if (Math.random() > 0.25) {
        const bellNotes = [523.25, 587.33, 659.25, 783.99, 880.0];
        const note = bellNotes[Math.floor(Math.random() * bellNotes.length)];
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        const delayOffset = 0.4 + Math.random() * 1.6;

        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(note, now + delayOffset);

        bellGain.gain.setValueAtTime(0.0001, now + delayOffset);
        bellGain.gain.linearRampToValueAtTime(0.03, now + delayOffset + 0.08);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + delayOffset + 2.4);

        bellOsc.connect(bellGain);
        bellGain.connect(this.masterGain!);

        bellOsc.start(now + delayOffset);
        bellOsc.stop(now + delayOffset + 2.5);
      }
    } else if (this.currentSoundscape === 'taman-bambu') {
      // Pentatonic kalimba / bamboo marimba gentle plucks
      const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
      const numNotes = Math.random() > 0.4 ? 2 : 1;

      for (let i = 0; i < numNotes; i++) {
        const freq = scale[Math.floor(Math.random() * scale.length)];
        const start = now + i * (0.35 + Math.random() * 0.35);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.065, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(start);
        osc.stop(start + 2.2);
      }
    } else if (this.currentSoundscape === 'hening-malam') {
      // Deep 432Hz-inspired meditative warm harmonic drone
      const baseFreqs = [108.0, 162.0, 216.0, 324.0];
      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.4, now);

        const amp = 0.05 / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(amp, now + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.2);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 5.3);
      });
    }
  }

  public playTileSlide(multiCount: number = 1) {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    const baseFreq = 240 + Math.min(multiCount * 25, 100);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.065);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playTileCorrect() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.055); // E5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playHint() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [440, 554.37].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.06, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  public playVictory() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 493.88, 523.25, 659.25]; // Cmaj7 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.075;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.085, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.68);
    });
  }
}

export const soundEngine = new SoundEngine();
