import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';
import { createBrowserPlatform } from '../../platform/browserPlatform';
import { createInitialState } from '../core';

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
  connect(): void {}
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
  async suspend(): Promise<void> {}
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
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('AudioEngine original feedback', () => {
  it('closes its owned AudioContext exactly once during idempotent teardown', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();

    await audio.prime();
    audio.destroy();
    audio.destroy();

    expect(audioContextCloseCalls).toBe(1);
  });

  it('plays 3-2-1 as three short discrete beats without a melody or release tail', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.playEntryCountdown(3);
    audio.playEntryCountdown(2);
    audio.playEntryCountdown(1);

    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([
      440, 880,
      440, 880,
      659.25, 1318.5,
    ]);
    expect(oscillators.every((oscillator) => oscillator.type === 'sine')).toBe(true);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators.slice(0, 4).every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.12)).toBe(true);
    expect(oscillators.slice(4).every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.25)).toBe(true);
    expect(oscillators[0]?.stops[0]).toBe(oscillators[2]?.stops[0]);
    expect((oscillators[4]?.stops[0] ?? 0) > (oscillators[2]?.stops[0] ?? 1)).toBe(true);
    audio.setEnabled(false);
    audio.playEntryCountdown(1);
    expect(oscillators).toHaveLength(6);
    audio.destroy();
  });

  it('rate-limits fast horizontal movement to present unbent sine ticks', async () => {
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
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([220, 220]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['sine', 'sine']);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    const voiceGains = gains.slice(2);
    expect(voiceGains).toHaveLength(2);
    expect(voiceGains.every((gain) => Math.max(...gain.gain.ramps) <= 0.1)).toBe(true);
    audio.destroy();
  });

  it('uses a rounded two-voice rotation cue without pitch bends', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'piece-rotated', piece: 'T', direction: 1 }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([293.66, 440]);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators.every((oscillator) => oscillator.type === 'sine')).toBe(true);
    expect(oscillators.every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.08)).toBe(true);
    expect(gains.slice(2).every((gain) => Math.max(...gain.gain.ramps) <= 0.14)).toBe(true);
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
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([440, 880]);
    audio.destroy();
  });

  it('keeps the cover exit silent after the short third countdown beat', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.playEntryCountdown(1);
    audio.play([{ type: 'started' }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([659.25, 1318.5]);
    expect(oscillators.every((oscillator) => oscillator.type === 'sine')).toBe(true);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators[0]?.stops[0]).toBeCloseTo(0.25, 4);
    expect(oscillators[1]?.stops[0]).toBeLessThan(0.16);
    expect(gains[2]?.gain.rampTimes).toEqual([0.012, 0.24]);
    expect(gains[3]?.gain.rampTimes.at(-1)).toBeCloseTo(0.1392, 4);
    audio.destroy();
  });

  it('gives every mutation material a concise, unbent original signature', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);

    const freeze = new AudioEngine();
    await freeze.prime();
    freeze.play([{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells }]);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([783.99]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['sine']);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    freeze.destroy();

    oscillators.length = 0;
    const collapse = new AudioEngine();
    await collapse.prime();
    collapse.play([{ type: 'mutation-activated', item: 'collapse', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells }]);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([148, 93]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['sine', 'sine']);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    collapse.destroy();

    oscillators.length = 0;
    const bomb = new AudioEngine();
    await bomb.prime();
    bomb.play([{ type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 300, rowsRemoved: 3, triggerCells: carrierCells }]);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([74]);
    expect(noiseSources).toHaveLength(1);
    expect(filters).toHaveLength(1);
    expect(filters[0]?.type).toBe('lowpass');
    expect(filters[0]?.frequency.setValues).toEqual([640]);
    expect(filters[0]?.Q.setValues).toEqual([0.7]);
    expect((noiseSources[0]?.buffer as unknown as FakeAudioBuffer).channel.some((sample) => sample !== 0)).toBe(true);
    bomb.destroy();

    oscillators.length = 0;
    const reshape = new AudioEngine();
    await reshape.prime();
    reshape.play([{ type: 'mutation-activated', item: 'reshape', durationTicks: 0, score: 0, rowsRemoved: 0, triggerCells: carrierCells }]);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([440, 554.37, 659.25]);
    expect(oscillators.every((oscillator) => oscillator.type === 'sine')).toBe(true);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    reshape.destroy();
  });

  it('keeps Double compact and adds only a clean octave for Super Double', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const double = new AudioEngine();
    await double.prime();
    double.play([{ type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 2, triggerCells: carrierCells }]);
    expect(oscillators).toHaveLength(4);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([
      523.25,
      523.25 * 2.01,
      659.25,
      659.25 * 2.01,
    ]);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    double.destroy();

    oscillators.length = 0;
    const superDouble = new AudioEngine();
    await superDouble.prime();
    superDouble.play([{ type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 4, triggerCells: carrierCells }]);
    expect(oscillators).toHaveLength(6);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toContain(1046.5);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toContain(1046.5 * 2.01);
    superDouble.destroy();
  });

  it('keeps Ice and multiplier silent after activation while Supergravity retains bounded ambience', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();
    const active = {
      ...createInitialState(0x51a1f00d, 'sprint'),
      mutationFreezeTicks: 600,
      mutationCollapseTicks: 600,
      mutationMultiplierTicks: 600,
      mutationMultiplierFactor: 4 as const,
    };

    audio.syncMutationState(active);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).not.toContain(261.63);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).not.toContain(392);
    const loop = oscillators.find((oscillator) => oscillator.frequency.setValues[0] === 73.42);
    expect(loop?.stops).toHaveLength(0);

    audio.syncMutationState({
      ...active,
      mutationFreezeTicks: 0,
      mutationCollapseTicks: 0,
      mutationMultiplierTicks: 0,
    });
    expect(loop?.stops).toHaveLength(1);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toContain(196);
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
    expect(frequencies.filter((frequency) => frequency === 783.99)).toHaveLength(1);
    expect(frequencies.filter((frequency) => frequency === 148)).toHaveLength(1);
    expect(frequencies.filter((frequency) => frequency === 93)).toHaveLength(1);
    expect(frequencies).toHaveLength(7);
    audio.destroy();
  });

  it('uses four clear-forward, bounded signatures and rejects invalid clear counts', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    const expectedFrequencies = [
      [392, 784],
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
      expect(voices.every((oscillator) => oscillator.type === 'sine')).toBe(true);
      expect(voices.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
      expect(voices.every((oscillator) => (
        (oscillator.stops[0] ?? 1) - (oscillator.starts[0] ?? 0)
      ) <= 0.2)).toBe(true);
      expect(voiceGains).toHaveLength(count + 1);
      const peaks = voiceGains.map((gain) => Math.max(...gain.gain.ramps));
      expect(peaks.every((gain) => gain <= 0.16)).toBe(true);
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

    // Ice's single glass tap remains; the ordinary clear cue is absent.
    expect(oscillators).toHaveLength(foregroundBefore + 1);
    expect(timers.size).toBe(0);
    audio.destroy();
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
      440, 554.37, 659.25, 880,
    ]);
    audio.destroy();
  });

  it('uses a compact two-voice hard-drop contact without a bass-heavy tail', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }, { type: 'piece-locked', piece: 'T', cells: [] }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([174.61, 349.23]);
    expect(oscillators.every((oscillator) => oscillator.type === 'sine')).toBe(true);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators.every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.085)).toBe(true);
    expect(gains.slice(2).every((gain) => Math.max(...gain.gain.ramps) <= 0.15)).toBe(true);
    audio.destroy();
  });

  it('keeps ordinary gravity lock quieter and shorter than hard drop', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'piece-locked', piece: 'T', cells: [] }]);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.type).toBe('sine');
    expect(oscillators[0]?.frequency.setValues).toEqual([246.94]);
    expect(oscillators[0]?.frequency.ramps).toEqual([]);
    expect(oscillators[0]?.stops[0]).toBeLessThanOrEqual(0.06);
    expect(Math.max(...(gains[2]?.gain.ramps ?? []))).toBeLessThanOrEqual(0.09);
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
      392, 329.63, 130.81, 196,
    ]);
    expect(oscillators[0]?.frequency.ramps).toEqual([293.66]);
    expect(oscillators[1]?.frequency.ramps).toEqual([220]);
    expect(oscillators.slice(2).every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
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
    expect(oscillators.every((oscillator) => oscillator.type === 'sine')).toBe(true);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([392, 523.25]);
    expect(oscillators.map((oscillator) => oscillator.frequency.ramps[0])).toEqual([523.25, 659.25]);
    audio.destroy();
  });

  it('routes every event through bounded original oscillator voices', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([
      { type: 'piece-moved', piece: 'T', dx: 1, dy: 0, cause: 'move' },
      { type: 'piece-moved', piece: 'T', dx: 0, dy: 1, cause: 'soft-drop' },
      { type: 'piece-rotated', piece: 'T', direction: 1 },
      { type: 'piece-locked', piece: 'T', cells: [] },
      { type: 'puzzle-undone' },
      { type: 'lines-cleared', rows: [39], count: 1, score: 40 },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 },
      { type: 'bedrock-raised', count: 1, height: 11 },
      { type: 'bedrock-lowered', count: 1, height: 10 },
      { type: 'survival-stones-spawned', cells: [{ x: 3, y: 0 }], intervalPieces: 8, nextIntervalPieces: 8 },
      { type: 'survival-stones-landed', cells: [{ x: 3, y: 12 }] },
      { type: 'level-up', level: 1 },
      { type: 'finished', completionTicks: 1 },
      { type: 'game-over', reason: 'block-out' },
      { type: 'started' },
      { type: 'paused' },
      { type: 'resumed' },
      { type: 'restarted' },
    ]);

    expect(oscillators.length).toBeGreaterThan(0);
    expect(oscillators.every((oscillator) => oscillator.type === 'sine' || oscillator.type === 'triangle')).toBe(true);
    audio.destroy();
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
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([293.66, 220, 349.23, 523.25]);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators.every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.105)).toBe(true);
    expect(gains.slice(2).every((gain) => Math.max(...gain.gain.ramps) <= 0.15)).toBe(true);
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
