// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from './GameRuntime';

const rendererSetOptions = vi.hoisted(() => vi.fn());
const inputClearHeld = vi.hoisted(() => vi.fn());
const inputHarness = vi.hoisted(() => ({ emit: null as ((action: string) => void) | null }));
const audioPrime = vi.hoisted(() => vi.fn());
const audioSetVolume = vi.hoisted(() => vi.fn());

vi.mock('../audio/AudioEngine', () => ({
  AudioEngine: class {
    setEnabled(): void {}
    setVolume(volume: number): void { audioSetVolume(volume); }
    async prime(): Promise<void> { audioPrime(); }
    play(): void {}
    suspend(): void {}
    destroy(): void {}
  },
}));

vi.mock('../input/InputController', () => ({
  InputController: class {
    constructor(emit: (action: string) => void) { inputHarness.emit = emit; }
    press(action: string): void { inputHarness.emit?.(action); }
    release(): void {}
    step(): void {}
    clearHeld(): void { inputClearHeld(); }
    destroy(): void {}
  },
}));

vi.mock('../render/TetrisRenderer', () => ({
  TetrisRenderer: class {
    async init(): Promise<void> {}
    setOptions(options: unknown): void { rendererSetOptions(options); }
    setFrameCallback(): void {}
    render(): void {}
    destroy(): void {}
    getSnapshot(): Record<string, never> { return {}; }
    benchmark(): { meanMs: number; p95Ms: number; maxMs: number } {
      return { meanMs: 0, p95Ms: 0, maxMs: 0 };
    }
  },
}));

describe('GameRuntime public state boundary', () => {
  it('starts from a deterministic ready state without browser mounting', () => {
    const onState = vi.fn();
    const runtime = new GameRuntime({ seed: 123, onState });
    expect(runtime.getState().status).toBe('ready');
    expect(runtime.getState().queue).toHaveLength(5);
    expect(runtime.getState().active).not.toBeNull();
    expect(onState).not.toHaveBeenCalled();
  });

  it('gates every public and QA gameplay entry until input is enabled', async () => {
    const onState = vi.fn();
    const runtime = new GameRuntime({ seed: 123, onState, audioEnabled: false, inputEnabled: false });
    await runtime.mount(document.createElement('div'));
    onState.mockClear();
    inputClearHeld.mockClear();
    audioPrime.mockClear();
    const readyState = runtime.getState();
    const readySnapshot = structuredClone(readyState);
    const readyActive = readyState.active;
    const readyQueue = readyState.queue;
    const readyBoard = readyState.board;

    runtime.start();
    runtime.press('left');
    runtime.togglePause();
    window.__SIGNAL_FOUNDRY_QA__?.action('hard-drop');
    window.__SIGNAL_FOUNDRY_QA__?.advanceTicks(180);

    const qaSurface = window.__SIGNAL_FOUNDRY_QA__!;
    const gatedEntries = [
      { name: 'direct restart', run: () => runtime.restart(456, 'race') },
      { name: 'direct mode selection', run: () => runtime.selectMode('race') },
      { name: 'direct Puzzle selection', run: () => runtime.selectPuzzle('t3r-cascade-06') },
      { name: 'QA restart', run: () => qaSurface.restart() },
      { name: 'QA mode selection', run: () => qaSurface.selectMode('race') },
      { name: 'QA Puzzle selection', run: () => qaSurface.selectPuzzle('t3r-cascade-06') },
    ];

    for (const entry of gatedEntries) {
      entry.run();
      const current = runtime.getState();
      expect(current, entry.name).toBe(readyState);
      expect(current, entry.name).toEqual(readySnapshot);
      expect(current.seed, entry.name).toBe(123);
      expect(current.status, entry.name).toBe('ready');
      expect(current.mode, entry.name).toBe('marathon');
      expect(current.puzzleId, entry.name).toBeNull();
      expect(current.active, entry.name).toBe(readyActive);
      expect(current.queue, entry.name).toBe(readyQueue);
      expect(current.board, entry.name).toBe(readyBoard);
      expect(onState, entry.name).not.toHaveBeenCalled();
      expect(audioPrime, entry.name).not.toHaveBeenCalled();
      expect(inputClearHeld, entry.name).not.toHaveBeenCalled();
    }

    runtime.setInputEnabled(true);
    expect(inputClearHeld).toHaveBeenCalledTimes(1);
    runtime.setInputEnabled(true);
    expect(inputClearHeld).toHaveBeenCalledTimes(1);
    runtime.start();

    expect(runtime.getState().status).toBe('playing');
    expect(audioPrime).toHaveBeenCalledTimes(1);
    expect(onState).toHaveBeenCalledTimes(1);
    expect(onState.mock.calls[0]?.[1]).toEqual([{ type: 'started' }]);

    runtime.setInputEnabled(false);
    expect(inputClearHeld).toHaveBeenCalledTimes(2);
    runtime.destroy();
  });

  it('coalesces ordinary simulation ticks before publishing React-facing state', () => {
    const onState = vi.fn();
    const runtime = new GameRuntime({ seed: 123, onState, audioEnabled: false });
    runtime.start();
    expect(onState).toHaveBeenCalledTimes(1);
    onState.mockClear();

    const internals = runtime as unknown as {
      fixedStep: () => void;
      frame: (deltaMs: number) => void;
    };
    for (let tick = 0; tick < 5; tick += 1) internals.fixedStep();
    expect(onState).not.toHaveBeenCalled();

    internals.frame(99);
    expect(onState).not.toHaveBeenCalled();
    internals.frame(1);
    expect(onState).toHaveBeenCalledTimes(1);
    expect(onState.mock.calls[0]?.[0].elapsedTicks).toBeGreaterThanOrEqual(5);
  });

  it('selects a real authored Puzzle level only through the restart boundary', () => {
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    runtime.selectPuzzle('t3r-cascade-06');

    const state = runtime.getState();
    expect(state.status).toBe('ready');
    expect(state.mode).toBe('puzzle');
    expect(state.puzzleId).toBe('t3r-cascade-06');
    expect(state.puzzleQueue).toEqual(state.queue);
    expect(state.queue).toHaveLength(5);
    expect(state.puzzleUndoHistory).toEqual([]);
    expect(state.puzzleCompletion).toBe('active');
  });

  it('refreshes ordinary run seeds while retaining a selected Puzzle sequence', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (values: Uint32Array) => {
        values[0] = 0x7a11beef;
        return values;
      },
    });
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    runtime.restart();
    expect(runtime.getState().mode).toBe('marathon');
    expect(runtime.getState().seed).toBe(0x7a11beef);

    runtime.selectPuzzle('t3r-cascade-06');
    const puzzleSeed = runtime.getState().seed;
    runtime.restart();
    expect(runtime.getState().mode).toBe('puzzle');
    expect(runtime.getState().seed).toBe(puzzleSeed);

    runtime.selectMode('sprint');
    expect(runtime.getState().mode).toBe('sprint');
    expect(runtime.getState().sprintCompletion).toBe('active');
    expect(runtime.getState().sprintTargetLines).toBe(40);
    expect(runtime.getState().seed).toBe(0x7a11beef);
    vi.unstubAllGlobals();
  });

  it('updates reduced motion in place without rebuilding runtime state', () => {
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    const before = runtime.getState();
    rendererSetOptions.mockClear();

    runtime.setReducedMotion(true);

    expect(rendererSetOptions).toHaveBeenCalledWith({ reducedMotion: true });
    expect(runtime.getState()).toBe(before);
  });

  it('routes a bounded user volume through audio without touching game state', () => {
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    const before = runtime.getState();
    audioSetVolume.mockClear();

    runtime.setAudioVolume(2);
    runtime.setAudioVolume(-1);

    expect(audioSetVolume).toHaveBeenNthCalledWith(1, 2);
    expect(audioSetVolume).toHaveBeenNthCalledWith(2, -1);
    expect(runtime.getState()).toBe(before);
  });

  it('restarts immediately from active play when the public R action is received', async () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (values: Uint32Array) => {
        values[0] = 0x7a11beef;
        return values;
      },
    });
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    await runtime.mount(document.createElement('div'));
    runtime.start();
    runtime.press('left');
    const before = runtime.getState();
    expect(before.status).toBe('playing');

    inputHarness.emit?.('restart');

    expect(runtime.getState().status).toBe('playing');
    expect(runtime.getState().elapsedTicks).toBe(0);
    expect(runtime.getState().seed).toBe(0x7a11beef);
    runtime.destroy();
    vi.unstubAllGlobals();
  });

  it('mounts a read-only QA state view without replay or state-replacement hooks', async () => {
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    await runtime.mount(document.createElement('div'));

    const qaSurface = window.__SIGNAL_FOUNDRY_QA__;
    expect(qaSurface).toBeDefined();
    expect(qaSurface).not.toHaveProperty('replayScenario');
    expect(qaSurface).not.toHaveProperty('setState');
    expect(qaSurface).not.toHaveProperty('replaceState');

    const exposedState = qaSurface!.getState();
    exposedState.status = 'finished';
    expect(runtime.getState().status).toBe('ready');

    runtime.destroy();
    expect(window.__SIGNAL_FOUNDRY_QA__).toBeUndefined();
  });
});
