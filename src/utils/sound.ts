class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  click() {
    this.playTone(620, 0.045, 'triangle', 0.035);
  }

  correct(streak = 1) {
    const boost = Math.min(streak - 1, 6) * 35;
    this.playTone(523.25 + boost, 0.14, 'sine', 0.075, 0);
    this.playTone(659.25 + boost, 0.18, 'sine', 0.08, 0.065);
    if (streak >= 3) {
      this.playTone(783.99 + boost, 0.24, 'triangle', 0.07, 0.13);
    }
  }

  wrong() {
    this.playTone(230, 0.14, 'sawtooth', 0.055, 0);
    this.playTone(175, 0.2, 'sawtooth', 0.05, 0.09);
  }

  flip() {
    this.playTone(440, 0.06, 'sine', 0.04, 0);
    this.playTone(580, 0.07, 'sine', 0.04, 0.035);
  }

  fanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.25, 'triangle', 0.08, idx * 0.085);
    });
  }
}

export const soundEngine = new SoundEngine();
