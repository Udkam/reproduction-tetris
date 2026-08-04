import type { GameEvent, GameState, MutationItem } from '../core';
import { browserPlatform, type BrowserPlatform } from '../../platform/browserPlatform';
import { MUTATION_VFX_TOKENS } from '../../design/mutationTokens';

interface ToneOptions {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  delay?: number;
  endFrequency?: number;
  attack?: number;
}

/** A short-lived foreground voice, including the occasional buffer-noise puff. */
interface EffectVoice {
  source: AudioScheduledSourceNode;
  gain: GainNode;
}

interface MutationLoopVoice extends EffectVoice {
  source: OscillatorNode;
}

type MutationActivation = Extract<GameEvent, { type: 'mutation-activated' }>;
type MutationLoopItem = Extract<MutationItem, 'collapse'>;

/** Full-volume mix gain is deliberately above unity, then safely contained by the compressor. */
const FULL_VOLUME_MASTER_GAIN = 1.85;
const VOICE_GAIN_CEILING = 0.5;
const VOICE_GAIN_BOOST = 1.45;
const BRIGHT_PARTIAL_RATIO = 2.01;
const MOVE_CUE_MIN_INTERVAL_MS = 60;

const CLEAR_CUE_PROFILES: Readonly<Record<1 | 2 | 3 | 4, readonly ToneOptions[]>> = Object.freeze({
  1: Object.freeze([
    Object.freeze({ frequency: 392, duration: 0.105, gain: 0.09, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 784, duration: 0.07, gain: 0.025, delay: 0.006, attack: 0.004, type: 'sine' as const }),
  ]),
  2: Object.freeze([
    Object.freeze({ frequency: 349.23, duration: 0.12, gain: 0.095, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 523.25, duration: 0.112, gain: 0.075, delay: 0.018, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 698.46, duration: 0.09, gain: 0.028, delay: 0.026, attack: 0.005, type: 'sine' as const }),
  ]),
  3: Object.freeze([
    Object.freeze({ frequency: 329.63, duration: 0.14, gain: 0.1, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 415.3, duration: 0.132, gain: 0.082, delay: 0.022, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 493.88, duration: 0.122, gain: 0.07, delay: 0.044, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 659.25, duration: 0.105, gain: 0.032, delay: 0.06, attack: 0.005, type: 'sine' as const }),
  ]),
  4: Object.freeze([
    Object.freeze({ frequency: 293.66, duration: 0.18, gain: 0.105, attack: 0.007, type: 'sine' as const }),
    Object.freeze({ frequency: 440, duration: 0.17, gain: 0.09, delay: 0.018, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 587.33, duration: 0.16, gain: 0.075, delay: 0.036, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 739.99, duration: 0.15, gain: 0.055, delay: 0.054, attack: 0.006, type: 'sine' as const }),
    Object.freeze({ frequency: 880, duration: 0.17, gain: 0.032, delay: 0.07, attack: 0.007, type: 'sine' as const }),
  ]),
});

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private enabled = true;
  private mutationVoices: EffectVoice[] = [];
  private readonly mutationLoops = new Map<MutationLoopItem, MutationLoopVoice>();
  private volume = 1;
  private lastMoveAt = Number.NEGATIVE_INFINITY;
  private lastSoftDropAt = 0;
  private voices = 0;

  constructor(private readonly platform: BrowserPlatform = browserPlatform) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMutationCue();
      this.stopMutationLoops(false);
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
      // Preserve the onset of intentional feedback at 100%, then contain only dense
      // clear/item overlaps. A gentler knee avoids flattening the whole mix.
      this.compressor.threshold.value = -4;
      this.compressor.knee.value = 6;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.12;
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
          this.tone({ frequency: 220, duration: 0.044, gain: 0.062, attack: 0.006, type: 'sine' });
          this.lastMoveAt = now;
        }
      } else if (event.type === 'piece-moved' && event.cause === 'soft-drop') {
        const now = this.platform.now();
        if (now - this.lastSoftDropAt > 52) {
          this.tone({ frequency: 196, duration: 0.036, gain: 0.078, endFrequency: 185, attack: 0.007, type: 'sine' });
          this.lastSoftDropAt = now;
        }
      } else if (event.type === 'piece-rotated') {
        // A rounded fundamental carries the action; the very short fifth adds a
        // readable edge without restoring the former sharp electronic click.
        this.tone({ frequency: 293.66, duration: 0.065, gain: 0.09, attack: 0.006, type: 'sine' });
        this.tone({ frequency: 440, duration: 0.038, gain: 0.024, delay: 0.004, attack: 0.004, type: 'sine' });
      } else if (event.type === 'hard-dropped') {
        if (!hasResolutionCue) this.landingThump();
      } else if (event.type === 'piece-locked' && !includesHardDrop && !hasResolutionCue) {
        this.tone({ frequency: 246.94, duration: 0.048, gain: 0.06, attack: 0.007, type: 'sine' });
      } else if (event.type === 'puzzle-undone') {
        this.tone({ frequency: 392, duration: 0.09, gain: 0.095, endFrequency: 293.66, attack: 0.006, type: 'sine' });
      } else if (event.type === 'clear-started') {
        // The renderer owns the brief pre-clear anticipation. Sound resolves once,
        // on lines-cleared, so the positive cue stays rhythmically precise.
      } else if (event.type === 'lines-cleared') {
        // A material trigger or Puzzle completion is the player-facing resolution of
        // this batch. Otherwise the clear owns the mix and suppresses landing/lock taps.
        if (!hasHigherPriorityResolution) this.clearChord(event.count);
      } else if (event.type === 'bedrock-raised') {
        this.tone({ frequency: 98, duration: 0.17, gain: 0.2, endFrequency: 123.47, attack: 0.008, type: 'sine' });
        this.tone({ frequency: 196, duration: 0.09, gain: 0.055, delay: 0.025, endFrequency: 246.94, attack: 0.006, type: 'sine' });
      } else if (event.type === 'bedrock-lowered') {
        this.tone({ frequency: 164.81, duration: 0.14, gain: 0.18, endFrequency: 110, attack: 0.008, type: 'sine' });
      } else if (event.type === 'survival-stones-warned') {
        // Two compact rounded pulses make the flashing arrow unmistakable without a
        // continuous alarm or a piercing square-wave chirp.
        this.tone({ frequency: 392, duration: 0.075, gain: 0.14, endFrequency: 523.25, attack: 0.006, type: 'sine' });
        this.tone({ frequency: 523.25, duration: 0.07, gain: 0.105, delay: 0.085, endFrequency: 659.25, attack: 0.006, type: 'sine' });
      } else if (event.type === 'survival-stones-spawned') {
        this.tone({ frequency: 329.63, duration: 0.12, gain: 0.13, endFrequency: 220, attack: 0.006, type: 'sine' });
      } else if (event.type === 'survival-stones-landed') {
        this.tone({ frequency: 130.81, duration: 0.085, gain: 0.18, attack: 0.006, type: 'sine' });
        this.tone({ frequency: 196, duration: 0.055, gain: 0.045, delay: 0.006, attack: 0.004, type: 'sine' });
      } else if (event.type === 'level-up') {
        [392, 493.88, 587.33, 783.99].forEach((frequency, index) => this.tone({ frequency, duration: 0.145, gain: index === 3 ? 0.12 : 0.17, delay: index * 0.047, attack: 0.006, type: 'sine' }));
      } else if (event.type === 'finished') {
        [440, 554.37, 659.25, 880].forEach((frequency, index) => this.tone({ frequency, duration: index === 3 ? 0.24 : 0.19, gain: index === 3 ? 0.1 : 0.19, delay: index * 0.055, attack: 0.007, type: 'sine' }));
      } else if (event.type === 'game-over') {
        [196, 164.81, 130.81].forEach((frequency, index) => this.tone({ frequency, duration: 0.165, gain: 0.16, delay: index * 0.11, attack: 0.01, type: 'sine' }));
      } else if (event.type === 'started') {
        // The cover exits silently after the third short countdown beat.
      } else if (event.type === 'resumed') {
        this.tone({ frequency: 349.23, duration: 0.09, gain: 0.1, attack: 0.007, type: 'sine' });
        this.tone({ frequency: 523.25, duration: 0.06, gain: 0.035, delay: 0.018, attack: 0.005, type: 'sine' });
      } else if (event.type === 'paused') {
        this.tone({ frequency: 293.66, duration: 0.085, gain: 0.09, attack: 0.007, type: 'sine' });
        this.tone({ frequency: 220, duration: 0.07, gain: 0.045, delay: 0.018, attack: 0.006, type: 'sine' });
      } else if (event.type === 'restarted') {
        // The fresh 3-2-1 sequence owns restart feedback; another voice here would
        // double the first beat when the restarted event and digit 3 share a frame.
      }
    }
    this.playMutationActivations(mutationActivations);
  }

  /** Three discrete short beats make the countdown readable without a melody or release tail. */
  playEntryCountdown(digit: 3 | 2 | 1): void {
    if (!this.context || !this.master || !this.enabled) return;
    const profile = digit === 1
      ? { frequency: 659.25, duration: 0.24, gain: 0.13 }
      : { frequency: 440, duration: 0.105, gain: 0.105 };
    this.tone({
      frequency: profile.frequency,
      duration: profile.duration,
      gain: profile.gain,
      type: 'sine',
    });
    this.tone({
      frequency: profile.frequency * 2,
      duration: profile.duration * 0.58,
      gain: profile.gain * 0.16,
      type: 'sine',
    });
  }

  destroy(): void {
    this.stopMutationCue();
    this.stopMutationLoops(false);
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
    // The clear is the positive resolution of a placement. Consonant unbent voices
    // provide presence and tier identity without noise, a sub-boom, or a gain spike.
    profile.forEach((tone) => this.tone(tone));
  }

  private landingThump(): void {
    // A compact body plus a quiet contact overtone is audible without becoming the
    // former bass-heavy impact. A clear in the same batch suppresses both voices.
    this.tone({ frequency: 174.61, duration: 0.072, gain: 0.1, attack: 0.006, type: 'sine' });
    this.tone({ frequency: 349.23, duration: 0.038, gain: 0.03, delay: 0.004, attack: 0.004, type: 'sine' });
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
    return [...unique.values()];
  }

  private playMutationActivations(activations: readonly MutationActivation[]): void {
    if (!activations.length) return;
    this.stopMutationCue();
    activations.forEach((activation, index) => {
      this.mutationCue(activation, index * 0.045);
    });
  }

  private mutationCue(event: MutationActivation, delayOffset = 0): void {
    // Carrier geometry is immutable Core event data. It makes an unusually broad
    // activation slightly fuller without depending on renderer state or randomness.
    const carrierAccent = Math.min(1.1, 0.84 + Math.max(0, event.triggerCells?.length ?? 4) * 0.04);
    const token = MUTATION_VFX_TOKENS[event.item].audio;
    if (event.item === 'freeze') {
      // One clean glass tap marks the cold front. Ice has no sustained oscillator
      // and no second note that could turn simultaneous activations into a chime.
      this.tone({
        frequency: token.accentHz,
        duration: 0.078,
        gain: 0.1 * carrierAccent,
        delay: delayOffset,
        attack: 0.005,
        type: 'sine',
      }, true);
      return;
    }
    if (event.item === 'collapse') {
      // A rounded two-part weight cue reads as a column settling without triangle buzz.
      this.tone({ frequency: token.activateHz, duration: 0.09, gain: 0.25 * carrierAccent, delay: delayOffset, attack: 0.008, type: 'sine' }, true);
      this.tone({ frequency: token.accentHz, duration: 0.12, gain: 0.17 * carrierAccent, delay: delayOffset + 0.018, attack: 0.009, type: 'sine' }, true);
      return;
    }
    if (event.item === 'bomb') {
      // A rounded bass bloom plus a low-passed deterministic air puff, not a harsh
      // full-band sweep. The buffer is generated locally and contains no sample asset.
      this.tone({ frequency: token.activateHz, duration: 0.16, gain: 0.32 * carrierAccent, delay: delayOffset, attack: 0.006, type: 'sine' }, true);
      this.noisePuff({ duration: 0.075, gain: 0.12 * carrierAccent, delay: delayOffset + 0.006, cutoff: 640 });
      return;
    }
    if (event.item === 'reshape') {
      // Three quick, consonant facets make the board rewrite explicit without a
      // long success jingle or a confusing copy of the multiplier material.
      [440, 554.37, 659.25].forEach((frequency, index) => {
        this.tone({ frequency, duration: 0.105, gain: (0.14 - index * 0.018) * carrierAccent, delay: delayOffset + index * 0.035, attack: 0.005, type: 'sine' }, true);
      });
      return;
    }
    // Double is a compact marimba dyad. Super Double adds one clean octave above it;
    // subsequent carriers remain Super Double in Core and keep this signature.
    this.mutationMarimbaStrike(token.activateHz, 0.165 * carrierAccent, delayOffset);
    this.mutationMarimbaStrike(token.accentHz, 0.145 * carrierAccent, delayOffset + 0.052);
    if (event.multiplierFactor === 4) {
      this.mutationMarimbaStrike(token.activateHz * 2, 0.12 * carrierAccent, delayOffset + 0.104);
    }
  }

  /**
   * Runtime supplies only Core timer state. These low-level, original voices
   * are not music: they are quiet material ambience while a timed mutation is
   * active, and stop immediately at its deterministic expiry.
   */
  syncMutationState(state: GameState): void {
    const desired: Array<{ item: MutationLoopItem; active: boolean }> = [
      { item: 'collapse', active: state.mode === 'sprint' && state.mutationCollapseTicks > 0 },
    ];
    for (const { item, active } of desired) {
      if (active && !this.mutationLoops.has(item)) this.startMutationLoop(item);
      if (!active && this.mutationLoops.has(item)) this.stopMutationLoop(item, true);
    }
  }

  private startMutationLoop(item: MutationLoopItem): void {
    const context = this.context;
    const effects = this.effects;
    const profile = MUTATION_VFX_TOKENS[item].audio;
    if (!this.enabled || !context || !effects || !profile.loopHz || this.voices >= 16) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    oscillator.type = item === 'collapse' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(profile.loopHz, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, profile.loopGain), start + .08);
    oscillator.connect(gain);
    gain.connect(effects);
    const voice: MutationLoopVoice = { source: oscillator, gain };
    this.mutationLoops.set(item, voice);
    this.voices += 1;
    oscillator.start(start);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.voices = Math.max(0, this.voices - 1);
      if (this.mutationLoops.get(item) === voice) this.mutationLoops.delete(item);
    };
  }

  private stopMutationLoop(item: MutationLoopItem, playEnd: boolean): void {
    const voice = this.mutationLoops.get(item);
    if (!voice) return;
    this.mutationLoops.delete(item);
    try {
      voice.source.stop();
    } catch {
      // A muted or closed context can already have stopped the oscillator.
    }
    const profile = MUTATION_VFX_TOKENS[item].audio;
    if (playEnd && this.enabled && profile.endHz) {
      this.tone({ frequency: profile.endHz, duration: .075, gain: profile.gain * .52, endFrequency: profile.endHz * .86, type: 'sine' });
    }
  }

  private stopMutationLoops(playEnd: boolean): void {
    for (const item of [...this.mutationLoops.keys()]) this.stopMutationLoop(item, playEnd);
  }

  private mutationMarimbaStrike(frequency: number, gain: number, delay: number): void {
    this.tone({ frequency, duration: 0.145, gain, delay, type: 'triangle' }, true);
    this.tone({ frequency: frequency * BRIGHT_PARTIAL_RATIO, duration: 0.096, gain: gain * 0.22, delay, type: 'sine' }, true);
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
    const peakGain = Math.max(0.0001, Math.min(VOICE_GAIN_CEILING, options.gain * VOICE_GAIN_BOOST));
    gain.gain.exponentialRampToValueAtTime(
      peakGain,
      start + Math.min(options.attack ?? 0.012, options.duration * 0.25),
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

  private noisePuff(options: Pick<ToneOptions, 'duration' | 'gain' | 'delay'> & { cutoff?: number }): void {
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
    gain.connect(effects);
    const voice: EffectVoice = { source, gain };
    this.mutationVoices.push(voice);
    this.voices += 1;
    source.start(start);
    source.stop(end + 0.01);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
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
