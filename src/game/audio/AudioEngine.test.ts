import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';
import { createBrowserPlatform } from '../../platform/browserPlatform';

class FakeAudioParam {
  value = 0;
  readonly setValues: number[] = [];
  readonly ramps: number[] = [];

  setValueAtTime(value: number): void {
    this.value = value;
    this.setValues.push(value);
  }

  exponentialRampToValueAtTime(value: number): void {
    this.value = value;
    this.ramps.push(value);
  }

  setTargetAtTime(value: number): void {
    this.value = value;
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

class FakeAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
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

  async resume(): Promise<void> {}
  async suspend(): Promise<void> {}
  async close(): Promise<void> {}
}

afterEach(() => {
  oscillators.length = 0;
  gains.length = 0;
  vi.unstubAllGlobals();
});

describe('AudioEngine original feedback', () => {
  it('uses a short physical landing thump instead of an electrical low-sine hum', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }, { type: 'piece-locked', piece: 'T', cells: [] }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['triangle', 'sine']);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([168, 252]);
    expect(oscillators.every((oscillator) => oscillator.frequency.ramps.length > 0)).toBe(true);
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

  it('starts a low original music bed only after play begins and stops it on pause', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();
    expect(oscillators).toHaveLength(0);

    audio.play([{ type: 'started' }]);
    const music = oscillators.slice(0, 2);
    expect(music.map((oscillator) => oscillator.type)).toEqual(['sine', 'triangle']);
    expect(oscillators).toHaveLength(4);

    audio.play([{ type: 'paused' }]);
    expect(music.every((oscillator) => oscillator.stops.length === 1)).toBe(true);
    audio.destroy();
  });

  it('starts deferred music after a later user-gesture audio prime', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    audio.play([{ type: 'started' }]);
    expect(oscillators).toHaveLength(0);

    await audio.prime();

    expect(oscillators.slice(0, 2).map((oscillator) => oscillator.type)).toEqual(['sine', 'triangle']);
    expect(oscillators).toHaveLength(3);
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
