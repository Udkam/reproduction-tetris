import type { GameEvent, GameState, MutationItem } from '../core';
import { browserPlatform, type BrowserPlatform } from '../../platform/browserPlatform';
import { MUTATION_VFX_TOKENS } from '../../design/mutationTokens';

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
const MUTATION_CUE_ORDER: Readonly<Record<MutationItem, number>> = Object.freeze({
  bomb: 0,
  freeze: 1,
  collapse: 2,
  multiplier: 3,
});

const CLEAR_CUE_PROFILES: Readonly<Record<1 | 2 | 3 | 4, readonly ToneOptions[]>> = Object.freeze({
  1: Object.freeze([
    Object.freeze({ frequency: 392, duration: 0.135, gain: 0.14, attack: 0.004, body: 0.48, bodyGain: 0.62, type: 'triangle' as const }),
    Object.freeze({ frequency: 587.33, duration: 0.105, gain: 0.062, delay: 0.008, attack: 0.003, body: 0.42, bodyGain: 0.5, type: 'sine' as const }),
  ]),
  2: Object.freeze([
    Object.freeze({ frequency: 349.23, duration: 0.165, gain: 0.15, attack: 0.004, body: 0.5, bodyGain: 0.64, type: 'triangle' as const }),
    Object.freeze({ frequency: 523.25, duration: 0.15, gain: 0.115, delay: 0.018, attack: 0.004, body: 0.48, bodyGain: 0.58, type: 'triangle' as const }),
    Object.freeze({ frequency: 698.46, duration: 0.115, gain: 0.06, delay: 0.038, attack: 0.003, body: 0.42, bodyGain: 0.48, type: 'sine' as const }),
  ]),
  3: Object.freeze([
    Object.freeze({ frequency: 329.63, duration: 0.195, gain: 0.165, attack: 0.004, body: 0.52, bodyGain: 0.66, type: 'triangle' as const }),
    Object.freeze({ frequency: 415.3, duration: 0.18, gain: 0.135, delay: 0.018, attack: 0.004, body: 0.5, bodyGain: 0.62, type: 'triangle' as const }),
    Object.freeze({ frequency: 493.88, duration: 0.165, gain: 0.105, delay: 0.04, attack: 0.004, body: 0.47, bodyGain: 0.56, type: 'sine' as const }),
    Object.freeze({ frequency: 659.25, duration: 0.13, gain: 0.064, delay: 0.065, attack: 0.003, body: 0.42, bodyGain: 0.48, type: 'sine' as const }),
  ]),
  4: Object.freeze([
    Object.freeze({ frequency: 293.66, duration: 0.255, gain: 0.18, attack: 0.004, body: 0.55, bodyGain: 0.68, type: 'triangle' as const }),
    Object.freeze({ frequency: 440, duration: 0.235, gain: 0.15, delay: 0.018, attack: 0.004, body: 0.53, bodyGain: 0.64, type: 'triangle' as const }),
    Object.freeze({ frequency: 587.33, duration: 0.215, gain: 0.12, delay: 0.04, attack: 0.004, body: 0.5, bodyGain: 0.6, type: 'sine' as const }),
    Object.freeze({ frequency: 739.99, duration: 0.195, gain: 0.09, delay: 0.065, attack: 0.003, body: 0.47, bodyGain: 0.54, type: 'sine' as const }),
    Object.freeze({ frequency: 880, duration: 0.175, gain: 0.062, delay: 0.09, attack: 0.003, body: 0.44, bodyGain: 0.48, type: 'sine' as const }),
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

  constructor(private readonly platform: BrowserPlatform = browserPlatform) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMutationCue();
    }
    this.applyEffectsGain();
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
          this.tone({ frequency: 196, duration: 0.046, gain: 0.068, attack: 0.003, body: 0.46, bodyGain: 0.46, type: 'triangle' });
          this.lastMoveAt = now;
        }
      } else if (event.type === 'piece-moved' && event.cause === 'soft-drop') {
        const now = this.platform.now();
        if (now - this.lastSoftDropAt > 52) {
          this.tone({ frequency: 174.61, duration: 0.04, gain: 0.072, endFrequency: 164.81, attack: 0.003, body: 0.45, bodyGain: 0.42, type: 'sine' });
          this.lastSoftDropAt = now;
        }
      } else if (event.type === 'piece-rotated') {
        this.tone({ frequency: 261.63, duration: 0.08, gain: 0.105, attack: 0.004, body: 0.5, bodyGain: 0.52, type: 'triangle' });
        this.tone({ frequency: 392, duration: 0.055, gain: 0.045, delay: 0.012, attack: 0.003, body: 0.42, bodyGain: 0.44, type: 'sine' });
      } else if (event.type === 'hard-dropped') {
        if (!hasResolutionCue) this.landingThump();
      } else if (event.type === 'piece-locked' && !includesHardDrop && !hasResolutionCue) {
        this.tone({ frequency: 220, duration: 0.055, gain: 0.07, attack: 0.004, body: 0.48, bodyGain: 0.48, type: 'triangle' });
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
        this.tone({ frequency: 110, duration: 0.21, gain: 0.24, endFrequency: 146.83, attack: 0.006, body: 0.56, bodyGain: 0.66, type: 'triangle' });
        this.tone({ frequency: 220, duration: 0.13, gain: 0.085, delay: 0.025, endFrequency: 293.66, attack: 0.004, body: 0.48, bodyGain: 0.5, type: 'sine' });
      } else if (event.type === 'bedrock-lowered') {
        this.tone({ frequency: 196, duration: 0.19, gain: 0.22, endFrequency: 123.47, attack: 0.006, body: 0.52, bodyGain: 0.62, type: 'triangle' });
        this.tone({ frequency: 293.66, duration: 0.11, gain: 0.065, delay: 0.014, endFrequency: 196, attack: 0.004, body: 0.44, bodyGain: 0.46, type: 'sine' });
      } else if (event.type === 'survival-stones-warned') {
        // Two compact rounded pulses make the flashing arrow unmistakable without a
        // continuous alarm or a piercing square-wave chirp.
        this.tone({ frequency: 392, duration: 0.095, gain: 0.17, endFrequency: 523.25, attack: 0.004, body: 0.46, bodyGain: 0.56, type: 'triangle' });
        this.tone({ frequency: 523.25, duration: 0.095, gain: 0.145, delay: 0.105, endFrequency: 698.46, attack: 0.004, body: 0.46, bodyGain: 0.54, type: 'triangle' });
      } else if (event.type === 'survival-stones-spawned') {
        this.tone({ frequency: 349.23, duration: 0.15, gain: 0.17, endFrequency: 220, attack: 0.004, body: 0.5, bodyGain: 0.58, type: 'triangle' });
        this.tone({ frequency: 523.25, duration: 0.09, gain: 0.055, delay: 0.008, endFrequency: 329.63, attack: 0.003, body: 0.42, bodyGain: 0.44, type: 'sine' });
      } else if (event.type === 'survival-stones-landed') {
        this.tone({ frequency: 123.47, duration: 0.12, gain: 0.24, endFrequency: 110, attack: 0.004, body: 0.5, bodyGain: 0.58, type: 'triangle' });
        this.tone({ frequency: 246.94, duration: 0.07, gain: 0.07, delay: 0.008, attack: 0.003, body: 0.42, bodyGain: 0.42, type: 'sine' });
      } else if (event.type === 'level-up' && !hasMutationActivation) {
        [392, 493.88, 587.33, 783.99].forEach((frequency, index) => this.tone({ frequency, duration: index === 3 ? 0.22 : 0.17, gain: index === 3 ? 0.15 : 0.19, bus: 'reward', delay: index * 0.05, attack: 0.004, body: 0.5, bodyGain: 0.58, type: index < 2 ? 'triangle' : 'sine' }));
      } else if (event.type === 'finished' && !hasMutationActivation) {
        [392, 493.88, 659.25, 783.99, 987.77].forEach((frequency, index) => this.tone({ frequency, duration: index === 4 ? 0.3 : 0.22, gain: index === 4 ? 0.105 : 0.2 - index * 0.018, bus: 'reward', delay: index * 0.055, attack: 0.004, body: 0.54, bodyGain: 0.6, type: index < 2 ? 'triangle' : 'sine' }));
      } else if (event.type === 'game-over' && !hasMutationActivation) {
        [220, 174.61, 146.83, 110].forEach((frequency, index) => this.tone({ frequency, duration: index === 3 ? 0.26 : 0.19, gain: 0.18 - index * 0.018, bus: 'reward', delay: index * 0.09, attack: 0.006, body: 0.54, bodyGain: 0.6, type: index < 3 ? 'triangle' : 'sine' }));
      } else if (event.type === 'started') {
        // The cover exits silently after the third short countdown beat.
      } else if (event.type === 'resumed') {
        this.tone({ frequency: 329.63, duration: 0.105, gain: 0.12, bus: 'ui', attack: 0.004, body: 0.5, bodyGain: 0.54, type: 'triangle' });
        this.tone({ frequency: 493.88, duration: 0.075, gain: 0.06, bus: 'ui', delay: 0.02, attack: 0.003, body: 0.44, bodyGain: 0.46, type: 'sine' });
      } else if (event.type === 'paused') {
        this.tone({ frequency: 329.63, duration: 0.1, gain: 0.11, bus: 'ui', attack: 0.004, body: 0.48, bodyGain: 0.52, type: 'triangle' });
        this.tone({ frequency: 246.94, duration: 0.085, gain: 0.06, bus: 'ui', delay: 0.02, attack: 0.004, body: 0.44, bodyGain: 0.46, type: 'sine' });
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
    // Triangle fundamentals add tactile body; delayed sine voices add an increasingly
    // resolved reward without noise, a sub-boom, or a master-gain jump.
    profile.forEach((tone) => this.tone({ ...tone, bus: 'reward' }));
  }

  private landingThump(): void {
    this.layeredCue({
      bus: 'gameplay',
      body: { frequency: 146.83, duration: 0.09, gain: 0.13, endFrequency: 130.81, attack: 0.004, body: 0.5, bodyGain: 0.54, type: 'triangle' },
      harmonic: { frequency: 293.66, duration: 0.05, gain: 0.045, delay: 0.006, attack: 0.003, body: 0.42, bodyGain: 0.42, type: 'sine' },
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
      this.tone({
        frequency: 698.46,
        duration: 0.105,
        gain: 0.135 * carrierAccent,
        bus: 'mutation',
        delay: delayOffset,
        attack: 0.003,
        body: 0.46,
        bodyGain: 0.54,
        type: 'triangle',
      }, true);
      this.tone({
        frequency: 1046.5,
        duration: 0.075,
        gain: 0.04 * carrierAccent,
        bus: 'mutation',
        delay: delayOffset + 0.012,
        attack: 0.0025,
        body: 0.4,
        bodyGain: 0.42,
        type: 'sine',
      }, true);
      return;
    }
    if (event.item === 'collapse') {
      this.tone({ frequency: 196, duration: 0.155, gain: 0.27 * carrierAccent, bus: 'mutation', delay: delayOffset, endFrequency: 130.81, attack: 0.004, body: 0.54, bodyGain: 0.64, type: 'triangle' }, true);
      this.tone({ frequency: 261.63, duration: 0.1, gain: 0.085 * carrierAccent, bus: 'mutation', delay: delayOffset + 0.02, endFrequency: 196, attack: 0.003, body: 0.46, bodyGain: 0.5, type: 'sine' }, true);
      return;
    }
    if (event.item === 'bomb') {
      this.tone({ frequency: 110, duration: 0.17, gain: 0.22 * carrierAccent, bus: 'mutation', delay: delayOffset, endFrequency: 82.41, attack: 0.004, body: 0.52, bodyGain: 0.6, type: 'triangle' }, true);
      this.noisePuff({ duration: 0.07, gain: 0.085 * carrierAccent, delay: delayOffset + 0.006, cutoff: 480 }, 'mutation', true);
      return;
    }
    this.mutationMarimbaStrike(token.activateHz, 0.18 * carrierAccent, delayOffset);
    this.mutationMarimbaStrike(token.accentHz, 0.155 * carrierAccent, delayOffset + 0.05);
    if (event.multiplierFactor === 4) {
      this.mutationMarimbaStrike(token.activateHz * 2, 0.1 * carrierAccent, delayOffset + 0.1, 'sine');
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
    this.tone({ frequency, duration: 0.145, gain, bus: 'mutation', delay, attack: 0.003, body: 0.45, bodyGain: 0.48, type }, true);
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
    filter.type = 'lowpass';
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
