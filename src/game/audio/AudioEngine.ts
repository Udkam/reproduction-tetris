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
const FULL_VOLUME_MASTER_GAIN = 1.7;
const VOICE_GAIN_CEILING = 0.5;
const VOICE_GAIN_BOOST = 1.3;
const BRIGHT_PARTIAL_RATIO = 2.01;
const MOVE_CUE_MIN_INTERVAL_MS = 60;

const CLEAR_CUE_PROFILES: Readonly<Record<1 | 2 | 3 | 4, readonly ToneOptions[]>> = Object.freeze({
  1: Object.freeze([
    Object.freeze({ frequency: 293.66, duration: 0.07, gain: 0.045, type: 'sine' as const }),
  ]),
  2: Object.freeze([
    Object.freeze({ frequency: 277.18, duration: 0.08, gain: 0.043, type: 'sine' as const }),
    Object.freeze({ frequency: 349.23, duration: 0.075, gain: 0.035, delay: 0.022, type: 'sine' as const }),
  ]),
  3: Object.freeze([
    Object.freeze({ frequency: 261.63, duration: 0.09, gain: 0.045, type: 'sine' as const }),
    Object.freeze({ frequency: 329.63, duration: 0.085, gain: 0.036, delay: 0.023, type: 'sine' as const }),
    Object.freeze({ frequency: 392, duration: 0.08, gain: 0.028, delay: 0.046, type: 'sine' as const }),
  ]),
  4: Object.freeze([
    Object.freeze({ frequency: 246.94, duration: 0.1, gain: 0.048, type: 'sine' as const }),
    Object.freeze({ frequency: 329.63, duration: 0.095, gain: 0.038, delay: 0.02, type: 'sine' as const }),
    Object.freeze({ frequency: 415.3, duration: 0.09, gain: 0.03, delay: 0.04, type: 'sine' as const }),
    Object.freeze({ frequency: 493.88, duration: 0.11, gain: 0.024, delay: 0.065, type: 'sine' as const }),
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
    const mutationActivations = this.uniqueMutationActivations(events);
    const hasMutationActivation = mutationActivations.length > 0;
    for (const event of events) {
      if (event.type === 'piece-moved' && event.cause === 'move') {
        const now = this.platform.now();
        if (now - this.lastMoveAt >= MOVE_CUE_MIN_INTERVAL_MS) {
          this.tone({ frequency: 196, duration: 0.05, gain: 0.05, type: 'sine' });
          this.lastMoveAt = now;
        }
      } else if (event.type === 'piece-moved' && event.cause === 'soft-drop') {
        const now = this.platform.now();
        if (now - this.lastSoftDropAt > 52) {
          this.tone({ frequency: 184, duration: 0.032, gain: 0.13, endFrequency: 170, type: 'triangle' });
          this.lastSoftDropAt = now;
        }
      } else if (event.type === 'piece-rotated') {
        this.tone({ frequency: 330, duration: 0.06, gain: 0.08, type: 'sine' });
      } else if (event.type === 'hard-dropped') {
        this.landingThump();
      } else if (event.type === 'piece-locked' && !includesHardDrop) {
        this.tone({ frequency: 220, duration: 0.035, gain: 0.045, type: 'sine' });
      } else if (event.type === 'lines-cleared') {
        // A material trigger is the player-facing resolution of this clear. Let it
        // speak on its own rather than stacking a clear chord into the same transient.
        if (!hasMutationActivation) this.clearChord(event.count);
      } else if (event.type === 'bedrock-raised') {
        this.tone({ frequency: 92, duration: 0.17, gain: 0.23, endFrequency: 78, type: 'sine' });
      } else if (event.type === 'bedrock-lowered') {
        this.tone({ frequency: 220, duration: 0.12, gain: 0.2, endFrequency: 278, type: 'sine' });
      } else if (event.type === 'survival-stones-warned') {
        // One dry rising chirp identifies the announced source column. It has no
        // loop or follow-up voice, so the 800 ms visual lead stays calm and legible.
        this.tone({ frequency: 540, duration: 0.065, gain: 0.16, endFrequency: 760, type: 'triangle' });
      } else if (event.type === 'level-up') {
        [330, 495, 660].forEach((frequency, index) => this.tone({ frequency, duration: 0.13, gain: 0.18, delay: index * 0.055, type: 'sine' }));
      } else if (event.type === 'finished') {
        [392, 494, 587].forEach((frequency, index) => this.tone({ frequency, duration: 0.18, gain: 0.19, delay: index * 0.06, type: 'sine' }));
      } else if (event.type === 'game-over') {
        [174, 131, 98].forEach((frequency, index) => this.tone({ frequency, duration: 0.17, gain: 0.19, delay: index * 0.12, type: 'sine' }));
      } else if (event.type === 'started') {
        // The cover exits silently after the third short countdown beat.
      } else if (event.type === 'resumed') {
        this.tone({ frequency: 329.63, duration: 0.075, gain: 0.075, type: 'sine' });
      } else if (event.type === 'paused') {
        this.tone({ frequency: 246.94, duration: 0.07, gain: 0.065, type: 'sine' });
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
    // A clear is a compact confirmation, not a melody: every tier stays below
    // 500 Hz, uses unbent sine voices, and gains distinction through a short
    // stagger rather than a louder transient or an explosive noise layer.
    profile.forEach((tone) => this.tone(tone));
  }

  private landingThump(): void {
    // One rounded contact keeps hard drop present without the former stacked,
    // bass-heavy impact. Its short envelope prevents an electrical hum.
    this.tone({ frequency: 185, duration: 0.055, gain: 0.095, type: 'sine' });
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
      // One quiet glass tap marks the cold front. Ice has no sustained oscillator
      // and no second note that could turn simultaneous activations into a chime.
      this.tone({
        frequency: token.accentHz,
        duration: 0.062,
        gain: 0.072 * carrierAccent,
        delay: delayOffset,
        type: 'sine',
      }, true);
      return;
    }
    if (event.item === 'collapse') {
      // A short, dry two-part thud with no moving pitch reads as a column settling.
      this.tone({ frequency: token.activateHz, duration: 0.075, gain: 0.22 * carrierAccent, delay: delayOffset, type: token.waveform }, true);
      this.tone({ frequency: token.accentHz, duration: 0.1, gain: 0.13 * carrierAccent, delay: delayOffset + 0.018, type: token.waveform }, true);
      return;
    }
    if (event.item === 'bomb') {
      // A rounded bass bloom plus a tiny deterministic noise puff, not a harsh buzzy
      // sweep. The noise buffer is generated locally and contains no sampled asset.
      this.tone({ frequency: token.activateHz, duration: 0.14, gain: 0.27 * carrierAccent, delay: delayOffset, type: token.waveform }, true);
      this.noisePuff({ duration: 0.065, gain: 0.095 * carrierAccent, delay: delayOffset + 0.006 });
      return;
    }
    // Double is a compact marimba dyad. Super Double adds one clean octave above it;
    // subsequent carriers remain Super Double in Core and keep this signature.
    this.mutationMarimbaStrike(token.activateHz, 0.14 * carrierAccent, delayOffset);
    this.mutationMarimbaStrike(token.accentHz, 0.125 * carrierAccent, delayOffset + 0.052);
    if (event.multiplierFactor === 4) {
      this.mutationMarimbaStrike(token.activateHz * 2, 0.105 * carrierAccent, delayOffset + 0.104);
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
