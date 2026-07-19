import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';

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

  connect(): void {}
  disconnect(): void {}
  start(): void {}
  stop(): void {}
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

class FakeAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  readonly destination = {} as AudioDestinationNode;

  createGain(): GainNode {
    return new FakeGain() as unknown as GainNode;
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
  vi.unstubAllGlobals();
});

describe('AudioEngine hard drop', () => {
  it('uses a paired sine landing thump instead of an electrical waveform', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioEngine();
    await audio.prime();

    audio.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);

    expect(oscillators).toHaveLength(2);
    expect(oscillators.map((oscillator) => oscillator.type)).toEqual(['sine', 'sine']);
    expect(oscillators.map((oscillator) => oscillator.frequency.setValues[0])).toEqual([132, 78]);
    expect(oscillators.map((oscillator) => oscillator.frequency.ramps[0])).toEqual([82, 52]);
    audio.destroy();
  });
});
