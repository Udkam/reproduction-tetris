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

/** A short-lived foreground voice, including the occasional buffer-noise puff. */
interface EffectVoice {
  source: AudioScheduledSourceNode;
  gain: GainNode;
}

type MutationActivation = Extract<GameEvent, { type: 'mutation-activated' }>;

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
/** A five-decibel dip leaves the cue clear without making the musical bed disappear. */
const MUSIC_DUCK_RATIO = 0.562341325;
const MUSIC_DUCK_DURATION_MS = 350;
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
  private mutationVoices: EffectVoice[] = [];
  private musicTimer: PlatformTimeout = null;
  private musicDuckTimer: PlatformTimeout = null;
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
    const primaryMutation = this.primaryMutationEvent(events);
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
        // A material trigger is the player-facing resolution of this clear. Let it
        // speak on its own rather than stacking a clear chord into the same transient.
        if (!primaryMutation) this.clearChord(event.count);
      } else if (event.type === 'mutation-activated') {
        if (event === primaryMutation) this.mutationCue(event);
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
    this.stopMutationCue();
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

  private primaryMutationEvent(events: readonly GameEvent[]): MutationActivation | null {
    const activations = events.filter((event): event is MutationActivation => event.type === 'mutation-activated');
    if (!activations.length) return null;
    // Several carrier cells may resolve in one clear. Keep the feedback readable by
    // choosing one deterministic foreground signature, with direct board-changing
    // items taking priority over a passive multiplier.
    const priority: Record<MutationActivation['item'], number> = {
      multiplier: 1,
      freeze: 2,
      collapse: 3,
      bomb: 4,
    };
    return activations.reduce((primary, activation) => (
      priority[activation.item] >= priority[primary.item] ? activation : primary
    ));
  }

  private mutationCue(event: MutationActivation): void {
    // An effect belongs to the material that just fired. Do not leave an earlier cue
    // ringing beneath it: the visual rail also shows only the newest transient state.
    this.stopMutationCue();
    this.duckMusic();
    // Carrier geometry is immutable Core event data. It makes an unusually broad
    // activation slightly fuller without depending on renderer state or randomness.
    const carrierAccent = Math.min(1.1, 0.84 + Math.max(0, event.triggerCells?.length ?? 4) * 0.04);
    if (event.item === 'freeze') {
      // Two unbent ceramic taps: bright enough to read as ice, short enough to avoid
      // the electronic sweep character of the old rising tones.
      this.tone({ frequency: 659.25, duration: 0.11, gain: 0.17 * carrierAccent, type: 'triangle' }, true);
      this.tone({ frequency: 783.99, duration: 0.15, gain: 0.14 * carrierAccent, delay: 0.058, type: 'sine' }, true);
      return;
    }
    if (event.item === 'collapse') {
      // A short, dry two-part thud with no moving pitch reads as a column settling.
      this.tone({ frequency: 148, duration: 0.075, gain: 0.22 * carrierAccent, type: 'triangle' }, true);
      this.tone({ frequency: 93, duration: 0.1, gain: 0.13 * carrierAccent, delay: 0.018, type: 'triangle' }, true);
      return;
    }
    if (event.item === 'bomb') {
      // A rounded bass bloom plus a tiny deterministic noise puff, not a harsh buzzy
      // sweep. The noise buffer is generated locally and contains no sampled asset.
      this.tone({ frequency: 74, duration: 0.14, gain: 0.27 * carrierAccent, type: 'triangle' }, true);
      this.noisePuff({ duration: 0.065, gain: 0.095 * carrierAccent, delay: 0.006 });
      return;
    }
    // Double is a compact marimba dyad. Super Double adds one clean octave above it;
    // subsequent carriers remain Super Double in Core and keep this signature.
    this.mutationMarimbaStrike(523.25, 0.14 * carrierAccent, 0);
    this.mutationMarimbaStrike(659.25, 0.125 * carrierAccent, 0.052);
    if (event.multiplierFactor === 4) this.mutationMarimbaStrike(1046.5, 0.105 * carrierAccent, 0.104);
  }

  private mutationMarimbaStrike(frequency: number, gain: number, delay: number): void {
    this.tone({ frequency, duration: 0.145, gain, delay, type: 'triangle' }, true);
    this.tone({ frequency: frequency * PIANO_PARTIAL_RATIO, duration: 0.096, gain: gain * 0.22, delay, type: 'sine' }, true);
  }

  private tone(options: ToneOptions, belongsToMutationCue = false): void {
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
    const voice: EffectVoice = { source: oscillator, gain };
    if (belongsToMutationCue) this.mutationVoices.push(voice);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.voices = Math.max(0, this.voices - 1);
      if (belongsToMutationCue) this.mutationVoices = this.mutationVoices.filter((candidate) => candidate !== voice);
    };
  }

  private noisePuff(options: Pick<ToneOptions, 'duration' | 'gain' | 'delay'>): void {
    const context = this.context;
    const effects = this.effects;
    if (!context || !effects || this.voices >= 16) return;
    const start = context.currentTime + (options.delay ?? 0);
    const end = start + options.duration;
    const frames = Math.max(1, Math.round(context.sampleRate * options.duration));
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const samples = buffer.getChannelData(0);
    // A deterministic pseudo-noise texture keeps replay-independent presentation
    // while avoiding an external sample or a full-band electronic burst.
    for (let index = 0; index < samples.length; index += 1) {
      const seeded = Math.sin((index + 1) * 12.9898) * 43758.5453;
      samples[index] = (seeded - Math.floor(seeded)) * 2 - 1;
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, Math.min(VOICE_GAIN_CEILING, options.gain * VOICE_GAIN_BOOST)),
      start + Math.min(0.009, options.duration * 0.22),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(gain);
    gain.connect(effects);
    const voice: EffectVoice = { source, gain };
    this.mutationVoices.push(voice);
    this.voices += 1;
    source.start(start);
    source.stop(end + 0.01);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.voices = Math.max(0, this.voices - 1);
      this.mutationVoices = this.mutationVoices.filter((candidate) => candidate !== voice);
    };
  }

  private stopMutationCue(): void {
    for (const voice of [...this.mutationVoices]) {
      try {
        voice.source.stop();
      } catch {
        // A source may have reached its short scheduled end between event batches.
      }
      voice.source.disconnect();
      voice.gain.disconnect();
    }
    this.mutationVoices = [];
  }

  private duckMusic(): void {
    const context = this.context;
    const musicBus = this.musicBus;
    if (!context || !musicBus || !this.musicPlaybackActive || !this.musicEnabled) return;
    this.platform.cancelTimeout(this.musicDuckTimer);
    this.musicDuckTimer = null;
    musicBus.gain.setTargetAtTime(MUSIC_BUS_GAIN * MUSIC_DUCK_RATIO, context.currentTime, 0.012);
    const restore = () => {
      this.musicDuckTimer = null;
      if (!this.context || !this.musicBus || !this.musicPlaybackActive || !this.musicEnabled) return;
      this.musicBus.gain.setTargetAtTime(MUSIC_BUS_GAIN, this.context.currentTime, 0.07);
    };
    const timer = this.platform.scheduleTimeout(restore, MUSIC_DUCK_DURATION_MS);
    if (timer === null) {
      // Capability-limited hosts can still schedule a bounded restore on the Web Audio
      // timeline without retaining a JS callback.
      musicBus.gain.setTargetAtTime(MUSIC_BUS_GAIN, context.currentTime + MUSIC_DUCK_DURATION_MS / 1000, 0.07);
    } else {
      this.musicDuckTimer = timer;
    }
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
    this.platform.cancelTimeout(this.musicDuckTimer);
    this.musicDuckTimer = null;
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
