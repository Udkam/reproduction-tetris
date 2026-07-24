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

/** A short-lived foreground voice, including the occasional buffer-noise puff. */
interface EffectVoice {
  source: AudioScheduledSourceNode;
  gain: GainNode;
}

type MutationActivation = Extract<GameEvent, { type: 'mutation-activated' }>;

/** Full-volume mix gain is deliberately above unity, then safely contained by the compressor. */
const FULL_VOLUME_MASTER_GAIN = 1.7;
const VOICE_GAIN_CEILING = 0.5;
const VOICE_GAIN_BOOST = 1.3;
const BRIGHT_PARTIAL_RATIO = 2.01;

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private enabled = true;
  private mutationVoices: EffectVoice[] = [];
  private volume = 1;
  private lastMoveAt = 0;
  private lastSoftDropAt = 0;
  private voices = 0;

  constructor(private readonly platform: BrowserPlatform = browserPlatform) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
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
    this.stopMutationCue();
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
