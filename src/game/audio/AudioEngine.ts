import type { GameEvent } from '../core';

interface ToneOptions {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  delay?: number;
  endFrequency?: number;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private lastMoveAt = 0;
  private voices = 0;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.master) this.master.gain.value = enabled ? 0.34 : 0;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async prime(): Promise<void> {
    if (!this.enabled || typeof AudioContext === 'undefined') return;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.34;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }

  suspend(): void {
    void this.context?.suspend();
  }

  play(events: readonly GameEvent[]): void {
    if (!this.enabled || !this.context || !this.master) return;
    for (const event of events) {
      if (event.type === 'piece-moved' && event.cause === 'move') {
        const now = performance.now();
        if (now - this.lastMoveAt > 28) {
          this.tone({ frequency: 178, endFrequency: 204, duration: 0.026, gain: 0.11, type: 'triangle' });
          this.lastMoveAt = now;
        }
      } else if (event.type === 'piece-rotated') {
        this.tone({ frequency: 310, endFrequency: 465, duration: 0.045, gain: 0.09, type: 'square' });
        this.tone({ frequency: 620, duration: 0.028, gain: 0.04, delay: 0.018, type: 'sine' });
      } else if (event.type === 'piece-held') {
        this.tone({ frequency: 420, endFrequency: 230, duration: 0.09, gain: 0.08, type: 'sine' });
        this.tone({ frequency: 240, endFrequency: 520, duration: 0.1, gain: 0.06, delay: 0.035, type: 'triangle' });
      } else if (event.type === 'hard-dropped') {
        this.tone({ frequency: 92, endFrequency: 46, duration: 0.11, gain: 0.2, type: 'triangle' });
      } else if (event.type === 'piece-locked') {
        this.tone({ frequency: 132, duration: 0.038, gain: 0.07, type: 'square' });
      } else if (event.type === 'lines-cleared') {
        this.clearChord(event.count);
      } else if (event.type === 'level-up') {
        [330, 495, 660].forEach((frequency, index) => this.tone({ frequency, duration: 0.11, gain: 0.055, delay: index * 0.055, type: 'sine' }));
      } else if (event.type === 'game-over') {
        this.tone({ frequency: 180, endFrequency: 48, duration: 0.62, gain: 0.13, type: 'sawtooth' });
      }
    }
  }

  destroy(): void {
    this.master?.disconnect();
    this.master = null;
    const context = this.context;
    this.context = null;
    if (context) void context.close();
    this.voices = 0;
  }

  private clearChord(count: number): void {
    const base = [0, 392, 440, 494, 587][count] ?? 392;
    const notes = count === 4 ? [1, 1.25, 1.5, 2] : [1, 1.25, 1.5];
    notes.forEach((ratio, index) => this.tone({
      frequency: base * ratio,
      duration: 0.12 + count * 0.025,
      gain: 0.045 + count * 0.012,
      delay: index * 0.022,
      type: index % 2 === 0 ? 'sine' : 'triangle',
    }));
  }

  private tone(options: ToneOptions): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || this.voices >= 16) return;
    const start = context.currentTime + (options.delay ?? 0);
    const end = start + options.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    this.voices += 1;
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, start);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, options.gain), start + Math.min(0.012, options.duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.voices = Math.max(0, this.voices - 1);
    };
  }
}
