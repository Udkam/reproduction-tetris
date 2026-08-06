import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';
import { createBrowserPlatform } from '../../platform/browserPlatform';
import { createInitialState, type GameEvent } from '../core';

class FakeAudioParam {
  value = 0;
  readonly setValues: number[] = [];
  readonly ramps: number[] = [];
  readonly rampTimes: number[] = [];
  readonly targets: Array<{ value: number; time: number; constant: number }> = [];

  setValueAtTime(value: number): void {
    this.value = value;
    this.setValues.push(value);
  }

  exponentialRampToValueAtTime(value: number, time = 0): void {
    this.value = value;
    this.ramps.push(value);
    this.rampTimes.push(time);
  }

  setTargetAtTime(value: number, time: number, constant: number): void {
    this.value = value;
    this.targets.push({ value, time, constant });
  }
}

class FakeGain {
  readonly gain = new FakeAudioParam();
  readonly connections: unknown[] = [];
  connect(target?: unknown): void { this.connections.push(target); }
  disconnect(): void {}
}

class FakeOscillator {
  type: OscillatorType = 'sine';
  readonly frequency = new FakeAudioParam();
  onended: (() => void) | null = null;
  readonly starts: number[] = [];
  readonly stops: number[] = [];

  connect(): void {}
  disconnect(): void {}
  start(time = 0): void { this.starts.push(time); }
  stop(time = 0): void { this.stops.push(time); this.onended?.(); }
}

class FakeAudioBuffer {
  readonly channel: Float32Array;

  constructor(frames: number) {
    this.channel = new Float32Array(frames);
  }

  getChannelData(): Float32Array {
    return this.channel;
  }
}

class FakeBufferSource {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  readonly stops: number[] = [];

  connect(): void {}
  disconnect(): void {}
  start(): void {}
  stop(time = 0): void { this.stops.push(time); this.onended?.(); }
}

class FakeBiquadFilter {
  type: BiquadFilterType = 'lowpass';
  readonly frequency = new FakeAudioParam();
  readonly Q = new FakeAudioParam();

  connect(): void {}
  disconnect(): void {}
}

class FakeCompressor {
  readonly threshold = new FakeAudioParam();
  readonly knee = new FakeAudioParam();
  readonly ratio = new FakeAudioParam();
  readonly attack = new FakeAudioParam();
  readonly release = new FakeAudioParam();
  connect(): void {}
  disconnect(): void {}
}

const oscillators: FakeOscillator[] = [];
const gains: FakeGain[] = [];
const noiseSources: FakeBufferSource[] = [];
const filters: FakeBiquadFilter[] = [];
let audioContextCloseCalls = 0;
let audioContextSuspendCalls = 0;

const scheduledVoiceGains = (): FakeGain[] => (
  gains.filter((gain) => gain.gain.rampTimes.length > 0)
);

class FakeAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  readonly sampleRate = 48_000;
  readonly destination = {} as AudioDestinationNode;

  createGain(): GainNode {
    const gain = new FakeGain();
    gains.push(gain);
    return gain as unknown as GainNode;
  }

  createDynamicsCompressor(): DynamicsCompressorNode {
    return new FakeCompressor() as unknown as DynamicsCompressorNode;
  }

  createOscillator(): OscillatorNode {
    const oscillator = new FakeOscillator();
    oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createBuffer(_channels: number, frames: number): AudioBuffer {
    return new FakeAudioBuffer(frames) as unknown as AudioBuffer;
  }

  createBufferSource(): AudioBufferSourceNode {
    const source = new FakeBufferSource();
    noiseSources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  createBiquadFilter(): BiquadFilterNode {
    const filter = new FakeBiquadFilter();
    filters.push(filter);
    return filter as unknown as BiquadFilterNode;
  }

  async resume(): Promise<void> {}
  async suspend(): Promise<void> { audioContextSuspendCalls += 1; }
  async close(): Promise<void> { audioContextCloseCalls += 1; }
}

interface ScheduledTimer {
  callback: () => void;
  delay: number;
}

function createTimedAudio(): { audio: AudioEngine; timers: Map<number, ScheduledTimer> } {
  const timers = new Map<number, ScheduledTimer>();
  let nextTimer = 1;
  const timerWindow = {
    setTimeout(callback: () => void, delay: number): number {
      const id = nextTimer;
      nextTimer += 1;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id: number): void {
      timers.delete(id);
    },
  };
  const platform = createBrowserPlatform({
    window: timerWindow as unknown as Window,
    document: null,
    audioContextFactory: () => new FakeAudioContext() as unknown as AudioContext,
  });
  return { audio: new AudioEngine(platform), timers };
}

const carrierCells = [
  { x: 3, y: 18 },
  { x: 4, y: 18 },
  { x: 3, y: 19 },
  { x: 4, y: 19 },
] as const;

afterEach(() => {
  oscillators.length = 0;
  gains.length = 0;
  noiseSources.length = 0;
  filters.length = 0;
  audioContextCloseCalls = 0;
  audioContextSuspendCalls = 0;
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('AudioEngine complete feedback remaster', () => {
  it('routes five named buses beneath the shared effects path', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    expect(gains).toHaveLength(7);
    expect(gains.slice(2, 7).map((gain) => gain.gain.value)).toEqual([
      0.82, 0.94, 0.88, 0.18, 0.58,
    ]);
    expect(gains.slice(2, 7).every((gain) => gain.connections[0] === gains[1])).toBe(true);

    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);
    expect(scheduledVoiceGains().at(-1)?.connections[0]).toBe(gains[2]);
    audio.play([{ type: 'lines-cleared', rows: [39], count: 1, score: 100 }]);
    expect(scheduledVoiceGains().at(-1)?.connections[0]).toBe(gains[3]);
    audio.play([{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells }]);
    expect(scheduledVoiceGains().at(-1)?.connections[0]).toBe(gains[4]);
    audio.play([{ type: 'paused' }]);
    expect(scheduledVoiceGains().at(-1)?.connections[0]).toBe(gains[6]);
    audio.destroy();
  });

  it('closes its owned AudioContext exactly once during idempotent teardown', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();

    await audio.prime();
    audio.destroy();
    audio.destroy();

    expect(audioContextCloseCalls).toBe(1);
  });

  it('plays 3-2-1 as three discrete transport beats with a longer resolving one', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.playEntryCountdown(3);
    audio.playEntryCountdown(2);
    audio.playEntryCountdown(1);

    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([
      392, 784,
      392, 784,
      587.33, 1174.66,
    ]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual([
      'triangle', 'sine',
      'triangle', 'sine',
      'triangle', 'sine',
    ]);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators.slice(0, 4).every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.14)).toBe(true);
    expect(oscillators.slice(4).every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.29)).toBe(true);
    expect(oscillators[0]?.stops[0]).toBe(oscillators[2]?.stops[0]);
    expect((oscillators[4]?.stops[0] ?? 0) > (oscillators[2]?.stops[0] ?? 1)).toBe(true);
    audio.setEnabled(false);
    audio.playEntryCountdown(1);
    expect(oscillators).toHaveLength(6);
    audio.destroy();
  });

  it('rate-limits fast horizontal movement to tactile unbent triangle ticks', async () => {
    let now = 100;
    const audio = new AudioEngine(createBrowserPlatform({
      audioContextFactory: () => new FakeAudioContext() as unknown as AudioContext,
      now: () => now,
    }));
    await audio.prime();

    const move = { type: 'piece-moved', piece: 'T', dx: 1, dy: 0, cause: 'move' } as const;
    audio.play([move]);
    now = 130;
    audio.play([move]);
    now = 160;
    audio.play([move]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([196, 196]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'triangle']);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    const voiceGains = scheduledVoiceGains();
    expect(voiceGains).toHaveLength(2);
    expect(voiceGains.every((gain) => Math.max(...gain.gain.ramps) <= 0.12)).toBe(true);
    audio.destroy();
  });

  it('uses a rounded two-voice rotation cue without pitch bends', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'piece-rotated', piece: 'T', direction: 1 }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([261.63, 392]);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'sine']);
    expect(oscillators.every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.1)).toBe(true);
    expect(scheduledVoiceGains().every((gain) => Math.max(...gain.gain.ramps) <= 0.18)).toBe(true);
    audio.destroy();
  });

  it('keeps restarted silent so countdown digit 3 is the sole first beat', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'restarted' }]);
    expect(oscillators).toHaveLength(0);
    audio.playEntryCountdown(3);
    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([392, 784]);
    audio.destroy();
  });

  it('keeps the cover exit silent after the short third countdown beat', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.playEntryCountdown(1);
    audio.play([{ type: 'started' }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([587.33, 1174.66]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'sine']);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators[0]?.stops[0]).toBeCloseTo(0.28, 4);
    expect(oscillators[1]?.stops[0]).toBeLessThan(0.18);
    expect(scheduledVoiceGains()[0]?.gain.rampTimes.at(-1)).toBeCloseTo(0.27, 4);
    expect(scheduledVoiceGains()[1]?.gain.rampTimes.at(-1)).toBeCloseTo(0.1566, 4);
    audio.destroy();
  });

  it('gives every live mutation material a concise, unbent original signature', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);

    const freeze = new AudioEngine();
    await freeze.prime();
    freeze.play([{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells }]);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([698.46, 1046.5]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'sine']);
    freeze.destroy();

    oscillators.length = 0;
    const collapse = new AudioEngine();
    await collapse.prime();
    collapse.play([{ type: 'mutation-activated', item: 'collapse', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells }]);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([196, 261.63]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'sine']);
    expect(oscillators.map((oscillator) => oscillator.frequency.ramps[0])).toEqual([130.81, 196]);
    collapse.destroy();

    oscillators.length = 0;
    const bomb = new AudioEngine();
    await bomb.prime();
    bomb.play([{ type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 300, rowsRemoved: 3, triggerCells: carrierCells }]);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([110]);
    expect(noiseSources).toHaveLength(1);
    expect(filters).toHaveLength(1);
    expect(filters[0]?.type).toBe('lowpass');
    expect(filters[0]?.frequency.setValues).toEqual([480]);
    expect(filters[0]?.Q.setValues).toEqual([0.7]);
    expect((noiseSources[0]?.buffer as unknown as FakeAudioBuffer).channel.some((sample) => sample !== 0)).toBe(true);
    bomb.destroy();

  });

  it('keeps Double compact and adds only a clean octave for Super Double', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const double = new AudioEngine();
    await double.prime();
    double.play([{ type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 2, triggerCells: carrierCells }]);
    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([523.25, 659.25]);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    double.destroy();

    oscillators.length = 0;
    const superDouble = new AudioEngine();
    await superDouble.prime();
    superDouble.play([{ type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 4, triggerCells: carrierCells }]);
    expect(oscillators).toHaveLength(3);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toContain(1046.5);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'triangle', 'sine']);
    superDouble.destroy();
  });

  it('keeps every timed mutation silent after its concise activation cue', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();
    const active = {
      ...createInitialState(0x51a1f00d, 'sprint'),
      mutationFreezeTicks: 600,
      mutationCollapsePiecesRemaining: 5,
      mutationMultiplierTicks: 600,
      mutationMultiplierFactor: 4 as const,
    };

    const voiceCount = oscillators.length;
    audio.syncMutationState(active);
    expect(oscillators).toHaveLength(voiceCount);

    audio.syncMutationState({
      ...active,
      mutationFreezeTicks: 0,
      mutationCollapsePiecesRemaining: 0,
      mutationMultiplierTicks: 0,
    });
    expect(oscillators).toHaveLength(voiceCount);
    audio.destroy();
  });

  it('plays every distinct same-frame mutation once and ignores duplicate item events', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
      { type: 'mutation-activated', item: 'collapse', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
      { type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 2, triggerCells: carrierCells },
    ]);

    const frequencies = oscillators.map((oscillator) => oscillator.frequency.setValues[0]);
    expect(frequencies.filter((frequency) => frequency === 698.46)).toHaveLength(1);
    expect(frequencies.filter((frequency) => frequency === 196)).toHaveLength(1);
    expect(frequencies.filter((frequency) => frequency === 261.63)).toHaveLength(1);
    expect(frequencies).toHaveLength(6);
    audio.destroy();
  });

  it('orders a dense mutation batch by impact without dropping a material or exceeding the voice ceiling', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([
      { type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 4, triggerCells: carrierCells },
      { type: 'mutation-activated', item: 'collapse', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
      { type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 300, rowsRemoved: 3, triggerCells: carrierCells },
    ]);

    const frequencies = oscillators.map((oscillator) => oscillator.frequency.setValues[0]);
    expect(frequencies[0]).toBe(110);
    expect(noiseSources).toHaveLength(1);
    expect(frequencies).toEqual([
      110,
      698.46, 1046.5,
      196, 261.63,
      523.25, 659.25, 1046.5,
    ]);
    expect(oscillators.length + noiseSources.length).toBeLessThanOrEqual(16);
    audio.destroy();
  });

  it('does not hard-cut a prior short mutation signature when another activation arrives', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells }]);
    const priorStops = oscillators.map((oscillator) => oscillator.stops.length);
    audio.play([{ type: 'mutation-activated', item: 'collapse', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells }]);

    expect(oscillators.slice(0, 2).map((oscillator) => oscillator.stops.length)).toEqual(priorStops);
    audio.destroy();
  });

  it('uses four clear-forward, bounded signatures and rejects invalid clear counts', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    const expectedFrequencies = [
      [392, 587.33],
      [349.23, 523.25, 698.46],
      [329.63, 415.3, 493.88, 659.25],
      [293.66, 440, 587.33, 739.99, 880],
    ];
    const tierPeakSums: number[] = [];

    expectedFrequencies.forEach((expected, index) => {
      const oscillatorStart = oscillators.length;
      const gainStart = gains.length;
      const count = index + 1;
      audio.play([{
        type: 'lines-cleared',
        rows: Array.from({ length: count }, (_, row) => 39 - row),
        count,
        score: count * 100,
      }]);

      const voices = oscillators.slice(oscillatorStart);
      const voiceGains = gains.slice(gainStart);
      expect(voices).toHaveLength(count + 1);
      expect(voices.map((oscillator) => oscillator.frequency.setValues[0])).toEqual(expected);
      expect(voices.every((oscillator) => oscillator.type === 'sine' || oscillator.type === 'triangle')).toBe(true);
      expect(voices.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
      expect(voices.every((oscillator) => (
        (oscillator.stops[0] ?? 1) - (oscillator.starts[0] ?? 0)
      ) <= 0.28)).toBe(true);
      expect(voiceGains).toHaveLength(count + 1);
      const peaks = voiceGains.map((gain) => Math.max(...gain.gain.ramps));
      expect(peaks.every((gain) => gain <= 0.3)).toBe(true);
      tierPeakSums.push(peaks.reduce((sum, gain) => sum + gain, 0));
    });

    expect(tierPeakSums[1]).toBeGreaterThan(tierPeakSums[0] ?? 0);
    expect(tierPeakSums[2]).toBeGreaterThan(tierPeakSums[1] ?? 0);
    expect(tierPeakSums[3]).toBeGreaterThan(tierPeakSums[2] ?? 0);

    const beforeInvalid = oscillators.length;
    audio.play([{ type: 'lines-cleared', rows: [], count: 0, score: 0 }]);
    audio.play([{ type: 'lines-cleared', rows: [35, 36, 37, 38, 39], count: 5, score: 0 }]);
    expect(oscillators).toHaveLength(beforeInvalid);
    audio.destroy();
  });

  it('keeps a one-line clear stronger in aggregate than a hard-drop contact', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const hardDrop = new AudioEngine();
    await hardDrop.prime();
    hardDrop.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);
    const hardDropEnergy = scheduledVoiceGains().reduce(
      (sum, gain) => sum + Math.max(...gain.gain.ramps),
      0,
    );
    hardDrop.destroy();

    oscillators.length = 0;
    gains.length = 0;
    const clear = new AudioEngine();
    await clear.prime();
    clear.play([{ type: 'lines-cleared', rows: [39], count: 1, score: 100 }]);
    const clearEnergy = scheduledVoiceGains().reduce(
      (sum, gain) => sum + Math.max(...gain.gain.ramps),
      0,
    );

    expect(clearEnergy).toBeGreaterThan(hardDropEnergy);
    clear.destroy();
  });

  it('keeps a single clear materially stronger and fuller than a routine move tick', async () => {
    let now = 100;
    const audio = new AudioEngine(createBrowserPlatform({
      audioContextFactory: () => new FakeAudioContext() as unknown as AudioContext,
      now: () => now,
    }));
    await audio.prime();

    audio.play([{ type: 'piece-moved', piece: 'T', dx: 1, dy: 0, cause: 'move' }]);
    const movePeak = Math.max(...(gains.at(-1)?.gain.ramps ?? []));
    const clearGainStart = gains.length;
    now += 100;
    audio.play([{ type: 'lines-cleared', rows: [39], count: 1, score: 100 }]);
    const clearPeaks = gains.slice(clearGainStart).map((gain) => Math.max(...gain.gain.ramps));

    expect(clearPeaks).toHaveLength(2);
    expect(Math.max(...clearPeaks)).toBeGreaterThan(movePeak * 1.35);
    expect(clearPeaks.reduce((sum, peak) => sum + peak, 0)).toBeGreaterThan(movePeak * 1.7);
    audio.destroy();
  });

  it('gives a same-frame mutation precedence over a clear chord without creating background voices', async () => {
    const { audio, timers } = createTimedAudio();
    await audio.prime();
    audio.play([{ type: 'started' }]);
    const foregroundBefore = oscillators.length;

    audio.play([
      { type: 'lines-cleared', rows: [39], count: 1, score: 40 },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
    ]);

    // Ice's compact two-voice crystal remains; the ordinary clear cue is absent.
    expect(oscillators).toHaveLength(foregroundBefore + 2);
    expect(timers.size).toBe(0);
    audio.destroy();
  });

  it('lets a same-frame mutation replace level, completion, and game-over resolution cues', async () => {
    const lowerResolutionEvents: readonly GameEvent[] = [
      { type: 'level-up', level: 2 },
      { type: 'finished', completionTicks: 120 },
      { type: 'game-over', reason: 'block-out' },
    ];

    for (const lowerResolutionEvent of lowerResolutionEvents) {
      oscillators.length = 0;
      gains.length = 0;
      const audio = new AudioEngine(createBrowserPlatform({
        audioContextFactory: () => new FakeAudioContext() as unknown as AudioContext,
      }));
      await audio.prime();
      audio.play([
        lowerResolutionEvent,
        { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
      ]);

      expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([
        698.46, 1046.5,
      ]);
      audio.destroy();
    }
  });

  it('lets a clear own the placement resolution instead of stacking landing or lock taps', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([
      { type: 'hard-dropped', piece: 'I', distance: 14 },
      { type: 'piece-locked', piece: 'I', cells: [] },
      { type: 'lines-cleared', rows: [36, 37, 38, 39], count: 4, score: 1200 },
    ]);

    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([
      293.66, 440, 587.33, 739.99, 880,
    ]);
    expect(oscillators.some((oscillator) => oscillator.frequency.setValues[0] === 174.61)).toBe(false);
    audio.destroy();
  });

  it('lets Puzzle completion replace rather than stack an ordinary clear cadence', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([
      { type: 'lines-cleared', rows: [39], count: 1, score: 40 },
      { type: 'finished', completionTicks: 120 },
    ]);

    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([
      392, 493.88, 659.25, 783.99, 987.77,
    ]);
    audio.destroy();
  });

  it('uses a compact two-voice hard-drop contact without a bass-heavy tail', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }, { type: 'piece-locked', piece: 'T', cells: [] }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([146.83, 293.66]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'sine']);
    expect(oscillators[0]?.frequency.ramps).toEqual([130.81]);
    expect(oscillators.every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.12)).toBe(true);
    expect(scheduledVoiceGains().every((gain) => Math.max(...gain.gain.ramps) <= 0.27)).toBe(true);
    audio.destroy();
  });

  it('keeps ordinary gravity lock quieter and shorter than hard drop', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'piece-locked', piece: 'T', cells: [] }]);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.type).toBe('triangle');
    expect(oscillators[0]?.frequency.setValues).toEqual([220]);
    expect(oscillators[0]?.frequency.ramps).toEqual([]);
    expect(oscillators[0]?.stops[0]).toBeLessThanOrEqual(0.07);
    expect(Math.max(...(scheduledVoiceGains()[0]?.gain.ramps ?? []))).toBeLessThanOrEqual(0.12);
    audio.destroy();
  });

  it('gives Puzzle undo and Survival stone motion distinct concise cues', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'puzzle-undone' }]);
    audio.play([{ type: 'survival-stones-spawned', cells: [{ x: 3, y: 0 }], intervalPieces: 8, nextIntervalPieces: 8 }]);
    audio.play([{ type: 'survival-stones-landed', cells: [{ x: 3, y: 12 }] }]);

    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([
      440, 659.25, 349.23, 523.25, 123.47, 246.94,
    ]);
    expect(oscillators[0]?.frequency.ramps).toEqual([329.63]);
    expect(oscillators[1]?.frequency.ramps).toEqual([493.88]);
    expect(oscillators[2]?.frequency.ramps).toEqual([220]);
    expect(oscillators[3]?.frequency.ramps).toEqual([329.63]);
    expect(oscillators[4]?.frequency.ramps).toEqual([110]);
    audio.destroy();
  });

  it('announces Survival rockfall with two rounded non-looping rises', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{
      type: 'survival-stones-warned',
      columns: [3],
      height: 2,
      leadPieces: 1,
    }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.every((oscillator) => oscillator.type === 'triangle')).toBe(true);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([392, 523.25]);
    expect(oscillators.map((oscillator) => oscillator.frequency.ramps[0])).toEqual([523.25, 698.46]);
    audio.destroy();
  });

  it('gives every audible event family a bounded sine-or-triangle signature', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audibleCases: readonly GameEvent[][] = [
      [{ type: 'piece-moved', piece: 'T', dx: 1, dy: 0, cause: 'move' }],
      [{ type: 'piece-moved', piece: 'T', dx: 0, dy: 1, cause: 'soft-drop' }],
      [{ type: 'piece-rotated', piece: 'T', direction: 1 }],
      [{ type: 'hard-dropped', piece: 'T', distance: 12 }],
      [{ type: 'piece-locked', piece: 'T', cells: [] }],
      [{ type: 'puzzle-undone' }],
      [{ type: 'lines-cleared', rows: [39], count: 1, score: 40 }],
      [{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 }],
      [{ type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 300, rowsRemoved: 3 }],
      [{ type: 'bedrock-raised', count: 1, height: 11 }],
      [{ type: 'bedrock-lowered', count: 1, height: 10 }],
      [{ type: 'survival-stones-warned', columns: [3], height: 2, leadPieces: 1 }],
      [{ type: 'survival-stones-spawned', cells: [{ x: 3, y: 0 }], intervalPieces: 8, nextIntervalPieces: 8 }],
      [{ type: 'survival-stones-landed', cells: [{ x: 3, y: 12 }] }],
      [{ type: 'level-up', level: 1 }],
      [{ type: 'finished', completionTicks: 1 }],
      [{ type: 'game-over', reason: 'block-out' }],
      [{ type: 'paused' }],
      [{ type: 'resumed' }],
    ];

    for (const events of audibleCases) {
      oscillators.length = 0;
      noiseSources.length = 0;
      const audio = new AudioEngine();
      await audio.prime();
      const eventGainStart = gains.length;
      audio.play(events);

      expect(oscillators.length + noiseSources.length).toBeGreaterThan(0);
      expect(oscillators.every((oscillator) => (
        oscillator.type === 'sine' || oscillator.type === 'triangle'
      ))).toBe(true);
      expect(gains.slice(eventGainStart).every((gain) => (
        Math.max(...gain.gain.ramps) <= 0.46
      ))).toBe(true);
      audio.destroy();
    }
  });

  it('keeps started silent and uses present unbent pause/resume cover cadences', async () => {
    const { audio, timers } = createTimedAudio();
    await audio.prime();
    expect(oscillators).toHaveLength(0);

    audio.play([{ type: 'started' }]);
    expect(oscillators).toHaveLength(0);
    expect(timers.size).toBe(0);

    audio.play([{ type: 'paused' }, { type: 'resumed' }]);
    expect(oscillators).toHaveLength(4);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([329.63, 246.94, 329.63, 493.88]);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators.every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.12)).toBe(true);
    expect(scheduledVoiceGains().every((gain) => Math.max(...gain.gain.ramps) <= 0.2)).toBe(true);
    expect(timers.size).toBe(0);
    audio.destroy();
  });

  it('gives the 100% volume setting a boosted bounded master gain', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    expect(gains[0]?.gain.value).toBeGreaterThan(1);
    audio.setVolume(0.5);
    expect(gains[0]?.gain.value).toBeGreaterThan(0.5);
    expect(gains[0]?.gain.value).toBeLessThan(1);
    audio.destroy();
  });

  it('caps live voices at sixteen, then reuses capacity after scheduled voices end', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();
    const fourLineClear: GameEvent = {
      type: 'lines-cleared',
      rows: [36, 37, 38, 39],
      count: 4,
      score: 800,
    };

    audio.play([fourLineClear]);
    audio.play([fourLineClear]);
    audio.play([fourLineClear]);
    audio.play([fourLineClear]);
    expect(oscillators).toHaveLength(16);

    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);
    expect(oscillators).toHaveLength(16);

    oscillators.slice(0, 2).forEach((oscillator) => oscillator.onended?.());
    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);
    expect(oscillators).toHaveLength(18);
    expect(oscillators.slice(-2).map((oscillator) => oscillator.frequency.setValues[0])).toEqual([
      146.83, 293.66,
    ]);
    audio.destroy();
  });

  it('mutes and releases owned mutation voices on disable, resumes routing, and suspends once', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();
    audio.play([
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
    ]);
    expect(oscillators).toHaveLength(2);

    audio.setEnabled(false);
    expect(audio.isEnabled()).toBe(false);
    expect(gains[1]?.gain.targets.at(-1)?.value).toBe(0);
    expect(oscillators.every((oscillator) => oscillator.stops.length === 2)).toBe(true);
    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);
    expect(oscillators).toHaveLength(2);

    audio.setEnabled(true);
    expect(gains[1]?.gain.targets.at(-1)?.value).toBe(1);
    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);
    expect(oscillators).toHaveLength(4);
    audio.suspend();
    expect(audioContextSuspendCalls).toBe(1);
    audio.destroy();
  });

  it('degrades to silence when a future desktop host has no AudioContext capability', async () => {
    const audio = new AudioEngine(createBrowserPlatform({
      window: null,
      document: null,
      audioContextFactory: null,
    }));

    await audio.prime();
    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);

    expect(oscillators).toEqual([]);
    audio.destroy();
  });
});
