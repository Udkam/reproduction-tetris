import type { GameEvent } from '../core';
import { browserPlatform, type BrowserPlatform } from '../../platform/browserPlatform';

interface ToneOptions {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  delay?: number;
  endFrequency?: number;
}

interface MusicVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
}

/** Full-volume mix gain is deliberately above unity, then safely contained by the compressor. */
const FULL_VOLUME_MASTER_GAIN = 1.55;
const VOICE_GAIN_CEILING = 0.5;
const VOICE_GAIN_BOOST = 1.3;
const MUSIC_BUS_GAIN = 0.055;

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private enabled = true;
  private musicEnabled = true;
  private musicPlaybackActive = false;
  private musicVoices: MusicVoice[] = [];
  private musicLfo: OscillatorNode | null = null;
  private musicLfoGain: GainNode | null = null;
  private volume = 1;
  private lastMoveAt = 0;
  private lastSoftDropAt = 0;
  private voices = 0;

  constructor(private readonly platform: BrowserPlatform = browserPlatform) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.applyEffectsGain();
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
    else if (this.musicPlaybackActive) this.startMusic();
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

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  async prime(): Promise<void> {
    if (!this.enabled && !this.musicEnabled) return;
    if (!this.context) {
      const context = this.platform.createAudioContext();
      if (!context) return;
      this.context = context;
      this.master = this.context.createGain();
      this.effects = this.context.createGain();
      this.musicBus = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      // Let individual sine transients stay present at 100%, then catch only
      // genuinely dense overlaps. The earlier hard compression made every cue
      // quiet and flattened into a buzzy landing tone.
      this.compressor.threshold.value = -6;
      this.compressor.knee.value = 8;
      this.compressor.ratio.value = 3.5;
      this.compressor.attack.value = 0.004;
      this.compressor.release.value = 0.14;
      this.applyMasterGain();
      this.applyEffectsGain();
      this.musicBus.gain.setValueAtTime(0, this.context.currentTime);
      this.effects.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(this.compressor);
      this.compressor.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    if (this.musicPlaybackActive) this.startMusic();
  }

  suspend(): void {
    this.stopMusic();
    void this.context?.suspend();
  }

  play(events: readonly GameEvent[]): void {
    const stopMusic = events.some((event) => (
      event.type === 'paused'
      || event.type === 'restarted'
      || event.type === 'finished'
      || event.type === 'game-over'
    ));
    const startMusic = events.some((event) => event.type === 'started' || event.type === 'resumed');
    if (stopMusic) {
      this.musicPlaybackActive = false;
      this.stopMusic();
    } else if (startMusic) {
      this.musicPlaybackActive = true;
      this.startMusic();
    }

    if (!this.context || !this.master) return;
    if (!this.enabled) return;
    const includesHardDrop = events.some((event) => event.type === 'hard-dropped');
    for (const event of events) {
      if (event.type === 'piece-moved' && event.cause === 'move') {
        const now = this.platform.now();
        if (now - this.lastMoveAt > 28) {
          this.tone({ frequency: 244, duration: 0.028, gain: 0.14, endFrequency: 258, type: 'triangle' });
          this.lastMoveAt = now;
        }
      } else if (event.type === 'piece-moved' && event.cause === 'soft-drop') {
        const now = this.platform.now();
        if (now - this.lastSoftDropAt > 52) {
          this.tone({ frequency: 184, duration: 0.032, gain: 0.13, endFrequency: 170, type: 'triangle' });
          this.lastSoftDropAt = now;
        }
      } else if (event.type === 'piece-rotated') {
        this.tone({ frequency: 392, duration: 0.052, gain: 0.21, endFrequency: 466, type: 'triangle' });
        this.tone({ frequency: 587, duration: 0.04, gain: 0.14, delay: 0.018, endFrequency: 660, type: 'sine' });
      } else if (event.type === 'hard-dropped') {
        this.landingThump();
      } else if (event.type === 'piece-locked' && !includesHardDrop) {
        this.tone({ frequency: 154, duration: 0.075, gain: 0.24, endFrequency: 116, type: 'triangle' });
      } else if (event.type === 'lines-cleared') {
        this.clearChord(event.count);
      } else if (event.type === 'bedrock-raised') {
        this.tone({ frequency: 92, duration: 0.17, gain: 0.23, endFrequency: 78, type: 'sine' });
      } else if (event.type === 'bedrock-lowered') {
        this.tone({ frequency: 220, duration: 0.12, gain: 0.2, endFrequency: 278, type: 'sine' });
      } else if (event.type === 'level-up') {
        [330, 495, 660].forEach((frequency, index) => this.tone({ frequency, duration: 0.13, gain: 0.18, delay: index * 0.055, type: 'sine' }));
      } else if (event.type === 'finished') {
        [392, 494, 587].forEach((frequency, index) => this.tone({ frequency, duration: 0.18, gain: 0.19, delay: index * 0.06, type: 'sine' }));
      } else if (event.type === 'game-over') {
        [174, 131, 98].forEach((frequency, index) => this.tone({ frequency, duration: 0.17, gain: 0.19, delay: index * 0.12, type: 'sine' }));
      } else if (event.type === 'started' || event.type === 'resumed') {
        this.tone({ frequency: 440, duration: 0.09, gain: 0.17, endFrequency: 554, type: 'sine' });
      } else if (event.type === 'paused') {
        this.tone({ frequency: 262, duration: 0.09, gain: 0.14, endFrequency: 218, type: 'sine' });
      } else if (event.type === 'restarted') {
        this.tone({ frequency: 294, duration: 0.08, gain: 0.16, endFrequency: 330, type: 'sine' });
        this.tone({ frequency: 440, duration: 0.08, gain: 0.14, delay: 0.045, endFrequency: 494, type: 'sine' });
      }
    }
  }

  destroy(): void {
    this.musicPlaybackActive = false;
    this.stopMusic();
    this.effects?.disconnect();
    this.effects = null;
    this.musicBus?.disconnect();
    this.musicBus = null;
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
      gain: 0.16 + count * 0.022,
      delay: index * 0.022,
      type: 'sine',
    }));
  }

  private landingThump(): void {
    // A short triangle impact plus a brief upper knock avoids the sustained electrical
    // hum of the prior low sine pair while staying clear beneath a line-clear chord.
    this.tone({ frequency: 168, duration: 0.072, gain: 0.36, endFrequency: 124, type: 'triangle' });
    this.tone({ frequency: 252, duration: 0.028, gain: 0.12, delay: 0.004, endFrequency: 206, type: 'sine' });
  }

  private tone(options: ToneOptions): void {
    const context = this.context;
    const effects = this.effects;
    if (!context || !effects || this.voices >= 16) return;
    const start = context.currentTime + (options.delay ?? 0);
    const end = start + options.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    this.voices += 1;
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, start);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, Math.min(VOICE_GAIN_CEILING, options.gain * VOICE_GAIN_BOOST)),
      start + Math.min(0.012, options.duration * 0.25),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(effects);
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
    const value = this.volume * FULL_VOLUME_MASTER_GAIN;
    if (this.context) this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.012);
    else this.master.gain.value = value;
  }

  private applyEffectsGain(): void {
    if (!this.effects) return;
    const value = this.enabled ? 1 : 0;
    if (this.context) this.effects.gain.setTargetAtTime(value, this.context.currentTime, 0.008);
    else this.effects.gain.value = value;
  }

  private startMusic(): void {
    const context = this.context;
    const musicBus = this.musicBus;
    if (!this.musicEnabled || !this.musicPlaybackActive || !context || !musicBus || this.musicVoices.length > 0) return;

    const now = context.currentTime;
    musicBus.gain.setTargetAtTime(MUSIC_BUS_GAIN, now, 0.12);
    for (const voice of [
      { frequency: 110, gain: 0.58, type: 'sine' as OscillatorType },
      { frequency: 164.81, gain: 0.17, type: 'triangle' as OscillatorType },
    ]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(voice.frequency, now);
      gain.gain.setValueAtTime(voice.gain, now);
      oscillator.connect(gain);
      gain.connect(musicBus);
      oscillator.start(now);
      this.musicVoices.push({ oscillator, gain });
    }
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.11, now);
    lfoGain.gain.setValueAtTime(0.012, now);
    lfo.connect(lfoGain);
    lfoGain.connect(musicBus.gain);
    lfo.start(now);
    this.musicLfo = lfo;
    this.musicLfoGain = lfoGain;
  }

  private stopMusic(): void {
    const context = this.context;
    if (context && this.musicBus) this.musicBus.gain.setTargetAtTime(0, context.currentTime, 0.025);
    for (const voice of this.musicVoices) {
      voice.oscillator.stop();
      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }
    this.musicVoices = [];
    this.musicLfo?.stop();
    this.musicLfo?.disconnect();
    this.musicLfoGain?.disconnect();
    this.musicLfo = null;
    this.musicLfoGain = null;
  }
}
