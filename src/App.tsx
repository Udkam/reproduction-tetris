import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PIECE_TYPES,
  ANCHOR_CELL,
  BEDROCK_CELL,
  TICKS_PER_SECOND,
  type GameEvent,
  type GameMode,
  type GameState,
  type PieceType,
  type BoardMaterial,
  type PuzzleId,
  createInitialState,
  gravityForMode,
  survivalIntervalSeconds,
  survivalIntervalTicks,
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
import { ANCHOR_MATERIAL, BEDROCK_MATERIAL, PIECE_MATERIALS } from './game/render/theme';
import { ActionSheet } from './ui/ActionSheet';
import {
  LEADERBOARD_KEY,
  LEGACY_LEADERBOARD_KEYS,
  emptyLeaderboard,
  insertScoreRecord,
  migrateLegacyLeaderboard,
  parseLeaderboard,
  recordsForMode,
  type Leaderboard,
  type RunMode,
  type ScoreRecord,
} from './leaderboard';

type AppScreen = 'home' | 'puzzle-library' | 'game';
type ExitDestination = 'home' | 'puzzle-library';
type EntryCountdownDigit = 3 | 2 | 1;

const APP_SEED = 0x51a1f00d;

const MODE_COPY: Record<GameMode, {
  label: string;
  detail: string;
  action: string;
}> = {
  marathon: {
    label: '经典',
    detail: '连消加分\n每 10 行提高下落速度',
    action: '开始',
  },
  race: {
    label: '生存',
    detail: '开局 5 层基岩\n15 秒 → 8 秒 · 每 3 行降层 / 提速',
    action: '开始',
  },
  puzzle: {
    label: '解谜',
    detail: `${CAMPAIGN_LEVELS.length} 关残局`,
    action: '选关',
  },
};

const MODE_ORDER: readonly GameMode[] = ['marathon', 'race', 'puzzle'];

export function cloneQaState(state: GameState): GameState {
  return structuredClone(state);
}

function readPuzzleProgress(): PuzzleProgress {
  try {
    const current = localStorage.getItem(PUZZLE_PROGRESS_KEY);
    if (current !== null) return parsePuzzleProgress(current);
    return migrateLegacyPuzzleProgress(localStorage.getItem(LEGACY_PUZZLE_PROGRESS_KEY));
  } catch {
    return defaultPuzzleProgress();
  }
}

function readLeaderboard(): Leaderboard {
  try {
    const current = localStorage.getItem(LEADERBOARD_KEY);
    if (current !== null) return parseLeaderboard(current);
    for (const key of LEGACY_LEADERBOARD_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy !== null) return migrateLegacyLeaderboard(legacy);
    }
  } catch {
    return emptyLeaderboard();
  }
  return emptyLeaderboard();
}

function formatScore(value: number): string {
  return Math.max(0, value).toLocaleString('zh-CN');
}

export function fallCadenceLabel(state: GameState): string {
  const ticks = gravityForMode(state.mode, state.level, state.pieceCount, state.lines);
  const seconds = ticks / TICKS_PER_SECOND;
  return `${seconds.toFixed(seconds < 0.1 ? 2 : 1).replace(/\.0$/, '')} 秒/格`;
}

export function survivalCountdownSeconds(state: GameState): number {
  if (state.mode !== 'race' || state.survivalRisePending) return 0;
  return Math.max(0, Math.ceil((survivalIntervalTicks(state.lines) - state.survivalPressureTicks) / TICKS_PER_SECOND));
}

export function survivalCountdownLabel(state: GameState): string {
  return state.survivalRisePending ? '待上升' : `${survivalCountdownSeconds(state)} 秒`;
}

export function puzzleExpirySeconds(state: GameState): number | null {
  if (state.mode !== 'puzzle' || state.puzzleVolatilePieces.length === 0) return null;
  return Math.max(0, Math.ceil(Math.min(...state.puzzleVolatilePieces.map((piece) => piece.expiryTicks)) / TICKS_PER_SECOND));
}

function campaignLevel(id: PuzzleId | null) {
  return CAMPAIGN_LEVELS.find((level) => level.id === id) ?? CAMPAIGN_LEVELS[0]!;
}

export function terminalCopy(state: GameState): { title: string; detail: string; success: boolean } | null {
  if (state.mode === 'puzzle') {
    if (state.puzzleCompletion === 'finished') {
      return { title: '棋盘已清空', detail: `${state.pieceCount} 方块 · ${state.lines} 消行`, success: true };
    }
    if (state.puzzleCompletion && state.puzzleCompletion !== 'active') {
      return { title: '堆叠到顶', detail: `${state.pieceCount} 方块 · ${state.lines} 消行`, success: false };
    }
    return null;
  }
  if (state.status !== 'game-over') return null;
  if (state.mode === 'race') {
    return {
      title: '生存结束',
      detail: `${state.lines} 消行 · ${state.pieceCount} 方块 · ${state.survivalBedrockRows} 层基岩`,
      success: false,
    };
  }
  return { title: '堆叠到顶', detail: `${formatScore(state.score)} 分 · ${state.lines} 消行`, success: false };
}

export function scoreRecordForState(state: GameState, completedAt: string): ScoreRecord | null {
  if ((state.mode !== 'marathon' && state.mode !== 'race') || state.status !== 'game-over') return null;
  return {
    version: 3,
    score: state.score,
    lines: state.lines,
    pieces: state.pieceCount,
    elapsedTicks: state.elapsedTicks,
    mode: state.mode,
    outcome: 'top-out',
    completedAt,
  };
}

function Brand({ compact = false, primary = false }: { compact?: boolean; primary?: boolean }) {
  const wordmark = primary ? <h1>Tetris</h1> : <strong>Tetris</strong>;
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} data-testid="brand">
      {wordmark}
    </div>
  );
}

function ModeGlyph({ mode }: { mode: GameMode }) {
  if (mode === 'marathon') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 31h9V22h9v-9h8" /></svg>;
  }
  if (mode === 'race') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><path className="mode-glyph__soft" d="M5 31h30M5 25h30" /><path d="M10 25v-6h8v6m5 0V14h8v11M27 14V7m-4 4 4-4 4 4" /></svg>;
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="15.5" y="6.5" width="9" height="9" />
      <rect x="6.5" y="15.5" width="9" height="9" />
      <rect x="15.5" y="15.5" width="9" height="9" />
      <rect x="24.5" y="15.5" width="9" height="9" />
    </svg>
  );
}

export function ModeHome({ onEnter }: { onEnter: (mode: GameMode) => void }) {
  const [previewMode, setPreviewMode] = useState<GameMode>('marathon');
  return (
    <main id="game" className="landing-shell" data-testid="mode-home">
      <header className="landing-header">
        <Brand primary />
      </header>
      <section className="landing-stage" aria-labelledby="home-title">
        <section className="mode-chooser">
          <div className="landing-intro">
            <h2 id="home-title">选择模式</h2>
          </div>
          <div
            className="mode-gates"
            data-selection={previewMode}
            aria-label="选择游戏模式"
            data-testid="mode-list"
          >
            {MODE_ORDER.map((mode) => {
              const item = MODE_COPY[mode];
              const active = previewMode === mode;
              return (
                <button
                  key={mode}
                  className={`mode-gate mode-gate--${mode} ${active ? 'mode-gate--active' : ''}`}
                  type="button"
                  data-testid={`enter-${mode}`}
                  data-selected={active || undefined}
                  aria-pressed={active}
                  onPointerEnter={() => setPreviewMode(mode)}
                  onFocus={() => setPreviewMode(mode)}
                  onClick={() => onEnter(mode)}
                >
                  <span className="mode-gate__glyph"><ModeGlyph mode={mode} /></span>
                  <span className="mode-gate__body">
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </span>
                  <span className={`mode-gate__motif mode-gate__motif--${mode}`} aria-hidden="true">
                    <i /><i /><i /><i />
                  </span>
                  <span className="mode-gate__action"><span>{item.action}</span><b aria-hidden="true">→</b></span>
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

function cssHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function puzzleSilhouettePaths(id: PuzzleId): ReadonlyMap<BoardMaterial, string> {
  const board = createInitialState(APP_SEED, 'puzzle', id).board.slice(-12);
  const unit = 4;
  const face = 3.8;
  const paths = new Map<BoardMaterial, string>();
  for (const type of [...PIECE_TYPES, ANCHOR_CELL] as const) {
    const path = board.flatMap((row, y) => row.map((cell, x) => (
      cell === type ? `M${x * unit + .1} ${y * unit + .1}h${face}v${face}h-${face}z` : ''
    ))).join('');
    if (path) paths.set(type, path);
  }
  return paths;
}

function PuzzleSilhouette({ id, name }: { id: PuzzleId; name: string }) {
  return (
    <svg
      className="puzzle-silhouette"
      viewBox="0 0 40 48"
      role="img"
      aria-label={`${name}棋盘轮廓`}
    >
      {[...puzzleSilhouettePaths(id)].map(([type, path]) => {
        const material = type === ANCHOR_CELL ? ANCHOR_MATERIAL : type === BEDROCK_CELL ? BEDROCK_MATERIAL : PIECE_MATERIALS[type];
        return (
          <path
            key={type}
            data-piece-type={type}
            d={path}
            fill={cssHex(material.fillStart)}
            stroke={cssHex(material.edge)}
          />
        );
      })}
    </svg>
  );
}

export function PuzzleLibrary({
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
        <button className="library-back" type="button" aria-label="返回模式首页" onClick={onBack}>
          <b aria-hidden="true">←</b><span>返回模式</span>
        </button>
        <Brand compact />
      </header>
      <section className="library-intro" aria-labelledby="library-title">
        <span>15 个原创残局</span>
        <h1 id="library-title">解谜档案</h1>
      </section>
      <section className="library-content" aria-label="全部解谜关卡">
        <div className="level-list" aria-label={`${CAMPAIGN_LEVELS.length} 个可用解谜关卡`} data-testid="level-list">
          {CAMPAIGN_LEVELS.map((level) => {
            const complete = progress.completedLevelIds.includes(level.id);
            const selectedLevel = selectedId === level.id;
            return (
              <article className={`level-item ${selectedLevel ? 'level-item--selected' : ''}`} key={level.id}>
                <button
                  className="level-entry"
                  type="button"
                  data-testid="level-row"
                  data-level-id={level.id}
                  aria-pressed={selectedLevel}
                  aria-label={`${String(level.index).padStart(2, '0')} ${level.name}${complete ? '，已完成' : ''}`}
                  onClick={() => onSelect(level.id)}
                >
                  <span className="level-entry__number">{String(level.index).padStart(2, '0')}</span>
                  <span className="level-entry__copy">
                    <strong>{level.name}</strong>
                    {complete && <small>已完成</small>}
                  </span>
                </button>
              </article>
            );
          })}
        </div>
        <section className="level-inline-detail" aria-live="polite" aria-label={`已选关卡：${selected.name}`}>
          <PuzzleSilhouette id={selected.id} name={selected.name} />
          <div>
            <small>{String(selected.index).padStart(2, '0')} / {String(selected.total).padStart(2, '0')}</small>
            <h2>{selected.name}</h2>
          </div>
          <button className="primary-action" type="button" data-testid="start-selected-puzzle-mobile" aria-label={`开始 ${selected.name}`} onClick={onStart}>开始本关</button>
        </section>
        <aside className="level-detail" aria-live="polite">
          <div className="level-detail__visual">
            <span className="level-detail__visual-index" aria-hidden="true">{String(selected.index).padStart(2, '0')}</span>
            <div className="level-detail__board">
              <PuzzleSilhouette id={selected.id} name={selected.name} />
            </div>
          </div>
          <div className="level-detail__heading">
            <span className="level-detail__count">{String(selected.index).padStart(2, '0')} / {String(selected.total).padStart(2, '0')}</span>
            <h2>{selected.name}</h2>
          </div>
          <button className="primary-action" type="button" data-testid="start-selected-puzzle" aria-label={`开始 ${selected.name}`} onClick={onStart}>开始本关</button>
        </aside>
      </section>
    </main>
  );
}

export function LeaderboardPanel({ mode, records }: { mode: RunMode; records: readonly ScoreRecord[] }) {
  const survival = mode === 'race';
  return (
    <section className="result-leaderboard" aria-label={survival ? '生存排行榜' : '经典排行榜'}>
      <header>
        <strong>{survival ? '生存排行' : '经典排行'}</strong>
        <span>{survival ? '消行' : '分数'}</span>
      </header>
      {records.length === 0 ? <p>暂无记录</p> : (
        <ol>
          {records.slice(0, 5).map((record, index) => (
            <li key={`${record.completedAt}:${index}`}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <strong>{survival ? `${record.lines} 行` : formatScore(record.score)}</strong>
              <small>{survival ? `${record.pieces} 方块` : `${record.lines} 行`}</small>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

interface TouchButtonProps {
  action: InputAction;
  label: string;
  glyph: string;
  runtime: GameRuntime | null;
  disabled?: boolean;
}

function TouchButton({ action, label, glyph, runtime, disabled = false }: TouchButtonProps) {
  const release = useCallback(() => runtime?.release(action), [action, runtime]);
  return (
    <button
      className="touch-key"
      type="button"
      data-testid={`touch-${action}`}
      aria-label={label}
      disabled={disabled}
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

function AudioControls({
  enabled,
  volume,
  onEnabledChange,
  onVolumeChange,
}: {
  enabled: boolean;
  volume: number;
  onEnabledChange: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
}) {
  const percent = Math.round(volume * 100);
  return (
    <section className="audio-controls" aria-label="声音控制">
      <button
        className="audio-toggle"
        type="button"
        data-testid="audio-toggle"
        aria-label={enabled ? '关闭声音' : '开启声音'}
        aria-pressed={enabled}
        onClick={() => onEnabledChange(!enabled)}
      >{enabled ? '声音开' : '声音关'}</button>
      <label className="audio-volume">
        <span>音量</span>
        <input
          type="range"
          data-testid="audio-volume"
          min="0"
          max="100"
          step="1"
          value={percent}
          aria-label="音量"
          onChange={(event) => onVolumeChange(Number(event.currentTarget.value) / 100)}
        />
        <output>{percent}%</output>
      </label>
    </section>
  );
}

export function RunStats({ state }: { state: GameState }) {
  if (state.mode === 'race') {
    const nextSeconds = survivalCountdownSeconds(state);
    return (
      <section className="run-stats" data-testid="stats" aria-label="生存模式数据">
        <article data-stat-role="score"><span>分数</span><strong>{formatScore(state.score)}</strong></article>
        <article data-stat-role="lines"><span>消行</span><strong>{state.lines}</strong></article>
        <article data-stat-role="survival-bedrock"><span>基岩</span><strong>{state.survivalBedrockRows}</strong></article>
        <article data-stat-role="survival-next" data-urgent={state.survivalRisePending || nextSeconds <= 5 || undefined}>
          <span>下一层</span><strong>{survivalCountdownLabel(state)}</strong>
        </article>
      </section>
    );
  }
  if (state.mode === 'puzzle') {
    const level = campaignLevel(state.puzzleId);
    const expirySeconds = puzzleExpirySeconds(state);
    const hasVolatileSignal = state.puzzleActiveVolatile || expirySeconds !== null;
    return (
      <section className="run-stats run-stats--puzzle" data-testid="stats" aria-label="解谜模式数据">
        <article data-stat-role="puzzle-level"><span>关卡 {level.index}/{level.total}</span><strong>{level.name}</strong></article>
        <article data-stat-role="placed"><span>已放置</span><strong>{state.pieceCount}</strong></article>
        <article data-stat-role="lines"><span>消行</span><strong>{state.lines}</strong></article>
        <article data-stat-role="objective" data-urgent={expirySeconds !== null && expirySeconds <= 3 || undefined}>
          <span>{hasVolatileSignal ? '限时块' : '目标'}</span><strong>{expirySeconds !== null ? `${expirySeconds} 秒` : state.puzzleActiveVolatile ? '落定后 5 秒' : '清除活动块'}</strong>
        </article>
      </section>
    );
  }
  return (
    <section className="run-stats" data-testid="stats" aria-label="经典模式数据">
      <article data-stat-role="score"><span>分数</span><strong>{formatScore(state.score)}</strong></article>
      <article data-stat-role="lines"><span>消行</span><strong>{state.lines}</strong></article>
      <article data-stat-role="classic-combo"><span>连消</span><strong>{state.combo}</strong></article>
      <article data-stat-role="fall-cadence"><span>下落</span><strong>{fallCadenceLabel(state)}</strong></article>
    </section>
  );
}

export function eventMessage(event: GameEvent): string {
  if (event.type === 'lines-cleared') return `消除了 ${event.count} 行。`;
  if (event.type === 'bedrock-raised') return `基岩升至 ${event.height} 层。`;
  if (event.type === 'bedrock-lowered') return `基岩降至 ${event.height} 层。`;
  if (event.type === 'piece-expired') return `限时 ${event.piece} 方块已消散。`;
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

export function GameSession({
  mode,
  puzzleId,
  onExit,
  onCanonicalCompletion,
  leaderboard = emptyLeaderboard(),
  onRunFinished,
}: {
  mode: GameMode;
  puzzleId: PuzzleId;
  onExit: (destination: ExitDestination) => void;
  onCanonicalCompletion: (state: GameState) => void;
  leaderboard?: Leaderboard;
  onRunFinished?: (state: GameState) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const exitWasPlayingRef = useRef(false);
  const lastRecordedRunRef = useRef<string | null>(null);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(APP_SEED, mode, mode === 'puzzle' ? puzzleId : undefined));
  const [countdownDigit, setCountdownDigit] = useState<EntryCountdownDigit | null>(3);
  const [exitOpen, setExitOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0.78);

  const focusBoard = useCallback(() => {
    requestAnimationFrame(() => hostRef.current?.querySelector('canvas')?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let countdownComplete = false;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nextRuntime = new GameRuntime({
      seed: APP_SEED,
      mode,
      puzzleId: mode === 'puzzle' ? puzzleId : undefined,
      inputEnabled: false,
      reducedMotion: motionQuery.matches,
      audioEnabled,
      audioVolume,
      onState: (nextState, events) => {
        if (disposed) return;
        setState(nextState);
        if (nextState.status === 'ready') lastRecordedRunRef.current = null;
        if ((nextState.mode === 'marathon' || nextState.mode === 'race') && nextState.status === 'game-over') {
          const runKey = `${nextState.seed}:${nextState.mode}:${nextState.elapsedTicks}:${nextState.pieceCount}:${nextState.score}:${nextState.lines}`;
          if (lastRecordedRunRef.current !== runKey) {
            lastRecordedRunRef.current = runKey;
            onRunFinished?.(nextState);
          }
        }
        const notable = [...events].reverse().find((event) => (
          event.type === 'lines-cleared'
          || event.type === 'bedrock-raised'
          || event.type === 'bedrock-lowered'
          || event.type === 'piece-expired'
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
    const countdownTimers = [
      window.setTimeout(() => {
        if (!disposed) setCountdownDigit(2);
      }, 1000),
      window.setTimeout(() => {
        if (!disposed) setCountdownDigit(1);
      }, 2000),
      window.setTimeout(() => {
        if (disposed) return;
        countdownComplete = true;
        nextRuntime.setInputEnabled(true);
        nextRuntime.start();
        setCountdownDigit(null);
        setLiveMessage('Tetris 已开始。');
        focusBoard();
      }, 3000),
    ];
    void nextRuntime.mount(host).then(() => {
      if (disposed) return;
      nextRuntime.setReducedMotion(motionQuery.matches);
      if (countdownComplete) focusBoard();
    });

    return () => {
      disposed = true;
      for (const timer of countdownTimers) window.clearTimeout(timer);
      motionQuery.removeEventListener('change', handleMotionChange);
      nextRuntime.destroy();
      if (runtimeRef.current === nextRuntime) runtimeRef.current = null;
    };
  }, [focusBoard, mode, onCanonicalCompletion, onRunFinished, puzzleId]);

  useEffect(() => {
    runtime?.setAudioEnabled(audioEnabled);
    runtime?.setAudioVolume(audioVolume);
  }, [audioEnabled, audioVolume, runtime]);

  useEffect(() => {
    if (!import.meta.env.DEV || !runtime) return;
    window.render_game_to_text = () => JSON.stringify({
      coordinateSystem: 'board origin is top-left; x increases right; y increases down; visible board is 10 columns by 20 rows',
      screen: 'game',
      mode: state.mode,
      status: state.status,
      countdown: countdownDigit,
      phase: state.phase,
      puzzleId: state.puzzleId,
      puzzleCompletion: state.puzzleCompletion,
      puzzleActiveVolatile: state.puzzleActiveVolatile,
      puzzleVolatilePieces: state.puzzleVolatilePieces,
      puzzleExpirySeconds: puzzleExpirySeconds(state),
      anchorCells: state.board.flat().filter((cell) => cell === ANCHOR_CELL).length,
      score: state.score,
      lines: state.lines,
      combo: state.combo,
      bedrockRows: state.survivalBedrockRows,
      bedrockIntervalSeconds: state.mode === 'race' ? survivalIntervalSeconds(state.lines) : null,
      bedrockNextSeconds: state.mode === 'race' ? survivalCountdownSeconds(state) : null,
      bedrockPending: state.mode === 'race' ? state.survivalRisePending : false,
      fallTicks: gravityForMode(state.mode, state.level, state.pieceCount, state.lines),
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
          countdown: countdownDigit,
          state: cloneQaState(runtime.getState()),
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
  }, [countdownDigit, runtime, state]);

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
  const leaderboardRecords = state.mode === 'puzzle' ? [] : recordsForMode(leaderboard, state.mode);

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
          aria-label={state.mode === 'puzzle' ? '返回解谜关卡' : '返回模式首页'}
        >← 返回</button>
        <div className="play-identity">
          <Brand compact />
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
          disabled={countdownDigit !== null || (state.status !== 'playing' && state.status !== 'paused')}
        >{state.status === 'paused' ? '继续' : '暂停'}</button>
      </header>

      <section className="play-surface" aria-label={`${MODE_COPY[state.mode].label}游戏面板`}>
        <section className="game-arena" data-testid="game-cluster" aria-label={`${MODE_COPY[state.mode].label}游戏区`}>
          <div ref={hostRef} className="canvas-host" data-testid="canvas-host" />
          <section
            className={`board-frame ${countdownDigit !== null ? 'board-frame--countdown' : ''}`}
            data-testid="board-frame"
            aria-label="10 × 20 游戏棋盘"
          >
            {countdownDigit !== null && (
              <div
                className="entry-countdown"
                data-testid="entry-countdown"
                data-countdown={countdownDigit}
                role="status"
                aria-live="assertive"
                aria-atomic="true"
              >
                <span key={countdownDigit} className="entry-countdown__digit">{countdownDigit}</span>
              </div>
            )}
          </section>
          <aside className="game-side-panel" data-testid="side-rail">
            <div className="info-rail" data-testid="context-top">
              <RunStats state={state} />
              <AudioControls
                enabled={audioEnabled}
                volume={audioVolume}
                onEnabledChange={setAudioEnabled}
                onVolumeChange={setAudioVolume}
              />
            </div>
            <div className="preview-rail">
              <p className="rail-label">Next</p>
              <div className="next-slot" data-testid="next-slot" aria-label="下一个方块" />
            </div>
            <p className="keyboard-map"><b>键盘</b><span>← → 移动</span><span>↑ 旋转</span><span>↓ 快速下落</span><span>空格 直接落底</span></p>
          </aside>
        </section>

        <section className="touch-deck" data-testid="touch-rail" aria-label="触控操作">
          <TouchButton action="left" label="左移" glyph="←" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="right" label="右移" glyph="→" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="rotate-cw" label="旋转" glyph="↻" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="soft-drop" label="快速下落" glyph="↓" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="hard-drop" label="直接落底" glyph="⇣" runtime={runtime} disabled={countdownDigit !== null} />
        </section>
      </section>

      <ActionSheet
        open={pauseOpen}
        title="已暂停"
        description=""
        onCancel={resumeRun}
      >
        <button className="primary-action" data-autofocus type="button" onClick={resumeRun}>继续游戏</button>
        <button className="secondary-action" type="button" onClick={restartRun}>重新开始</button>
        <button className="text-action" type="button" onClick={requestExit}>离开本局</button>
      </ActionSheet>

      <ActionSheet
        open={exitOpen}
        title="离开本局？"
        description=""
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
        {state.mode !== 'puzzle' && <LeaderboardPanel mode={state.mode} records={leaderboardRecords} />}
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
  const [leaderboard, setLeaderboard] = useState<Leaderboard>(readLeaderboard);

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

  const recordRun = useCallback((state: GameState) => {
    const record = scoreRecordForState(state, new Date().toISOString());
    if (!record) return;
    setLeaderboard((current) => {
      const updated = insertScoreRecord(current, record);
      try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated)); } catch { /* optional local leaderboard */ }
      return updated;
    });
  }, []);

  const exitGame = useCallback((destination: ExitDestination) => {
    setScreen(destination === 'puzzle-library' ? 'puzzle-library' : 'home');
  }, []);

  return (
    <div className="app">
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
          leaderboard={leaderboard}
          onRunFinished={recordRun}
        />
      )}
    </div>
  );
}
