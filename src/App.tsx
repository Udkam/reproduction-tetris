import { useCallback, useEffect, useRef, useState } from 'react';
import {
  raceSpeedTier,
  type GameEvent,
  type GameMode,
  type GameState,
  type PuzzleId,
  createInitialState,
} from './game/core';
import { type InputAction } from './game/input/InputController';
import { GameRuntime } from './game/runtime/GameRuntime';
import {
  CAMPAIGN_LEVELS,
  LEGACY_PUZZLE_PROGRESS_KEY,
  PUZZLE_PROGRESS_KEY,
  defaultPuzzleProgress,
  migrateLegacyPuzzleProgress,
  parsePuzzleProgress,
  recordCanonicalPuzzleCompletion,
  type PuzzleProgress,
} from './puzzleProgress';
import { ActionSheet } from './ui/ActionSheet';

type AppScreen = 'home' | 'puzzle-library' | 'game';
type ExitDestination = 'home' | 'puzzle-library';

const APP_SEED = 0x51a1f00d;

const MODE_COPY: Record<GameMode, {
  index: string;
  label: string;
  short: string;
  detail: string;
  action: string;
}> = {
  marathon: {
    index: '01',
    label: '马拉松模式',
    short: '开放堆叠',
    detail: '分数与等级持续累积，堆叠到顶结束。',
    action: '进入马拉松',
  },
  race: {
    index: '02',
    label: '竞速模式',
    short: '持续加速',
    detail: '速度持续提升｜无终点｜主动退出或堆叠到顶结束',
    action: '进入竞速',
  },
  puzzle: {
    index: '03',
    label: '解谜模式',
    short: '清空棋盘',
    detail: '六个关卡全部开放，使用连续七袋方块寻找自己的清空路线。',
    action: '查看关卡',
  },
};

function readPuzzleProgress(): PuzzleProgress {
  try {
    const current = localStorage.getItem(PUZZLE_PROGRESS_KEY);
    if (current !== null) return parsePuzzleProgress(current);
    return migrateLegacyPuzzleProgress(localStorage.getItem(LEGACY_PUZZLE_PROGRESS_KEY));
  } catch {
    return defaultPuzzleProgress();
  }
}

function formatScore(value: number): string {
  return Math.max(0, value).toLocaleString('zh-CN');
}

function campaignLevel(id: PuzzleId | null) {
  return CAMPAIGN_LEVELS.find((level) => level.id === id) ?? CAMPAIGN_LEVELS[0]!;
}

function terminalCopy(state: GameState): { title: string; detail: string; success: boolean } | null {
  if (state.mode === 'puzzle') {
    if (state.puzzleCompletion === 'finished') {
      return { title: '棋盘已清空', detail: `使用 ${state.pieceCount} 个方块，完成 ${state.lines} 次消行。`, success: true };
    }
    if (state.puzzleCompletion && state.puzzleCompletion !== 'active') {
      return { title: '路线在这里结束', detail: '堆叠触及顶部，可以重新整理清空路径。', success: false };
    }
    return null;
  }
  if (state.status !== 'game-over') return null;
  if (state.mode === 'race') {
    return {
      title: '本轮竞速结束',
      detail: `${state.lines} 行 · ${state.pieceCount} 个方块 · 速度 ${raceSpeedTier(state.pieceCount, state.lines) + 1} 档`,
      success: false,
    };
  }
  return { title: '堆叠触及顶部', detail: `${formatScore(state.score)} 分 · ${state.lines} 行`, success: false };
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} data-testid="brand">
      <span className="brand__mark" aria-hidden="true"><i /><i /><i /></span>
      <span className="brand__copy">
        <strong>青流方阵</strong>
        <small>AQUA ROUTE / 10 × 20</small>
      </span>
    </div>
  );
}

function ModeHome({ onEnter }: { onEnter: (mode: GameMode) => void }) {
  return (
    <main id="game" className="landing-shell" data-testid="mode-home">
      <header className="landing-header">
        <Brand />
        <span className="header-coordinate" aria-hidden="true">N 20 / E 10</span>
      </header>
      <section className="landing-intro" aria-labelledby="home-title">
        <p className="eyebrow">CHOOSE A FLOW / 选择路线</p>
        <h1 id="home-title">让每一次下落，<br />走向不同的终点。</h1>
        <p>三种规则各自进入。棋盘只在开局后生成，离开时完整收起。</p>
      </section>
      <section className="mode-gates" aria-label="选择游戏模式" data-testid="mode-list">
        {(Object.keys(MODE_COPY) as GameMode[]).map((mode) => {
          const item = MODE_COPY[mode];
          return (
            <button
              key={mode}
              className={`mode-gate mode-gate--${mode}`}
              type="button"
              data-testid={`enter-${mode}`}
              onClick={() => onEnter(mode)}
            >
              <span className="mode-gate__index" aria-hidden="true">{item.index}</span>
              <span className="mode-gate__body">
                <small>{item.short}</small>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </span>
              <span className="mode-gate__action">{item.action}<b aria-hidden="true">↗</b></span>
            </button>
          );
        })}
      </section>
      <footer className="landing-footer">
        <span>键盘与触控均可操作</span>
        <span>连续七袋 · 确定性规则</span>
      </footer>
    </main>
  );
}

function PuzzleLibrary({
  progress,
  selectedId,
  onSelect,
  onStart,
  onBack,
}: {
  progress: PuzzleProgress;
  selectedId: PuzzleId;
  onSelect: (id: PuzzleId) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const selected = campaignLevel(selectedId);
  return (
    <main id="game" className="library-shell" data-testid="puzzle-library">
      <header className="library-header">
        <Brand compact />
        <button className="text-action" type="button" onClick={onBack}>← 返回模式首页</button>
      </header>
      <section className="library-intro" aria-labelledby="library-title">
        <div>
          <p className="eyebrow">PUZZLE ARCHIVE / 关卡库</p>
          <h1 id="library-title">从复杂堆叠中，找出你的清空路线。</h1>
        </div>
        <p>全部关卡开放。每局使用持续补充的确定性七袋序列，操作与普通模式一致，不限定唯一答案。</p>
      </section>
      <section className="level-grid" aria-label="六个可用解谜关卡" data-testid="level-list">
        {CAMPAIGN_LEVELS.map((level) => {
          const complete = progress.completedLevelIds.includes(level.id);
          const selectedLevel = selectedId === level.id;
          return (
            <button
              key={level.id}
              className="level-entry"
              type="button"
              data-testid="level-row"
              data-level-id={level.id}
              aria-pressed={selectedLevel}
              onClick={() => onSelect(level.id)}
            >
              <span className="level-entry__number">{String(level.index).padStart(2, '0')}</span>
              <span className="level-entry__copy">
                <small>{complete ? '已完成 · 可重玩' : '可直接进入'}</small>
                <strong>{level.name}</strong>
                <span>目标：清空完整棋盘</span>
              </span>
              <span className="level-entry__stream">连续七袋<b aria-hidden="true">→</b></span>
            </button>
          );
        })}
      </section>
      <footer className="library-selection" aria-live="polite">
        <span><small>当前选择</small><strong>{selected.index}/{selected.total} · {selected.name}</strong></span>
        <button className="primary-action" type="button" onClick={onStart}>进入所选关卡</button>
      </footer>
    </main>
  );
}

interface TouchButtonProps {
  action: InputAction;
  label: string;
  glyph: string;
  runtime: GameRuntime | null;
}

function TouchButton({ action, label, glyph, runtime }: TouchButtonProps) {
  const release = useCallback(() => runtime?.release(action), [action, runtime]);
  return (
    <button
      className="touch-key"
      type="button"
      data-testid={`touch-${action}`}
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        runtime?.press(action);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      <b aria-hidden="true">{glyph}</b><small>{label}</small>
    </button>
  );
}

function RunStats({ state }: { state: GameState }) {
  if (state.mode === 'race') {
    return (
      <section className="run-stats" data-testid="stats" aria-label="竞速模式数据">
        <article><span>分数</span><strong>{formatScore(state.score)}</strong></article>
        <article><span>消行</span><strong>{state.lines}</strong></article>
        <article><span>速度档</span><strong>{raceSpeedTier(state.pieceCount, state.lines) + 1}</strong></article>
      </section>
    );
  }
  if (state.mode === 'puzzle') {
    const level = campaignLevel(state.puzzleId);
    return (
      <section className="run-stats run-stats--puzzle" data-testid="stats" aria-label="解谜模式数据">
        <article className="run-stats__wide"><span>关卡</span><strong>{level.index}/{level.total} · {level.name}</strong></article>
        <article><span>已放置</span><strong>{state.pieceCount}</strong></article>
        <article><span>消行</span><strong>{state.lines}</strong></article>
        <article className="run-stats__wide"><span>目标</span><strong>清空完整棋盘</strong></article>
      </section>
    );
  }
  return (
    <section className="run-stats" data-testid="stats" aria-label="马拉松模式数据">
      <article><span>分数</span><strong>{formatScore(state.score)}</strong></article>
      <article><span>消行</span><strong>{state.lines}</strong></article>
      <article><span>等级</span><strong>{state.level}</strong></article>
    </section>
  );
}

function eventMessage(event: GameEvent): string {
  if (event.type === 'lines-cleared') return `消除了 ${event.count} 行。`;
  if (event.type === 'paused') return '本局已暂停。';
  if (event.type === 'resumed') return '继续本局。';
  if (event.type === 'finished') return '棋盘已清空。';
  if (event.type === 'game-over') return '本局结束。';
  return '';
}

function serialiseRect(element: Element | null) {
  if (!(element instanceof HTMLElement)) return null;
  const value = element.getBoundingClientRect();
  if (value.width <= 0 || value.height <= 0) return null;
  return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
}

declare global {
  interface Window {
    __TETRIS_D4_QA__?: { collect: () => unknown };
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

function GameSession({
  mode,
  puzzleId,
  onExit,
  onCanonicalCompletion,
}: {
  mode: GameMode;
  puzzleId: PuzzleId;
  onExit: (destination: ExitDestination) => void;
  onCanonicalCompletion: (state: GameState) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const exitWasPlayingRef = useRef(false);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(APP_SEED, mode, mode === 'puzzle' ? puzzleId : undefined));
  const [exitOpen, setExitOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState('青流方阵已开始。');

  const focusBoard = useCallback(() => {
    requestAnimationFrame(() => hostRef.current?.querySelector('canvas')?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nextRuntime = new GameRuntime({
      seed: APP_SEED,
      mode,
      puzzleId: mode === 'puzzle' ? puzzleId : undefined,
      reducedMotion: motionQuery.matches,
      onState: (nextState, events) => {
        if (disposed) return;
        setState(nextState);
        const notable = [...events].reverse().find((event) => (
          event.type === 'lines-cleared'
          || event.type === 'paused'
          || event.type === 'resumed'
          || event.type === 'finished'
          || event.type === 'game-over'
        ));
        if (notable) setLiveMessage(eventMessage(notable));
        if (nextState.mode === 'puzzle' && nextState.puzzleCompletion === 'finished') {
          onCanonicalCompletion(nextState);
        }
      },
    });
    const handleMotionChange = (event: MediaQueryListEvent) => nextRuntime.setReducedMotion(event.matches);
    motionQuery.addEventListener('change', handleMotionChange);
    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    void nextRuntime.mount(host).then(() => {
      if (disposed) return;
      nextRuntime.setReducedMotion(motionQuery.matches);
      nextRuntime.start();
      focusBoard();
    });

    return () => {
      disposed = true;
      motionQuery.removeEventListener('change', handleMotionChange);
      nextRuntime.destroy();
      if (runtimeRef.current === nextRuntime) runtimeRef.current = null;
    };
  }, [focusBoard, mode, onCanonicalCompletion, puzzleId]);

  useEffect(() => {
    if (!import.meta.env.DEV || !runtime) return;
    window.render_game_to_text = () => JSON.stringify({
      coordinateSystem: 'board origin is top-left; x increases right; y increases down; visible board is 10 columns by 20 rows',
      screen: 'game',
      mode: state.mode,
      status: state.status,
      phase: state.phase,
      puzzleId: state.puzzleId,
      puzzleCompletion: state.puzzleCompletion,
      score: state.score,
      lines: state.lines,
      level: state.level,
      placedPieces: state.pieceCount,
      active: state.active ? { type: state.active.type, x: state.active.x, y: state.active.y, rotation: state.active.rotation } : null,
      next: state.queue[0] ?? null,
      visibleBoard: state.board.slice(-20).map((row) => row.map((cell) => cell ?? '.').join('')),
    });
    window.advanceTime = (ms: number) => {
      const ticks = Math.max(1, Math.round(Math.max(0, ms) / (1000 / 60)));
      window.__SIGNAL_FOUNDRY_QA__?.advanceTicks(ticks);
    };
    window.__TETRIS_D4_QA__ = {
      collect: () => {
        const buttons = [...document.querySelectorAll<HTMLElement>('button')].map((button) => button.getBoundingClientRect());
        return {
          screen: 'game',
          state: runtime.getState(),
          renderer: runtime.getRendererSnapshot(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
          },
          bounds: {
            board: serialiseRect(document.querySelector('[data-testid="board-frame"]')),
            stats: serialiseRect(document.querySelector('[data-testid="stats"]')),
            next: serialiseRect(document.querySelector('[data-testid="next-slot"]')),
            touch: serialiseRect(document.querySelector('[data-testid="touch-rail"]')),
          },
          assertions: {
            canvasCount: document.querySelectorAll('canvas').length,
            domCellCount: document.querySelectorAll('[data-game-cell]').length,
            minButtonWidth: buttons.length ? Math.min(...buttons.map((item) => item.width)) : null,
            minButtonHeight: buttons.length ? Math.min(...buttons.map((item) => item.height)) : null,
            noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
            noVerticalOverflow: document.documentElement.scrollHeight <= window.innerHeight,
          },
        };
      },
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
      delete window.__TETRIS_D4_QA__;
    };
  }, [runtime, state]);

  const restartRun = useCallback(() => {
    setExitOpen(false);
    runtime?.restart();
    runtime?.start();
    focusBoard();
  }, [focusBoard, runtime]);

  const resumeRun = useCallback(() => {
    if (runtime?.getState().status === 'paused') runtime.togglePause();
  }, [runtime]);

  const requestExit = useCallback(() => {
    exitWasPlayingRef.current = runtime?.getState().status === 'playing';
    if (exitWasPlayingRef.current) runtime?.togglePause();
    setExitOpen(true);
  }, [runtime]);

  const cancelExit = useCallback(() => {
    setExitOpen(false);
    if (exitWasPlayingRef.current && runtime?.getState().status === 'paused') runtime.togglePause();
    exitWasPlayingRef.current = false;
  }, [runtime]);

  const terminal = terminalCopy(state);
  const level = state.mode === 'puzzle' ? campaignLevel(state.puzzleId) : null;
  const exitDestination: ExitDestination = state.mode === 'puzzle' ? 'puzzle-library' : 'home';
  const pauseOpen = state.status === 'paused' && !exitOpen;
  const resultOpen = terminal !== null && !exitOpen;

  return (
    <main id="game" className="play-shell" data-testid="game-screen">
      <header className="play-topbar" data-testid="cluster-header">
        <button
          className="topbar-action"
          type="button"
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            requestExit();
          }}
        >← 模式首页</button>
        <div className="play-identity">
          <Brand compact />
          <span aria-hidden="true">/</span>
          <h1 data-testid="current-mode">{MODE_COPY[state.mode].label}</h1>
          {level && <small>{level.index}/{level.total} · {level.name}</small>}
        </div>
        <button
          className="topbar-action"
          type="button"
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            runtime?.togglePause();
          }}
          disabled={state.status !== 'playing' && state.status !== 'paused'}
        >{state.status === 'paused' ? '继续' : '暂停'}</button>
      </header>

      <section className="game-arena" data-testid="game-cluster" aria-label={`${MODE_COPY[state.mode].label}游戏区`}>
        <div ref={hostRef} className="canvas-host" data-testid="canvas-host" />
        <aside className="info-rail" data-testid="context-top">
          <p className="rail-label">LIVE DATA / 本局</p>
          <RunStats state={state} />
          <p className="mode-rule">{MODE_COPY[state.mode].detail}</p>
        </aside>
        <section className="board-frame" data-testid="board-frame" aria-label="10 × 20 游戏棋盘" />
        <aside className="preview-rail" data-testid="side-rail">
          <p className="rail-label">ROUTE / NEXT</p>
          <div className="next-slot" data-testid="next-slot" aria-label="下一个方块" />
          <p className="keyboard-map">← → 移动<br />↑ 旋转<br />↓ 快速下落<br />空格 直接落底</p>
        </aside>
      </section>

      <section className="touch-deck" data-testid="touch-rail" aria-label="触控操作">
        <TouchButton action="left" label="左移" glyph="←" runtime={runtime} />
        <TouchButton action="right" label="右移" glyph="→" runtime={runtime} />
        <TouchButton action="rotate-cw" label="旋转" glyph="↻" runtime={runtime} />
        <TouchButton action="soft-drop" label="快速下落" glyph="↓" runtime={runtime} />
        <TouchButton action="hard-drop" label="直接落底" glyph="⇣" runtime={runtime} />
      </section>

      <ActionSheet
        open={pauseOpen}
        title="本局已暂停"
        description="棋盘状态已保留。继续、重新开始，或离开当前路线。"
        onCancel={resumeRun}
      >
        <button className="primary-action" data-autofocus type="button" onClick={resumeRun}>继续游戏</button>
        <button className="secondary-action" type="button" onClick={restartRun}>重新开始</button>
        <button className="text-action" type="button" onClick={requestExit}>离开本局</button>
      </ActionSheet>

      <ActionSheet
        open={exitOpen}
        title="要离开当前路线吗？"
        description="本局尚未保存；已完成的解谜记录不会受影响。"
        tone="danger"
        onCancel={cancelExit}
      >
        <button className="primary-action" data-autofocus type="button" onClick={cancelExit}>留在本局</button>
        <button className="secondary-action" type="button" onClick={() => onExit(exitDestination)}>
          {exitDestination === 'puzzle-library' ? '返回关卡库' : '返回模式首页'}
        </button>
      </ActionSheet>

      <ActionSheet
        open={resultOpen}
        title={terminal?.title ?? '本局结束'}
        description={terminal?.detail ?? ''}
        tone={terminal?.success ? 'success' : 'danger'}
      >
        <button className="primary-action" data-autofocus type="button" onClick={restartRun}>再来一局</button>
        <button className="secondary-action" type="button" onClick={() => onExit(exitDestination)}>
          {exitDestination === 'puzzle-library' ? '返回关卡库' : '返回模式首页'}
        </button>
      </ActionSheet>

      <div className="sr-only" aria-live="polite">{liveMessage}</div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [mode, setMode] = useState<GameMode>('marathon');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<PuzzleId>(CAMPAIGN_LEVELS[0]!.id);
  const [progress, setProgress] = useState<PuzzleProgress>(readPuzzleProgress);

  const enterMode = useCallback((nextMode: GameMode) => {
    setMode(nextMode);
    setScreen(nextMode === 'puzzle' ? 'puzzle-library' : 'game');
  }, []);

  const startPuzzle = useCallback(() => {
    setMode('puzzle');
    setScreen('game');
  }, []);

  const recordCompletion = useCallback((state: GameState) => {
    setProgress((current) => {
      const updated = recordCanonicalPuzzleCompletion(current, state);
      if (updated !== current) {
        try { localStorage.setItem(PUZZLE_PROGRESS_KEY, JSON.stringify(updated)); } catch { /* optional local completion record */ }
      }
      return updated;
    });
  }, []);

  const exitGame = useCallback((destination: ExitDestination) => {
    setScreen(destination === 'puzzle-library' ? 'puzzle-library' : 'home');
  }, []);

  return (
    <div className="app">
      <div className="route-line" aria-hidden="true"><i /><i /><i /></div>
      {screen === 'home' && <ModeHome onEnter={enterMode} />}
      {screen === 'puzzle-library' && (
        <PuzzleLibrary
          progress={progress}
          selectedId={selectedPuzzleId}
          onSelect={setSelectedPuzzleId}
          onStart={startPuzzle}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'game' && (
        <GameSession
          key={`${mode}:${selectedPuzzleId}`}
          mode={mode}
          puzzleId={selectedPuzzleId}
          onExit={exitGame}
          onCanonicalCompletion={recordCompletion}
        />
      )}
    </div>
  );
}
