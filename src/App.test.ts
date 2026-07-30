// @vitest-environment jsdom

// @ts-expect-error Vitest runs this test in Node while the product tsconfig intentionally omits Node globals.
import { readFileSync } from 'node:fs';
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import styles from './styles.css?raw';
import { PIECE_TYPES, createInitialState, dispatch, getPuzzleDefinition, nextMutationPreviewItem, type GameEvent, type GameMode, type GameState, type PieceType, type PuzzleId } from './game/core';
import App, {
  cloneQaState,
  countdownTimeLabel,
  elapsedClockLabel,
  elapsedTimeLabel,
  eventMessage,
  eventMessages,
  fallCadenceLabel,
  GameSession,
  LeaderboardPanel,
  MutationStatus,
  ModeHome,
  PuzzleLibrary,
  puzzleAnchorSilhouettePath,
  puzzleCelebrationCopy,
  puzzleCelebrationOutcome,
  puzzleSilhouettePaths,
  runResultMetrics,
  RunResultSummary,
  RunStats,
  SettingsRecord,
  scoreRecordRank,
  scoreRecordForState,
  survivalCountdownLabel,
  survivalStoneCountdownSeconds,
  terminalCopy,
} from './App';
import {
  CAMPAIGN_LEVELS,
  defaultPuzzleProgress,
  PUZZLE_CAMPAIGN_REVISION,
  PUZZLE_PROGRESS_KEY,
  V4_PUZZLE_PROGRESS_KEY,
  type PuzzleProgress,
} from './puzzleProgress';
import type { ScoreRecord } from './leaderboard';
import { itemLabel, modeRules, modeRulesTitle } from './ui/localization';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const sourceStyles = readFileSync('src/styles.css', 'utf8');

interface RuntimeTestOptions {
  seed?: number;
  mode?: GameMode;
  puzzleId?: PuzzleId;
  inputEnabled?: boolean;
  survivalEntryBedrockRows?: number | null;
  onState?: (state: GameState, events: readonly GameEvent[]) => void;
}

interface RuntimeTestInstance {
  options: RuntimeTestOptions;
  setInputEnabled: ReturnType<typeof vi.fn>;
  setSurvivalEntryBedrockRows: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  restart: ReturnType<typeof vi.fn>;
  undoPuzzle: ReturnType<typeof vi.fn>;
  togglePause: ReturnType<typeof vi.fn>;
  setAudioEnabled: ReturnType<typeof vi.fn>;
  setAudioVolume: ReturnType<typeof vi.fn>;
  press: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
  getState: () => GameState;
  setState: (state: GameState) => void;
}

const runtimeHarness = vi.hoisted(() => ({ instances: [] as RuntimeTestInstance[] }));

vi.mock('./game/runtime/GameRuntime', async () => {
  const core = await vi.importActual<typeof import('./game/core')>('./game/core');
  return {
    randomRunSeed: () => 0x51a1f00d,
    GameRuntime: class {
    private state: GameState;
    private canvas: HTMLCanvasElement | null = null;
    readonly setInputEnabled = vi.fn();
    readonly setSurvivalEntryBedrockRows = vi.fn();
    readonly setReducedMotion = vi.fn();
    readonly setAudioEnabled = vi.fn();
    readonly setAudioVolume = vi.fn();
    readonly start = vi.fn(() => {
      const transition = core.dispatch(this.state, { type: 'start' });
      this.state = transition.state;
      this.options.onState?.(this.state, transition.events);
    });

    constructor(readonly options: RuntimeTestOptions) {
      this.state = core.createInitialState(options.seed, options.mode, options.puzzleId);
      runtimeHarness.instances.push(this);
    }

    async mount(host: HTMLElement): Promise<void> {
      this.canvas = document.createElement('canvas');
      this.canvas.tabIndex = 0;
      host.append(this.canvas);
    }

    readonly press = vi.fn();
    readonly release = vi.fn();
    readonly togglePause = vi.fn(() => {
      if (this.state.status === 'playing') this.state = { ...this.state, status: 'paused' };
      else if (this.state.status === 'paused') this.state = { ...this.state, status: 'playing' };
      this.options.onState?.(this.state, []);
    });
    readonly restart = vi.fn(() => {
      const transition = core.dispatch(this.state, { type: 'restart' });
      this.state = transition.state;
      this.options.onState?.(this.state, transition.events);
    });
    readonly undoPuzzle = vi.fn(() => {
      const transition = core.dispatch(this.state, { type: 'undo' });
      this.state = transition.state;
      this.options.onState?.(this.state, transition.events);
    });
    getState(): GameState { return this.state; }
    setState(state: GameState): void {
      this.state = state;
      this.options.onState?.(this.state, []);
    }
    getRendererSnapshot(): Record<string, never> { return {}; }
    destroy(): void { this.canvas?.remove(); }
    },
  };
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  runtimeHarness.instances.length = 0;
});

function render(element: ReactNode): {
  container: HTMLDivElement;
  rerender: (next: ReactNode) => void;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => root.render(element));
  return {
    container,
    rerender: (next) => act(() => root.render(next)),
    unmount: () => act(() => {
      root.unmount();
      container.remove();
    }),
  };
}

async function advanceEntryCountdown(): Promise<void> {
  for (let step = 0; step < 3; step += 1) {
    await act(async () => vi.advanceTimersByTimeAsync(1000));
  }
}

describe('DEV QA state snapshot isolation', () => {
  it('detaches scalar, active piece, queue, and nested board state', () => {
    const canonical = createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01');
    const snapshot = cloneQaState(canonical);
    const original = structuredClone(canonical);

    expect(snapshot).not.toBe(canonical);
    expect(snapshot.active).not.toBe(canonical.active);
    expect(snapshot.queue).not.toBe(canonical.queue);
    expect(snapshot.board).not.toBe(canonical.board);
    expect(snapshot.board[0]).not.toBe(canonical.board[0]);

    snapshot.status = 'game-over';
    if (snapshot.active) snapshot.active.x += 3;
    snapshot.queue[0] = snapshot.queue[0] === 'I' ? 'T' : 'I';
    snapshot.board[0]![0] = snapshot.board[0]![0] === 'O' ? 'Z' : 'O';

    expect(canonical).toEqual(original);
  });
});

describe('Puzzle progress boot migration', () => {
  it('writes a frozen v4 completion into v5 without deleting the rollback key or promoting its retired-board best', () => {
    const levelId = CAMPAIGN_LEVELS[0]!.id;
    const v4 = JSON.stringify({
      version: 4,
      completedLevelIds: [levelId],
      bestPieceCounts: { [levelId]: 6 },
    });
    localStorage.setItem(V4_PUZZLE_PROGRESS_KEY, v4);

    const view = render(createElement(App));
    expect(JSON.parse(localStorage.getItem(PUZZLE_PROGRESS_KEY) ?? 'null')).toEqual({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [levelId],
      bestPieceCounts: {},
    });
    expect(localStorage.getItem(V4_PUZZLE_PROGRESS_KEY)).toBe(v4);
    view.unmount();
  });

  it('prefers an existing valid v5 record and leaves the older key untouched', () => {
    const currentId = CAMPAIGN_LEVELS[1]!.id;
    const staleId = CAMPAIGN_LEVELS[0]!.id;
    const current = JSON.stringify({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [currentId],
      bestPieceCounts: { [currentId]: 7 },
    });
    const stale = JSON.stringify({
      version: 4,
      completedLevelIds: [staleId],
      bestPieceCounts: { [staleId]: 5 },
    });
    localStorage.setItem(PUZZLE_PROGRESS_KEY, current);
    localStorage.setItem(V4_PUZZLE_PROGRESS_KEY, stale);

    const view = render(createElement(App));
    expect(localStorage.getItem(PUZZLE_PROGRESS_KEY)).toBe(current);
    expect(localStorage.getItem(V4_PUZZLE_PROGRESS_KEY)).toBe(stale);
    view.unmount();
  });
});

describe('Survival stone timing presentation', () => {
  it('reveals one, two, and three bedrock rows across the 3-2-1 entry countdown', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const view = render(createElement(GameSession, {
      mode: 'race',
      puzzleId: CAMPAIGN_LEVELS[0]!.id,
      onExit: vi.fn(),
      onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());

    const runtime = runtimeHarness.instances.at(-1)!;
    expect(runtime.options.survivalEntryBedrockRows).toBe(1);
    expect(runtime.setSurvivalEntryBedrockRows).toHaveBeenLastCalledWith(1);

    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(runtime.setSurvivalEntryBedrockRows).toHaveBeenLastCalledWith(2);
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(runtime.setSurvivalEntryBedrockRows).toHaveBeenLastCalledWith(3);
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(runtime.setSurvivalEntryBedrockRows).toHaveBeenLastCalledWith(null);
    expect(runtime.start).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('reports the independent stone clock from the canonical Core state', () => {
    const initial = createInitialState(0x51a1f00d, 'race');
    expect(survivalStoneCountdownSeconds(initial)).toBe(20);
    expect(survivalStoneCountdownSeconds({
      ...initial,
      survivalDebrisIntervalSeconds: 10,
      survivalDebrisIntervalTicks: 599,
    })).toBe(1);
    expect(survivalStoneCountdownSeconds(createInitialState(0x51a1f00d, 'marathon'))).toBe(0);
  });

  it('reads the live runtime snapshot immediately after a deterministic state change', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const view = render(createElement(GameSession, {
      mode: 'race',
      puzzleId: CAMPAIGN_LEVELS[0]!.id,
      onExit: vi.fn(),
      onCanonicalCompletion: vi.fn(),
      onRunFinished: vi.fn(),
    }));
    await act(async () => Promise.resolve());

    const runtime = runtimeHarness.instances[0]!;
    const current = {
      ...runtime.getState(),
      status: 'playing' as const,
      survivalDebrisIntervalSeconds: 19,
      survivalDebrisIntervalTicks: 0,
      survivalDebris: [{ id: 1, x: 4, y: 21, height: 2 as const }],
    };
    // Deliberately bypass a React wait: the QA text path must still report the
    // same Core frame that Pixi has just rendered.
    runtime.setState(current);
    const text = JSON.parse(window.render_game_to_text?.() ?? '{}') as Record<string, unknown>;
    expect(text).toMatchObject({
      mode: 'race',
      stoneIntervalSeconds: 19,
      stoneNextSeconds: 19,
      fallingStones: [{ x: 4, y: 21 }, { x: 4, y: 22 }],
    });
    view.unmount();
  });
});

describe('Puzzle completion ceremony', () => {
  it('renders distinct first-clear, record, and replay results from the best that existed before persistence', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const puzzleId = CAMPAIGN_LEVELS[0]!.id;

    const renderCompletion = async (puzzleProgress = defaultPuzzleProgress(), pieces = 9) => {
      const onCanonicalCompletion = vi.fn();
      const view = render(createElement(GameSession, {
        mode: 'puzzle', puzzleId, onExit: vi.fn(), onCanonicalCompletion, puzzleProgress,
      }));
      await act(async () => Promise.resolve());
      await advanceEntryCountdown();
      const runtime = runtimeHarness.instances.at(-1)!;
      const finished = {
        ...runtime.getState(),
        status: 'finished' as const,
        puzzleCompletion: 'finished' as const,
        completedLevelId: puzzleId,
        puzzleTargetCells: [],
        pieceCount: pieces,
        lines: 5,
      };
      act(() => runtime.setState(finished));
      return { view, onCanonicalCompletion };
    };

    const first = await renderCompletion();
    expect(first.view.container.querySelector<HTMLElement>('[data-testid="puzzle-celebration"]')?.dataset.outcome).toBe('first');
    expect(first.view.container.textContent).toContain('恭喜你破解谜题');
    expect(first.view.container.textContent).not.toContain('首次完成 · 9 步 · 5 消行');
    expect(first.view.container.textContent).toContain('当前最优：9步');
    expect(first.onCanonicalCompletion).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ completedLevelId: puzzleId, pieceCount: 9 }));
    first.view.unmount();

    const priorBest: PuzzleProgress = {
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [puzzleId],
      bestPieceCounts: { [puzzleId]: 12 },
    };
    const record = await renderCompletion(priorBest, 9);
    expect(record.view.container.querySelector<HTMLElement>('[data-testid="puzzle-celebration"]')?.dataset.outcome).toBe('record');
    expect(record.view.container.textContent).toContain('新的个人纪录');
    expect(record.view.container.textContent).not.toContain('从 12 步精炼至 9 步 · 5 消行');
    record.view.unmount();

    const replayBest: PuzzleProgress = {
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [puzzleId],
      bestPieceCounts: { [puzzleId]: 9 },
    };
    const replay = await renderCompletion(replayBest, 9);
    expect(replay.view.container.querySelector<HTMLElement>('[data-testid="puzzle-celebration"]')?.dataset.outcome).toBe('replay');
    expect(replay.view.container.textContent).toContain('谜题再次破解');
    expect(replay.view.container.textContent).not.toContain('新的个人纪录');
    replay.view.unmount();
  });
});

describe('entry countdown', () => {
  it('freezes the current digit across Settings and Exit, then starts exactly once after three open-sheet-free seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }));
    const onRunFinished = vi.fn();
    const onExit = vi.fn();
    const view = render(createElement(GameSession, {
      mode: 'marathon',
      puzzleId: CAMPAIGN_LEVELS[0]!.id,
      onExit,
      onCanonicalCompletion: vi.fn(),
      onRunFinished,
    }));
    await act(async () => Promise.resolve());

    const runtime = runtimeHarness.instances[0]!;
    const countdown = () => view.container.querySelector<HTMLElement>('[data-testid="entry-countdown"]');
    const settings = view.container.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')!;
    const back = view.container.querySelector<HTMLButtonElement>('[data-testid="exit-game"]')!;
    const textState = JSON.parse(window.render_game_to_text?.() ?? '{}') as Record<string, unknown>;

    expect(runtime.options.inputEnabled).toBe(false);
    expect(textState).not.toHaveProperty('level');
    expect(textState).toMatchObject({ combo: 0, bedrockRows: 0, fallTicks: 48 });
    expect(countdown()?.dataset.countdown).toBe('3');
    expect(settings.disabled).toBe(false);
    expect(back.disabled).toBe(false);
    expect(view.container.querySelector('[data-testid="touch-rail"]')).toBeNull();
    expect(view.container.querySelector('[data-testid="board-frame"]')?.hasAttribute('aria-label')).toBe(false);
    expect(view.container.querySelector('canvas')?.getAttribute('aria-description')).toContain('触控');
    expect(runtime.start).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(400));
    act(() => settings.click());
    expect(view.container.querySelector('[data-testid="settings-sheet"]')).not.toBeNull();
    expect(view.container.querySelector<HTMLButtonElement>('[data-testid="settings-restart"]')?.disabled).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(countdown()?.dataset.countdown).toBe('3');
    expect(runtime.start).not.toHaveBeenCalled();
    expect(runtime.setInputEnabled.mock.calls.some(([enabled]) => enabled === true)).toBe(false);
    expect(view.container.querySelector<HTMLElement>('[role="dialog"]')?.contains(document.activeElement)).toBe(true);

    act(() => view.container.querySelector<HTMLElement>('[data-testid="action-sheet-backdrop"]')?.click());
    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(countdown()?.dataset.countdown).toBe('3');
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(countdown()?.dataset.countdown).toBe('2');

    act(() => back.click());
    expect(view.container.querySelector('.action-sheet')?.textContent).toContain('离开本局？');
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(countdown()?.dataset.countdown).toBe('2');
    expect(runtime.start).not.toHaveBeenCalled();
    expect(runtime.setInputEnabled.mock.calls.some(([enabled]) => enabled === true)).toBe(false);
    expect(view.container.querySelector<HTMLElement>('[role="dialog"]')?.contains(document.activeElement)).toBe(true);

    act(() => [...view.container.querySelectorAll<HTMLButtonElement>('.action-sheet__actions > button')]
      .find((button) => button.textContent === '留在本局')?.click());
    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(countdown()?.dataset.countdown).toBe('2');
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(countdown()?.dataset.countdown).toBe('1');
    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(countdown()?.dataset.countdown).toBe('1');
    expect(runtime.start).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(countdown()).toBeNull();
    expect(runtime.setInputEnabled).toHaveBeenLastCalledWith(true);
    expect(runtime.setInputEnabled).toHaveBeenCalledWith(false);
    expect(runtime.start).toHaveBeenCalledTimes(1);
    expect(runtime.setInputEnabled.mock.invocationCallOrder[0]).toBeLessThan(runtime.start.mock.invocationCallOrder[0]!);
    expect(settings.disabled).toBe(false);
    expect(back.disabled).toBe(false);
    expect(document.activeElement).toBe(view.container.querySelector('canvas'));
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(runtime.start).toHaveBeenCalledTimes(1);

    const terminalState = {
      ...createInitialState(0x51a1f00d, 'marathon'),
      status: 'game-over' as const,
      score: 4321,
      lines: 12,
      pieceCount: 44,
      elapsedTicks: 3600,
    };
    act(() => {
      runtime.options.onState?.(terminalState, []);
      runtime.options.onState?.(terminalState, []);
    });
    expect(onRunFinished).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ mode: 'marathon', score: 4321, lines: 12 }));
    expect(view.container.querySelector('.result-leaderboard')?.textContent).toContain('排行榜前 50112 行4,321 分');
    expect(view.container.querySelector('[data-current-record="true"]')?.textContent).toContain('12 行');
    expect(view.container.querySelector('[data-metric="lines"]')?.textContent).toBe('12消行');
    expect(view.container.querySelector('[data-metric="score"]')?.textContent).toBe('4,321分数');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(onExit).toHaveBeenCalledExactlyOnceWith('home');
    view.unmount();
  });

  it('cancels the pending countdown step on unmount without enabling input or starting the runtime', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const view = render(createElement(GameSession, {
      mode: 'marathon',
      puzzleId: CAMPAIGN_LEVELS[0]!.id,
      onExit: vi.fn(),
      onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    const runtime = runtimeHarness.instances.at(-1)!;

    await act(async () => vi.advanceTimersByTimeAsync(400));
    view.unmount();
    await act(async () => vi.advanceTimersByTimeAsync(5000));

    expect(runtime.start).not.toHaveBeenCalled();
    expect(runtime.setInputEnabled.mock.calls.some(([enabled]) => enabled === true)).toBe(false);
  });
});

describe('T15 Phase 2 Settings layout contract', () => {
  it('uses one authoritative connected console without undersized interface text', () => {
    const startMarker = '/* T15 Phase 2 authoritative Settings console';
    const endMarker = '/* End T15 Phase 2 authoritative Settings console */';
    const start = sourceStyles.indexOf(startMarker);
    const end = sourceStyles.indexOf(endMarker, start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(sourceStyles.indexOf(startMarker, start + startMarker.length)).toBe(-1);

    const block = sourceStyles.slice(start, end);
    const fontSizes = [...block.matchAll(/font-size:\s*([\d.]+)px/g)].map((match) => Number(match[1]));
    expect(Math.min(...fontSizes)).toBeGreaterThanOrEqual(12);
    expect(block).toMatch(/\.action-sheet--settings\s*\{[\s\S]*?box-sizing:\s*border-box[\s\S]*?width:\s*min\(800px,\s*100%\)/);
    expect(block).toMatch(/\.settings-console\s*\{[\s\S]*?gap:\s*0\s*;/);
    expect(block).toMatch(/padding:\s*12px 16px\s*;/);
    expect(block).toMatch(/\.settings-console__controls[\s\S]*?grid-template-columns:\s*52px/);
    expect(block).toMatch(/\.settings-console__keyboard[\s\S]*?grid-template-columns:\s*52px/);
    expect(block).toMatch(/\.settings-console__controls \.language-control button\s*\{[\s\S]*?min-height:\s*44px/);
    expect(block).toMatch(/\.settings-console__controls \.audio-toggle\s*\{[\s\S]*?min-height:\s*44px/);
    expect(block).toMatch(/\.settings-console__actions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(block).toMatch(/\.settings-console__actions > button\s*\{[\s\S]*?min-height:\s*44px/);
    expect(block).not.toMatch(/\.action-sheet--settings\s*\{[^}]*width:[^;]*100vw/);
    expect(block).not.toMatch(/align-content:\s*space-between|grid-auto-rows:\s*1fr/);
  });
});

describe('T6 frontend mode binding', () => {
  it('keeps the authoritative countdown veil translucent above staged Survival bedrock', () => {
    const start = sourceStyles.lastIndexOf('.entry-countdown {');
    const end = sourceStyles.indexOf('\n}', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const block = sourceStyles.slice(start, end);
    expect(block).toMatch(/color-mix\(in srgb,\s*var\(--well\)\s*68%,\s*transparent\)/);
    expect(block).not.toContain('#071427');
  });

  it('keeps the live canvas visible but demoted while a modal owns the compositor', () => {
    const selector = '.play-shell:has(.sheet-backdrop) .canvas-host';
    const start = sourceStyles.indexOf(selector);
    const end = sourceStyles.indexOf('\n}', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const block = sourceStyles.slice(start, end);

    expect(block).toMatch(/z-index:\s*0\s*;/);
    expect(block).toMatch(/transform:\s*none\s*;/);
    expect(block).toMatch(/visibility:\s*visible\s*;/);
    expect(block).not.toMatch(/display:\s*none|visibility:\s*hidden|opacity:\s*0(?:\D|$)/);
  });

  it('preserves and refocuses the same canvas node across the Settings compositor', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const view = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();

    const canvas = view.container.querySelector<HTMLCanvasElement>('canvas')!;
    expect(canvas).not.toBeNull();
    act(() => canvas.focus());
    expect(document.activeElement).toBe(canvas);

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's', bubbles: true })));
    await act(async () => Promise.resolve());
    const sheet = view.container.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(view.container.querySelectorAll('canvas')).toHaveLength(1);
    expect(view.container.querySelector('canvas')).toBe(canvas);
    expect(sheet.contains(document.activeElement)).toBe(true);

    act(() => view.container.querySelector<HTMLElement>('[data-testid="action-sheet-backdrop"]')?.click());
    await act(async () => Promise.resolve());
    expect(view.container.querySelectorAll('canvas')).toHaveLength(1);
    expect(view.container.querySelector('canvas')).toBe(canvas);
    expect(document.activeElement).toBe(canvas);
    view.unmount();
  });

  it('moves mode rules out of home, then shows and stores the first-entry introduction', () => {
    localStorage.setItem('tetramorph:language:v1', 'zh-CN');
    const view = render(createElement(App));
    const mutation = view.container.querySelector<HTMLButtonElement>('[data-testid="enter-sprint"]')!;
    expect(view.container.querySelector('[data-testid="entry-mode-rules"]')).toBeNull();
    expect(view.container.textContent).not.toContain('带核心标记的方块携带道具。');

    act(() => mutation.click());
    const sheet = view.container.querySelector<HTMLElement>('.action-sheet')!;
    const rules = view.container.querySelector<HTMLElement>('[data-testid="entry-mode-rules"]')!;
    expect(sheet.querySelector('h2')?.textContent).toBe('异变规则');
    expect(sheet.textContent).not.toContain('首次进入说明');
    expect(rules.querySelector('strong')).toBeNull();
    expect(rules.textContent).toContain('特殊整块任一格被清除时，立即释放一次道具。');
    expect(rules.textContent).toContain('计时效果重复触发会刷新为 10 秒');
    expect(view.container.querySelector('[data-testid="mode-home"]')).not.toBeNull();

    const start = [...(view.container.querySelector('.action-sheet')?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      .find((button) => button.textContent === '好的')!;
    act(() => start.click());
    expect(JSON.parse(localStorage.getItem('tetris:mode-rule-intros:v1') ?? '[]')).toContain('sprint');
    expect(view.container.querySelector('[data-testid="game-screen"]')).not.toBeNull();
    view.unmount();
    view.unmount();
  });

  it('uses localized compact rule titles and describes random same-column Survival stones', () => {
    expect((['marathon', 'race', 'sprint', 'puzzle'] as const).map((mode) => modeRulesTitle('zh-CN', mode))).toEqual([
      '经典规则',
      '生存规则',
      '异变规则',
      '解谜规则',
    ]);
    expect((['marathon', 'race', 'sprint', 'puzzle'] as const).map((mode) => modeRulesTitle('en', mode))).toEqual([
      'Classic Rules',
      'Survival Rules',
      'Mutation Rules',
      'Puzzle Rules',
    ]);
    const chineseStonefall = modeRules('zh-CN', 'race').find((fact) => fact.id === 'stonefall')?.value ?? '';
    const englishStonefall = modeRules('en', 'race').find((fact) => fact.id === 'stonefall')?.value ?? '';
    expect(chineseStonefall).toContain('随机 1–2 块');
    expect(chineseStonefall).toContain('同一随机列');
    expect(chineseStonefall).not.toContain('同列双石');
    expect(englishStonefall).toContain('1–2 clearable rocks');
    expect(englishStonefall).toContain('one random column');
  });

  it('uses stable typed rule facts in both languages without delimiter parsing or placeholder entries', () => {
    const expected: Readonly<Record<GameMode, readonly string[]>> = {
      marathon: ['goal', 'pace', 'end'],
      race: ['start', 'pressure', 'stonefall', 'end'],
      sprint: ['goal', 'carriers', 'items', 'end'],
      puzzle: ['goal', 'queue', 'undo', 'record'],
    };

    for (const language of ['zh-CN', 'en'] as const) {
      for (const mode of ['marathon', 'race', 'sprint', 'puzzle'] as const) {
        const facts = modeRules(language, mode);
        expect(facts.map((fact) => fact.id)).toEqual(expected[mode]);
        for (const fact of facts) {
          expect(Object.keys(fact).sort()).toEqual(['id', 'label', 'value']);
          expect(fact.label.trim()).not.toBe('');
          expect(fact.value.trim()).not.toBe('');
          expect(`${fact.label}${fact.value}`).not.toMatch(/[|｜]/);
        }
      }
    }
  });

  it('binds every statistic to an explicit role without positional CSS inference', () => {
    const classic = { ...createInitialState(0x51a1f00d, 'marathon'), combo: 3 };
    const survival = createInitialState(0x51a1f00d, 'race');
    const sprintBase = createInitialState(0x51a1f00d, 'sprint');
    const sprint = {
      ...sprintBase,
      lines: 9,
      pieceCount: 19,
      elapsedTicks: 540,
      mutationFreezeTicks: 10 * 60,
      mutationCarriers: [{ id: 1, item: 'freeze' as const, cells: [] }],
    };
    const cases = [
      { state: classic, roles: ['score', 'lines', 'classic-combo', 'fall-cadence'], label: '经典模式数据', copy: ['连消', '3', '下落速度', '0.8 秒/格'] },
      {
        state: survival,
        roles: ['survival-time', 'lines', 'survival-bedrock', 'survival-stones'],
        label: '生存模式数据',
        copy: ['生存时间', '0:00', '上升', '13 秒', '落石', '20 秒'],
      },
      { state: sprint, roles: ['score', 'lines', 'classic-combo', 'fall-cadence'], label: '异变模式数据', copy: ['消行', '9', '连消', '下落速度', '1.0 秒/格'] },
      {
        state: createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01'),
        roles: ['puzzle-targets', 'puzzle-placed'],
        label: '解谜模式数据',
        copy: ['原有方块', '操作数'],
      },
    ];

    for (const { state, roles, label, copy } of cases) {
      const view = render(createElement(RunStats, { state }));
      const stats = view.container.querySelector<HTMLElement>('[data-testid="stats"]');
      const articles = [...(stats?.querySelectorAll<HTMLElement>('article') ?? [])];
      expect(articles.map((article) => article.dataset.statRole)).toEqual(roles);
      expect(new Set(articles.map((article) => article.dataset.statRole)).size).toBe(roles.length);
      expect(stats?.getAttribute('aria-label')).toBe(label);
      for (const fragment of copy) expect(stats?.textContent).toContain(fragment);
      expect(stats?.textContent).not.toMatch(/竞速|等级|速度档/);
      view.unmount();
    }

    const statisticSelectors = [...styles.matchAll(/([^{}]*\.run-stats[^{}]*)\{/g)]
      .map((match) => match[1]!.trim())
      .join('\n');
    expect(statisticSelectors).not.toMatch(/nth-child|nth-of-type|\bodd\b|\beven\b/);
  });

  it('marks both imminent Survival clocks without hiding their distinct meanings', () => {
    const state = {
      ...createInitialState(0x51a1f00d, 'race'),
      survivalRisePending: true,
      survivalDebrisIntervalSeconds: 20,
      survivalDebrisIntervalTicks: 19 * 60,
      survivalDebrisWarningColumns: [2],
    };
    const view = render(createElement(RunStats, { state }));
    const bedrock = view.container.querySelector<HTMLElement>('[data-stat-role="survival-bedrock"]');
    const stones = view.container.querySelector<HTMLElement>('[data-stat-role="survival-stones"]');

    expect(bedrock?.dataset.urgent).toBe('true');
    expect(bedrock?.textContent).toBe('上升待上升');
    expect(stones?.dataset.warning).toBe('true');
    expect(stones?.dataset.urgent).toBe('true');
    expect(stones?.textContent).toBe('落石1 秒');
    view.unmount();
  });

  it('shows Puzzle target progress and a non-limiting placed-piece count', () => {
    const state = createInitialState(0x51a1f00d, 'puzzle', 't5r-lattice-09');
    const view = render(createElement(RunStats, { state }));
    const targets = view.container.querySelector<HTMLElement>('[data-stat-role="puzzle-targets"]');
    const placed = view.container.querySelector<HTMLElement>('[data-stat-role="puzzle-placed"]');
    expect(targets?.textContent).toContain(`${state.puzzleTargetCells.length}/${state.puzzleInitialTargetCount}`);
    expect(placed?.textContent).toBe('操作数0');
    expect(view.container.querySelector('[data-stat-role="objective"]')).toBeNull();
    expect(view.container.textContent).not.toMatch(/剩余可用|已用方块|上限|限时|落定后/);
    view.unmount();
  });

  it('keeps the header to one S-accessible settings control and groups audio controls inside it', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const leaderboard = {
      version: 8 as const,
      marathon: [{
        version: 8 as const,
        mode: 'marathon' as const,
        outcome: 'top-out' as const,
        score: 3_210,
        lines: 12,
        pieces: 44,
        elapsedTicks: 3_600,
        chain: 0,
        completedAt: '2026-07-24T00:00:00.000Z',
      }],
      race: [],
      sprint: [],
    };
    const view = render(createElement(GameSession, {
      mode: 'marathon',
      puzzleId: CAMPAIGN_LEVELS[0]!.id,
      onExit: vi.fn(),
      onCanonicalCompletion: vi.fn(),
      onLanguageChange: vi.fn(),
      leaderboard,
    }));
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();
    const header = view.container.querySelector<HTMLElement>('[data-testid="cluster-header"]')!;
    const settings = view.container.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')!;
    expect(settings.textContent).toBe('设置');
    expect(settings.getAttribute('aria-keyshortcuts')).toBe('S');
    expect(header.querySelectorAll('button')).toHaveLength(2);
    expect(header.querySelector('[data-testid="restart-game"], [data-testid="pause-game"], [data-testid="audio-toggle"]')).toBeNull();

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's', bubbles: true })));
    const sheet = view.container.querySelector<HTMLElement>('[data-testid="settings-sheet"]')!;
    const dialog = sheet.closest<HTMLElement>('[role="dialog"]')!;
    expect(sheet).not.toBeNull();
    expect(dialog.classList.contains('action-sheet--settings')).toBe(true);
    expect(sheet.className).toBe('settings-console');
    expect(view.container.querySelector('.settings-sheet')).toBeNull();
    expect(runtimeHarness.instances.at(-1)?.togglePause).toHaveBeenCalled();
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(false);
    const toggle = view.container.querySelector<HTMLButtonElement>('[data-testid="audio-toggle"]')!;
    const volume = view.container.querySelector<HTMLInputElement>('[data-testid="audio-volume"]')!;
    const controls = view.container.querySelector<HTMLElement>('[data-testid="settings-controls"]')!;
    const settingsLeaderboard = view.container.querySelector<HTMLElement>('[data-testid="settings-leaderboard"]')!;
    const shortcuts = view.container.querySelector<HTMLElement>('[data-testid="settings-shortcuts"]')!;
    const gameplay = view.container.querySelector<HTMLElement>('[data-testid="keyboard-gameplay"]')!;
    const shortcutKeys = view.container.querySelector<HTMLElement>('[data-testid="keyboard-shortcuts"]')!;
    const rules = view.container.querySelector<HTMLElement>('[data-testid="settings-rules"]')!;
    expect(toggle.textContent).toBe('音效开');
    expect(view.container.querySelector('[data-testid="music-toggle"]')).toBeNull();
    expect(volume.value).toBe('100');
    expect([...sheet.children].map((child) => child.getAttribute('data-testid') ?? child.className)).toEqual([
      'settings-rules',
      'settings-controls',
      'settings-shortcuts',
      'settings-leaderboard',
    ]);
    expect(controls.textContent).toContain('控制');
    expect(settingsLeaderboard.textContent).toContain('本模式排行前 50112 行3,210 分2026.07.24');
    expect(rules.textContent).toContain('补满横行，消除并得分。');
    expect([...rules.querySelectorAll<HTMLElement>('[data-rule-id]')].map((fact) => fact.dataset.ruleId)).toEqual([
      'goal',
      'pace',
      'end',
    ]);
    expect(shortcuts.textContent).toContain('键盘玩法操作← → 移动↑ 旋转↓ 快速下落Space 直接落底快捷键S 设置P 暂停 / 继续R 重开确认Esc 返回← → 选择↑ ↓ 切换Enter 执行');
    expect(gameplay.textContent).toBe('玩法操作← → 移动↑ 旋转↓ 快速下落Space 直接落底');
    expect(shortcutKeys.textContent).toBe('快捷键S 设置P 暂停 / 继续R 重开确认Esc 返回← → 选择↑ ↓ 切换Enter 执行');
    expect(gameplay.classList.contains('settings-console__key-group--gameplay')).toBe(true);
    expect(shortcutKeys.classList.contains('settings-console__key-group--shortcuts')).toBe(true);
    const chinese = view.container.querySelector<HTMLButtonElement>('[data-testid="language-zh"]')!;
    const english = view.container.querySelector<HTMLButtonElement>('[data-testid="language-en"]')!;
    const restart = view.container.querySelector<HTMLButtonElement>('[data-testid="settings-restart"]')!;
    const resume = [...sheet.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === '继续游戏')!;
    expect(resume.dataset.arrowSelected).toBe('true');

    const assertArrowRoute = (from: HTMLButtonElement, key: string, to: HTMLButtonElement) => {
      act(() => from.focus());
      act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
      expect(document.activeElement).toBe(to);
      expect(to.dataset.arrowSelected).toBe('true');
    };
    const routes: readonly [HTMLButtonElement, string, HTMLButtonElement][] = [
      [chinese, 'ArrowLeft', toggle],
      [chinese, 'ArrowRight', english],
      [chinese, 'ArrowUp', restart],
      [chinese, 'ArrowDown', restart],
      [english, 'ArrowLeft', chinese],
      [english, 'ArrowRight', toggle],
      [english, 'ArrowUp', restart],
      [english, 'ArrowDown', restart],
      [toggle, 'ArrowLeft', english],
      [toggle, 'ArrowRight', chinese],
      [toggle, 'ArrowUp', resume],
      [toggle, 'ArrowDown', resume],
      [restart, 'ArrowLeft', resume],
      [restart, 'ArrowRight', resume],
      [restart, 'ArrowUp', chinese],
      [restart, 'ArrowDown', chinese],
      [resume, 'ArrowLeft', restart],
      [resume, 'ArrowRight', restart],
      [resume, 'ArrowUp', toggle],
      [resume, 'ArrowDown', toggle],
    ];
    for (const [from, key, to] of routes) assertArrowRoute(from, key, to);

    act(() => volume.focus());
    const nativeRangeArrow = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    act(() => volume.dispatchEvent(nativeRangeArrow));
    expect(nativeRangeArrow.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(volume);

    act(() => toggle.focus());
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(toggle.textContent).toBe('音效关');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(volume, '56');
    act(() => volume.dispatchEvent(new Event('input', { bubbles: true })));
    expect(view.container.textContent).toContain('56%');
    expect(runtimeHarness.instances.at(-1)?.setAudioEnabled).toHaveBeenCalledWith(false);
    expect(resume).not.toBeNull();
    act(() => view.container.querySelector<HTMLElement>('[data-testid="action-sheet-backdrop"]')?.click());
    expect(view.container.querySelector('[data-testid="settings-sheet"]')).toBeNull();
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(true);
    view.unmount();
  });

  it('limits the Puzzle Settings record to the selected level minimum piece count', () => {
    const level = CAMPAIGN_LEVELS[0]!;
    const completed = {
      ...defaultPuzzleProgress(),
      completedLevelIds: [level.id],
      bestPieceCounts: { [level.id]: 7 },
    };
    const completedView = render(createElement(SettingsRecord, {
      mode: 'puzzle', puzzleId: level.id, leaderboard: { version: 8, marathon: [], race: [], sprint: [] }, progress: completed,
    }));
    expect(completedView.container.textContent).toBe('当前关纪录最少 7 步');
    expect(completedView.container.textContent).not.toMatch(/消行|分|连锁|最长/);
    completedView.unmount();

    const freshView = render(createElement(SettingsRecord, {
      mode: 'puzzle', puzzleId: level.id, leaderboard: { version: 8, marathon: [], race: [], sprint: [] }, progress: defaultPuzzleProgress(),
    }));
    expect(freshView.container.textContent).toBe('当前关纪录尚未通关');
    freshView.unmount();
  });

  it('keeps live Puzzle information practical instead of exposing authored level metadata', () => {
    const state = createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01');
    const view = render(createElement(RunStats, { state }));
    expect(view.container.textContent).toContain('原有方块');
    expect(view.container.textContent).toContain('操作数');
    expect(view.container.textContent).not.toContain('通关目标');
    expect(view.container.textContent).not.toContain('起步');
    expect(view.container.textContent).not.toMatch(/\d+\/20/);
    view.unmount();
  });

  it('labels Puzzle Next as two ordered canonical inputs while live modes retain one', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const puzzle = render(createElement(GameSession, {
      mode: 'puzzle', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    const puzzleSlot = puzzle.container.querySelector<HTMLElement>('[data-testid="next-slot"]')!;
    const segments = puzzle.container.querySelectorAll<HTMLElement>('[data-testid="puzzle-next-segment"]');
    expect(puzzle.container.querySelector('.preview-sequence')).toBeNull();
    expect(puzzleSlot.dataset.previewCount).toBe('2');
    expect(segments).toHaveLength(2);
    expect(segments[0]?.dataset.previewSegment).toBe('1');
    expect(segments[0]?.getAttribute('aria-label')).toBe('1 下一个方块');
    expect(segments[0]?.textContent).toBe('1');
    expect(segments[1]?.dataset.previewSegment).toBe('2');
    expect(segments[1]?.getAttribute('aria-label')).toBe('2 后一个方块');
    expect(segments[1]?.textContent).toBe('2');
    await advanceEntryCountdown();
    const puzzlePreview = runtimeHarness.instances.at(-1)!.getState().queue.slice(0, 2);
    expect(segments[0]?.getAttribute('aria-label')).toBe(`1 下一个方块: ${puzzlePreview[0]}`);
    expect(segments[1]?.getAttribute('aria-label')).toBe(`2 后一个方块: ${puzzlePreview[1]}`);
    expect(puzzleSlot.getAttribute('aria-label')).toContain(puzzlePreview.join(', '));
    puzzle.unmount();

    const classic = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    const classicSlot = classic.container.querySelector<HTMLElement>('[data-testid="next-slot"]')!;
    expect(classic.container.querySelector('.preview-rail')?.textContent).toContain('Next');
    expect(classic.container.querySelector('.preview-rail')?.textContent).not.toContain('Next · 2');
    expect(classicSlot.dataset.previewCount).toBe('1');
    expect(classicSlot.getAttribute('role')).toBe('img');
    expect(classicSlot.getAttribute('aria-label')).toBe('下一个方块');
    classic.unmount();

    const mutation = render(createElement(GameSession, {
      mode: 'sprint', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    const mutationSlot = mutation.container.querySelector<HTMLElement>('[data-testid="next-slot"]')!;
    expect(mutationSlot.getAttribute('aria-label')).toBe('下一个方块');
    await advanceEntryCountdown();
    const mutationRuntime = runtimeHarness.instances.at(-1)!;
    let carrierPreviewState: GameState | null = null;
    for (let seed = 1; seed <= 512 && carrierPreviewState === null; seed += 1) {
      let candidate = dispatch(createInitialState(seed, 'sprint'), { type: 'start' }).state;
      candidate = dispatch(candidate, { type: 'hard-drop' }).state;
      for (let tick = 0; tick < 120 && candidate.active === null; tick += 1) {
        candidate = dispatch(candidate, { type: 'tick' }).state;
      }
      candidate = dispatch(candidate, { type: 'hard-drop' }).state;
      if (nextMutationPreviewItem(candidate) !== null) carrierPreviewState = candidate;
    }
    if (carrierPreviewState === null) throw new Error('Expected a deterministic Mutation carrier preview seed');
    const mutationState = carrierPreviewState;
    expect(mutationState.active).toBeNull();
    act(() => mutationRuntime.setState(mutationState));
    const mutationItem = nextMutationPreviewItem(mutationState);
    expect(mutationItem).not.toBeNull();
    expect(mutationSlot.getAttribute('aria-label')).toBe(
      `下一个方块: ${mutationState.queue[0]} 方块，携带${itemLabel('zh-CN', mutationItem!)}道具`,
    );
    mutation.unmount();
  });

  it('routes the transparent board interaction surface to the same canvas and touch controls', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const view = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();

    const board = view.container.querySelector<HTMLElement>('[data-testid="board-frame"]')!;
    const canvas = view.container.querySelector<HTMLCanvasElement>('canvas')!;
    const runtime = runtimeHarness.instances.at(-1)!;
    Object.assign(board, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
      releasePointerCapture: vi.fn(),
    });
    const pointer = (type: 'pointerdown' | 'pointerup', x: number, y: number, at: number) => {
      const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
      Object.defineProperties(event, {
        pointerId: { value: 7 },
        pointerType: { value: 'touch' },
        timeStamp: { value: at },
      });
      return event;
    };

    act(() => {
      board.dispatchEvent(pointer('pointerdown', 100, 100, 100));
      board.dispatchEvent(pointer('pointerup', 104, 104, 220));
    });
    expect(document.activeElement).toBe(canvas);
    expect(runtime.press).toHaveBeenCalledWith('rotate-cw');

    act(() => {
      board.dispatchEvent(pointer('pointerdown', 100, 100, 300));
      board.dispatchEvent(pointer('pointerup', 140, 101, 390));
    });
    expect(runtime.press).toHaveBeenCalledWith('right');
    expect(runtime.release).toHaveBeenCalledWith('right');
    view.unmount();
  });

  it('directly restores the prior Puzzle piece from its top spawn after a lock', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const puzzle = render(createElement(GameSession, {
      mode: 'puzzle', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());

    expect(puzzle.container.querySelector('[data-testid="touch-rail"]')).toBeNull();
    expect(puzzle.container.querySelector('[data-testid="board-frame"]')?.hasAttribute('aria-label')).toBe(false);
    expect(puzzle.container.querySelector('canvas')?.getAttribute('aria-description')).toContain('触控');
    expect(puzzle.container.querySelector('.keyboard-map')).toBeNull();

    await advanceEntryCountdown();
    const instance = runtimeHarness.instances.at(-1)!;
    const current = instance.getState();
    const locked = dispatch(current, { type: 'hard-drop' }).state;
    act(() => instance.setState(locked));
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', key: 'z', bubbles: true })));
    expect(instance.undoPuzzle).toHaveBeenCalledTimes(1);
    expect(instance.getState().active).toEqual(current.active);
    expect(instance.getState().puzzleUndoHistory).toEqual([]);
    expect(puzzle.container.querySelector('[data-testid="confirm-puzzle-undo"]')).toBeNull();

    act(() => instance.setState(locked));
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', key: 'z', bubbles: true })));
    expect(instance.undoPuzzle).toHaveBeenCalledTimes(2);
    expect(instance.getState().active).toEqual(current.active);
    puzzle.unmount();

    const classic = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    expect(classic.container.querySelector('[data-testid="touch-undo"]')).toBeNull();
    expect(classic.container.querySelector('.keyboard-map')).toBeNull();
    classic.unmount();
  });

  it('pauses through Settings and routes Settings/R restart through the same Enter confirmation', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const view = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();
    runtimeHarness.instances.at(-1)?.restart.mockClear();
    runtimeHarness.instances.at(-1)?.start.mockClear();
    runtimeHarness.instances.at(-1)?.togglePause.mockClear();
    const settings = view.container.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')!;
    const topbar = view.container.querySelector<HTMLElement>('[data-testid="cluster-header"]')!;
    expect(settings.disabled).toBe(false);
    expect(topbar.textContent).toContain('设置');
    expect(topbar.textContent).not.toContain('重新开始暂停声音');

    act(() => settings.click());
    expect(view.container.querySelector('[data-testid="settings-sheet"]')?.textContent).toContain('继续游戏');
    expect(runtimeHarness.instances.at(-1)?.togglePause).toHaveBeenCalledTimes(1);
    act(() => view.container.querySelector<HTMLButtonElement>('[data-testid="settings-restart"]')?.click());
    expect(view.container.textContent).toContain('重新开始？');
    expect(view.container.textContent).not.toContain('按 Enter 确认。');
    const confirmRestart = view.container.querySelector<HTMLButtonElement>('[data-testid="confirm-restart"]')!;
    const cancelRestart = [...view.container.querySelectorAll<HTMLButtonElement>('.action-sheet__actions > button')]
      .find((button) => button.textContent === '取消')!;
    expect(confirmRestart.textContent).toBe('确认');
    expect(confirmRestart.dataset.actionSelected).toBe('true');
    expect(runtimeHarness.instances.at(-1)?.restart).not.toHaveBeenCalled();
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(false);
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(cancelRestart.dataset.actionSelected).toBe('true');
    expect(confirmRestart.dataset.actionSelected).toBeUndefined();
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(view.container.textContent).not.toContain('重新开始？');
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(true);
    expect(runtimeHarness.instances.at(-1)?.togglePause).toHaveBeenCalledTimes(2);

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR', key: 'r', bubbles: true })));
    expect(view.container.textContent).toContain('重新开始？');
    expect(runtimeHarness.instances.at(-1)?.restart).not.toHaveBeenCalled();
    expect(runtimeHarness.instances.at(-1)?.togglePause).toHaveBeenCalledTimes(3);
    expect(view.container.querySelector('[data-testid="confirm-restart"]')?.getAttribute('data-action-selected')).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(runtimeHarness.instances.at(-1)?.restart).toHaveBeenCalledTimes(1);
    expect(runtimeHarness.instances.at(-1)?.start).not.toHaveBeenCalled();
    expect(view.container.querySelector('[data-testid="entry-countdown"]')?.getAttribute('data-countdown')).toBe('3');
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(false);
    expect(view.container.querySelector('[data-testid="confirm-restart"]')).toBeNull();
    await advanceEntryCountdown();
    expect(runtimeHarness.instances.at(-1)?.start).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector('[data-testid="entry-countdown"]')).toBeNull();
    view.unmount();
  });

  it('treats Settings opened from an existing pause as an overlay and continues directly to play', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const view = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();
    const runtime = runtimeHarness.instances.at(-1)!;
    runtime.togglePause.mockClear();
    act(() => runtime.setState({ ...runtime.getState(), status: 'paused' }));
    expect(view.container.textContent).toContain('已暂停');

    act(() => view.container.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')?.click());
    expect(runtime.togglePause).not.toHaveBeenCalled();
    expect(view.container.querySelector('[data-testid="settings-sheet"]')?.textContent).toContain('继续游戏');
    expect(view.container.querySelector('[data-testid="settings-sheet"]')?.textContent).not.toContain('返回暂停');

    act(() => [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="settings-sheet"] button')]
      .find((button) => button.textContent === '继续游戏')?.click());
    expect(view.container.querySelector('[data-testid="settings-sheet"]')).toBeNull();
    expect(view.container.textContent).not.toContain('已暂停');
    expect(runtime.togglePause).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('hands focus to a successor sheet before restoring the game canvas', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    let nextFrame = 0;
    const frameQueue = new Map<number, FrameRequestCallback>();
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      nextFrame += 1;
      frameQueue.set(nextFrame, callback);
      return nextFrame;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((handle: number) => {
      frameQueue.delete(handle);
    }));
    const flushFrame = () => {
      const callbacks = [...frameQueue.values()];
      frameQueue.clear();
      callbacks.forEach((callback) => callback(0));
    };
    const flushTwoFrames = () => {
      act(flushFrame);
      act(flushFrame);
    };

    const view = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();
    const canvas = view.container.querySelector<HTMLCanvasElement>('canvas')!;
    const runtime = runtimeHarness.instances.at(-1)!;
    act(() => canvas.focus());

    act(() => runtime.setState({ ...runtime.getState(), status: 'paused' }));
    act(flushFrame);
    const pauseDialog = view.container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')!;
    expect(pauseDialog.textContent).toContain('已暂停');
    expect(pauseDialog.contains(document.activeElement)).toBe(true);

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's', bubbles: true })));
    const settingsDialog = view.container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')!;
    expect(view.container.querySelectorAll('[role="dialog"][aria-modal="true"]')).toHaveLength(1);
    expect(settingsDialog.querySelector('[data-testid="settings-sheet"]')).not.toBeNull();
    flushTwoFrames();
    expect(settingsDialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(canvas);
    expect(view.container.querySelectorAll('canvas')).toHaveLength(1);
    expect(view.container.querySelector('canvas')).toBe(canvas);
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(false);

    act(() => view.container.querySelector<HTMLElement>('[data-testid="action-sheet-backdrop"]')?.click());
    flushTwoFrames();
    expect(view.container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(canvas);

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's', bubbles: true })));
    act(flushFrame);
    act(() => view.container.querySelector<HTMLButtonElement>('[data-testid="settings-restart"]')?.click());
    const restartDialog = view.container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')!;
    expect(restartDialog.textContent).toContain('重新开始？');
    flushTwoFrames();
    expect(restartDialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(canvas);
    const cancelRestart = [...restartDialog.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === '取消')!;
    act(() => cancelRestart.click());
    flushTwoFrames();
    expect(view.container.querySelector('[role="dialog"]')).toBeNull();
    expect(view.container.querySelectorAll('canvas')).toHaveLength(1);
    expect(view.container.querySelector('canvas')).toBe(canvas);
    expect(document.activeElement).toBe(canvas);

    act(() => runtime.setState({ ...runtime.getState(), status: 'paused' }));
    flushTwoFrames();
    expect(view.container.querySelector<HTMLElement>('[role="dialog"]')?.textContent).toContain('已暂停');
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's', bubbles: true })));
    flushTwoFrames();
    act(() => view.container.querySelector<HTMLButtonElement>('[data-testid="settings-restart"]')?.click());
    flushTwoFrames();
    const pausedRestartDialog = view.container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')!;
    expect(pausedRestartDialog.textContent).toContain('重新开始？');
    expect(pausedRestartDialog.contains(document.activeElement)).toBe(true);
    act(() => [...pausedRestartDialog.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === '取消')?.click());
    flushTwoFrames();
    const returnedPauseDialog = view.container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')!;
    expect(view.container.querySelectorAll('[role="dialog"][aria-modal="true"]')).toHaveLength(1);
    expect(returnedPauseDialog.textContent).toContain('已暂停');
    expect(returnedPauseDialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(canvas);
    expect(view.container.querySelectorAll('canvas')).toHaveLength(1);
    expect(view.container.querySelector('canvas')).toBe(canvas);
    view.unmount();
  });

  it('routes Escape through the visible return confirmation with arrow and Enter selection', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const onExit = vi.fn();
    const view = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit, onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();
    const back = view.container.querySelector<HTMLButtonElement>('.topbar-action')!;
    expect(back.getAttribute('aria-keyshortcuts')).toBe('Escape');

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })));
    expect(view.container.textContent).toContain('离开本局？');
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(false);
    const actions = [...view.container.querySelectorAll<HTMLButtonElement>('.action-sheet__actions > button')];
    const leave = actions
      .find((button) => button.textContent === '返回模式首页')!;
    const stay = actions.find((button) => button.textContent === '留在本局')!;
    expect(actions.map((button) => button.textContent)).toEqual(['返回模式首页', '留在本局']);
    expect(stay.dataset.actionSelected).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(leave.dataset.actionSelected).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(onExit).toHaveBeenCalledExactlyOnceWith('home');
    view.unmount();
  });

  it('keeps the homepage navigational without visible rules or record copy', () => {
    const onEnter = vi.fn();
    const view = render(createElement(ModeHome, { onEnter }));
    const classic = view.container.querySelector<HTMLButtonElement>('[data-testid="enter-marathon"]');
    const survival = view.container.querySelector<HTMLButtonElement>('[data-testid="enter-race"]');
    const mutation = view.container.querySelector<HTMLButtonElement>('[data-testid="enter-sprint"]');
    const puzzle = view.container.querySelector<HTMLButtonElement>('[data-testid="enter-puzzle"]');

    expect(classic).not.toBeNull();
    expect([classic, survival, mutation, puzzle].map((button) => button?.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(view.container.querySelectorAll('.mode-gate--active')).toHaveLength(0);
    expect(view.container.querySelector('[data-testid="mode-list"]')?.hasAttribute('data-selection')).toBe(false);
    expect([classic, survival, mutation, puzzle].every((button) => (
      !button?.hasAttribute('data-selected') && !button?.hasAttribute('aria-pressed')
    ))).toBe(true);
    expect(classic?.textContent).toContain('经典');
    expect(view.container.textContent).not.toMatch(/马拉松|竞速|等级|速度档/);
    expect(view.container.textContent).not.toContain('选择模式');
    expect(view.container.textContent).not.toContain('补满任意横行即可消除并得分。');
    expect(view.container.querySelector('[data-testid="brand"]')).toBeNull();
    expect(view.container.querySelector('h1.mode-home-wordmark')?.tagName).toBe('H1');
    expect(view.container.querySelector('h1.mode-home-wordmark')?.textContent).toBe('TetraMorph');
    expect(view.container.textContent).not.toContain('基岩会持续向上推进。');
    expect(view.container.textContent).not.toContain('带核心标记的方块携带道具。');
    expect(view.container.textContent).not.toContain('使用固定出现顺序的方块。');
    expect(view.container.textContent).not.toMatch(/按(?:消行|时长)排行|记录最少落子/);
    expect(view.container.textContent).not.toContain('目标：清空棋盘');
    expect(view.container.querySelector('.mode-preview')).toBeNull();
    expect(view.container.querySelector('.phase-seam')).toBeNull();
    expect(view.container.querySelector('.landing-shell--workbench .mode-chooser--workbench')).not.toBeNull();
    expect(view.container.querySelectorAll('.mode-gate__index, .mode-gate__motif')).toHaveLength(0);
    expect(view.container.querySelector('.landing-header__signal, .landing-intro__eyebrow, .landing-intro__mark')).toBeNull();
    for (const selector of ['enter-marathon', 'enter-race', 'enter-sprint', 'enter-puzzle']) {
      expect(view.container.querySelectorAll(`[data-testid="${selector}"] .mode-gate__glyph rect`)).toHaveLength(4);
    }
    expect(styles).not.toContain('.phase-seam');
    expect(styles).not.toContain('.action-sheet::before');
    expect(styles).not.toContain('rotate(3deg)');
    expect(view.container.textContent).not.toMatch(/GRAVITY FIELD|选择一条重力轨迹/);

    for (const banned of ['当前选择', '三种玩法', '随时开始，也可随时退出。', '键盘与触控均可操作']) {
      expect(view.container.textContent).not.toContain(banned);
    }

    act(() => classic?.focus());
    act(() => classic?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })));
    expect(document.activeElement).toBe(survival);
    expect([classic, survival, mutation, puzzle].map((button) => button?.tabIndex)).toEqual([-1, 0, -1, -1]);
    act(() => survival?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })));
    expect(document.activeElement).toBe(puzzle);
    act(() => puzzle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })));
    expect(document.activeElement).toBe(mutation);
    act(() => mutation?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })));
    expect(document.activeElement).toBe(classic);
    expect(view.container.querySelectorAll('.mode-gate--active')).toHaveLength(0);

    act(() => survival?.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true })));
    act(() => survival?.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true })));
    expect(view.container.querySelectorAll('.mode-gate--active, [data-selected="true"]')).toHaveLength(0);

    act(() => survival?.click());
    expect(onEnter).toHaveBeenCalledWith('race');
    view.unmount();
  });

  it('persists an English settings choice across the active game surface without Chinese fallback copy', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    localStorage.setItem('tetramorph:language:v1', 'zh-CN');
    localStorage.setItem('tetris:mode-rule-intros:v1', JSON.stringify(['marathon']));
    const view = render(createElement(App));

    act(() => view.container.querySelector<HTMLButtonElement>('[data-testid="enter-marathon"]')?.click());
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();
    act(() => view.container.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')?.click());
    const english = view.container.querySelector<HTMLButtonElement>('[data-testid="language-en"]')!;
    expect(english).not.toBeNull();
    act(() => english.click());

    const sheet = view.container.querySelector<HTMLElement>('[data-testid="settings-sheet"]')!;
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('tetramorph:language:v1')).toBe('en');
    expect(sheet.textContent).toContain('Settings');
    expect(sheet.textContent).toMatch(/Keyboard.*Move.*Hard drop/s);
    expect(sheet.textContent).not.toMatch(/[\u4E00-\u9FFF]/);
    expect(view.container.querySelector('.sr-only[aria-live="polite"]')?.textContent).toBe('');
    expect(view.container.querySelector('.keyboard-map')).toBeNull();
    expect(view.container.querySelector('canvas')?.getAttribute('aria-label')).toBe('TetraMorph 10 by 20 game board');
    view.unmount();
  });

  it('keeps the active English language in the terminal leaderboard call site', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const view = render(createElement(GameSession, {
      mode: 'marathon',
      puzzleId: CAMPAIGN_LEVELS[0]!.id,
      onExit: vi.fn(),
      onCanonicalCompletion: vi.fn(),
      language: 'en',
    }));
    await act(async () => Promise.resolve());
    await advanceEntryCountdown();

    const runtime = runtimeHarness.instances.at(-1)!;
    act(() => runtime.setState({
      ...runtime.getState(),
      status: 'game-over',
      score: 4321,
      lines: 12,
      pieceCount: 44,
      elapsedTicks: 3600,
    }));

    const leaderboard = view.container.querySelector<HTMLElement>('.result-leaderboard');
    expect(leaderboard?.getAttribute('aria-label')).toBe('Leaderboard');
    expect(leaderboard?.querySelector('header')?.textContent).toBe('LeaderboardTop 5');
    expect(leaderboard?.textContent).toContain('12 lines');
    expect(leaderboard?.textContent).toContain('4,321 pts');
    expect(leaderboard?.textContent).not.toMatch(/[\u4E00-\u9FFF]/);
    view.unmount();
  });

  it('ranks and labels Classic by cleared lines, Survival by endurance, and 异变 by cleared lines', () => {
    const base: ScoreRecord = {
      version: 8,
      score: 3200,
      lines: 18,
      pieces: 62,
      elapsedTicks: 4200,
      chain: 0,
      mode: 'marathon',
      outcome: 'top-out',
      completedAt: '2026-07-18T12:00:00.000Z',
    };
    const classic = render(createElement(LeaderboardPanel, { mode: 'marathon', records: [base], highlightRecord: base }));
    expect(classic.container.querySelector('.result-leaderboard')?.getAttribute('aria-label')).toBe('排行榜');
    expect(classic.container.querySelector('.result-leaderboard header')?.textContent).toBe('排行榜前 5');
    expect(classic.container.querySelector('.result-leaderboard li .result-leaderboard__run')?.textContent).toBe('18 行3,200 分本局');
    expect(classic.container.querySelector('.result-leaderboard__current')?.textContent).toBe('本局');
    expect(classic.container.querySelector('.result-leaderboard li time')?.textContent).toBe('2026.07.18');
    expect(classic.container.querySelector('.result-leaderboard li')?.textContent).not.toContain('·');
    expect(classic.container.querySelector('[data-current-record="true"]')).not.toBeNull();
    expect(classic.container.querySelector<HTMLElement>('.result-leaderboard')?.dataset.empty).toBeUndefined();
    expect(scoreRecordRank([base], base)).toBe(1);
    expect(scoreRecordRank([base], { ...base, completedAt: '2026-07-19T12:00:00.000Z' })).toBeNull();
    classic.unmount();

    const emptySettings = render(createElement(LeaderboardPanel, { mode: 'marathon', records: [], variant: 'settings' }));
    expect(emptySettings.container.querySelector<HTMLElement>('[data-testid="settings-leaderboard"]')?.dataset.empty).toBe('true');
    expect(emptySettings.container.querySelector('.result-leaderboard > p')?.textContent).toBe('暂无记录');
    emptySettings.unmount();

    const survivalRecord: ScoreRecord = {
      version: 8,
      mode: 'race',
      outcome: 'top-out',
      lines: 27,
      elapsedTicks: base.elapsedTicks,
      completedAt: base.completedAt,
    };
    const survival = render(createElement(LeaderboardPanel, { mode: 'race', records: [survivalRecord] }));
    expect(survival.container.querySelector('.result-leaderboard')?.getAttribute('aria-label')).toBe('排行榜');
    expect(survival.container.querySelector('.result-leaderboard header')?.textContent).toBe('排行榜前 5');
    expect(survival.container.querySelector('.result-leaderboard li .result-leaderboard__run')?.textContent).toBe('1 分 10 秒27 行');
    expect(survival.container.querySelector('.result-leaderboard li')?.textContent).not.toContain('方块');
    expect(survival.container.querySelector('.result-leaderboard li time')?.textContent).toBe('2026.07.18');
    survival.unmount();

    const sprintRecord = { ...base, mode: 'sprint' as const, score: 1800, lines: 40, pieces: 48, elapsedTicks: 5400, chain: 0 };
    const sprint = render(createElement(LeaderboardPanel, { mode: 'sprint', records: [sprintRecord] }));
    expect(sprint.container.querySelector('.result-leaderboard')?.getAttribute('aria-label')).toBe('排行榜');
    expect(sprint.container.querySelector('.result-leaderboard header')?.textContent).toBe('排行榜前 5');
    expect(sprint.container.querySelector('.result-leaderboard li .result-leaderboard__run')?.textContent).toBe('40 行1,800 分  48 方块');
    expect(sprint.container.querySelector('.result-leaderboard li time')?.textContent).toBe('2026.07.18');
    sprint.unmount();

    expect(elapsedTimeLabel(65 * 60)).toBe('1 分 5 秒');
    expect(elapsedClockLabel(65 * 60)).toBe('1:05');
    expect(countdownTimeLabel(65 * 60)).toBe('1:05');

    const ended = { ...createInitialState(1, 'race'), status: 'game-over' as const, score: 900, lines: 27, pieceCount: 62, elapsedTicks: 4200 };
    expect(scoreRecordForState(ended, base.completedAt)).toEqual({
      version: 8,
      mode: 'race',
      outcome: 'top-out',
      lines: 27,
      elapsedTicks: 4200,
      completedAt: base.completedAt,
    });
    const endedSprint = { ...createInitialState(1, 'sprint'), status: 'game-over' as const, score: 1800, lines: 40, pieceCount: 48, elapsedTicks: 5400 };
    expect(scoreRecordForState(endedSprint, base.completedAt)).toMatchObject({ mode: 'sprint', score: 1800, lines: 40, chain: 0, outcome: 'top-out' });
    expect(scoreRecordForState(createInitialState(1, 'puzzle', CAMPAIGN_LEVELS[0]!.id), base.completedAt)).toBeNull();
  });

  it('renders at most five real rows with the exact record field matrix for each scored mode', () => {
    const expectedFields: Readonly<Record<'marathon' | 'race' | 'sprint', readonly string[]>> = {
      marathon: ['rank', 'lines', 'score', 'date'],
      race: ['rank', 'time', 'lines', 'date'],
      sprint: ['rank', 'lines', 'score', 'pieces', 'date'],
    };

    for (const mode of ['marathon', 'race', 'sprint'] as const) {
      const records: ScoreRecord[] = Array.from({ length: 7 }, (_, index) => {
        const completedAt = `2026-07-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`;
        if (mode === 'race') return {
          version: 8 as const,
          mode: 'race' as const,
          outcome: 'top-out' as const,
          lines: 30 - index,
          elapsedTicks: 4200 - index * 30,
          completedAt,
        };
        return {
          version: 8 as const,
          mode,
          outcome: 'top-out' as const,
          score: 7000 - index * 100,
          lines: 30 - index,
          pieces: 50 + index,
          elapsedTicks: 4200 - index * 30,
          chain: 0,
          completedAt,
        };
      });
      const view = render(createElement(LeaderboardPanel, { mode, records, variant: 'settings' }));
      const rows = [...view.container.querySelectorAll<HTMLLIElement>('ol > li')];
      expect(rows).toHaveLength(5);
      expect(rows.map((row) => row.querySelector('[data-record-field="rank"]')?.textContent)).toEqual(['01', '02', '03', '04', '05']);
      for (const row of rows) {
        expect([...row.querySelectorAll<HTMLElement>('[data-record-field]')].map((field) => field.dataset.recordField))
          .toEqual(expectedFields[mode]);
      }
      if (mode === 'race') {
        expect(view.container.querySelector('[data-record-field="score"], [data-record-field="pieces"]')).toBeNull();
      }
      view.unmount();

      const empty = render(createElement(LeaderboardPanel, { mode, records: [], variant: 'settings' }));
      expect(empty.container.querySelectorAll('li')).toHaveLength(0);
      expect(empty.container.querySelector('.result-leaderboard > p')?.textContent).toBe('暂无记录');
      empty.unmount();
    }
  });

  it('labels an active 4× multiplier with a visible ten-second meter and no Bomb rail copy', () => {
    const idle = render(createElement(MutationStatus, {
      state: createInitialState(0x51a1f00d, 'sprint'),
    }));
    expect(idle.container.querySelector('[data-testid="mutation-status"]')).toBeNull();
    idle.unmount();

    const active = {
      ...createInitialState(0x51a1f00d, 'sprint'),
      mutationMultiplierTicks: 600,
      mutationMultiplierFactor: 4 as const,
    };
    const view = render(createElement(MutationStatus, { state: active }));
    const multiplier = view.container.querySelector<HTMLElement>('[data-mutation-state="multiplier"]');
    expect(view.container.querySelectorAll('.mutation-status__effect')).toHaveLength(1);
    expect(multiplier?.textContent).toBe('超级加倍 ×4生效中10 秒');
    expect(multiplier?.dataset.mutationTier).toBe('4');
    expect(multiplier?.querySelector<HTMLElement>('.mutation-status__meter > i')?.style.width).toBe('100%');
    expect(view.container.textContent).not.toContain('倍增');
    const bombState = { ...active, mutationLastItem: 'bomb' as const, mutationLastItemTicks: 120 };
    const bomb = render(createElement(MutationStatus, { state: bombState }));
    expect(bomb.container.textContent).not.toContain('炸弹已清除底部 3 行');
    const mutationRule = modeRules('zh-CN', 'sprint').find((fact) => fact.id === 'items')?.value ?? '';
    expect(mutationRule).toContain('冰冻把自动下落固定为 1.0 秒/格');
    expect(mutationRule).toContain('超重使各列独立下沉');
    expect(mutationRule).not.toContain('冻结');
    bomb.unmount();
    view.unmount();
  });

  it('announces every notable event from one transition in source order', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const view = render(createElement(GameSession, {
      mode: 'sprint', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    const runtime = runtimeHarness.instances.at(-1)!;
    const events: GameEvent[] = [
      { type: 'lines-cleared', rows: [39], count: 1, score: 40 },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 },
      { type: 'mutation-activated', item: 'collapse', durationTicks: 600, score: 0, rowsRemoved: 0 },
    ];
    act(() => runtime.options.onState?.(runtime.getState(), events));
    expect(view.container.querySelector('.sr-only[aria-live="polite"]')?.textContent).toBe(
      '消除了 1 行。 冰冻 已触发，持续 10 秒。 超重 已触发，持续 10 秒。',
    );
    view.unmount();
  });

  it('reports Survival terminal data and bedrock rise announcements', () => {
    const terminalState: GameState = {
      ...createInitialState(0x51a1f00d, 'race'),
      status: 'game-over',
      lines: 24,
      pieceCount: 72,
      survivalBedrockRows: 4,
    };

    expect(terminalCopy(terminalState)).toEqual({
      title: '生存结束',
      detail: '',
      success: false,
    });
    expect(runResultMetrics({ ...terminalState, elapsedTicks: 125 * 60 })).toEqual([
      { id: 'survival-time', label: '生存时间', value: '2:05', primary: true },
      { id: 'lines', label: '消行', value: '24', primary: false },
    ]);
    const resultSummary = render(createElement(RunResultSummary, {
      state: { ...terminalState, elapsedTicks: 125 * 60 },
      rank: 2,
      hasRecord: true,
    }));
    expect(resultSummary.container.querySelector('.run-result__rank')).toBeNull();
    expect(resultSummary.container.textContent).not.toContain('本局第');
    expect(resultSummary.container.textContent).not.toMatch(/方块|基岩/);
    resultSummary.unmount();
    const unrankedSummary = render(createElement(RunResultSummary, {
      state: { ...terminalState, elapsedTicks: 125 * 60 },
      rank: null,
      hasRecord: true,
    }));
    expect(unrankedSummary.container.querySelector('.run-result__rank')?.textContent).toBe('未进入前 5');
    unrankedSummary.unmount();
    expect(eventMessage({ type: 'bedrock-raised', count: 1, height: 4 })).toBe('基岩升至 4 层。');
    expect(eventMessage({ type: 'bedrock-lowered', count: 1, height: 3 })).toBe('基岩降至 3 层。');
    expect(eventMessage({ type: 'puzzle-undone' })).toBe('已撤回上一次落子。');
    const mutationEvents: GameEvent[] = [
      { type: 'lines-cleared', rows: [39], count: 1, score: 40 },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 },
      { type: 'mutation-activated', item: 'collapse', durationTicks: 600, score: 0, rowsRemoved: 0 },
    ];
    expect(eventMessages(mutationEvents)).toBe(
      '消除了 1 行。 冰冻 已触发，持续 10 秒。 超重 已触发，持续 10 秒。',
    );
    expect(eventMessages(mutationEvents, 'en')).toBe(
      '1 lines cleared. Freeze activated for 10 seconds. Supergravity activated for 10 seconds.',
    );

    const completedPuzzle: GameState = {
      ...createInitialState(0x51a1f00d, 'puzzle', CAMPAIGN_LEVELS[0]!.id),
      status: 'finished',
      puzzleCompletion: 'finished',
      pieceCount: 4,
      lines: 3,
    };
    expect(terminalCopy(completedPuzzle)).toEqual({
      title: '原有方块已清除',
      detail: '4 方块 · 3 消行',
      success: true,
    });
    expect(puzzleCelebrationOutcome(null, 9)).toBe('first');
    expect(puzzleCelebrationOutcome(12, 9)).toBe('record');
    expect(puzzleCelebrationOutcome(9, 9)).toBe('replay');
    expect(puzzleCelebrationOutcome(8, 9)).toBe('replay');
    expect(puzzleCelebrationCopy({ outcome: 'first', pieces: 9, lines: 5, previousBest: null })).toEqual({
      title: '恭喜你破解谜题',
      detail: '',
      eyebrow: '首次破解',
      best: '当前最优：9步',
    });
    expect(puzzleCelebrationCopy({ outcome: 'record', pieces: 9, lines: 5, previousBest: 12 })).toMatchObject({
      title: '新的个人纪录',
      detail: '',
      best: '当前最优：9步',
    });

    const endedSprint: GameState = {
      ...createInitialState(0x51a1f00d, 'sprint'),
      status: 'game-over',
      lines: 22,
      pieceCount: 47,
      score: 1800,
    };
    expect(terminalCopy(endedSprint)).toEqual({
      title: '异变结束',
      detail: '',
      success: false,
    });
  });

  it('shows direct progressive cadence and pending pressure instead of a level label', () => {
    const classic = { ...createInitialState(0x51a1f00d, 'marathon'), lines: 10 };
    const survival = { ...createInitialState(0x51a1f00d, 'race'), lines: 3 };
    const sprint = createInitialState(0x51a1f00d, 'sprint');
    const pending = {
      ...createInitialState(0x51a1f00d, 'race'),
      lines: 5,
      survivalRisePending: true,
    };
    expect(fallCadenceLabel(classic)).toBe('0.7 秒/格');
    expect(fallCadenceLabel(survival)).toBe('0.7 秒/格');
    expect(fallCadenceLabel(sprint)).toBe('0.8 秒/格');
    expect(survivalCountdownLabel(pending)).toBe('待上升');
  });

  it('uses a two-page Puzzle gallery with one canonical selected-board focus', () => {
    expect(CAMPAIGN_LEVELS).toHaveLength(50);
    const onSelect = vi.fn();
    const onStart = vi.fn();
    const onBack = vi.fn();
    const props = (selectedId: PuzzleId, progress = defaultPuzzleProgress()) => ({
      progress,
      selectedId,
      onSelect,
      onStart,
      onBack,
    });
    const view = render(createElement(PuzzleLibrary, props(CAMPAIGN_LEVELS[0]!.id)));

    let rows = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    expect(rows).toHaveLength(25);
    expect(rows.map((row) => row.dataset.levelId)).toEqual(CAMPAIGN_LEVELS.slice(0, 25).map((level) => level.id));
    expect(rows.every((row) => !row.disabled && row.dataset.unlocked === 'true')).toBe(true);
    expect(view.container.querySelector('[data-testid="level-list"]')?.getAttribute('aria-label')).toBe('50 个开放解谜残局');
    expect(view.container.querySelector('[data-testid="campaign-availability"], [data-testid="campaign-rules"]')).toBeNull();
    expect(view.container.querySelectorAll('.console-band, .console-bands, .console-nodes')).toHaveLength(0);
    const pageTabs = [...view.container.querySelectorAll<HTMLButtonElement>('.puzzle-gallery__pages [role="tab"]')];
    expect(pageTabs).toHaveLength(2);
    expect(pageTabs.map((tab) => tab.textContent)).toEqual(['01–25', '26–50']);
    expect(pageTabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    act(() => {
      pageTabs[0]!.focus();
      pageTabs[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(document.activeElement).toBe(pageTabs[1]);
    expect(pageTabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(onSelect).toHaveBeenLastCalledWith(CAMPAIGN_LEVELS[25]!.id);
    act(() => {
      pageTabs[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    expect(document.activeElement).toBe(pageTabs[0]);
    expect(pageTabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(view.container.querySelector('.puzzle-gallery__grid')?.getAttribute('aria-label')).toBe('第 1 至 25 关');
    expect(rows[0]?.textContent).toContain('01');
    expect(rows[0]?.getAttribute('aria-label')).toContain(CAMPAIGN_LEVELS[0]!.name);
    expect(view.container.querySelectorAll('.puzzle-gallery__catalog .puzzle-silhouette')).toHaveLength(0);
    expect(view.container.querySelectorAll('.puzzle-gallery__hero .puzzle-silhouette')).toHaveLength(1);
    expect(view.container.querySelector('.puzzle-gallery__hero .puzzle-silhouette')?.getAttribute('viewBox')).not.toBe('0 0 40 48');
    expect(view.container.querySelector<HTMLButtonElement>('.library-back')?.textContent).toBe('←返回模式');
    for (const banned of ['目标：清空棋盘', '目标清空棋盘', '清空完整棋盘', '当前选择', '起始棋盘', '连续七袋方块', '不限定唯一解法']) {
      expect(view.container.textContent).not.toContain(banned);
    }

    act(() => view.container.querySelector<HTMLButtonElement>('.library-back')?.click());
    expect(onBack).toHaveBeenCalledTimes(1);

    const fullyUnlocked: PuzzleProgress = {
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: CAMPAIGN_LEVELS.map((level) => level.id),
      bestPieceCounts: { [CAMPAIGN_LEVELS[0]!.id]: 7 },
    };
    view.rerender(createElement(PuzzleLibrary, props(CAMPAIGN_LEVELS[0]!.id, fullyUnlocked)));
    const selectedBest = view.container.querySelector<HTMLElement>('[data-testid="selected-puzzle-start-best"]');
    const startSelected = view.container.querySelector<HTMLButtonElement>('[data-testid="start-selected-puzzle"]');
    expect(selectedBest?.textContent).toBe('当前最优步数：7步');
    expect(selectedBest?.closest('.puzzle-gallery__title-row')?.querySelector('.puzzle-gallery__title')).not.toBeNull();
    expect(startSelected?.closest('.puzzle-gallery__meta')?.contains(selectedBest ?? null)).toBe(true);
    expect(view.container.querySelector<HTMLButtonElement>('[data-level-id="t3r-shaft-01"]')?.dataset.bestPieces).toBe('7');
    expect(view.container.querySelectorAll('.puzzle-gallery__completion-tick')).toHaveLength(25);
    expect(view.container.querySelectorAll('.puzzle-gallery__node--complete .puzzle-gallery__index')).toHaveLength(0);
    expect(view.container.querySelector<HTMLButtonElement>('[data-level-id="t3r-shaft-01"]')?.textContent).toBe('');
    expect(view.container.textContent).not.toContain('√');
    expect(view.container.querySelector('.puzzle-gallery__title')?.classList.contains('puzzle-gallery__title--complete')).toBe(true);

    act(() => pageTabs[1]!.click());
    rows = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    expect(rows).toHaveLength(25);
    expect(rows.map((row) => row.dataset.levelId)).toEqual(CAMPAIGN_LEVELS.slice(25).map((level) => level.id));
    expect(view.container.querySelector('.puzzle-gallery__grid')?.getAttribute('aria-label')).toBe('第 26 至 50 关');
    expect(onSelect).toHaveBeenLastCalledWith(CAMPAIGN_LEVELS[25]!.id);
    expect(rows.filter((row) => row.tabIndex === 0).map((row) => row.dataset.levelId)).toEqual([CAMPAIGN_LEVELS[25]!.id]);
    view.rerender(createElement(PuzzleLibrary, props(CAMPAIGN_LEVELS[25]!.id, fullyUnlocked)));

    for (const index of [0, 7, CAMPAIGN_LEVELS.length - 1]) {
      const level = CAMPAIGN_LEVELS[index]!;
      view.rerender(createElement(PuzzleLibrary, props(level.id, fullyUnlocked)));
      const pressed = view.container.querySelector<HTMLButtonElement>('[data-testid="level-row"][aria-pressed="true"]');
      const canonical = createInitialState(0x51a1f00d, 'puzzle', level.id);
      const visibleMaterials = new Set(canonical.board.slice(-12).flat().filter((cell): cell is PieceType => PIECE_TYPES.includes(cell as PieceType)));
      const definition = getPuzzleDefinition(level.id);

      expect(pressed?.dataset.levelId).toBe(level.id);
      expect(view.container.querySelector('.puzzle-gallery__hero h2')?.textContent).toBe(level.name);
      expect(view.container.querySelector('.puzzle-gallery__title')?.classList.contains('puzzle-gallery__title--complete')).toBe(true);
      expect(canonical.puzzleId).toBe(level.id);
      expect(canonical.active?.type).toBeTruthy();
      expect(canonical.queue[0]).toBeTruthy();
      expect(visibleMaterials.size).toBeGreaterThan(0);
      expect(puzzleSilhouettePaths(level.id).size).toBe(visibleMaterials.size);
      expect([...puzzleSilhouettePaths(level.id).values()].every((path) => path.includes('h3.8v3.8'))).toBe(true);
      expect(Boolean(puzzleAnchorSilhouettePath(level.id))).toBe(definition.anchorCells.length > 0);
      expect(view.container.querySelectorAll('.puzzle-gallery__hero .puzzle-silhouette [data-piece-type="anchor"]')).toHaveLength(
        definition.anchorCells.length > 0 ? 1 : 0,
      );
    }

    view.rerender(createElement(PuzzleLibrary, props(CAMPAIGN_LEVELS[0]!.id, fullyUnlocked)));
    rows = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    act(() => rows[6]!.click());
    expect(onSelect).toHaveBeenCalledWith(CAMPAIGN_LEVELS[6]!.id);

    const start = view.container.querySelector<HTMLButtonElement>('[data-testid="start-selected-puzzle"]');
    expect(start).not.toBeNull();
    expect(view.container.querySelectorAll('[data-testid^="start-selected-puzzle"]')).toHaveLength(1);
    expect(start?.textContent).toBe('开始');
    act(() => start?.click());
    expect(onStart).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('uses one roving Puzzle focus with five-column movement and cross-page navigation', () => {
    const onSelect = vi.fn();
    const view = render(createElement(PuzzleLibrary, {
      progress: defaultPuzzleProgress(),
      selectedId: CAMPAIGN_LEVELS[0]!.id,
      onSelect,
      onStart: vi.fn(),
      onBack: vi.fn(),
    }));
    const levels = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    const press = (button: HTMLButtonElement, key: string) => {
      act(() => button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })));
    };

    expect(levels.filter((button) => button.tabIndex === 0)).toEqual([levels[0]]);
    act(() => levels[0]!.focus());
    press(levels[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(levels[5]);
    expect(onSelect).toHaveBeenLastCalledWith(CAMPAIGN_LEVELS[5]!.id);
    press(levels[5]!, 'ArrowRight');
    expect(document.activeElement).toBe(levels[6]);
    expect(onSelect).toHaveBeenLastCalledWith(CAMPAIGN_LEVELS[6]!.id);
    press(levels[6]!, 'Home');
    expect(document.activeElement).toBe(levels[0]);
    press(levels[0]!, 'End');
    expect(document.activeElement).toBe(levels[24]);

    press(levels[24]!, 'ArrowRight');
    let visible = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    expect(visible).toHaveLength(25);
    expect(visible[0]?.dataset.levelId).toBe(CAMPAIGN_LEVELS[25]!.id);
    expect(document.activeElement).toBe(visible[0]);
    expect(onSelect).toHaveBeenLastCalledWith(CAMPAIGN_LEVELS[25]!.id);

    press(visible[0]!, 'End');
    expect(document.activeElement).toBe(visible[24]);
    press(visible[0]!, 'ArrowLeft');
    visible = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    expect(visible[24]?.dataset.levelId).toBe(CAMPAIGN_LEVELS[24]!.id);
    expect(document.activeElement).toBe(visible[24]);
    view.unmount();
  });

});
