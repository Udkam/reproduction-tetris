// @vitest-environment jsdom

import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import styles from './styles.css?raw';
import { PIECE_TYPES, createInitialState, getPuzzleDefinition, type GameEvent, type GameMode, type GameState, type PieceType, type PuzzleId } from './game/core';
import App, {
  cloneQaState,
  countdownTimeLabel,
  elapsedTimeLabel,
  eventMessage,
  fallCadenceLabel,
  GameSession,
  LeaderboardPanel,
  ModeHome,
  PuzzleLibrary,
  puzzleAnchorSilhouettePath,
  puzzleSilhouettePaths,
  RunStats,
  SettingsRecord,
  scoreRecordRank,
  scoreRecordForState,
  survivalCountdownLabel,
  terminalCopy,
} from './App';
import { CAMPAIGN_LEVELS, defaultPuzzleProgress, PUZZLE_ROW_BANDS } from './puzzleProgress';
import type { ScoreRecord } from './leaderboard';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

interface RuntimeTestOptions {
  seed?: number;
  mode?: GameMode;
  puzzleId?: PuzzleId;
  inputEnabled?: boolean;
  onState?: (state: GameState, events: readonly GameEvent[]) => void;
}

interface RuntimeTestInstance {
  options: RuntimeTestOptions;
  setInputEnabled: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  restart: ReturnType<typeof vi.fn>;
  undoPuzzle: ReturnType<typeof vi.fn>;
  togglePause: ReturnType<typeof vi.fn>;
  setAudioEnabled: ReturnType<typeof vi.fn>;
  setMusicEnabled: ReturnType<typeof vi.fn>;
  setAudioVolume: ReturnType<typeof vi.fn>;
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
    readonly setReducedMotion = vi.fn();
    readonly setAudioEnabled = vi.fn();
    readonly setMusicEnabled = vi.fn();
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

    press(): void {}
    release(): void {}
    readonly togglePause = vi.fn(() => {
      if (this.state.status === 'playing') this.state = { ...this.state, status: 'paused' };
      else if (this.state.status === 'paused') this.state = { ...this.state, status: 'playing' };
      this.options.onState?.(this.state, []);
    });
    readonly restart = vi.fn();
    readonly undoPuzzle = vi.fn(() => {
      const checkpoint = this.state.puzzleUndoHistory.at(-1);
      if (!checkpoint) return;
      this.state = {
        ...checkpoint,
        status: this.state.status === 'paused' ? 'paused' : checkpoint.status,
        puzzleUndoHistory: this.state.puzzleUndoHistory.slice(0, -1),
      };
      this.options.onState?.(this.state, [{ type: 'puzzle-undone' }]);
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

describe('entry countdown', () => {
  it('holds ready for three exact seconds, then enables input, starts once, and focuses the board', async () => {
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
    const view = render(createElement(GameSession, {
      mode: 'marathon',
      puzzleId: CAMPAIGN_LEVELS[0]!.id,
      onExit: vi.fn(),
      onCanonicalCompletion: vi.fn(),
      onRunFinished,
    }));
    await act(async () => Promise.resolve());

    const runtime = runtimeHarness.instances[0]!;
    const countdown = () => view.container.querySelector<HTMLElement>('[data-testid="entry-countdown"]');
    const pause = [...view.container.querySelectorAll<HTMLButtonElement>('.topbar-action')].at(-1)!;
    const touchButtons = [...view.container.querySelectorAll<HTMLButtonElement>('.touch-key')];
    const textState = JSON.parse(window.render_game_to_text?.() ?? '{}') as Record<string, unknown>;

    expect(runtime.options.inputEnabled).toBe(false);
    expect(textState).not.toHaveProperty('level');
    expect(textState).toMatchObject({ combo: 0, bedrockRows: 0, fallTicks: 48 });
    expect(countdown()?.dataset.countdown).toBe('3');
    expect(pause.disabled).toBe(true);
    expect(touchButtons).toHaveLength(5);
    expect(touchButtons.every((button) => button.disabled)).toBe(true);
    expect(runtime.start).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(countdown()?.dataset.countdown).toBe('3');
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(countdown()?.dataset.countdown).toBe('2');
    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(countdown()?.dataset.countdown).toBe('2');
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(countdown()?.dataset.countdown).toBe('1');
    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(countdown()?.dataset.countdown).toBe('1');
    expect(runtime.start).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(countdown()).toBeNull();
    expect(runtime.setInputEnabled).toHaveBeenCalledExactlyOnceWith(true);
    expect(runtime.start).toHaveBeenCalledTimes(1);
    expect(runtime.setInputEnabled.mock.invocationCallOrder[0]).toBeLessThan(runtime.start.mock.invocationCallOrder[0]!);
    expect(pause.disabled).toBe(false);
    expect(touchButtons.every((button) => !button.disabled)).toBe(true);
    expect(document.activeElement).toBe(view.container.querySelector('canvas'));

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
    expect(view.container.querySelector('.result-leaderboard')?.textContent).toContain('经典排行消行 · 前 50112 行4,321 分 ·');
    expect(view.container.querySelector('[data-current-record="true"]')?.textContent).toContain('12 行');
    view.unmount();
  });
});

describe('T6 frontend mode binding', () => {
  it('moves mode rules out of home, then shows and stores the first-entry introduction', () => {
    const view = render(createElement(App));
    const mutation = view.container.querySelector<HTMLButtonElement>('[data-testid="enter-sprint"]')!;
    expect(view.container.querySelector('[data-testid="entry-mode-rules"]')).toBeNull();
    expect(view.container.textContent).not.toContain('带核心标记的方块携带道具。');

    act(() => mutation.click());
    const rules = view.container.querySelector<HTMLElement>('[data-testid="entry-mode-rules"]')!;
    expect(rules.textContent).toContain('带核心标记的方块携带道具，消除其任一格即可触发一次效果。');
    expect(rules.textContent).toContain('冻结停止自动下落');
    expect(view.container.querySelector('[data-testid="mode-home"]')).not.toBeNull();

    const start = [...(view.container.querySelector('.action-sheet')?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      .find((button) => button.textContent === '开始')!;
    act(() => start.click());
    expect(JSON.parse(localStorage.getItem('tetris:mode-rule-intros:v1') ?? '[]')).toContain('sprint');
    expect(view.container.querySelector('[data-testid="game-screen"]')).not.toBeNull();
    view.unmount();
  });

  it('binds every statistic to an explicit role without positional CSS inference', () => {
    const classic = { ...createInitialState(0x51a1f00d, 'marathon'), combo: 3 };
    const survival = createInitialState(0x51a1f00d, 'race');
    const sprintBase = createInitialState(0x51a1f00d, 'sprint');
    const sprint = { ...sprintBase, lines: 9, pieceCount: 19, elapsedTicks: 540, mutationCarriers: [{ id: 1, item: 'freeze' as const, cells: [] }] };
    const cases = [
      { state: classic, roles: ['score', 'lines', 'classic-combo', 'fall-cadence'], label: '经典模式数据', copy: ['连消', '3', '0.8 秒/格'] },
      { state: survival, roles: ['score', 'lines', 'survival-bedrock', 'survival-next'], label: '生存模式数据', copy: ['基岩', '3', '13 秒'] },
      { state: sprint, roles: ['score', 'lines', 'mutation-speed', 'mutation-carriers'], label: '异变模式数据', copy: ['消行', '9', '下落', '核心', '1'] },
      {
        state: createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01'),
        roles: ['puzzle-level', 'puzzle-targets', 'puzzle-placed', 'objective'],
        label: '解谜模式数据',
        copy: ['原有方块', '已落子', '通关目标'],
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

  it('shows Puzzle target progress and a non-limiting placed-piece count', () => {
    const state = createInitialState(0x51a1f00d, 'puzzle', 't5r-lattice-09');
    const view = render(createElement(RunStats, { state }));
    const targets = view.container.querySelector<HTMLElement>('[data-stat-role="puzzle-targets"]');
    const placed = view.container.querySelector<HTMLElement>('[data-stat-role="puzzle-placed"]');
    const objective = view.container.querySelector<HTMLElement>('[data-stat-role="objective"]');
    expect(targets?.textContent).toContain(`${state.puzzleTargetCells.length}/${state.puzzleInitialTargetCount}`);
    expect(placed?.textContent).toBe('已落子0');
    expect(objective?.textContent).toContain('清除全部原有方块');
    expect(view.container.textContent).not.toMatch(/剩余可用|已用方块|上限|限时|落定后/);
    view.unmount();
  });

  it('keeps the header to one S-accessible settings control and groups audio controls inside it', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const leaderboard = {
      version: 7 as const,
      marathon: [{
        version: 7 as const,
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
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(), leaderboard,
    }));
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    const header = view.container.querySelector<HTMLElement>('[data-testid="cluster-header"]')!;
    const settings = view.container.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')!;
    expect(settings.textContent).toBe('设置');
    expect(settings.getAttribute('aria-keyshortcuts')).toBe('S');
    expect(header.querySelectorAll('button')).toHaveLength(2);
    expect(header.querySelector('[data-testid="restart-game"], [data-testid="pause-game"], [data-testid="audio-toggle"]')).toBeNull();

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's', bubbles: true })));
    const sheet = view.container.querySelector<HTMLElement>('[data-testid="settings-sheet"]')!;
    expect(sheet).not.toBeNull();
    expect(runtimeHarness.instances.at(-1)?.togglePause).toHaveBeenCalled();
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(false);
    const toggle = view.container.querySelector<HTMLButtonElement>('[data-testid="audio-toggle"]')!;
    const music = view.container.querySelector<HTMLButtonElement>('[data-testid="music-toggle"]')!;
    const volume = view.container.querySelector<HTMLInputElement>('[data-testid="audio-volume"]')!;
    const controls = view.container.querySelector<HTMLElement>('[data-testid="settings-controls"]')!;
    const settingsLeaderboard = view.container.querySelector<HTMLElement>('[data-testid="settings-leaderboard"]')!;
    const shortcuts = view.container.querySelector<HTMLElement>('[data-testid="settings-shortcuts"]')!;
    const rules = view.container.querySelector<HTMLElement>('[data-testid="settings-rules"]')!;
    expect(toggle.textContent).toBe('音效开');
    expect(music.textContent).toBe('音乐开');
    expect(volume.value).toBe('100');
    expect([...sheet.children].map((child) => child.getAttribute('data-testid') ?? child.className)).toEqual([
      'settings-controls',
      'settings-shortcuts',
      'settings-rules',
      'settings-leaderboard',
    ]);
    expect(controls.textContent).toContain('控制');
    expect(settingsLeaderboard.textContent).toContain('本模式排行消行 · 前 50112 行3,210 分 · 2026.07.24');
    expect(rules.textContent).toContain('补满任意横行即可消除并得分。');
    expect(shortcuts.textContent).toContain('键盘S 设置P 暂停R 重开Esc 返回←→ 选择↑↓ 切换Enter 执行');
    const resume = [...sheet.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === '继续游戏')!;
    expect(resume.dataset.arrowSelected).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })));
    expect(music.dataset.arrowSelected).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(music.textContent).toBe('音乐关');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
    expect(toggle.dataset.arrowSelected).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(toggle.textContent).toBe('音效关');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(volume, '56');
    act(() => volume.dispatchEvent(new Event('input', { bubbles: true })));
    expect(view.container.textContent).toContain('56%');
    expect(runtimeHarness.instances.at(-1)?.setAudioEnabled).toHaveBeenCalledWith(false);
    expect(runtimeHarness.instances.at(-1)?.setMusicEnabled).toHaveBeenCalledWith(false);
    act(() => resume.click());
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
      mode: 'puzzle', puzzleId: level.id, leaderboard: { version: 7, marathon: [], race: [], sprint: [] }, progress: completed,
    }));
    expect(completedView.container.textContent).toBe('当前关纪录最少 7 步');
    expect(completedView.container.textContent).not.toMatch(/消行|分|连锁|最长/);
    completedView.unmount();

    const freshView = render(createElement(SettingsRecord, {
      mode: 'puzzle', puzzleId: level.id, leaderboard: { version: 7, marathon: [], race: [], sprint: [] }, progress: defaultPuzzleProgress(),
    }));
    expect(freshView.container.textContent).toBe('当前关纪录尚未通关');
    freshView.unmount();
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
    expect(puzzle.container.querySelector('.preview-rail')?.textContent).toContain('Next · 2');
    expect(puzzleSlot.dataset.previewCount).toBe('2');
    expect(puzzleSlot.getAttribute('aria-label')).toBe('后续两个方块，按顺序显示');
    puzzle.unmount();

    const classic = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    const classicSlot = classic.container.querySelector<HTMLElement>('[data-testid="next-slot"]')!;
    expect(classic.container.querySelector('.preview-rail')?.textContent).toContain('Next');
    expect(classic.container.querySelector('.preview-rail')?.textContent).not.toContain('Next · 2');
    expect(classicSlot.dataset.previewCount).toBe('1');
    expect(classicSlot.getAttribute('aria-label')).toBe('下一个方块');
    classic.unmount();
  });

  it('opens a Z-confirmed Puzzle undo control only after a pre-lock checkpoint exists', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    const puzzle = render(createElement(GameSession, {
      mode: 'puzzle', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());

    const undo = puzzle.container.querySelector<HTMLButtonElement>('[data-testid="touch-undo"]')!;
    expect(undo).not.toBeNull();
    expect(undo.disabled).toBe(true);
    expect(undo.getAttribute('aria-label')).toBe('撤回上一次落子（Z）');
    expect(undo.getAttribute('aria-keyshortcuts')).toBe('Z');
    expect(puzzle.container.querySelector('[data-testid="touch-rail"]')?.className).toContain('touch-deck--puzzle');
    expect(puzzle.container.querySelector('[data-testid="touch-rail"]')?.querySelectorAll('button')).toHaveLength(6);
    expect(puzzle.container.querySelector('.keyboard-map')?.textContent).toContain('Z 撤回');

    await act(async () => vi.advanceTimersByTimeAsync(3000));
    expect(undo.disabled).toBe(true);
    const instance = runtimeHarness.instances.at(-1)!;
    const current = instance.getState();
    const { puzzleUndoHistory: _history, ...checkpoint } = current;
    act(() => instance.setState({ ...current, puzzleUndoHistory: [checkpoint] }));
    expect(undo.disabled).toBe(false);
    act(() => undo.click());
    expect(puzzle.container.textContent).toContain('撤回上一步？');
    expect(instance.undoPuzzle).not.toHaveBeenCalled();
    const confirmUndo = puzzle.container.querySelector<HTMLButtonElement>('[data-testid="confirm-puzzle-undo"]')!;
    const cancelUndo = [...puzzle.container.querySelectorAll<HTMLButtonElement>('.action-sheet__actions > button')]
      .find((button) => button.textContent === '取消')!;
    expect(confirmUndo.dataset.actionSelected).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(cancelUndo.dataset.actionSelected).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(instance.undoPuzzle).not.toHaveBeenCalled();
    expect(puzzle.container.querySelector('[data-testid="confirm-puzzle-undo"]')).toBeNull();

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', key: 'z', bubbles: true })));
    expect(puzzle.container.querySelector('[data-testid="confirm-puzzle-undo"]')).not.toBeNull();
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(instance.undoPuzzle).toHaveBeenCalledTimes(1);
    expect(puzzle.container.querySelector('[data-testid="confirm-puzzle-undo"]')).toBeNull();
    puzzle.unmount();

    const classic = render(createElement(GameSession, {
      mode: 'marathon', puzzleId: CAMPAIGN_LEVELS[0]!.id, onExit: vi.fn(), onCanonicalCompletion: vi.fn(),
    }));
    await act(async () => Promise.resolve());
    expect(classic.container.querySelector('[data-testid="touch-undo"]')).toBeNull();
    expect(classic.container.querySelector('.keyboard-map')?.textContent).not.toContain('Z 撤回');
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
    await act(async () => vi.advanceTimersByTimeAsync(3000));
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
    expect(runtimeHarness.instances.at(-1)?.start).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector('[data-testid="confirm-restart"]')).toBeNull();
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
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    const back = view.container.querySelector<HTMLButtonElement>('.topbar-action')!;
    expect(back.getAttribute('aria-keyshortcuts')).toBe('Escape');

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })));
    expect(view.container.textContent).toContain('离开本局？');
    expect(runtimeHarness.instances.at(-1)?.setInputEnabled).toHaveBeenLastCalledWith(false);
    const leave = [...view.container.querySelectorAll<HTMLButtonElement>('.action-sheet__actions > button')]
      .find((button) => button.textContent === '返回模式首页')!;
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

    expect(classic).not.toBeNull();
    expect(classic?.textContent).toContain('经典');
    expect(view.container.textContent).not.toMatch(/马拉松|竞速|等级|速度档/);
    expect(view.container.textContent).not.toContain('选择模式');
    expect(view.container.textContent).not.toContain('补满任意横行即可消除并得分。');
    expect(view.container.querySelector('[data-testid="brand"]')).toBeNull();
    expect(view.container.querySelector('#home-title')?.tagName).toBe('H1');
    expect(view.container.querySelector('#home-title')?.textContent).toBe('TetraMorph');
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

    for (const selector of ['enter-marathon', 'enter-race', 'enter-sprint', 'enter-puzzle']) {
      const entry = view.container.querySelector<HTMLButtonElement>(`[data-testid="${selector}"]`);
      act(() => entry?.focus());
      expect(entry?.getAttribute('aria-pressed')).toBe('true');
    }

    act(() => classic?.click());
    expect(onEnter).toHaveBeenCalledWith('marathon');
    view.unmount();
  });

  it('ranks and labels Classic by cleared lines, Survival by endurance, and 异变 by cleared lines', () => {
    const base: ScoreRecord = {
      version: 7,
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
    expect(classic.container.querySelector('.result-leaderboard')?.getAttribute('aria-label')).toBe('经典排行');
    expect(classic.container.querySelector('.result-leaderboard header')?.textContent).toBe('经典排行消行 · 前 5');
    expect(classic.container.querySelector('.result-leaderboard li')?.textContent).toBe('0118 行3,200 分 · 2026.07.18');
    expect(classic.container.querySelector('[data-current-record="true"]')).not.toBeNull();
    expect(scoreRecordRank([base], base)).toBe(1);
    expect(scoreRecordRank([base], { ...base, completedAt: '2026-07-19T12:00:00.000Z' })).toBeNull();
    classic.unmount();

    const survivalRecord = { ...base, mode: 'race' as const, score: 900, lines: 27 };
    const survival = render(createElement(LeaderboardPanel, { mode: 'race', records: [survivalRecord] }));
    expect(survival.container.querySelector('.result-leaderboard')?.getAttribute('aria-label')).toBe('生存排行');
    expect(survival.container.querySelector('.result-leaderboard header')?.textContent).toBe('生存排行生存时间 · 前 5');
    expect(survival.container.querySelector('.result-leaderboard li')?.textContent).toBe('011 分 10 秒27 行 · 62 方块 · 2026.07.18');
    survival.unmount();

    const sprintRecord = { ...base, mode: 'sprint' as const, score: 1800, lines: 40, pieces: 48, elapsedTicks: 5400, chain: 0 };
    const sprint = render(createElement(LeaderboardPanel, { mode: 'sprint', records: [sprintRecord] }));
    expect(sprint.container.querySelector('.result-leaderboard')?.getAttribute('aria-label')).toBe('异变排行');
    expect(sprint.container.querySelector('.result-leaderboard header')?.textContent).toBe('异变排行消行 · 前 5');
    expect(sprint.container.querySelector('.result-leaderboard li')?.textContent).toBe('0140 行1,800 分 · 48 方块 · 2026.07.18');
    sprint.unmount();

    expect(elapsedTimeLabel(65 * 60)).toBe('1 分 5 秒');
    expect(countdownTimeLabel(65 * 60)).toBe('1:05');

    const ended = { ...createInitialState(1, 'race'), status: 'game-over' as const, score: 900, lines: 27, pieceCount: 62, elapsedTicks: 4200 };
    expect(scoreRecordForState(ended, base.completedAt)).toMatchObject({ mode: 'race', score: 900, lines: 27, outcome: 'top-out' });
    const endedSprint = { ...createInitialState(1, 'sprint'), status: 'game-over' as const, score: 1800, lines: 40, pieceCount: 48, elapsedTicks: 5400 };
    expect(scoreRecordForState(endedSprint, base.completedAt)).toMatchObject({ mode: 'sprint', score: 1800, lines: 40, chain: 0, outcome: 'top-out' });
    expect(scoreRecordForState(createInitialState(1, 'puzzle', CAMPAIGN_LEVELS[0]!.id), base.completedAt)).toBeNull();
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
      detail: '24 消行 · 72 方块 · 4 层基岩',
      success: false,
    });
    expect(eventMessage({ type: 'bedrock-raised', count: 1, height: 4 })).toBe('基岩升至 4 层。');
    expect(eventMessage({ type: 'bedrock-lowered', count: 1, height: 3 })).toBe('基岩降至 3 层。');
    expect(eventMessage({ type: 'puzzle-undone' })).toBe('已撤回上一次落子。');

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

    const endedSprint: GameState = {
      ...createInitialState(0x51a1f00d, 'sprint'),
      status: 'game-over',
      lines: 22,
      pieceCount: 47,
      score: 1800,
    };
    expect(terminalCopy(endedSprint)).toEqual({
      title: '异变到顶',
      detail: '22 消行 · 1,800 分',
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

  it('uses an all-open compact endgame console while keeping one canonical selected-board focus', () => {
    expect(CAMPAIGN_LEVELS).toHaveLength(20);
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

    const rows = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    expect(rows).toHaveLength(20);
    expect(rows.map((row) => row.dataset.levelId)).toEqual(CAMPAIGN_LEVELS.map((level) => level.id));
    expect(rows.every((row) => !row.disabled && row.dataset.unlocked === 'true')).toBe(true);
    expect(view.container.querySelector('[data-testid="level-list"]')?.getAttribute('aria-label')).toBe('20 个开放解谜残局');
    expect(view.container.querySelector('[data-testid="campaign-availability"], [data-testid="campaign-rules"]')).toBeNull();
    expect(view.container.querySelectorAll('.console-band')).toHaveLength(4);
    expect(PUZZLE_ROW_BANDS.every((band, index) => (
      view.container.querySelectorAll(`.console-band[data-rows="${index + 5}"] .console-node`).length === band.length
    ))).toBe(true);
    expect(view.container.querySelectorAll('[data-testid="sector-row"]')).toHaveLength(0);
    expect(view.container.querySelectorAll('.observatory-sector, .observatory-stop')).toHaveLength(0);
    expect(rows[0]?.textContent).toContain('01');
    expect(rows[0]?.getAttribute('aria-label')).toContain(CAMPAIGN_LEVELS[0]!.name);
    expect(view.container.querySelectorAll('.console-route .puzzle-silhouette')).toHaveLength(0);
    expect(view.container.querySelectorAll('.console-focus .puzzle-silhouette')).toHaveLength(1);
    expect(view.container.querySelector('.console-focus__index, .console-focus__pulse')).toBeNull();
    expect(view.container.querySelector('.console-focus__heading > span, .console-focus__heading > i')).toBeNull();
    expect(view.container.querySelector<HTMLButtonElement>('.library-back')?.textContent).toBe('←返回模式');
    for (const banned of ['目标：清空棋盘', '目标清空棋盘', '清空完整棋盘', '当前选择', '起始棋盘', '连续七袋方块', '不限定唯一解法']) {
      expect(view.container.textContent).not.toContain(banned);
    }
    for (const banned of ['SECTOR', 'OPEN', '解锁下一段']) {
      expect(view.container.textContent).not.toContain(banned);
    }

    act(() => view.container.querySelector<HTMLButtonElement>('.library-back')?.click());
    expect(onBack).toHaveBeenCalledTimes(1);

    const fullyUnlocked = {
      version: 4 as const,
      completedLevelIds: CAMPAIGN_LEVELS.map((level) => level.id),
      bestPieceCounts: { [CAMPAIGN_LEVELS[0]!.id]: 7 },
    };
    view.rerender(createElement(PuzzleLibrary, props(CAMPAIGN_LEVELS[0]!.id, fullyUnlocked)));
    const selectedBest = view.container.querySelector<HTMLElement>('[data-testid="selected-puzzle-start-best"]');
    const startSelected = view.container.querySelector<HTMLButtonElement>('[data-testid="start-selected-puzzle"]');
    expect(selectedBest?.textContent).toBe('最少 7 步');
    expect(selectedBest?.nextElementSibling).toBe(startSelected);
    expect(view.container.querySelector<HTMLButtonElement>('[data-level-id="t3r-shaft-01"]')?.dataset.bestPieces).toBe('7');
    expect(view.container.querySelectorAll('.console-focus__heading > span, .console-focus__heading > i, .console-node i')).toHaveLength(0);
    expect(view.container.querySelector('.console-focus__title')?.classList.contains('console-focus__title--complete')).toBe(true);
    for (const index of [0, 7, CAMPAIGN_LEVELS.length - 1]) {
      const level = CAMPAIGN_LEVELS[index]!;
      view.rerender(createElement(PuzzleLibrary, props(level.id, fullyUnlocked)));
      const pressed = view.container.querySelector<HTMLButtonElement>('[data-testid="level-row"][aria-pressed="true"]');
      const canonical = createInitialState(0x51a1f00d, 'puzzle', level.id);
      const visibleMaterials = new Set(canonical.board.slice(-12).flat().filter((cell): cell is PieceType => PIECE_TYPES.includes(cell as PieceType)));
      const definition = getPuzzleDefinition(level.id);

      expect(pressed?.dataset.levelId).toBe(level.id);
      expect(view.container.querySelector('.console-focus h2')?.textContent).toBe(level.name);
      expect(view.container.querySelector('.console-focus__title')?.classList.contains('console-focus__title--complete')).toBe(true);
      expect(canonical.puzzleId).toBe(level.id);
      expect(canonical.active?.type).toBeTruthy();
      expect(canonical.queue[0]).toBeTruthy();
      expect(visibleMaterials.size).toBeGreaterThan(0);
      expect(puzzleSilhouettePaths(level.id).size).toBe(visibleMaterials.size);
      expect([...puzzleSilhouettePaths(level.id).values()].every((path) => path.includes('h3.8v3.8'))).toBe(true);
      expect(Boolean(puzzleAnchorSilhouettePath(level.id))).toBe(definition.anchorCells.length > 0);
      expect(view.container.querySelectorAll('.console-focus .puzzle-silhouette [data-piece-type="anchor"]')).toHaveLength(
        definition.anchorCells.length > 0 ? 1 : 0,
      );
    }

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

});
