import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RACE_TARGET_LINES,
  type GameEvent,
  type GameMode,
  type GameState,
  createInitialState,
} from './game/core';
import { type InputAction } from './game/input/InputController';
import { GameRuntime } from './game/runtime/GameRuntime';
import {
  LEADERBOARD_KEY,
  LEGACY_LEADERBOARD_KEY,
  emptyLeaderboard,
  insertScoreRecord,
  migrateLegacyLeaderboard,
  parseLeaderboard,
  recordsForMode,
  type Leaderboard,
  type ScoreRecord,
} from './leaderboard';

const PUZZLE_RECORDS_KEY = 'stack-order:puzzle-records:v1';

type PuzzleRecords = Record<string, { first: number; best: number }>;

const MODE_COPY: Record<GameMode, { label: string; goal: string; end: string }> = {
  marathon: { label: '马拉松模式', goal: '目标：最高得分', end: '结束：堆叠到顶' },
  race: { label: '竞速模式', goal: '目标：清除 20 行', end: '结束：完成 20 行' },
  puzzle: { label: '解谜模式', goal: '目标：完成局面', end: '结束：方块用尽' },
};

function readLeaderboard(): Leaderboard {
  try {
    const current = localStorage.getItem(LEADERBOARD_KEY);
    return current === null
      ? migrateLegacyLeaderboard(localStorage.getItem(LEGACY_LEADERBOARD_KEY))
      : parseLeaderboard(current);
  } catch {
    return emptyLeaderboard();
  }
}

function readPuzzleRecords(): PuzzleRecords {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PUZZLE_RECORDS_KEY) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).flatMap(([id, record]) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) return [];
      const candidate = record as { first?: unknown; best?: unknown };
      const first = candidate.first;
      const best = candidate.best;
      if (typeof first !== 'number' || typeof best !== 'number'
        || !Number.isSafeInteger(first) || !Number.isSafeInteger(best) || first < 1 || best < 1) return [];
      return [[id, { first, best }] as const];
    }));
  } catch {
    return {};
  }
}

function formatScore(value: number): string {
  return Math.max(0, value).toLocaleString('zh-CN');
}

function formatDuration(ticks: number): string {
  const totalSeconds = Math.max(0, Math.floor(ticks / 60));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function modeLabel(mode: GameMode): string {
  return MODE_COPY[mode].label;
}

function terminalCopy(state: GameState): { title: string; detail: string } | null {
  if (state.status === 'finished') {
    if (state.mode === 'race') return { title: '20 行完成', detail: `${formatDuration(state.elapsedTicks)} · ${state.pieceCount} 块` };
    if (state.mode === 'puzzle') return { title: '解谜完成', detail: `${state.pieceCount} 块完成` };
  }
  if (state.status === 'game-over') {
    if (state.mode === 'race') return { title: '竞速未完成', detail: `还差 ${Math.max(0, RACE_TARGET_LINES - state.lines)} 行` };
    if (state.mode === 'puzzle') return { title: '方块用尽', detail: `目标 ${state.lines} / ${state.puzzleTargetLines ?? 0} 行` };
    return { title: '堆叠到顶', detail: `${formatScore(state.score)} 分 · ${state.lines} 行` };
  }
  return null;
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
      <b aria-hidden="true">{glyph}</b>
      <small>{label}</small>
    </button>
  );
}

function ModeLines({ selected, onSelect, label = '选择模式' }: { selected: GameMode; onSelect: (mode: GameMode) => void; label?: string }) {
  return (
    <section className="mode-lines" data-testid="mode-list" aria-label={label}>
      <p>{label}</p>
      {(Object.keys(MODE_COPY) as GameMode[]).map((mode) => (
        <button key={mode} type="button" aria-pressed={selected === mode} onClick={() => onSelect(mode)}>
          <strong>{MODE_COPY[mode].label}</strong>
          <span>{MODE_COPY[mode].goal}</span>
          <small>{MODE_COPY[mode].end}</small>
        </button>
      ))}
    </section>
  );
}

function RunStats({ state, puzzleRecords }: { state: GameState; puzzleRecords: PuzzleRecords }) {
  const puzzleRecord = state.puzzleId ? puzzleRecords[state.puzzleId] : undefined;
  if (state.mode === 'race') {
    return (
      <section className="run-stats" data-testid="stats" aria-label="竞速模式数据">
        <article><span>用时</span><strong>{formatDuration(state.elapsedTicks)}</strong></article>
        <article><span>剩余行</span><strong>{Math.max(0, RACE_TARGET_LINES - state.lines)}</strong></article>
        <article><span>速度档</span><strong>{Math.floor(state.pieceCount / 5) + 1}</strong></article>
      </section>
    );
  }
  if (state.mode === 'puzzle') {
    return (
      <section className="run-stats" data-testid="stats" aria-label="解谜模式数据">
        <article><span>关卡</span><strong>{state.puzzleId?.replace('offset-', '') ?? '01'}</strong></article>
        <article><span>剩余方块</span><strong>{Math.max(0, (state.puzzlePieceBudget ?? 0) - state.pieceCount)}</strong></article>
        <article><span>目标进度</span><strong>{state.lines} / {state.puzzleTargetLines ?? 0}</strong></article>
        {puzzleRecord && <p className="puzzle-best">首次 {puzzleRecord.first} · 最佳 {puzzleRecord.best}</p>}
      </section>
    );
  }
  return (
    <section className="run-stats" data-testid="stats" aria-label="马拉松模式数据">
      <article><span>得分</span><strong>{formatScore(state.score)}</strong></article>
      <article><span>消行</span><strong>{state.lines}</strong></article>
      <article><span>等级</span><strong>{state.level}</strong></article>
    </section>
  );
}

function rect(element: Element | null): DOMRect | null {
  return element instanceof HTMLElement ? element.getBoundingClientRect() : null;
}

function serialiseRect(value: DOMRect | null) {
  return value && value.width > 0 && value.height > 0
    ? { left: value.left, top: value.top, width: value.width, height: value.height, right: value.right, bottom: value.bottom }
    : null;
}

function intersectionArea(left: DOMRect | null, right: DOMRect | null): number {
  if (!left || !right) return 0;
  return Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
    * Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
}

declare global {
  interface Window {
    __TETRIS_D4_QA__?: { collect: () => unknown };
  }
}

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const lastRecordedRunRef = useRef<string | null>(null);
  const modeSwitchResumesRef = useRef(false);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(0x51a1f00d));
  const [leaderboard, setLeaderboard] = useState<Leaderboard>(readLeaderboard);
  const [puzzleRecords, setPuzzleRecords] = useState<PuzzleRecords>(readPuzzleRecords);
  const [modeSwitchOpen, setModeSwitchOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode>('marathon');
  const [liveMessage, setLiveMessage] = useState('Tetris 已准备好。');

  const focusBoard = useCallback(() => {
    requestAnimationFrame(() => hostRef.current?.querySelector('canvas')?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const nextRuntime = new GameRuntime({
      seed: 0x51a1f00d,
      reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
      onState: (nextState, events) => {
        if (disposed) return;
        setState(nextState);
        const notable = [...events].reverse().find((event) => event.type === 'lines-cleared' || event.type === 'paused'
          || event.type === 'resumed' || event.type === 'finished' || event.type === 'game-over');
        if (notable) setLiveMessage(eventMessage(notable));

        if (nextState.status === 'ready') lastRecordedRunRef.current = null;
        const isRecordable = (nextState.mode === 'marathon' && nextState.status === 'game-over')
          || (nextState.mode === 'race' && nextState.status === 'finished');
        if (isRecordable) {
          const runKey = `${nextState.status}:${nextState.seed}:${nextState.mode}:${nextState.elapsedTicks}:${nextState.pieceCount}:${nextState.score}`;
          if (lastRecordedRunRef.current !== runKey) {
            lastRecordedRunRef.current = runKey;
            const recordedMode: 'marathon' | 'race' = nextState.mode === 'race' ? 'race' : 'marathon';
            const record: ScoreRecord = {
              version: 2,
              score: nextState.score,
              lines: nextState.lines,
              pieces: nextState.pieceCount,
              elapsedTicks: nextState.elapsedTicks,
              completionTicks: nextState.mode === 'race' ? nextState.elapsedTicks : null,
              mode: recordedMode,
              outcome: recordedMode === 'race' ? 'finished' : 'top-out',
              completedAt: new Date().toISOString(),
            };
            setLeaderboard((current) => {
              const next = insertScoreRecord(current, record);
              try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next)); } catch { /* optional presentation storage */ }
              return next;
            });
          }
        }
        if (nextState.mode === 'puzzle' && nextState.status === 'finished' && nextState.puzzleId) {
          setPuzzleRecords((current) => {
            const prior = current[nextState.puzzleId!];
            const used = nextState.pieceCount;
            const next = { ...current, [nextState.puzzleId!]: { first: prior?.first ?? used, best: Math.min(prior?.best ?? used, used) } };
            try { localStorage.setItem(PUZZLE_RECORDS_KEY, JSON.stringify(next)); } catch { /* optional presentation storage */ }
            return next;
          });
        }
      },
    });
    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    void nextRuntime.mount(host);
    return () => {
      disposed = true;
      nextRuntime.destroy();
      if (runtimeRef.current === nextRuntime) runtimeRef.current = null;
      setRuntime(null);
    };
  }, []);

  useEffect(() => {
    runtime?.setModeSwitch(modeSwitchOpen);
  }, [modeSwitchOpen, runtime]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__TETRIS_D4_QA__ = {
      collect: () => {
        const board = rect(document.querySelector('[data-testid="board-frame"]'));
        const pause = rect(document.querySelector('[data-testid="pause-strip"]'));
        const header = rect(document.querySelector('[data-testid="cluster-header"]'));
        const brand = rect(document.querySelector('[data-testid="brand"]'));
        const currentMode = rect(document.querySelector('[data-testid="current-mode"]'));
        const hint = rect(document.querySelector('[data-testid="rotation-hint"]'));
        const context = rect(document.querySelector('[data-testid="context-top"]'));
        const stats = rect(document.querySelector('[data-testid="stats"]'));
        const touch = rect(document.querySelector('[data-testid="touch-rail"]'));
        const modeList = rect(document.querySelector('[data-testid="mode-list"]'));
        const next = rect(document.querySelector('[data-testid="next-slot"]'));
        const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="game-canvas"]');
        const headerPairs = [[brand, currentMode], [brand, hint], [currentMode, hint]].map(([left, right]) => intersectionArea(left, right));
        const structuralPairs = [[context, board], [stats, board], [touch, board]].map(([left, right]) => intersectionArea(left, right));
        const pauseArea = pause ? pause.width * pause.height : 0;
        const boardArea = board ? board.width * board.height : 0;
        return {
          state,
          renderer: runtime?.getRendererSnapshot() ?? null,
          bounds: {
            header: serialiseRect(header), brand: serialiseRect(brand), currentMode: serialiseRect(currentMode), rotationHint: serialiseRect(hint),
            canvasHost: serialiseRect(rect(document.querySelector('[data-testid="canvas-host"]'))),
            board: serialiseRect(board), next: serialiseRect(next), stats: serialiseRect(stats), pauseStrip: serialiseRect(pause),
            modeList: serialiseRect(modeList), touchRail: serialiseRect(touch), touchZones: [...document.querySelectorAll('[data-testid^="touch-"]:not([data-testid="touch-rail"])')].map((item) => serialiseRect(rect(item))),
          },
          assertions: {
            boardRatio: board ? board.height / board.width : null,
            pauseStripRatio: boardArea ? pauseArea / boardArea : null,
            pauseInsideBoard: pause && board ? pause.left >= board.left - 1 && pause.right <= board.right + 1 && pause.top >= board.top - 1 && pause.bottom <= board.bottom + 1 : true,
            headerPairwiseIntersection: headerPairs,
            structuralPairwiseIntersection: structuralPairs,
            touchMinHeight: Math.min(...[...document.querySelectorAll<HTMLElement>('[data-testid^="touch-"]:not([data-testid="touch-rail"])')].map((item) => item.getBoundingClientRect().height)),
            canvasCount: document.querySelectorAll('canvas').length,
            domCellCount: document.querySelectorAll('[data-game-cell]').length,
            noOverflow: document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= Math.max(document.documentElement.clientHeight, window.innerHeight),
            boardText: document.querySelector('[data-testid="board-frame"]')?.textContent?.trim() ?? '',
            previewLayerHidden: modeSwitchOpen ? runtime?.getRendererSnapshot().previewLayerVisible === false : true,
            canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null,
          },
        };
      },
    };
    return () => { delete window.__TETRIS_D4_QA__; };
  }, [modeSwitchOpen, runtime, state]);

  const isReady = state.status === 'ready';
  const isTerminal = state.status === 'game-over' || state.status === 'finished';
  const terminal = terminalCopy(state);
  const leaderboardRecords = state.mode === 'puzzle' ? [] : recordsForMode(leaderboard, state.mode);

  const openModeSwitch = () => {
    modeSwitchResumesRef.current = state.status === 'playing';
    if (state.status === 'playing') runtime?.togglePause();
    setPendingMode(state.mode);
    setModeSwitchOpen(true);
  };
  const returnToRun = () => {
    setModeSwitchOpen(false);
    if (modeSwitchResumesRef.current) runtime?.togglePause();
  };
  const applyModeSwitch = () => {
    setModeSwitchOpen(false);
    runtime?.restart(state.seed, pendingMode);
    runtime?.start();
    focusBoard();
  };

  return (
    <div className="app">
      <main id="game" className="game-shell">
        <header className="cluster-header" data-testid="cluster-header">
          <div className="brand-lockup" data-testid="brand"><h1>Tetris</h1></div>
          <p className="current-mode" data-testid="current-mode">{modeLabel(state.mode)}</p>
          <span className="rotation-hint" data-testid="rotation-hint">↑ 旋转</span>
          <i className="drop-band" aria-hidden="true" />
        </header>

        <section className={`game-cluster${modeSwitchOpen ? ' game-cluster--switching' : ''}`} data-testid="game-cluster" aria-label="Tetris 棋盘">
          <div ref={hostRef} className="canvas-host" data-testid="canvas-host" />

          <aside className="context-top" data-testid="context-top">
            {isReady ? (
              <>
                <ModeLines selected={state.mode} onSelect={(mode) => runtime?.selectMode(mode)} />
                <div className="ready-action">
                  <strong>{MODE_COPY[state.mode].goal.replace('目标：', '')}</strong>
                  <span>{MODE_COPY[state.mode].end}</span>
                  <button type="button" onClick={() => { runtime?.start(); focusBoard(); }}>开始</button>
                </div>
              </>
            ) : modeSwitchOpen ? (
              <>
                <ModeLines selected={pendingMode} onSelect={setPendingMode} label="切换模式" />
                <button className="primary-action" type="button" onClick={applyModeSwitch}>应用并重新开始</button>
                <button className="secondary-action" type="button" onClick={returnToRun}>返回本局</button>
              </>
            ) : (
              <>
                <div className="run-heading">
                  <strong>{modeLabel(state.mode)}</strong>
                  <button type="button" onClick={openModeSwitch}>切换模式</button>
                </div>
                <div className="next-slot" data-testid="next-slot" aria-label="下一个方块" />
                {state.status === 'playing' && <button className="pause-action" type="button" onClick={() => runtime?.togglePause()}>暂停</button>}
                <p className="keyboard-map">← → 移动　↑ 旋转　↓ 快速下落　空格 直接落底</p>
              </>
            )}
          </aside>

          <section className="board-frame" data-testid="board-frame" aria-label="10 × 20 棋盘">
            {state.status === 'paused' && !modeSwitchOpen && (
              <div className="pause-strip" data-testid="pause-strip">
                <strong>暂停</strong><i aria-hidden="true" />
                <button className="pause-strip__primary" type="button" onClick={() => { runtime?.togglePause(); focusBoard(); }}>继续</button>
                <button type="button" onClick={() => { runtime?.restart(); focusBoard(); }}>重新开始</button>
              </div>
            )}
            {terminal && !modeSwitchOpen && (
              <div className="end-strip" data-testid="end-strip">
                <strong>{terminal.title}</strong><span>{terminal.detail}</span>
                <button type="button" onClick={() => { runtime?.restart(); focusBoard(); }}>再来一局</button>
                {state.mode !== 'puzzle' && <Leaderboard mode={state.mode} records={leaderboardRecords} />}
              </div>
            )}
          </section>

          {!isReady && !modeSwitchOpen && <RunStats state={state} puzzleRecords={puzzleRecords} />}

          <section className="touch-deck" data-testid="touch-rail" aria-label="触控操作">
            <TouchButton action="left" label="左移" glyph="←" runtime={runtime} />
            <TouchButton action="right" label="右移" glyph="→" runtime={runtime} />
            <TouchButton action="rotate-cw" label="旋转" glyph="↑" runtime={runtime} />
            <TouchButton action="soft-drop" label="快速下落" glyph="↓" runtime={runtime} />
            <TouchButton action="hard-drop" label="直接落底" glyph="⇣" runtime={runtime} />
          </section>
        </section>
      </main>
      <div className="sr-only" aria-live="polite">{liveMessage}</div>
    </div>
  );
}

function Leaderboard({ mode, records }: { mode: Exclude<GameMode, 'puzzle'>; records: readonly ScoreRecord[] }) {
  const isRace = mode === 'race';
  return (
    <section className="leaderboard" aria-label={isRace ? '竞速完成榜' : '马拉松记录'}>
      <p>{isRace ? '竞速完成榜' : '马拉松记录'}</p>
      {records.length === 0 ? <span>暂无记录</span> : (
        <ol>{records.slice(0, 5).map((record, index) => (
          <li key={`${record.completedAt}:${index}`}><b>{index + 1}</b><strong>{isRace ? formatDuration(record.completionTicks ?? record.elapsedTicks) : formatScore(record.score)}</strong><small>{record.pieces} 块</small></li>
        ))}</ol>
      )}
    </section>
  );
}

function eventMessage(event: GameEvent): string {
  if (event.type === 'lines-cleared') return `消除了 ${event.count} 行。`;
  if (event.type === 'paused') return '暂停。';
  if (event.type === 'resumed') return '继续游戏。';
  if (event.type === 'finished') return '本局完成。';
  if (event.type === 'game-over') return event.reason === 'puzzle-budget' ? '方块用尽。' : '堆叠到顶，本局结束。';
  return '';
}
