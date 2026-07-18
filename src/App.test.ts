// @vitest-environment jsdom

import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import styles from './styles.css?raw';
import { createInitialState, type GameEvent, type GameMode, type GameState, type PuzzleId } from './game/core';
import {
  cloneQaState,
  eventMessage,
  fallCadenceLabel,
  GameSession,
  LeaderboardPanel,
  ModeHome,
  PuzzleLibrary,
  puzzleSilhouettePaths,
  RunStats,
  scoreRecordForState,
  survivalCountdownLabel,
  terminalCopy,
} from './App';
import { CAMPAIGN_LEVELS, defaultPuzzleProgress } from './puzzleProgress';
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
}

const runtimeHarness = vi.hoisted(() => ({ instances: [] as RuntimeTestInstance[] }));

vi.mock('./game/runtime/GameRuntime', async () => {
  const core = await vi.importActual<typeof import('./game/core')>('./game/core');
  return { GameRuntime: class {
    private state: GameState;
    private canvas: HTMLCanvasElement | null = null;
    readonly setInputEnabled = vi.fn();
    readonly setReducedMotion = vi.fn();
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
    togglePause(): void {}
    restart(): void {}
    getState(): GameState { return this.state; }
    getRendererSnapshot(): Record<string, never> { return {}; }
    destroy(): void { this.canvas?.remove(); }
  } };
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
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
    expect(onRunFinished).toHaveBeenCalledExactlyOnceWith(terminalState);
    expect(view.container.querySelector('.result-leaderboard')?.textContent).toContain('经典排行分数暂无记录');
    view.unmount();
  });
});

describe('T6 frontend mode binding', () => {
  it('binds every statistic to an explicit role without positional CSS inference', () => {
    const classic = { ...createInitialState(0x51a1f00d, 'marathon'), combo: 3 };
    const survival = createInitialState(0x51a1f00d, 'race');
    const cases = [
      { state: classic, roles: ['score', 'lines', 'classic-combo', 'fall-cadence'], label: '经典模式数据', copy: ['连消', '3', '0.8 秒/格'] },
      { state: survival, roles: ['score', 'lines', 'survival-bedrock', 'survival-next'], label: '生存模式数据', copy: ['基岩', '5', '15 秒'] },
      {
        state: createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01'),
        roles: ['puzzle-level', 'placed', 'lines', 'objective'],
        label: '解谜模式数据',
        copy: ['目标', '清空棋盘'],
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

  it('shows the distinct Classic, Survival, and Puzzle copy while retaining internal selectors', () => {
    const onEnter = vi.fn();
    const view = render(createElement(ModeHome, { onEnter }));
    const classic = view.container.querySelector<HTMLButtonElement>('[data-testid="enter-marathon"]');

    expect(classic).not.toBeNull();
    expect(classic?.textContent).toContain('经典');
    expect(view.container.textContent).not.toMatch(/马拉松|竞速|等级|速度档/);
    expect(view.container.textContent?.match(/选择模式/g)).toHaveLength(1);
    expect(view.container.textContent).toContain('连消加分\n每 10 行提高下落速度');
    expect(view.container.querySelector('[data-testid="brand"] h1')?.textContent).toBe('Tetris');
    expect(view.container.textContent).toContain('生存开局 5 层基岩\n15 秒 → 8 秒 · 每 3 行降层 / 提速');
    expect(view.container.textContent).toContain('15 关残局');
    expect(view.container.textContent).not.toContain('目标：清空棋盘');
    expect(view.container.querySelector('.mode-preview')).toBeNull();
    expect(view.container.querySelector('.phase-seam')).toBeNull();
    expect(view.container.querySelectorAll('.mode-gate__motif')).toHaveLength(3);
    expect([...view.container.querySelectorAll('.mode-gate__motif')].every((motif) => motif.children.length === 4)).toBe(true);
    expect(view.container.querySelectorAll('[data-testid="enter-puzzle"] .mode-gate__glyph rect')).toHaveLength(4);
    expect(styles).not.toContain('.phase-seam');
    expect(styles).not.toContain('.action-sheet::before');
    expect(styles).not.toContain('rotate(3deg)');

    for (const banned of ['当前选择', '三种玩法', '随时开始，也可随时退出。', '键盘与触控均可操作']) {
      expect(view.container.textContent).not.toContain(banned);
    }

    for (const selector of ['enter-marathon', 'enter-race', 'enter-puzzle']) {
      const entry = view.container.querySelector<HTMLButtonElement>(`[data-testid="${selector}"]`);
      act(() => entry?.focus());
      expect(entry?.getAttribute('aria-pressed')).toBe('true');
    }

    act(() => classic?.click());
    expect(onEnter).toHaveBeenCalledWith('marathon');
    view.unmount();
  });

  it('ranks and labels Classic by score while Survival is led by cleared lines', () => {
    const base: ScoreRecord = {
      version: 3,
      score: 3200,
      lines: 18,
      pieces: 62,
      elapsedTicks: 4200,
      mode: 'marathon',
      outcome: 'top-out',
      completedAt: '2026-07-18T12:00:00.000Z',
    };
    const classic = render(createElement(LeaderboardPanel, { mode: 'marathon', records: [base] }));
    expect(classic.container.querySelector('.result-leaderboard')?.getAttribute('aria-label')).toBe('经典排行榜');
    expect(classic.container.querySelector('.result-leaderboard header')?.textContent).toBe('经典排行分数');
    expect(classic.container.querySelector('.result-leaderboard li')?.textContent).toBe('013,20018 行');
    classic.unmount();

    const survivalRecord = { ...base, mode: 'race' as const, score: 900, lines: 27 };
    const survival = render(createElement(LeaderboardPanel, { mode: 'race', records: [survivalRecord] }));
    expect(survival.container.querySelector('.result-leaderboard')?.getAttribute('aria-label')).toBe('生存排行榜');
    expect(survival.container.querySelector('.result-leaderboard header')?.textContent).toBe('生存排行消行');
    expect(survival.container.querySelector('.result-leaderboard li')?.textContent).toBe('0127 行62 方块');
    survival.unmount();

    const ended = { ...createInitialState(1, 'race'), status: 'game-over' as const, score: 900, lines: 27, pieceCount: 62, elapsedTicks: 4200 };
    expect(scoreRecordForState(ended, base.completedAt)).toMatchObject({ mode: 'race', score: 900, lines: 27, outcome: 'top-out' });
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
  });

  it('shows direct progressive cadence and pending pressure instead of a level label', () => {
    const classic = { ...createInitialState(0x51a1f00d, 'marathon'), lines: 10 };
    const survival = { ...createInitialState(0x51a1f00d, 'race'), lines: 3 };
    const pending = {
      ...createInitialState(0x51a1f00d, 'race'),
      lines: 5,
      survivalRisePending: true,
    };
    expect(fallCadenceLabel(classic)).toBe('0.7 秒/格');
    expect(fallCadenceLabel(survival)).toBe('0.7 秒/格');
    expect(survivalCountdownLabel(pending)).toBe('待上升');
  });

  it('mounts all fifteen enabled levels and binds first, eighth, and fifteenth selections', () => {
    expect(CAMPAIGN_LEVELS).toHaveLength(15);
    const onSelect = vi.fn();
    const onStart = vi.fn();
    const onBack = vi.fn();
    const selectedIndexes = [0, 7, CAMPAIGN_LEVELS.length - 1];
    const props = (selectedId: PuzzleId) => ({
      progress: defaultPuzzleProgress(),
      selectedId,
      onSelect,
      onStart,
      onBack,
    });
    const view = render(createElement(PuzzleLibrary, props(CAMPAIGN_LEVELS[0]!.id)));

    const rows = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    expect(rows).toHaveLength(CAMPAIGN_LEVELS.length);
    expect(rows.map((row) => row.dataset.levelId)).toEqual(CAMPAIGN_LEVELS.map((level) => level.id));
    expect(rows.every((row) => !row.disabled && row.getAttribute('aria-pressed') !== null)).toBe(true);
    expect(view.container.querySelector('[data-testid="level-list"]')?.getAttribute('aria-label')).toBe('15 个可用解谜关卡');
    expect(rows[0]?.textContent).toBe(`01${CAMPAIGN_LEVELS[0]!.name}`);
    expect(view.container.querySelectorAll('.level-entry__preview .puzzle-silhouette--compact')).toHaveLength(15);
    expect(view.container.querySelector<HTMLButtonElement>('.library-back')?.textContent).toBe('←返回模式');
    for (const banned of ['目标：清空棋盘', '目标清空棋盘', '清空完整棋盘', '当前选择', '起始棋盘', '连续七袋方块', '不限定唯一解法']) {
      expect(view.container.textContent).not.toContain(banned);
    }

    act(() => view.container.querySelector<HTMLButtonElement>('.library-back')?.click());
    expect(onBack).toHaveBeenCalledTimes(1);

    act(() => rows[7]!.click());
    expect(onSelect).toHaveBeenCalledWith(CAMPAIGN_LEVELS[7]!.id);

    for (const index of selectedIndexes) {
      const level = CAMPAIGN_LEVELS[index]!;
      view.rerender(createElement(PuzzleLibrary, props(level.id)));
      const pressed = view.container.querySelector<HTMLButtonElement>('[data-testid="level-row"][aria-pressed="true"]');
      const canonical = createInitialState(0x51a1f00d, 'puzzle', level.id);
      const lockedTypes = new Set(canonical.board.flat().filter((cell): cell is NonNullable<typeof cell> => cell !== null));

      expect(pressed?.dataset.levelId).toBe(level.id);
      expect(view.container.querySelector('.level-detail h2')?.textContent).toBe(level.name);
      expect(canonical.puzzleId).toBe(level.id);
      expect(canonical.active?.type).toBeTruthy();
      expect(canonical.queue[0]).toBeTruthy();
      expect(lockedTypes.size).toBeGreaterThanOrEqual(5);
      expect(puzzleSilhouettePaths(level.id).size).toBe(lockedTypes.size);
      expect([...puzzleSilhouettePaths(level.id).values()].every((path) => path.includes('h3.8v3.8'))).toBe(true);
    }

    const desktopStart = view.container.querySelector<HTMLButtonElement>('[data-testid="start-selected-puzzle"]');
    const mobileStart = view.container.querySelector<HTMLButtonElement>('[data-testid="start-selected-puzzle-mobile"]');
    expect(desktopStart).not.toBeNull();
    expect(mobileStart).not.toBeNull();
    expect(desktopStart?.textContent).toBe('开始本关');
    expect(mobileStart?.textContent).toBe('开始本关');
    act(() => {
      desktopStart?.click();
      mobileStart?.click();
    });
    expect(onStart).toHaveBeenCalledTimes(2);
    view.unmount();
  });
});
