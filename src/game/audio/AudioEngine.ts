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
  private compressor: DynamicsCompressorNode | null = null;
  private enabled = true;
  private volume = 1;
  private lastMoveAt = 0;
  private lastSoftDropAt = 0;
  private voices = 0;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.applyMasterGain();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 1));
    this.applyMasterGain();
  }

  getVolume(): number {
    return this.volume;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async prime(): Promise<void> {
    if (!this.enabled || typeof AudioContext === 'undefined') return;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 8;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.18;
      this.applyMasterGain();
      this.master.connect(this.compressor);
      this.compressor.connect(this.context.destination);
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
          this.tone({ frequency: 178, endFrequency: 204, duration: 0.03, gain: 0.16, type: 'triangle' });
          this.lastMoveAt = now;
        }
      } else if (event.type === 'piece-moved' && event.cause === 'soft-drop') {
        const now = performance.now();
        if (now - this.lastSoftDropAt > 52) {
          this.tone({ frequency: 248, endFrequency: 224, duration: 0.022, gain: 0.09, type: 'sine' });
          this.lastSoftDropAt = now;
        }
      } else if (event.type === 'piece-rotated') {
        this.tone({ frequency: 310, endFrequency: 465, duration: 0.055, gain: 0.22, type: 'square' });
        this.tone({ frequency: 620, duration: 0.035, gain: 0.11, delay: 0.018, type: 'sine' });
      } else if (event.type === 'hard-dropped') {
        this.tone({ frequency: 92, endFrequency: 46, duration: 0.12, gain: 0.38, type: 'triangle' });
      } else if (event.type === 'piece-locked') {
        this.tone({ frequency: 132, duration: 0.05, gain: 0.18, type: 'square' });
      } else if (event.type === 'lines-cleared') {
        this.clearChord(event.count);
      } else if (event.type === 'piece-expired') {
        this.tone({ frequency: 720, endFrequency: 340, duration: 0.18, gain: 0.28, type: 'sawtooth' });
        this.tone({ frequency: 460, endFrequency: 230, duration: 0.22, gain: 0.18, delay: 0.055, type: 'triangle' });
      } else if (event.type === 'bedrock-raised') {
        this.tone({ frequency: 108, endFrequency: 72, duration: 0.2, gain: 0.26, type: 'triangle' });
      } else if (event.type === 'bedrock-lowered') {
        this.tone({ frequency: 174, endFrequency: 246, duration: 0.15, gain: 0.22, type: 'sine' });
      } else if (event.type === 'level-up') {
        [330, 495, 660].forEach((frequency, index) => this.tone({ frequency, duration: 0.11, gain: 0.15, delay: index * 0.055, type: 'sine' }));
      } else if (event.type === 'finished') {
        [392, 494, 587].forEach((frequency, index) => this.tone({ frequency, duration: 0.16, gain: 0.15, delay: index * 0.06, type: 'sine' }));
      } else if (event.type === 'game-over') {
        this.tone({ frequency: 180, endFrequency: 48, duration: 0.62, gain: 0.32, type: 'sawtooth' });
      } else if (event.type === 'started' || event.type === 'resumed') {
        this.tone({ frequency: 392, endFrequency: 523, duration: 0.09, gain: 0.17, type: 'sine' });
      } else if (event.type === 'paused') {
        this.tone({ frequency: 270, endFrequency: 210, duration: 0.09, gain: 0.13, type: 'sine' });
      } else if (event.type === 'restarted') {
        this.tone({ frequency: 294, endFrequency: 392, duration: 0.07, gain: 0.15, type: 'sine' });
        this.tone({ frequency: 440, duration: 0.07, gain: 0.12, delay: 0.045, type: 'triangle' });
      }
    }
  }

  destroy(): void {
    this.master?.disconnect();
    this.master = null;
    this.compressor?.disconnect();
    this.compressor = null;
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
      gain: 0.13 + count * 0.02,
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
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, Math.min(0.38, options.gain)), start + Math.min(0.012, options.duration * 0.25));
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

  private applyMasterGain(): void {
    if (!this.master) return;
    const value = this.enabled ? this.volume : 0;
    if (this.context) this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.012);
    else this.master.gain.value = value;
  }
}
