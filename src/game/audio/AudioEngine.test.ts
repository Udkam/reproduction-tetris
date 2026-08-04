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
  readonly stops: number[] = [];

  connect(): void {}
  disconnect(): void {}
  start(): void {}
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

  it('plays 3-2-1 as two matching ticks and one higher continuous release without a melody', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.playEntryCountdown(3);
    audio.playEntryCountdown(2);
    audio.playEntryCountdown(1);

    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([523.25, 523.25, 783.99]);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['sine', 'sine', 'sine']);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    expect(oscillators.slice(0, 2).every((oscillator) => (oscillator.stops[0] ?? 1) <= 0.12)).toBe(true);
    expect(oscillators[0]?.stops[0]).toBe(oscillators[1]?.stops[0]);
    expect(oscillators[2]?.stops[0]).toBeCloseTo(1.23, 4);
    audio.setEnabled(false);
    audio.playEntryCountdown(1);
    expect(oscillators).toHaveLength(3);
    audio.destroy();
  });

  it('rate-limits fast horizontal movement to soft unbent sine ticks', async () => {
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
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['sine', 'sine']);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    const voiceGains = gains.slice(2);
    expect(voiceGains).toHaveLength(2);
    expect(voiceGains.every((gain) => Math.max(...gain.gain.ramps) <= 0.07)).toBe(true);
    audio.destroy();
  });

  it('uses one soft unbent mid-low voice for rotation', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'piece-rotated', piece: 'T', direction: 1 }]);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.frequency.setValues).toEqual([330]);
    expect(oscillators[0]?.frequency.ramps).toEqual([]);
    expect(oscillators[0]?.type).toBe('sine');
    expect(oscillators[0]?.stops[0]).toBeLessThanOrEqual(0.07);
    expect(Math.max(...(gains[2]?.gain.ramps ?? []))).toBeLessThanOrEqual(0.11);
    audio.destroy();
  });

  it('keeps restarted silent so countdown digit 3 is the sole first beat', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'restarted' }]);
    expect(oscillators).toHaveLength(0);
    audio.playEntryCountdown(3);
    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.frequency.setValues).toEqual([523.25]);
    audio.destroy();
  });

  it('uses one digit-1 oscillator whose quiet tail reaches the cover-exit boundary', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.playEntryCountdown(1);
    audio.play([{ type: 'started' }]);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.frequency.setValues).toEqual([783.99]);
    expect(oscillators[0]?.type).toBe('sine');
    expect(oscillators[0]?.frequency.ramps).toEqual([]);
    expect(oscillators[0]?.stops[0]).toBeCloseTo(1.23, 4);
    expect(gains[2]?.gain.rampTimes).toEqual([0.012, 0.18, 1, 1.22]);
    expect(gains[2]?.gain.ramps[1]).toBeLessThan(gains[2]?.gain.ramps[0] ?? 0);
    expect(gains[2]?.gain.ramps[2]).toBeLessThan(gains[2]?.gain.ramps[1] ?? 0);
    expect(gains[2]?.gain.ramps[3]).toBe(0.0001);
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
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'triangle']);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length === 0)).toBe(true);
    collapse.destroy();

    oscillators.length = 0;
    const bomb = new AudioEngine();
    await bomb.prime();
    bomb.play([{ type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 300, rowsRemoved: 3, triggerCells: carrierCells }]);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([74]);
    expect(noiseSources).toHaveLength(1);
    expect((noiseSources[0]?.buffer as unknown as FakeAudioBuffer).channel.some((sample) => sample !== 0)).toBe(true);
    bomb.destroy();
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

  it('gives a same-frame mutation precedence over a clear chord without creating background voices', async () => {
    const { audio, timers } = createTimedAudio();
    await audio.prime();
    audio.play([{ type: 'started' }]);
    const foregroundBefore = oscillators.length;

    audio.play([
      { type: 'lines-cleared', rows: [39], count: 1, score: 40 },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0, triggerCells: carrierCells },
    ]);

    // Ice's single glass tap remains; the three-note normal clear chord is absent.
    expect(oscillators).toHaveLength(foregroundBefore + 1);
    expect(timers.size).toBe(0);
    audio.destroy();
  });

  it('uses one light rounded hard-drop contact without stacked impact voices', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }, { type: 'piece-locked', piece: 'T', cells: [] }]);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.type).toBe('sine');
    expect(oscillators[0]?.frequency.setValues).toEqual([185]);
    expect(oscillators[0]?.frequency.ramps).toEqual([]);
    expect(oscillators[0]?.stops[0]).toBeLessThanOrEqual(0.065);
    expect(Math.max(...(gains[2]?.gain.ramps ?? []))).toBeLessThanOrEqual(0.13);
    audio.destroy();
  });

  it('keeps ordinary gravity lock quieter and shorter than hard drop', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'piece-locked', piece: 'T', cells: [] }]);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.type).toBe('sine');
    expect(oscillators[0]?.frequency.setValues).toEqual([220]);
    expect(oscillators[0]?.frequency.ramps).toEqual([]);
    expect(oscillators[0]?.stops[0]).toBeLessThanOrEqual(0.046);
    expect(Math.max(...(gains[2]?.gain.ramps ?? []))).toBeLessThanOrEqual(0.065);
    audio.destroy();
  });

  it('announces Survival rockfall with one concise non-looping chirp', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{
      type: 'survival-stones-warned',
      columns: [3],
      height: 2,
      leadPieces: 1,
    }]);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.type).toBe('triangle');
    expect(oscillators[0]?.frequency.setValues).toEqual([540]);
    expect(oscillators[0]?.frequency.ramps).toEqual([760]);
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
      { type: 'lines-cleared', rows: [39], count: 1, score: 40 },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 },
      { type: 'bedrock-raised', count: 1, height: 11 },
      { type: 'bedrock-lowered', count: 1, height: 10 },
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

  it('keeps started silent and resume feedback foreground-only with no ambient music bus', async () => {
    const { audio, timers } = createTimedAudio();
    await audio.prime();
    expect(oscillators).toHaveLength(0);

    audio.play([{ type: 'started' }]);
    expect(oscillators).toHaveLength(0);
    expect(timers.size).toBe(0);

    audio.play([{ type: 'resumed' }]);
    expect(oscillators).toHaveLength(1);
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
