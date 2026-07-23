import type { GameEvent } from '../core';
import { browserPlatform, type BrowserPlatform, type PlatformTimeout } from '../../platform/browserPlatform';

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

interface MusicNote {
  at: number;
  frequency: number;
  duration: number;
  gain: number;
}

/** Full-volume mix gain is deliberately above unity, then safely contained by the compressor. */
const FULL_VOLUME_MASTER_GAIN = 1.7;
const VOICE_GAIN_CEILING = 0.5;
const VOICE_GAIN_BOOST = 1.3;
const MUSIC_BUS_GAIN = 0.28;
const MUSIC_LOOP_SECONDS = 7.2;
const PIANO_PARTIAL_RATIO = 2.01;
const PIANO_PARTIAL_MIX = 0.18;
const PIANO_NOTE_FLOOR = 0.0001;
/** An original D-major figure: low pedal tones, a small rising answer, then a soft return. */
const PIANO_PHRASE: readonly MusicNote[] = [
  { at: 0, frequency: 146.83, duration: 0.92, gain: 0.23 },
  { at: 0, frequency: 293.66, duration: 0.68, gain: 0.17 },
  { at: 0.56, frequency: 369.99, duration: 0.54, gain: 0.16 },
  { at: 1.08, frequency: 440, duration: 0.62, gain: 0.18 },
  { at: 1.62, frequency: 329.63, duration: 0.58, gain: 0.15 },
  { at: 2.14, frequency: 220, duration: 0.8, gain: 0.19 },
  { at: 2.14, frequency: 293.66, duration: 0.58, gain: 0.15 },
  { at: 2.68, frequency: 369.99, duration: 0.54, gain: 0.16 },
  { at: 3.2, frequency: 493.88, duration: 0.62, gain: 0.18 },
  { at: 3.74, frequency: 440, duration: 0.58, gain: 0.16 },
  { at: 4.28, frequency: 196, duration: 0.88, gain: 0.21 },
  { at: 4.28, frequency: 392, duration: 0.62, gain: 0.17 },
  { at: 4.82, frequency: 493.88, duration: 0.54, gain: 0.16 },
  { at: 5.36, frequency: 440, duration: 0.58, gain: 0.17 },
  { at: 5.9, frequency: 369.99, duration: 0.54, gain: 0.15 },
  { at: 6.42, frequency: 220, duration: 0.74, gain: 0.19 },
  { at: 6.42, frequency: 293.66, duration: 0.66, gain: 0.16 },
];

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
  private musicTimer: PlatformTimeout = null;
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
      } else if (event.type === 'mutation-activated') {
        this.mutationCue(event.item);
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
    // Two brief triangle transients read as a dry material impact. Keeping both voices
    // non-sinusoidal avoids the sustained electrical-hum character of the former pair.
    this.tone({ frequency: 174, duration: 0.064, gain: 0.34, endFrequency: 118, type: 'triangle' });
    this.tone({ frequency: 286, duration: 0.024, gain: 0.11, delay: 0.006, endFrequency: 218, type: 'triangle' });
  }

  private mutationCue(item: Extract<GameEvent, { type: 'mutation-activated' }>['item']): void {
    if (item === 'freeze') {
      this.tone({ frequency: 523, duration: 0.11, gain: 0.19, endFrequency: 392, type: 'sine' });
      this.tone({ frequency: 659, duration: 0.13, gain: 0.14, delay: 0.035, endFrequency: 523, type: 'triangle' });
      return;
    }
    if (item === 'collapse') {
      this.tone({ frequency: 246, duration: 0.1, gain: 0.2, endFrequency: 164, type: 'triangle' });
      this.tone({ frequency: 329, duration: 0.08, gain: 0.13, delay: 0.03, endFrequency: 220, type: 'triangle' });
      return;
    }
    if (item === 'bomb') {
      this.tone({ frequency: 116, duration: 0.085, gain: 0.28, endFrequency: 74, type: 'triangle' });
      this.tone({ frequency: 174, duration: 0.04, gain: 0.13, delay: 0.01, endFrequency: 110, type: 'triangle' });
      return;
    }
    this.tone({ frequency: 392, duration: 0.1, gain: 0.18, endFrequency: 587, type: 'sine' });
    this.tone({ frequency: 494, duration: 0.12, gain: 0.16, delay: 0.03, endFrequency: 740, type: 'triangle' });
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
    if (!this.musicEnabled || !this.musicPlaybackActive || !context || !musicBus || this.musicTimer !== null) return;

    const now = context.currentTime;
    musicBus.gain.setTargetAtTime(MUSIC_BUS_GAIN, now, 0.12);
    this.scheduleMusicPhrase();
  }

  private stopMusic(): void {
    const context = this.context;
    if (context && this.musicBus) this.musicBus.gain.setTargetAtTime(0, context.currentTime, 0.025);
    this.platform.cancelTimeout(this.musicTimer);
    this.musicTimer = null;
    for (const voice of [...this.musicVoices]) {
      voice.oscillator.stop();
      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }
    this.musicVoices = [];
  }

  private scheduleMusicPhrase(): void {
    const context = this.context;
    if (!this.musicEnabled || !this.musicPlaybackActive || !context || !this.musicBus) return;
    const phraseStart = context.currentTime + 0.035;
    for (const note of PIANO_PHRASE) this.playPianoNote(note, phraseStart);
    this.musicTimer = this.platform.scheduleTimeout(() => {
      this.musicTimer = null;
      this.scheduleMusicPhrase();
    }, MUSIC_LOOP_SECONDS * 1000);
  }

  private playPianoNote(note: MusicNote, phraseStart: number): void {
    const context = this.context;
    const musicBus = this.musicBus;
    if (!context || !musicBus) return;
    const start = phraseStart + note.at;
    const end = start + note.duration;
    const createVoice = (frequency: number, peak: number, type: OscillatorType, duration: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const voiceEnd = start + duration;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(PIANO_NOTE_FLOOR, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(Math.max(PIANO_NOTE_FLOOR, peak * 0.22), start + Math.min(0.18, duration * 0.36));
      gain.gain.exponentialRampToValueAtTime(PIANO_NOTE_FLOOR, voiceEnd);
      oscillator.connect(gain);
      gain.connect(musicBus);
      oscillator.start(start);
      const voice: MusicVoice = { oscillator, gain };
      this.musicVoices.push(voice);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        this.musicVoices = this.musicVoices.filter((current) => current !== voice);
      };
      oscillator.stop(voiceEnd + 0.02);
    };
    createVoice(note.frequency, note.gain, 'triangle', note.duration);
    createVoice(note.frequency * PIANO_PARTIAL_RATIO, note.gain * PIANO_PARTIAL_MIX, 'sine', note.duration * 0.72);
  }
}
