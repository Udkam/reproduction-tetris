import type { GameEvent, GameState, MutationItem } from '../core';
import { browserPlatform, type BrowserPlatform } from '../../platform/browserPlatform';
import type { VisualThemeId } from '../../design/visualThemes';
import {
  scheduleGesture,
  type AudioBus,
  type GestureVoice,
} from './audioGesture';
import { audioCue, type AudioCueId } from './audioPalette';

type MutationActivation = Extract<GameEvent, { type: 'mutation-activated' }>;

interface AmbientProfile {
  filter: BiquadFilterType;
  cutoff: number;
  q: number;
  gain: number;
  seed: number;
}

interface AmbientVoice {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

const FULL_VOLUME_MASTER_GAIN = 1.42;
const MOVE_CUE_MIN_INTERVAL_MS = 58;
const SOFT_DROP_CUE_MIN_INTERVAL_MS = 48;
const MAX_EFFECT_VOICES = 16;
const AUDIO_BUSES: readonly AudioBus[] = Object.freeze([
  'gameplay',
  'reward',
  'mutation',
  'ambient',
  'ui',
]);
const AUDIO_BUS_GAINS: Readonly<Record<AudioBus, number>> = Object.freeze({
  gameplay: 0.9,
  reward: 1,
  mutation: 0.96,
  ambient: 0.14,
  ui: 0.7,
});
const AMBIENT_PROFILES: Readonly<Record<VisualThemeId, AmbientProfile>> = Object.freeze({
  'deep-tide': Object.freeze({ filter: 'lowpass', cutoff: 180, q: 0.42, gain: 0.018, seed: 0xdee71de }),
  'mineral-mist': Object.freeze({ filter: 'bandpass', cutoff: 680, q: 0.52, gain: 0.011, seed: 0x51a71e }),
  sunstone: Object.freeze({ filter: 'lowpass', cutoff: 360, q: 0.38, gain: 0.014, seed: 0x5a5710 }),
});
const MUTATION_CUE_ORDER: Readonly<Record<MutationItem, number>> = Object.freeze({
  bomb: 0,
  freeze: 1,
  collapse: 2,
  multiplier: 3,
});

function fillDeterministicAir(target: Float32Array, seed: number): void {
  let state = seed >>> 0;
  let smoothed = 0;
  for (let index = 0; index < target.length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const white = ((state >>> 0) / 2147483648) - 1;
    smoothed += (white - smoothed) * 0.08;
    target[index] = smoothed;
  }
  const seam = Math.min(Math.floor(target.length / 4), 12_000);
  for (let index = 0; index < seam; index += 1) {
    const mix = index / Math.max(1, seam - 1);
    const endIndex = target.length - seam + index;
    const blended = target[index] * (1 - mix) + target[endIndex] * mix;
    target[index] = blended;
    target[endIndex] = blended;
  }
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private buses: Partial<Record<AudioBus, GainNode>> = {};
  private enabled = true;
  private volume = 1;
  private lastMoveAt = Number.NEGATIVE_INFINITY;
  private lastSoftDropAt = Number.NEGATIVE_INFINITY;
  private ambientTheme: VisualThemeId | null = null;
  private ambientVoice: AmbientVoice | null = null;
  private readonly activeVoices = new Set<GestureVoice>();
  private readonly mutationVoices = new Set<GestureVoice>();

  constructor(private readonly platform: BrowserPlatform = browserPlatform) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) this.ensureAmbientLayer();
    else {
      this.stopMutationCue();
      this.stopAmbientLayer();
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

  getVolume(): number { return this.volume; }
  isEnabled(): boolean { return this.enabled; }

  async prime(): Promise<void> {
    if (!this.enabled) return;
    if (!this.context) {
      const context = this.platform.createAudioContext();
      if (!context) return;
      this.context = context;
      this.master = context.createGain();
      this.effects = context.createGain();
      this.compressor = context.createDynamicsCompressor();
      for (const name of AUDIO_BUSES) {
        const bus = context.createGain();
        bus.gain.value = AUDIO_BUS_GAINS[name];
        bus.connect(this.effects);
        this.buses[name] = bus;
      }
      this.compressor.threshold.value = -3;
      this.compressor.knee.value = 5;
      this.compressor.ratio.value = 2.2;
      this.compressor.attack.value = 0.007;
      this.compressor.release.value = 0.19;
      this.applyMasterGain();
      this.applyEffectsGain();
      this.effects.connect(this.master);
      this.master.connect(this.compressor);
      this.compressor.connect(context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.ensureAmbientLayer();
  }

  suspend(): void { void this.context?.suspend(); }

  play(events: readonly GameEvent[]): void {
    if (!this.context || !this.master || !this.enabled) return;
    const includesHardDrop = events.some((event) => event.type === 'hard-dropped');
    const includesLineClear = events.some((event) => event.type === 'lines-cleared');
    const includesCompletion = events.some((event) => event.type === 'finished');
    const includesGameOver = events.some((event) => event.type === 'game-over');
    const includesLevelUp = events.some((event) => event.type === 'level-up');
    const mutationActivations = this.uniqueMutationActivations(events);
    const hasMutationActivation = mutationActivations.length > 0;
    const hasHigherResolution = hasMutationActivation || includesCompletion || includesGameOver || includesLevelUp;
    const hasResolution = includesLineClear || hasHigherResolution;

    for (const event of events) {
      if (event.type === 'piece-moved' && event.cause === 'move') {
        const now = this.platform.now();
        if (now - this.lastMoveAt >= MOVE_CUE_MIN_INTERVAL_MS) {
          this.playCue('move');
          this.lastMoveAt = now;
        }
      } else if (event.type === 'piece-moved' && event.cause === 'soft-drop') {
        const now = this.platform.now();
        if (now - this.lastSoftDropAt >= SOFT_DROP_CUE_MIN_INTERVAL_MS) {
          this.playCue('soft-drop');
          this.lastSoftDropAt = now;
        }
      } else if (event.type === 'piece-rotated') {
        this.playCue('rotate');
      } else if (event.type === 'hard-dropped') {
        if (!hasResolution) this.playCue('hard-drop');
      } else if (event.type === 'piece-locked' && !includesHardDrop && !hasResolution) {
        this.playCue('lock');
      } else if (event.type === 'puzzle-undone') {
        this.playCue('puzzle-undo');
      } else if (event.type === 'lines-cleared') {
        if (!hasHigherResolution) this.playClear(event.count);
      } else if (event.type === 'bedrock-raised') {
        this.playCue('bedrock-rise');
      } else if (event.type === 'bedrock-lowered') {
        this.playCue('bedrock-lower');
      } else if (event.type === 'survival-stones-warned') {
        this.playCue('stone-warning');
      } else if (event.type === 'survival-stones-spawned') {
        this.playCue('stone-spawn');
      } else if (event.type === 'survival-stones-landed') {
        this.playCue('stone-land');
      } else if (event.type === 'level-up' && !hasMutationActivation) {
        this.playCue('level-up');
      } else if (event.type === 'finished' && !hasMutationActivation) {
        this.playCue('finished');
      } else if (event.type === 'game-over' && !hasMutationActivation) {
        this.playCue('game-over');
      } else if (event.type === 'paused') {
        this.playCue('pause');
      } else if (event.type === 'resumed') {
        this.playCue('resume');
      }
      // started and restarted stay silent: the entry countdown owns those frames.
    }
    this.playMutationActivations(mutationActivations);
  }

  playEntryCountdown(digit: 3 | 2 | 1): void {
    this.playCue(digit === 1 ? 'countdown-resolve' : 'countdown-tick');
  }

  /** Timed states never own a sustained foreground voice. */
  syncMutationState(_state: GameState): void {}

  destroy(): void {
    this.stopMutationCue();
    this.stopAmbientLayer();
    for (const voice of [...this.activeVoices]) {
      voice.stop(this.context?.currentTime);
      voice.disconnect();
    }
    this.activeVoices.clear();
    for (const name of AUDIO_BUSES) this.buses[name]?.disconnect();
    this.buses = {};
    this.effects?.disconnect();
    this.master?.disconnect();
    this.compressor?.disconnect();
    this.effects = null;
    this.master = null;
    this.compressor = null;
    const context = this.context;
    this.context = null;
    if (context) void context.close();
  }

  private playClear(count: number): void {
    if (!Number.isInteger(count) || count < 1) return;
    const tier = Math.min(4, count) as 1 | 2 | 3 | 4;
    this.playCue(`clear-${tier}`);
  }

  private playCue(id: AudioCueId, delay = 0): void {
    const context = this.context;
    const cue = audioCue(id);
    const destination = this.buses[cue.bus];
    const available = MAX_EFFECT_VOICES - this.activeVoices.size;
    if (!context || !destination || available <= 0 || !this.enabled) return;
    scheduleGesture(context, destination, cue, {
      startAt: context.currentTime + delay,
      maxVoices: available,
      onVoiceStart: (voice) => {
        this.activeVoices.add(voice);
        if (cue.mutationOwned) this.mutationVoices.add(voice);
      },
      onVoiceEnd: (voice) => {
        this.activeVoices.delete(voice);
        this.mutationVoices.delete(voice);
      },
    });
  }

  private uniqueMutationActivations(events: readonly GameEvent[]): MutationActivation[] {
    const unique = new Map<MutationItem, MutationActivation>();
    for (const event of events) {
      if (event.type !== 'mutation-activated') continue;
      const previous = unique.get(event.item);
      if (!previous || (
        event.item === 'multiplier'
        && (event.multiplierFactor ?? 2) > (previous.multiplierFactor ?? 2)
      )) unique.set(event.item, event);
    }
    return [...unique.values()].sort((left, right) => (
      MUTATION_CUE_ORDER[left.item] - MUTATION_CUE_ORDER[right.item]
    ));
  }

  private playMutationActivations(activations: readonly MutationActivation[]): void {
    activations.forEach((event, index) => {
      const id: AudioCueId = event.item === 'freeze'
        ? 'freeze'
        : event.item === 'collapse'
          ? 'supergravity'
          : event.item === 'bomb'
            ? 'bomb'
            : event.multiplierFactor === 4 ? 'multiplier-4' : 'multiplier-2';
      this.playCue(id, index * 0.035);
    });
  }

  private stopMutationCue(): void {
    for (const voice of [...this.mutationVoices]) {
      voice.stop(this.context?.currentTime);
      voice.disconnect();
      this.activeVoices.delete(voice);
    }
    this.mutationVoices.clear();
  }

  private ensureAmbientLayer(): void {
    const context = this.context;
    const destination = this.buses.ambient;
    const theme = this.ambientTheme;
    if (!this.enabled || !context || !destination || !theme || this.ambientVoice) return;
    const profile = AMBIENT_PROFILES[theme];
    const frames = Math.max(1, Math.round(context.sampleRate * 4));
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    fillDeterministicAir(buffer.getChannelData(0), profile.seed);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = profile.filter;
    filter.frequency.setValueAtTime(profile.cutoff, context.currentTime);
    filter.Q.setValueAtTime(profile.q, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(profile.gain, context.currentTime + 0.8);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(context.currentTime);
    this.ambientVoice = { source, filter, gain };
  }

  private stopAmbientLayer(): void {
    const voice = this.ambientVoice;
    if (!voice) return;
    try { voice.source.stop((this.context?.currentTime ?? 0) + 0.05); } catch { /* already stopped */ }
    voice.source.disconnect();
    voice.filter.disconnect();
    voice.gain.disconnect();
    this.ambientVoice = null;
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
