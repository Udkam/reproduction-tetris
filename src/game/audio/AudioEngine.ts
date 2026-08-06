import type { GameEvent, GameState, MutationItem } from '../core';
import { browserPlatform, type BrowserPlatform } from '../../platform/browserPlatform';
import { MUTATION_VFX_TOKENS } from '../../design/mutationTokens';
import type { VisualThemeId } from '../../design/visualThemes';

interface ToneOptions {
  frequency: number;
  duration: number;
  gain: number;
  bus?: AudioBus;
  type?: OscillatorType;
  delay?: number;
  endFrequency?: number;
  attack?: number;
  /** Fraction of the voice duration used for a short audible body before release. */
  body?: number;
  /** Gain retained at the end of the body segment, relative to the peak. */
  bodyGain?: number;
}

type AudioBus = 'gameplay' | 'reward' | 'mutation' | 'ambient' | 'ui';

interface TextureOptions {
  duration: number;
  gain: number;
  delay?: number;
  cutoff?: number;
  filterType?: BiquadFilterType;
}

interface LayeredCueOptions {
  bus: AudioBus;
  body: ToneOptions;
  harmonic?: ToneOptions;
  texture?: TextureOptions;
  tail?: ToneOptions;
  mutationOwned?: boolean;
}

/** A short-lived foreground voice, including the occasional buffer-noise puff. */
interface EffectVoice {
  source: AudioScheduledSourceNode;
  gain: GainNode;
}

interface AmbientVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

interface AmbientToneProfile {
  frequency: number;
  gain: number;
  type: OscillatorType;
}

interface AmbientThemeProfile {
  filterType: BiquadFilterType;
  cutoff: number;
  tones: readonly [AmbientToneProfile, AmbientToneProfile];
}

type MutationActivation = Extract<GameEvent, { type: 'mutation-activated' }>;

/** Per-event dynamics carry presence; the master adds headroom without flattening hierarchy. */
const FULL_VOLUME_MASTER_GAIN = 1.5;
const VOICE_GAIN_CEILING = 0.46;
const VOICE_GAIN_BOOST = 1.6;
const MOVE_CUE_MIN_INTERVAL_MS = 60;
const AUDIO_BUSES: readonly AudioBus[] = Object.freeze([
  'gameplay',
  'reward',
  'mutation',
  'ambient',
  'ui',
]);
const AUDIO_BUS_GAINS: Readonly<Record<AudioBus, number>> = Object.freeze({
  gameplay: 0.82,
  reward: 0.94,
  mutation: 0.88,
  ambient: 0.18,
  ui: 0.58,
});
const AMBIENT_THEME_PROFILES: Readonly<Record<VisualThemeId, AmbientThemeProfile>> = Object.freeze({
  'deep-tide': Object.freeze({
    filterType: 'lowpass' as const,
    cutoff: 230,
    tones: Object.freeze([
      Object.freeze({ frequency: 55, gain: 0.026, type: 'sine' as const }),
      Object.freeze({ frequency: 82.41, gain: 0.011, type: 'triangle' as const }),
    ]) as readonly [AmbientToneProfile, AmbientToneProfile],
  }),
  'mineral-mist': Object.freeze({
    filterType: 'bandpass' as const,
    cutoff: 520,
    tones: Object.freeze([
      Object.freeze({ frequency: 130.81, gain: 0.016, type: 'sine' as const }),
      Object.freeze({ frequency: 196, gain: 0.007, type: 'triangle' as const }),
    ]) as readonly [AmbientToneProfile, AmbientToneProfile],
  }),
  sunstone: Object.freeze({
    filterType: 'lowpass' as const,
    cutoff: 420,
    tones: Object.freeze([
      Object.freeze({ frequency: 110, gain: 0.019, type: 'sine' as const }),
      Object.freeze({ frequency: 164.81, gain: 0.008, type: 'triangle' as const }),
    ]) as readonly [AmbientToneProfile, AmbientToneProfile],
  }),
});
const MUTATION_CUE_ORDER: Readonly<Record<MutationItem, number>> = Object.freeze({
  bomb: 0,
  freeze: 1,
  collapse: 2,
  multiplier: 3,
});

const CLEAR_CUE_PROFILES: Readonly<Record<1 | 2 | 3 | 4, readonly ToneOptions[]>> = Object.freeze({
  1: Object.freeze([
    Object.freeze({ frequency: 392, duration: 0.22, gain: 0.11, attack: 0.006, body: 0.45, bodyGain: 0.58, type: 'triangle' as const }),
    Object.freeze({ frequency: 523.25, duration: 0.18, gain: 0.055, delay: 0.018, endFrequency: 783.99, attack: 0.008, body: 0.42, bodyGain: 0.44, type: 'sine' as const }),
  ]),
  2: Object.freeze([
    Object.freeze({ frequency: 392, duration: 0.28, gain: 0.105, attack: 0.006, body: 0.48, bodyGain: 0.6, type: 'triangle' as const }),
    Object.freeze({ frequency: 587.33, duration: 0.25, gain: 0.075, delay: 0.026, attack: 0.006, body: 0.46, bodyGain: 0.54, type: 'triangle' as const }),
    Object.freeze({ frequency: 783.99, duration: 0.19, gain: 0.038, delay: 0.055, attack: 0.006, body: 0.4, bodyGain: 0.42, type: 'sine' as const }),
  ]),
  3: Object.freeze([
    Object.freeze({ frequency: 261.63, duration: 0.4, gain: 0.09, attack: 0.008, body: 0.5, bodyGain: 0.62, type: 'triangle' as const }),
    Object.freeze({ frequency: 329.63, duration: 0.36, gain: 0.075, delay: 0.025, attack: 0.007, body: 0.48, bodyGain: 0.57, type: 'triangle' as const }),
    Object.freeze({ frequency: 392, duration: 0.32, gain: 0.065, delay: 0.052, attack: 0.007, body: 0.46, bodyGain: 0.52, type: 'sine' as const }),
    Object.freeze({ frequency: 523.25, duration: 0.25, gain: 0.045, delay: 0.085, attack: 0.006, body: 0.42, bodyGain: 0.45, type: 'sine' as const }),
  ]),
  4: Object.freeze([
    Object.freeze({ frequency: 55, duration: 0.78, gain: 0.075, attack: 0.02, body: 0.58, bodyGain: 0.66, type: 'sine' as const }),
    Object.freeze({ frequency: 261.63, duration: 0.9, gain: 0.085, delay: 0.035, attack: 0.012, body: 0.52, bodyGain: 0.6, type: 'triangle' as const }),
    Object.freeze({ frequency: 392, duration: 0.78, gain: 0.07, delay: 0.09, attack: 0.01, body: 0.5, bodyGain: 0.56, type: 'triangle' as const }),
    Object.freeze({ frequency: 523.25, duration: 0.64, gain: 0.055, delay: 0.15, attack: 0.01, body: 0.47, bodyGain: 0.5, type: 'sine' as const }),
    Object.freeze({ frequency: 783.99, duration: 0.46, gain: 0.035, delay: 0.23, endFrequency: 880, attack: 0.009, body: 0.42, bodyGain: 0.44, type: 'sine' as const }),
  ]),
});

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private buses: Partial<Record<AudioBus, GainNode>> = {};
  private enabled = true;
  private mutationVoices: EffectVoice[] = [];
  private volume = 1;
  private lastMoveAt = Number.NEGATIVE_INFINITY;
  private lastSoftDropAt = 0;
  private voices = 0;
  private ambientTheme: VisualThemeId | null = null;
  private ambientVoices: AmbientVoice[] = [];

  constructor(private readonly platform: BrowserPlatform = browserPlatform) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMutationCue();
      this.stopAmbientLayer();
    } else {
      this.ensureAmbientLayer();
    }
    this.applyEffectsGain();
  }

  setAmbientTheme(theme: VisualThemeId): void {
    if (theme === this.ambientTheme) return;
    this.stopAmbientLayer();
    this.ambientTheme = theme;
    this.ensureAmbientLayer();
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
    if (!this.enabled) return;
    if (!this.context) {
      const context = this.platform.createAudioContext();
      if (!context) return;
      this.context = context;
      this.master = this.context.createGain();
      this.effects = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      for (const busName of AUDIO_BUSES) {
        const bus = this.context.createGain();
        bus.gain.value = AUDIO_BUS_GAINS[busName];
        bus.connect(this.effects);
        this.buses[busName] = bus;
      }
      // Let short event transients remain distinct; contain only genuinely dense
      // resolution batches instead of flattening routine controls into the same level.
      this.compressor.threshold.value = -2;
      this.compressor.knee.value = 4;
      this.compressor.ratio.value = 2.4;
      this.compressor.attack.value = 0.006;
      this.compressor.release.value = 0.16;
      this.applyMasterGain();
      this.applyEffectsGain();
      this.effects.connect(this.master);
      this.master.connect(this.compressor);
      this.compressor.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.ensureAmbientLayer();
  }

  suspend(): void {
    void this.context?.suspend();
  }

  play(events: readonly GameEvent[]): void {
    if (!this.context || !this.master) return;
    if (!this.enabled) return;
    const includesHardDrop = events.some((event) => event.type === 'hard-dropped');
    const includesLineClear = events.some((event) => event.type === 'lines-cleared');
    const includesCompletion = events.some((event) => event.type === 'finished');
    const includesGameOver = events.some((event) => event.type === 'game-over');
    const includesLevelUp = events.some((event) => event.type === 'level-up');
    const mutationActivations = this.uniqueMutationActivations(events);
    const hasMutationActivation = mutationActivations.length > 0;
    const hasHigherPriorityResolution = hasMutationActivation || includesCompletion || includesGameOver || includesLevelUp;
    const hasResolutionCue = includesLineClear || hasHigherPriorityResolution;
    for (const event of events) {
      if (event.type === 'piece-moved' && event.cause === 'move') {
        const now = this.platform.now();
        if (now - this.lastMoveAt >= MOVE_CUE_MIN_INTERVAL_MS) {
          this.layeredCue({
            bus: 'gameplay',
            body: { frequency: 246.94, duration: 0.042, gain: 0.03, attack: 0.003, body: 0.44, bodyGain: 0.42, type: 'triangle' },
            texture: { duration: 0.024, gain: 0.0045, delay: 0.002, cutoff: 980, filterType: 'bandpass' },
          });
          this.lastMoveAt = now;
        }
      } else if (event.type === 'piece-moved' && event.cause === 'soft-drop') {
        const now = this.platform.now();
        if (now - this.lastSoftDropAt > 52) {
          this.layeredCue({
            bus: 'gameplay',
            body: { frequency: 400, duration: 0.034, gain: 0.024, endFrequency: 250, attack: 0.003, body: 0.42, bodyGain: 0.38, type: 'sine' },
            texture: { duration: 0.026, gain: 0.004, delay: 0.001, cutoff: 720, filterType: 'bandpass' },
          });
          this.lastSoftDropAt = now;
        }
      } else if (event.type === 'piece-rotated') {
        this.layeredCue({
          bus: 'gameplay',
          body: { frequency: 300, duration: 0.072, gain: 0.044, endFrequency: 450, attack: 0.004, body: 0.5, bodyGain: 0.5, type: 'sine' },
          harmonic: { frequency: 600, duration: 0.036, gain: 0.014, delay: 0.011, attack: 0.003, body: 0.4, bodyGain: 0.38, type: 'triangle' },
        });
      } else if (event.type === 'hard-dropped') {
        if (!hasResolutionCue) this.landingThump();
      } else if (event.type === 'piece-locked' && !includesHardDrop && !hasResolutionCue) {
        this.layeredCue({
          bus: 'gameplay',
          body: { frequency: 110, duration: 0.1, gain: 0.04, endFrequency: 98, attack: 0.006, body: 0.48, bodyGain: 0.52, type: 'sine' },
          harmonic: { frequency: 220, duration: 0.065, gain: 0.017, delay: 0.006, attack: 0.005, body: 0.42, bodyGain: 0.4, type: 'triangle' },
        });
      } else if (event.type === 'puzzle-undone') {
        this.tone({ frequency: 440, duration: 0.13, gain: 0.13, endFrequency: 329.63, attack: 0.004, body: 0.5, bodyGain: 0.58, type: 'triangle' });
        this.tone({ frequency: 659.25, duration: 0.085, gain: 0.05, delay: 0.008, endFrequency: 493.88, attack: 0.003, body: 0.44, bodyGain: 0.46, type: 'sine' });
      } else if (event.type === 'clear-started') {
        // The renderer owns the brief pre-clear anticipation. Sound resolves once,
        // on lines-cleared, so the positive cue stays rhythmically precise.
      } else if (event.type === 'lines-cleared') {
        // A material trigger or Puzzle completion is the player-facing resolution of
        // this batch. Otherwise the clear owns the mix and suppresses landing/lock taps.
        if (!hasHigherPriorityResolution) this.clearChord(event.count);
      } else if (event.type === 'bedrock-raised') {
        this.layeredCue({
          bus: 'gameplay',
          body: { frequency: 82.41, duration: 0.86, gain: 0.045, endFrequency: 110, attack: 0.035, body: 0.62, bodyGain: 0.68, type: 'sine' },
          harmonic: { frequency: 164.81, duration: 0.64, gain: 0.018, delay: 0.035, endFrequency: 220, attack: 0.025, body: 0.58, bodyGain: 0.58, type: 'sine' },
          texture: { duration: 0.28, gain: 0.006, delay: 0.04, cutoff: 260, filterType: 'lowpass' },
        });
      } else if (event.type === 'bedrock-lowered') {
        this.layeredCue({
          bus: 'gameplay',
          body: { frequency: 110, duration: 0.72, gain: 0.04, endFrequency: 82.41, attack: 0.026, body: 0.6, bodyGain: 0.62, type: 'sine' },
          harmonic: { frequency: 220, duration: 0.52, gain: 0.016, delay: 0.025, endFrequency: 164.81, attack: 0.02, body: 0.55, bodyGain: 0.54, type: 'sine' },
          texture: { duration: 0.24, gain: 0.0055, delay: 0.025, cutoff: 240, filterType: 'lowpass' },
        });
      } else if (event.type === 'survival-stones-warned') {
        // Two low, rounded pulses support the flashing arrow without becoming an alarm.
        this.tone({ frequency: 130.81, duration: 0.11, gain: 0.065, endFrequency: 123.47, attack: 0.008, body: 0.52, bodyGain: 0.58, type: 'sine' });
        this.tone({ frequency: 164.81, duration: 0.11, gain: 0.055, delay: 0.13, endFrequency: 146.83, attack: 0.008, body: 0.52, bodyGain: 0.55, type: 'sine' });
      } else if (event.type === 'survival-stones-spawned') {
        this.layeredCue({
          bus: 'gameplay',
          body: { frequency: 261.63, duration: 0.16, gain: 0.055, endFrequency: 146.83, attack: 0.007, body: 0.52, bodyGain: 0.58, type: 'sine' },
          texture: { duration: 0.055, gain: 0.008, delay: 0.008, cutoff: 480, filterType: 'bandpass' },
        });
      } else if (event.type === 'survival-stones-landed') {
        this.layeredCue({
          bus: 'gameplay',
          body: { frequency: 98, duration: 0.15, gain: 0.075, endFrequency: 82.41, attack: 0.007, body: 0.5, bodyGain: 0.6, type: 'sine' },
          harmonic: { frequency: 196, duration: 0.09, gain: 0.028, delay: 0.008, endFrequency: 164.81, attack: 0.005, body: 0.44, bodyGain: 0.45, type: 'triangle' },
          texture: { duration: 0.06, gain: 0.012, delay: 0.006, cutoff: 420, filterType: 'lowpass' },
        });
      } else if (event.type === 'level-up' && !hasMutationActivation) {
        [392, 493.88, 587.33, 783.99].forEach((frequency, index) => this.tone({ frequency, duration: index === 3 ? 0.22 : 0.17, gain: index === 3 ? 0.15 : 0.19, bus: 'reward', delay: index * 0.05, attack: 0.004, body: 0.5, bodyGain: 0.58, type: index < 2 ? 'triangle' : 'sine' }));
      } else if (event.type === 'finished' && !hasMutationActivation) {
        [392, 493.88, 659.25, 783.99, 987.77].forEach((frequency, index) => this.tone({ frequency, duration: index === 4 ? 0.3 : 0.22, gain: index === 4 ? 0.105 : 0.2 - index * 0.018, bus: 'reward', delay: index * 0.055, attack: 0.004, body: 0.54, bodyGain: 0.6, type: index < 2 ? 'triangle' : 'sine' }));
      } else if (event.type === 'game-over' && !hasMutationActivation) {
        [220, 174.61, 146.83, 110].forEach((frequency, index) => this.tone({ frequency, duration: index === 3 ? 0.26 : 0.19, gain: 0.18 - index * 0.018, bus: 'reward', delay: index * 0.09, attack: 0.006, body: 0.54, bodyGain: 0.6, type: index < 3 ? 'triangle' : 'sine' }));
      } else if (event.type === 'started') {
        // The cover exits silently after the third short countdown beat.
      } else if (event.type === 'resumed') {
        this.tone({ frequency: 246.94, duration: 0.11, gain: 0.052, bus: 'ui', endFrequency: 329.63, attack: 0.008, body: 0.5, bodyGain: 0.5, type: 'sine' });
        this.tone({ frequency: 493.88, duration: 0.065, gain: 0.018, bus: 'ui', delay: 0.022, attack: 0.005, body: 0.42, bodyGain: 0.4, type: 'sine' });
      } else if (event.type === 'paused') {
        this.tone({ frequency: 293.66, duration: 0.11, gain: 0.05, bus: 'ui', endFrequency: 246.94, attack: 0.008, body: 0.5, bodyGain: 0.5, type: 'sine' });
        this.tone({ frequency: 146.83, duration: 0.07, gain: 0.02, bus: 'ui', delay: 0.02, attack: 0.005, body: 0.42, bodyGain: 0.42, type: 'sine' });
      } else if (event.type === 'restarted') {
        // The fresh 3-2-1 sequence owns restart feedback; another voice here would
        // double the first beat when the restarted event and digit 3 share a frame.
      }
    }
    this.playMutationActivations(mutationActivations);
  }

  /** Three transport-like beats: 3 and 2 repeat; 1 resolves higher and longer. */
  playEntryCountdown(digit: 3 | 2 | 1): void {
    if (!this.context || !this.master || !this.enabled) return;
    const profile = digit === 1
      ? { frequency: 587.33, duration: 0.27, gain: 0.17 }
      : { frequency: 392, duration: 0.125, gain: 0.14 };
    this.tone({
      frequency: profile.frequency,
      duration: profile.duration,
      gain: profile.gain,
      bus: 'ui',
      attack: 0.004,
      body: digit === 1 ? 0.58 : 0.48,
      bodyGain: digit === 1 ? 0.64 : 0.54,
      type: 'triangle',
    });
    this.tone({
      frequency: profile.frequency * 2,
      duration: profile.duration * 0.58,
      gain: profile.gain * 0.24,
      bus: 'ui',
      attack: 0.003,
      body: 0.42,
      bodyGain: 0.44,
      type: 'sine',
    });
  }

  destroy(): void {
    this.stopMutationCue();
    this.stopAmbientLayer();
    for (const busName of AUDIO_BUSES) this.buses[busName]?.disconnect();
    this.buses = {};
    this.effects?.disconnect();
    this.effects = null;
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
    if (count < 1 || count > 4 || !Number.isInteger(count)) return;
    const profile = CLEAR_CUE_PROFILES[count as 1 | 2 | 3 | 4];
    // Each tier widens the harmony while one quiet, filtered air layer supplies the
    // crystal-material edge. Four lines resolves as a branded spatial bloom.
    profile.forEach((tone) => this.tone({ ...tone, bus: 'reward' }));
    this.noisePuff({
      duration: count === 4 ? 0.32 : 0.075 + count * 0.018,
      gain: 0.01 + count * 0.002,
      delay: count === 4 ? 0.2 : 0.012,
      cutoff: count === 4 ? 1500 : 1250 + count * 120,
      filterType: 'bandpass',
    }, 'reward');
  }

  private landingThump(): void {
    this.layeredCue({
      bus: 'gameplay',
      body: { frequency: 82.41, duration: 0.18, gain: 0.07, endFrequency: 73.42, attack: 0.007, body: 0.48, bodyGain: 0.58, type: 'sine' },
      harmonic: { frequency: 146.83, duration: 0.13, gain: 0.042, delay: 0.008, endFrequency: 123.47, attack: 0.005, body: 0.44, bodyGain: 0.48, type: 'triangle' },
      texture: { duration: 0.06, gain: 0.014, delay: 0.006, cutoff: 520, filterType: 'lowpass' },
      tail: { frequency: 493.88, duration: 0.17, gain: 0.018, delay: 0.026, endFrequency: 440, attack: 0.008, body: 0.38, bodyGain: 0.38, type: 'sine' },
    });
  }

  private uniqueMutationActivations(events: readonly GameEvent[]): MutationActivation[] {
    const unique = new Map<MutationItem, MutationActivation>();
    for (const event of events) {
      if (event.type !== 'mutation-activated') continue;
      const previous = unique.get(event.item);
      if (!previous) {
        unique.set(event.item, event);
        continue;
      }
      if (
        event.item === 'multiplier'
        && (event.multiplierFactor ?? 2) > (previous.multiplierFactor ?? 2)
      ) {
        unique.set(event.item, event);
      }
    }
    return [...unique.values()].sort((left, right) => (
      MUTATION_CUE_ORDER[left.item] - MUTATION_CUE_ORDER[right.item]
    ));
  }

  private playMutationActivations(activations: readonly MutationActivation[]): void {
    if (!activations.length) return;
    activations.forEach((activation, index) => {
      this.mutationCue(activation, index * 0.035);
    });
  }

  private mutationCue(event: MutationActivation, delayOffset = 0): void {
    // Carrier geometry is immutable Core event data. It makes an unusually broad
    // activation slightly fuller without depending on renderer state or randomness.
    const carrierAccent = Math.min(1.1, 0.84 + Math.max(0, event.triggerCells?.length ?? 4) * 0.04);
    const token = MUTATION_VFX_TOKENS[event.item].audio;
    if (event.item === 'freeze') {
      this.layeredCue({
        bus: 'mutation',
        mutationOwned: true,
        body: { frequency: 523.25, duration: 0.58, gain: 0.085 * carrierAccent, endFrequency: 659.25, delay: delayOffset, attack: 0.016, body: 0.54, bodyGain: 0.6, type: 'sine' },
        harmonic: { frequency: 783.99, duration: 0.42, gain: 0.045 * carrierAccent, delay: delayOffset + 0.04, attack: 0.012, body: 0.48, bodyGain: 0.52, type: 'sine' },
        texture: { duration: 0.18, gain: 0.012 * carrierAccent, delay: delayOffset + 0.025, cutoff: 1080, filterType: 'bandpass' },
        tail: { frequency: 1046.5, duration: 0.26, gain: 0.025 * carrierAccent, delay: delayOffset + 0.14, endFrequency: 932.33, attack: 0.01, body: 0.42, bodyGain: 0.4, type: 'sine' },
      });
      return;
    }
    if (event.item === 'collapse') {
      this.layeredCue({
        bus: 'mutation',
        mutationOwned: true,
        body: { frequency: 73.42, duration: 0.5, gain: 0.105 * carrierAccent, endFrequency: 55, delay: delayOffset, attack: 0.012, body: 0.56, bodyGain: 0.65, type: 'sine' },
        harmonic: { frequency: 200, duration: 0.42, gain: 0.065 * carrierAccent, endFrequency: 80, delay: delayOffset + 0.025, attack: 0.01, body: 0.52, bodyGain: 0.56, type: 'triangle' },
        texture: { duration: 0.16, gain: 0.014 * carrierAccent, delay: delayOffset + 0.035, cutoff: 280, filterType: 'lowpass' },
        tail: { frequency: 146.83, duration: 0.24, gain: 0.022 * carrierAccent, endFrequency: 98, delay: delayOffset + 0.12, attack: 0.008, body: 0.42, bodyGain: 0.42, type: 'sine' },
      });
      return;
    }
    if (event.item === 'bomb') {
      this.layeredCue({
        bus: 'mutation',
        mutationOwned: true,
        body: { frequency: 90, duration: 0.44, gain: 0.085 * carrierAccent, endFrequency: 130, delay: delayOffset, attack: 0.025, body: 0.44, bodyGain: 0.6, type: 'sine' },
        harmonic: { frequency: 65, duration: 0.3, gain: 0.1 * carrierAccent, endFrequency: 55, delay: delayOffset + 0.075, attack: 0.008, body: 0.46, bodyGain: 0.54, type: 'triangle' },
        texture: { duration: 0.11, gain: 0.025 * carrierAccent, delay: delayOffset + 0.082, cutoff: 360, filterType: 'lowpass' },
        tail: { frequency: 329.63, duration: 0.24, gain: 0.024 * carrierAccent, endFrequency: 293.66, delay: delayOffset + 0.14, attack: 0.01, body: 0.4, bodyGain: 0.4, type: 'sine' },
      });
      return;
    }
    this.mutationMarimbaStrike(token.activateHz, 0.09 * carrierAccent, delayOffset);
    this.mutationMarimbaStrike(token.accentHz, 0.07 * carrierAccent, delayOffset + 0.06);
    if (event.multiplierFactor === 4) {
      this.mutationMarimbaStrike(token.activateHz * 2, 0.045 * carrierAccent, delayOffset + 0.13, 'sine');
    }
  }

  /** Timed mutation states are intentionally silent; only activation cues play. */
  syncMutationState(_state: GameState): void {}

  private mutationMarimbaStrike(
    frequency: number,
    gain: number,
    delay: number,
    type: OscillatorType = 'triangle',
  ): void {
    this.tone({ frequency, duration: 0.26, gain, bus: 'mutation', delay, attack: 0.009, body: 0.48, bodyGain: 0.5, type }, true);
  }

  /**
   * One semantic cue can own a soft body, harmonic colour, deterministic material
   * texture, and a quiet delayed tail. All layers share the same bus and ownership so
   * event priority remains legible rather than becoming an accidental sound pile-up.
   */
  private layeredCue(options: LayeredCueOptions): void {
    const { bus, mutationOwned = false } = options;
    this.tone({ ...options.body, bus }, mutationOwned);
    if (options.harmonic) this.tone({ ...options.harmonic, bus }, mutationOwned);
    if (options.texture) this.noisePuff(options.texture, bus, mutationOwned);
    if (options.tail) this.tone({ ...options.tail, bus }, mutationOwned);
  }

  private tone(options: ToneOptions, belongsToMutationCue = false): void {
    const context = this.context;
    const bus = this.buses[options.bus ?? 'gameplay'];
    if (!context || !bus || this.voices >= 16) return;
    const start = context.currentTime + (options.delay ?? 0);
    const end = start + options.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    this.voices += 1;
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, start);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), end);
    gain.gain.setValueAtTime(0.0001, start);
    const peakGain = Math.max(0.0001, Math.min(VOICE_GAIN_CEILING, options.gain * VOICE_GAIN_BOOST));
    const attackEnd = start + Math.min(options.attack ?? 0.012, options.duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(peakGain, attackEnd);
    if (options.body) {
      const bodyEnd = Math.min(
        end - 0.004,
        Math.max(attackEnd + 0.003, start + options.duration * Math.min(0.82, Math.max(0.28, options.body))),
      );
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, peakGain * Math.min(0.9, Math.max(0.18, options.bodyGain ?? 0.5))),
        bodyEnd,
      );
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(bus);
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

  private noisePuff(
    options: TextureOptions,
    busName: AudioBus = 'gameplay',
    belongsToMutationCue = false,
  ): void {
    const context = this.context;
    const bus = this.buses[busName];
    if (!context || !bus || this.voices >= 16) return;
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
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = options.filterType ?? 'lowpass';
    filter.frequency.setValueAtTime(options.cutoff ?? 720, start);
    filter.Q.setValueAtTime(0.7, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, Math.min(VOICE_GAIN_CEILING, options.gain * VOICE_GAIN_BOOST)),
      start + Math.min(0.009, options.duration * 0.22),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    const voice: EffectVoice = { source, gain };
    if (belongsToMutationCue) this.mutationVoices.push(voice);
    this.voices += 1;
    source.start(start);
    source.stop(end + 0.01);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      this.voices = Math.max(0, this.voices - 1);
      if (belongsToMutationCue) this.mutationVoices = this.mutationVoices.filter((candidate) => candidate !== voice);
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

  private ensureAmbientLayer(): void {
    const context = this.context;
    const bus = this.buses.ambient;
    const theme = this.ambientTheme;
    if (!this.enabled || !context || !bus || !theme || this.ambientVoices.length > 0) return;
    const profile = AMBIENT_THEME_PROFILES[theme];
    for (const toneProfile of profile.tones) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = toneProfile.type;
      oscillator.frequency.setValueAtTime(toneProfile.frequency, context.currentTime);
      filter.type = profile.filterType;
      filter.frequency.setValueAtTime(profile.cutoff, context.currentTime);
      filter.Q.setValueAtTime(profile.filterType === 'bandpass' ? 0.55 : 0.4, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(toneProfile.gain, context.currentTime + 0.65);
      oscillator.connect(gain);
      gain.connect(filter);
      filter.connect(bus);
      const voice: AmbientVoice = { oscillator, gain, filter };
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        filter.disconnect();
      };
      oscillator.start(context.currentTime);
      this.ambientVoices.push(voice);
    }
  }

  private stopAmbientLayer(): void {
    const context = this.context;
    for (const voice of this.ambientVoices) {
      if (context) voice.gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.02);
      try {
        voice.oscillator.stop((context?.currentTime ?? 0) + 0.08);
      } catch {
        // A context shutdown can race a scheduled ambient fade.
      }
    }
    this.ambientVoices = [];
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
}
