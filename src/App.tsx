import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ANCHOR_CELL,
  PIECE_TYPES,
  TICKS_PER_SECOND,
  type GameEvent,
  type GameMode,
  type GameState,
  type PieceType,
  type PuzzleId,
  createInitialState,
  getPuzzleDefinition,
  gravityForMode,
  survivalIntervalSeconds,
  survivalIntervalTicks,
} from './game/core';
import { type InputAction } from './game/input/InputController';
import { GameRuntime, randomRunSeed } from './game/runtime/GameRuntime';
import { browserPlatform, type PlatformTimeout } from './platform/browserPlatform';
import {
  CAMPAIGN_LEVELS,
  LEGACY_PUZZLE_PROGRESS_KEY,
  PUZZLE_ROW_BANDS,
  PUZZLE_PROGRESS_KEY,
  V3_PUZZLE_PROGRESS_KEY,
  V2_PUZZLE_PROGRESS_KEY,
  defaultPuzzleProgress,
  migrateLegacyPuzzleProgress,
  migrateV3PuzzleProgress,
  migrateV2PuzzleProgress,
  parsePuzzleProgress,
  puzzleBestPieceCount,
  recordCanonicalPuzzleCompletion,
  type PuzzleProgress,
} from './puzzleProgress';
import { ANCHOR_MATERIAL, PIECE_MATERIALS } from './game/render/theme';
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
const PRODUCT_NAME = 'Tetra';

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
    detail: '开局 7 层基岩\n13 秒 → 6 秒 · 每 3 行降层 · 固定下落',
    action: '开始',
  },
  sprint: {
    label: '坍缩',
    detail: '消行后逐列坍落\n堆叠到顶前制造连锁',
    action: '开始',
  },
  puzzle: {
    label: '解谜',
    detail: `${CAMPAIGN_LEVELS.length} 关残局`,
    action: '选关',
  },
};

const MODE_ORDER: readonly GameMode[] = ['marathon', 'race', 'sprint', 'puzzle'];

export function cloneQaState(state: GameState): GameState {
  return structuredClone(state);
}

function readPuzzleProgress(): PuzzleProgress {
  try {
    const current = browserPlatform.readStorage(PUZZLE_PROGRESS_KEY);
    if (current !== null) return parsePuzzleProgress(current);
    const v3 = browserPlatform.readStorage(V3_PUZZLE_PROGRESS_KEY);
    if (v3 !== null) return migrateV3PuzzleProgress(v3);
    const v2 = browserPlatform.readStorage(V2_PUZZLE_PROGRESS_KEY);
    if (v2 !== null) return migrateV2PuzzleProgress(v2);
    return migrateLegacyPuzzleProgress(browserPlatform.readStorage(LEGACY_PUZZLE_PROGRESS_KEY));
  } catch {
    return defaultPuzzleProgress();
  }
}

function readLeaderboard(): Leaderboard {
  try {
    const current = browserPlatform.readStorage(LEADERBOARD_KEY);
    if (current !== null) return parseLeaderboard(current);
    for (const key of LEGACY_LEADERBOARD_KEYS) {
      const legacy = browserPlatform.readStorage(key);
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

export function elapsedTimeLabel(elapsedTicks: number): string {
  const seconds = Math.floor(Math.max(0, elapsedTicks) / TICKS_PER_SECOND);
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
}

export function countdownTimeLabel(remainingTicks: number): string {
  const seconds = Math.ceil(Math.max(0, remainingTicks) / TICKS_PER_SECOND);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
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

function campaignLevel(id: PuzzleId | null) {
  return CAMPAIGN_LEVELS.find((level) => level.id === id) ?? CAMPAIGN_LEVELS[0]!;
}

export function terminalCopy(state: GameState): { title: string; detail: string; success: boolean } | null {
  if (state.mode === 'puzzle') {
    if (state.puzzleCompletion === 'finished') {
      return { title: '原有方块已清除', detail: `${state.pieceCount} 方块 · ${state.lines} 消行`, success: true };
    }
    if (state.puzzleCompletion && state.puzzleCompletion !== 'active') {
      const remaining = state.puzzleTargetCells.length;
      return { title: '堆叠到顶', detail: `剩余 ${remaining} 原有方块 · 已落 ${state.pieceCount} 块`, success: false };
    }
    return null;
  }
  if (state.mode === 'sprint') {
    if (state.status === 'game-over') {
      return {
        title: '坍缩到顶',
        detail: `${state.lines} 消行 · ${formatScore(state.score)} 分 · 最高 ${state.sprintBestCascade} 连锁`,
        success: false,
      };
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
  const isTopOutRun = (state.mode === 'marathon' || state.mode === 'race' || state.mode === 'sprint') && state.status === 'game-over';
  if (!isTopOutRun) return null;
  const mode: RunMode = state.mode === 'sprint' ? 'sprint' : state.mode === 'race' ? 'race' : 'marathon';
  return {
    version: 6,
    score: state.score,
    lines: state.lines,
    pieces: state.pieceCount,
    elapsedTicks: state.elapsedTicks,
    chain: mode === 'sprint' ? state.sprintBestCascade : 0,
    mode,
    outcome: 'top-out',
    completedAt,
  };
}

export function scoreRecordKey(record: ScoreRecord): string {
  return [record.mode, record.completedAt, record.score, record.lines, record.pieces, record.elapsedTicks, record.chain].join(':');
}

export function scoreRecordRank(records: readonly ScoreRecord[], record: ScoreRecord | null): number | null {
  if (!record) return null;
  const index = records.findIndex((candidate) => scoreRecordKey(candidate) === scoreRecordKey(record));
  return index >= 0 ? index + 1 : null;
}

function Brand({ compact = false, primary = false }: { compact?: boolean; primary?: boolean }) {
  const wordmark = primary ? <h1>{PRODUCT_NAME}</h1> : <strong>{PRODUCT_NAME}</strong>;
  return (
    <div
      className={`brand ${compact ? 'brand--compact' : ''}`}
      data-testid="brand"
      aria-label={PRODUCT_NAME}
    >
      {wordmark}
    </div>
  );
}

function ModeGlyph({ mode }: { mode: GameMode }) {
  const cell = { width: 8, height: 8, rx: 1 };
  if (mode === 'marathon') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="4" y="16" {...cell} /><rect x="12" y="16" {...cell} /><rect x="20" y="16" {...cell} /><rect x="28" y="16" {...cell} /></svg>;
  }
  if (mode === 'race') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="12" y="12" {...cell} /><rect x="20" y="12" {...cell} /><rect x="12" y="20" {...cell} /><rect x="20" y="20" {...cell} /></svg>;
  }
  if (mode === 'sprint') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="12" y="8" {...cell} /><rect x="12" y="16" {...cell} /><rect x="12" y="24" {...cell} /><rect x="20" y="24" {...cell} /></svg>;
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="16" y="8" {...cell} />
      <rect x="8" y="16" {...cell} />
      <rect x="16" y="16" {...cell} />
      <rect x="24" y="16" {...cell} />
    </svg>
  );
}

export function ModeHome({ onEnter }: { onEnter: (mode: GameMode) => void }) {
  const [previewMode, setPreviewMode] = useState<GameMode>('marathon');
  return (
    <main id="game" className="landing-shell landing-shell--workbench" data-testid="mode-home">
      <header className="landing-header">
        <Brand primary />
      </header>
      <section className="landing-stage landing-stage--workbench" aria-labelledby="home-title">
        <section className="mode-chooser mode-chooser--workbench">
          <div className="landing-intro">
            <h2 id="home-title">选择模式</h2>
          </div>
          <div
            className="mode-gates mode-gates--workbench"
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

export function puzzleSilhouettePaths(id: PuzzleId): ReadonlyMap<PieceType, string> {
  const board = createInitialState(APP_SEED, 'puzzle', id).board.slice(-12);
  const unit = 4;
  const face = 3.8;
  const paths = new Map<PieceType, string>();
  for (const type of PIECE_TYPES) {
    const path = board.flatMap((row, y) => row.map((cell, x) => (
      cell === type ? `M${x * unit + .1} ${y * unit + .1}h${face}v${face}h-${face}z` : ''
    ))).join('');
    if (path) paths.set(type, path);
  }
  return paths;
}

/** One canonical preview keeps immutable anchors legible without adding list thumbnails. */
export function puzzleAnchorSilhouettePath(id: PuzzleId): string {
  const board = createInitialState(APP_SEED, 'puzzle', id).board.slice(-12);
  const unit = 4;
  const face = 3.8;
  return board.flatMap((row, y) => row.map((cell, x) => (
    cell === ANCHOR_CELL ? `M${x * unit + .1} ${y * unit + .1}h${face}v${face}h-${face}z` : ''
  ))).join('');
}

function PuzzleSilhouette({ id, name }: { id: PuzzleId; name: string }) {
  const anchorPath = puzzleAnchorSilhouettePath(id);
  return (
    <svg
      className="puzzle-silhouette"
      viewBox="0 0 40 48"
      role="img"
      aria-label={`${name}棋盘轮廓`}
    >
      {[...puzzleSilhouettePaths(id)].map(([type, path]) => {
        const material = PIECE_MATERIALS[type];
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
      {anchorPath && (
        <path
          className="puzzle-silhouette__anchor"
          data-piece-type="anchor"
          d={anchorPath}
          fill={cssHex(ANCHOR_MATERIAL.fillStart)}
          stroke={cssHex(ANCHOR_MATERIAL.edge)}
        />
      )}
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
  const selectedDefinition = getPuzzleDefinition(selected.id);
  const selectedComplete = progress.completedLevelIds.includes(selected.id);
  const selectedAnchorCount = selectedDefinition.anchorCells.length;
  const selectedRows = selectedDefinition.boardRows.filter((row) => row !== '..........').length;
  const selectedBest = puzzleBestPieceCount(progress, selected.id);
  return (
    <main id="game" className="library-shell library-shell--console" data-testid="puzzle-library">
      <header className="library-header console-header">
        <button className="library-back" type="button" aria-label="返回模式首页" onClick={onBack}>
          <b aria-hidden="true">←</b><span>返回模式</span>
        </button>
        <Brand compact />
      </header>
      <section className="console-workbench" aria-labelledby="library-title">
        <aside className="console-focus" aria-live="polite" aria-label={`已选残局：${selected.name}`}>
          <div className="console-focus__well" key={selected.id}>
            <div className="console-focus__board">
              <PuzzleSilhouette id={selected.id} name={selected.name} />
            </div>
          </div>
          <section className="console-focus__copy">
            <div className="console-focus__heading">
              <span>{selectedRows} 行残局</span>
              <h2>{selected.name}</h2>
              {selectedComplete && <i aria-label="已完成">✓</i>}
            </div>
            <div className="console-focus__facts" aria-label="残局特性">
              {selectedAnchorCount > 0 && <span>固定锚点</span>}
              {selectedBest !== null && <span data-testid="selected-puzzle-best">最少 {selectedBest} 步</span>}
            </div>
            <button className="primary-action console-focus__start" type="button" data-testid="start-selected-puzzle" aria-label={`开始 ${selected.name}`} onClick={onStart}>开始</button>
          </section>
        </aside>
        <nav className="console-route" aria-label={`${CAMPAIGN_LEVELS.length} 个开放解谜残局`} data-testid="level-list">
          <div className="console-route__heading">
            <h1 id="library-title">解谜</h1>
          </div>
          <ol className="console-bands" aria-label="残局行数分段">
            {PUZZLE_ROW_BANDS.map((band, bandIndex) => {
              const rows = bandIndex + 5;
                const activeBand = band.some((level) => level.id === selected.id);
                return (
                  <li className={`console-band ${activeBand ? 'console-band--active' : ''}`} data-rows={rows} aria-label={`${rows} 行残局`} key={band[0]!.id}>
                  <span className="console-band__label" aria-hidden="true"><small>{rows} 行</small></span>
                  <ol className="console-nodes">
                    {band.map((level) => {
                      const complete = progress.completedLevelIds.includes(level.id);
                      const hasAnchor = getPuzzleDefinition(level.id).anchorCells.length > 0;
                      const selectedLevel = selectedId === level.id;
                      const bestPieces = puzzleBestPieceCount(progress, level.id);
                      return (
                        <li className={`console-node ${selectedLevel ? 'console-node--selected' : ''} ${complete ? 'console-node--complete' : ''}`} key={level.id}>
                          <button
                            type="button"
                            data-testid="level-row"
                            data-level-id={level.id}
                            data-unlocked="true"
                            data-anchor={hasAnchor || undefined}
                            data-best-pieces={bestPieces ?? undefined}
                            aria-pressed={selectedLevel}
                            aria-label={`${String(level.index).padStart(2, '0')} ${level.name}，${rows} 行残局${hasAnchor ? '，含固定锚点' : ''}${complete ? '，已完成' : '，可进入'}${bestPieces !== null ? `，最少 ${bestPieces} 步` : ''}`}
                            onClick={() => onSelect(level.id)}
                          >
                            <span>{String(level.index).padStart(2, '0')}</span>
                            {bestPieces !== null && <small aria-label={`最少 ${bestPieces} 步`}>{bestPieces}</small>}
                            {complete && <i aria-hidden="true">✓</i>}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </li>
              );
            })}
          </ol>
        </nav>
      </section>
    </main>
  );
}

export function LeaderboardPanel({
  mode,
  records,
  highlightRecord = null,
}: {
  mode: RunMode;
  records: readonly ScoreRecord[];
  highlightRecord?: ScoreRecord | null;
}) {
  const survival = mode === 'race';
  const sprint = mode === 'sprint';
  const highlightKey = highlightRecord ? scoreRecordKey(highlightRecord) : null;
  return (
    <section className="result-leaderboard" aria-label={sprint ? '坍缩排行榜' : survival ? '生存排行榜' : '经典排行榜'}>
      <header>
        <strong>{sprint ? '坍缩排行' : survival ? '生存排行' : '经典排行'}</strong>
        <span>{sprint ? '消行 · 前 10' : survival ? '生存时间' : '消行'}</span>
      </header>
      {records.length === 0 ? <p>暂无记录</p> : (
        <ol>
          {records.map((record, index) => (
            <li key={`${record.completedAt}:${index}`} data-current-record={scoreRecordKey(record) === highlightKey || undefined}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <strong>{sprint ? `${record.lines} 行` : survival ? elapsedTimeLabel(record.elapsedTicks) : `${record.lines} 行`}</strong>
              <small>{sprint ? `${formatScore(record.score)} 分 · 最高 ${record.chain} 连锁` : survival ? `${record.lines} 行 · ${record.pieces} 方块` : `${formatScore(record.score)} 分`}</small>
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

function PuzzleUndoButton({ runtime, disabled = false }: { runtime: GameRuntime | null; disabled?: boolean }) {
  return (
    <button
      className="touch-key touch-key--undo"
      type="button"
      data-testid="touch-undo"
      aria-label="撤回上一次落子（B）"
      aria-keyshortcuts="B"
      disabled={disabled}
      onClick={() => runtime?.undoPuzzle()}
    >
      <b aria-hidden="true">↶</b><small>撤回</small>
    </button>
  );
}

function AudioControls({
  enabled,
  volume,
  onEnabledChange,
  onVolumeChange,
  placement = 'side',
}: {
  enabled: boolean;
  volume: number;
  onEnabledChange: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
  placement?: 'side' | 'topbar';
}) {
  const percent = Math.round(volume * 100);
  return (
    <section className={`audio-controls audio-controls--${placement}`} aria-label="声音控制">
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
    return (
      <section className="run-stats run-stats--puzzle" data-testid="stats" aria-label="解谜模式数据">
        <article data-stat-role="puzzle-level"><span>关卡 {level.index}/{level.total}</span><strong>{level.name}</strong></article>
        <article data-stat-role="puzzle-targets"><span>原有方块（剩余/总数）</span><strong>{state.puzzleTargetCells.length}/{state.puzzleInitialTargetCount}</strong></article>
        <article data-stat-role="puzzle-placed"><span>已落子</span><strong>{state.pieceCount}</strong></article>
        <article data-stat-role="objective">
          <span>通关目标</span><strong>清除全部原有方块</strong>
        </article>
      </section>
    );
  }
  if (state.mode === 'sprint') {
    return (
      <section className="run-stats run-stats--collapse" data-testid="stats" aria-label="坍缩模式数据">
        <article data-stat-role="score"><span>分数</span><strong>{formatScore(state.score)}</strong></article>
        <article data-stat-role="sprint-chain"><span>当前连锁</span><strong>{state.sprintCascadeDepth}</strong></article>
        <article data-stat-role="sprint-best"><span>最高连锁</span><strong>{state.sprintBestCascade}</strong></article>
        <article data-stat-role="lines"><span>消行</span><strong>{state.lines}</strong></article>
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
  if (event.type === 'paused') return '本局已暂停。';
  if (event.type === 'resumed') return '继续本局。';
  if (event.type === 'puzzle-undone') return '已撤回上一次落子。';
  if (event.type === 'finished') return '目标已达成。';
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
  onRunFinished?: (record: ScoreRecord) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const exitWasPlayingRef = useRef(false);
  const restartWasPlayingRef = useRef(false);
  const lastRecordedRunRef = useRef<string | null>(null);
  const [runSeed] = useState(() => mode === 'puzzle' ? APP_SEED : randomRunSeed());
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(runSeed, mode, mode === 'puzzle' ? puzzleId : undefined));
  const [countdownDigit, setCountdownDigit] = useState<EntryCountdownDigit | null>(3);
  const [exitOpen, setExitOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(1);
  const [resultRecord, setResultRecord] = useState<ScoreRecord | null>(null);

  const focusBoard = useCallback(() => {
    browserPlatform.defer(() => {
      browserPlatform.deferFocus(hostRef.current?.querySelector('canvas') ?? null);
    });
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let countdownComplete = false;
    const motionQuery = browserPlatform.mediaQuery('(prefers-reduced-motion: reduce)');
    const nextRuntime = new GameRuntime({
      seed: runSeed,
      mode,
      puzzleId: mode === 'puzzle' ? puzzleId : undefined,
      inputEnabled: false,
      reducedMotion: motionQuery.matches,
      audioEnabled,
      audioVolume,
      onState: (nextState, events) => {
        if (disposed) return;
        setState(nextState);
        if (nextState.status === 'ready') {
          lastRecordedRunRef.current = null;
          setResultRecord(null);
        }
        const recordableRun = (nextState.mode === 'marathon' || nextState.mode === 'race' || nextState.mode === 'sprint')
          && nextState.status === 'game-over';
        if (recordableRun) {
          const runKey = `${nextState.seed}:${nextState.mode}:${nextState.elapsedTicks}:${nextState.pieceCount}:${nextState.score}:${nextState.lines}:${nextState.sprintBestCascade}`;
          if (lastRecordedRunRef.current !== runKey) {
            lastRecordedRunRef.current = runKey;
            const record = scoreRecordForState(nextState, new Date().toISOString());
            if (record) {
              setResultRecord(record);
              onRunFinished?.(record);
            }
          }
        }
        const notable = [...events].reverse().find((event) => (
          event.type === 'lines-cleared'
           || event.type === 'bedrock-raised'
           || event.type === 'bedrock-lowered'
           || event.type === 'paused'
          || event.type === 'resumed'
          || event.type === 'puzzle-undone'
          || event.type === 'finished'
          || event.type === 'game-over'
        ));
        if (notable) setLiveMessage(eventMessage(notable));
        if (nextState.mode === 'puzzle' && nextState.puzzleCompletion === 'finished') {
          onCanonicalCompletion(nextState);
        }
      },
    });
    const removeMotionListener = motionQuery.subscribe((matches) => nextRuntime.setReducedMotion(matches));
    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    const countdownTimers: PlatformTimeout[] = [
      browserPlatform.scheduleTimeout(() => {
        if (!disposed) setCountdownDigit(2);
      }, 1000),
      browserPlatform.scheduleTimeout(() => {
        if (!disposed) setCountdownDigit(1);
      }, 2000),
      browserPlatform.scheduleTimeout(() => {
        if (disposed) return;
        countdownComplete = true;
        nextRuntime.setInputEnabled(true);
        nextRuntime.start();
        setCountdownDigit(null);
        setLiveMessage(`${PRODUCT_NAME} 已开始。`);
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
      for (const timer of countdownTimers) browserPlatform.cancelTimeout(timer);
      removeMotionListener();
      nextRuntime.destroy();
      if (runtimeRef.current === nextRuntime) runtimeRef.current = null;
    };
  }, [focusBoard, mode, onCanonicalCompletion, onRunFinished, puzzleId, runSeed]);

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
      puzzleTargetsRemaining: state.puzzleTargetCells.length,
      puzzleTargetsInitial: state.puzzleInitialTargetCount,
      puzzleUndoDepth: state.mode === 'puzzle' ? state.puzzleUndoHistory.length : 0,
      sprintGoal: state.sprintGoal,
      sprintCascadeDepth: state.sprintCascadeDepth,
      sprintBestCascade: state.sprintBestCascade,
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
      nextPreviews: state.mode === 'puzzle' ? state.queue.slice(0, 2) : state.queue.slice(0, 1),
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
    setRestartConfirmOpen(false);
    restartWasPlayingRef.current = false;
    runtime?.setInputEnabled(true);
    runtime?.restart();
    runtime?.start();
    focusBoard();
  }, [focusBoard, runtime]);

  const requestRestart = useCallback(() => {
    if (!runtime || restartConfirmOpen || runtime.getState().status !== 'playing') return;
    restartWasPlayingRef.current = true;
    runtime.togglePause();
    // The confirmation is a UI transaction: no keyboard control may leak through it.
    runtime.setInputEnabled(false);
    setRestartConfirmOpen(true);
  }, [restartConfirmOpen, runtime]);

  const cancelRestart = useCallback(() => {
    setRestartConfirmOpen(false);
    runtime?.setInputEnabled(true);
    if (restartWasPlayingRef.current && runtime?.getState().status === 'paused') runtime.togglePause();
    restartWasPlayingRef.current = false;
  }, [runtime]);

  const resumeRun = useCallback(() => {
    if (runtime?.getState().status === 'paused') runtime.togglePause();
    focusBoard();
  }, [focusBoard, runtime]);

  useEffect(() => {
    const handleRestartShortcut = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.code !== 'KeyR' || keyboardEvent.repeat || keyboardEvent.isComposing) return;
      if (countdownDigit !== null || state.status !== 'playing' || restartConfirmOpen) return;
      keyboardEvent.preventDefault();
      requestRestart();
    };
    return browserPlatform.listenWindow('keydown', handleRestartShortcut);
  }, [countdownDigit, requestRestart, restartConfirmOpen, state.status]);

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
  const pauseOpen = state.status === 'paused' && !exitOpen && !restartConfirmOpen;
  const resultOpen = terminal !== null && !exitOpen && !restartConfirmOpen;
  const storedRecords = state.mode === 'puzzle' ? [] : recordsForMode(leaderboard, state.mode);
  const leaderboardRecords = resultRecord && scoreRecordRank(storedRecords, resultRecord) === null
    ? recordsForMode(insertScoreRecord(leaderboard, resultRecord), resultRecord.mode)
    : storedRecords;
  const resultRank = state.mode === 'puzzle' ? null : scoreRecordRank(leaderboardRecords, resultRecord);
  const puzzleDoublePreview = state.mode === 'puzzle';

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
        <div className="topbar-actions">
          <AudioControls
            enabled={audioEnabled}
            volume={audioVolume}
            onEnabledChange={setAudioEnabled}
            onVolumeChange={setAudioVolume}
            placement="topbar"
          />
          <button
            className="topbar-action topbar-action--restart"
            type="button"
            data-testid="restart-game"
            aria-label="重新开始（R）"
            disabled={countdownDigit !== null}
            onClick={requestRestart}
          ><span className="restart-label--long">重新开始</span><span className="restart-label--short">重开</span></button>
          <button
            className="topbar-action"
            type="button"
            data-testid="pause-game"
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true });
              runtime?.togglePause();
            }}
            aria-label={state.status === 'paused' ? '继续游戏（P）' : '暂停（P）'}
            disabled={countdownDigit !== null || (state.status !== 'playing' && state.status !== 'paused')}
          >{state.status === 'paused' ? '继续' : '暂停'}</button>
        </div>
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
          <aside className={`game-side-panel game-side-panel--${state.mode}`} data-testid="side-rail">
            <div className="info-rail" data-testid="context-top">
              <RunStats state={state} />
            </div>
            <div className={`preview-rail ${puzzleDoublePreview ? 'preview-rail--puzzle' : ''}`}>
              <p className="rail-label">{puzzleDoublePreview ? 'Next · 2' : 'Next'}</p>
              <div
                className="next-slot"
                data-testid="next-slot"
                data-preview-count={puzzleDoublePreview ? 2 : 1}
                aria-label={puzzleDoublePreview ? '后续两个方块，按顺序显示' : '下一个方块'}
              />
            </div>
            <p className="keyboard-map"><b>键盘</b><span>← → 移动</span><span>↑ 旋转</span><span>↓ 快速下落</span><span>空格 直接落底</span><span>P 暂停 / 继续</span><span>R 重开确认</span>{state.mode === 'puzzle' && <span>B 撤回</span>}</p>
          </aside>
        </section>

        <section className={`touch-deck ${state.mode === 'puzzle' ? 'touch-deck--puzzle' : ''}`} data-testid="touch-rail" aria-label={state.mode === 'puzzle' ? '解谜触控操作' : '触控操作'}>
          <TouchButton action="left" label="左移" glyph="←" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="right" label="右移" glyph="→" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="rotate-cw" label="旋转" glyph="↻" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="soft-drop" label="快速下落" glyph="↓" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="hard-drop" label="直接落底" glyph="⇣" runtime={runtime} disabled={countdownDigit !== null} />
          {state.mode === 'puzzle' && <PuzzleUndoButton runtime={runtime} disabled={countdownDigit !== null || state.status === 'finished'} />}
        </section>
      </section>

      <ActionSheet
        open={pauseOpen}
        title="已暂停"
        description=""
        onCancel={resumeRun}
        onConfirm={resumeRun}
      >
        <button className="primary-action" data-autofocus type="button" onClick={resumeRun}>继续游戏</button>
      </ActionSheet>

      <ActionSheet
        open={restartConfirmOpen}
        title="重新开始？"
        description=""
        tone="danger"
        onCancel={cancelRestart}
        onConfirm={restartRun}
      >
        <button className="primary-action" data-autofocus data-testid="confirm-restart" type="button" onClick={restartRun}>确认</button>
        <button className="secondary-action" type="button" onClick={cancelRestart}>取消</button>
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
        {state.mode !== 'puzzle' && <>
          <LeaderboardPanel mode={state.mode} records={leaderboardRecords} highlightRecord={resultRank !== null ? resultRecord : null} />
          {resultRecord && resultRank === null && <p className="result-rank-notice" data-testid="result-rank-notice">本局未进入排行榜</p>}
        </>}
        <button className="primary-action" data-autofocus type="button" onClick={restartRun}>{state.mode === 'puzzle' ? '重来' : '再来一局'}</button>
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
        browserPlatform.writeStorage(PUZZLE_PROGRESS_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const recordRun = useCallback((record: ScoreRecord) => {
    setLeaderboard((current) => {
      const updated = insertScoreRecord(current, record);
      browserPlatform.writeStorage(LEADERBOARD_KEY, JSON.stringify(updated));
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
