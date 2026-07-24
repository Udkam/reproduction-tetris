import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ANCHOR_CELL,
  PIECE_TYPES,
  TICKS_PER_SECOND,
  type GameEvent,
  type GameMode,
  type GameState,
  type MutationItem,
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
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  appCopy,
  formatDate,
  formatNumber,
  initialLanguage,
  itemLabel,
  modeCopy,
  modeRules,
  parseLanguage,
  puzzleDisplayName,
  type AppLanguage,
} from './ui/localization';
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
const PRODUCT_NAME = 'TetraMorph';
const MODE_RULE_INTROS_KEY = 'tetris:mode-rule-intros:v1';

const MODE_ORDER: readonly GameMode[] = ['marathon', 'race', 'sprint', 'puzzle'];

export function cloneQaState(state: GameState): GameState {
  return structuredClone(state);
}

function readModeRuleIntros(): readonly GameMode[] {
  try {
    const raw = browserPlatform.readStorage(MODE_RULE_INTROS_KEY);
    if (raw === null) return Object.freeze([]);
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Object.freeze([]);
    return Object.freeze(parsed.filter((value): value is GameMode => MODE_ORDER.includes(value as GameMode)));
  } catch {
    return Object.freeze([]);
  }
}

function readLanguage(): AppLanguage {
  try {
    const saved = parseLanguage(browserPlatform.readStorage(LANGUAGE_STORAGE_KEY));
    if (saved !== null) return saved;
    return initialLanguage(browserPlatform.windowTarget()?.navigator.language);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function writeLanguage(language: AppLanguage): void {
  try {
    browserPlatform.writeStorage(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage is optional: the active session still switches language immediately.
  }
}

function writeModeRuleIntros(modes: readonly GameMode[]): void {
  try {
    browserPlatform.writeStorage(MODE_RULE_INTROS_KEY, JSON.stringify([...new Set(modes)]));
  } catch {
    // Storage is optional. A blocked browser simply shows the short rule sheet again.
  }
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
      if (legacy !== null) {
        const migrated = migrateLegacyLeaderboard(legacy);
        browserPlatform.writeStorage(LEADERBOARD_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {
    return emptyLeaderboard();
  }
  return emptyLeaderboard();
}

function formatScore(value: number, language: AppLanguage = DEFAULT_LANGUAGE): string {
  return formatNumber(value, language);
}

export function elapsedTimeLabel(elapsedTicks: number, language: AppLanguage = DEFAULT_LANGUAGE): string {
  const seconds = Math.floor(Math.max(0, elapsedTicks) / TICKS_PER_SECOND);
  return appCopy(language).phrasing.elapsed(Math.floor(seconds / 60), seconds % 60);
}

export function countdownTimeLabel(remainingTicks: number): string {
  const seconds = Math.ceil(Math.max(0, remainingTicks) / TICKS_PER_SECOND);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function fallCadenceLabel(state: GameState, language: AppLanguage = DEFAULT_LANGUAGE): string {
  const ticks = gravityForMode(state.mode, state.level, state.pieceCount, state.lines);
  const seconds = ticks / TICKS_PER_SECOND;
  return appCopy(language).phrasing.cadence(seconds.toFixed(seconds < 0.1 ? 2 : 1).replace(/\.0$/, ''));
}

export function survivalCountdownSeconds(state: GameState): number {
  if (state.mode !== 'race' || state.survivalRisePending) return 0;
  return Math.max(0, Math.ceil((survivalIntervalTicks(state.lines) - state.survivalPressureTicks) / TICKS_PER_SECOND));
}

export function survivalCountdownLabel(state: GameState, language: AppLanguage = DEFAULT_LANGUAGE): string {
  const copy = appCopy(language);
  return state.survivalRisePending ? copy.labels.pendingRise : copy.phrasing.seconds(survivalCountdownSeconds(state));
}

function campaignLevel(id: PuzzleId | null) {
  return CAMPAIGN_LEVELS.find((level) => level.id === id) ?? CAMPAIGN_LEVELS[0]!;
}

export function terminalCopy(state: GameState, language: AppLanguage = DEFAULT_LANGUAGE): { title: string; detail: string; success: boolean } | null {
  const copy = appCopy(language);
  if (state.mode === 'puzzle') {
    if (state.puzzleCompletion === 'finished') {
      return { ...copy.phrasing.terminalPuzzleSuccess(state.pieceCount, state.lines), success: true };
    }
    if (state.puzzleCompletion && state.puzzleCompletion !== 'active') {
      const remaining = state.puzzleTargetCells.length;
      return { ...copy.phrasing.terminalPuzzleFailure(remaining, state.pieceCount), success: false };
    }
    return null;
  }
  if (state.mode === 'sprint') {
    if (state.status === 'game-over') {
      return {
        ...copy.phrasing.terminalMutation(state.lines, formatScore(state.score, language)),
        success: false,
      };
    }
    return null;
  }
  if (state.status !== 'game-over') return null;
  if (state.mode === 'race') {
    return {
      ...copy.phrasing.terminalSurvival(state.lines, state.pieceCount, state.survivalBedrockRows),
      success: false,
    };
  }
  return { ...copy.phrasing.terminalClassic(state.lines, formatScore(state.score, language)), success: false };
}

export function scoreRecordForState(state: GameState, completedAt: string): ScoreRecord | null {
  const isTopOutRun = (state.mode === 'marathon' || state.mode === 'race' || state.mode === 'sprint') && state.status === 'game-over';
  if (!isTopOutRun) return null;
  const mode: RunMode = state.mode === 'sprint' ? 'sprint' : state.mode === 'race' ? 'race' : 'marathon';
  return {
    version: 7,
    score: state.score,
    lines: state.lines,
    pieces: state.pieceCount,
    elapsedTicks: state.elapsedTicks,
    chain: 0,
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

function Brand({ compact = false }: { compact?: boolean }) {
  const wordmark = <strong>{PRODUCT_NAME}</strong>;
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
  const cell = { width: 9, height: 9, rx: 1.15 };
  if (mode === 'marathon') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="1.5" y="15.5" {...cell} /><rect x="11.3" y="15.5" {...cell} /><rect x="21.1" y="15.5" {...cell} /><rect x="30.9" y="15.5" {...cell} /></svg>;
  }
  if (mode === 'race') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="10.7" y="10.7" {...cell} /><rect x="20.3" y="10.7" {...cell} /><rect x="10.7" y="20.3" {...cell} /><rect x="20.3" y="20.3" {...cell} /></svg>;
  }
  if (mode === 'sprint') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="10.7" y="5.9" {...cell} /><rect x="10.7" y="15.5" {...cell} /><rect x="10.7" y="25.1" {...cell} /><rect x="20.3" y="25.1" {...cell} /></svg>;
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="15.5" y="5.9" {...cell} />
      <rect x="5.9" y="15.5" {...cell} />
      <rect x="15.5" y="15.5" {...cell} />
      <rect x="25.1" y="15.5" {...cell} />
    </svg>
  );
}

function ModeRuleSummary({ mode, language, testId }: { mode: GameMode; language: AppLanguage; testId?: string }) {
  const copy = appCopy(language);
  const modeLabel = modeCopy(language, mode).label;
  return (
    <section className="mode-rule-summary" data-testid={testId} aria-label={`${modeLabel} ${copy.labels.rules}`}>
      <strong>{copy.labels.rules}</strong>
      <ul>
        {modeRules(language, mode).map((rule) => <li key={rule}>{rule}</li>)}
      </ul>
    </section>
  );
}

export function ModeHome({ onEnter, language = DEFAULT_LANGUAGE }: { onEnter: (mode: GameMode) => void; language?: AppLanguage }) {
  const [previewMode, setPreviewMode] = useState<GameMode>('marathon');
  const copy = appCopy(language);
  return (
    <main id="game" lang={language} className="landing-shell landing-shell--workbench landing-shell--wordmark" data-testid="mode-home">
      <section className="landing-stage landing-stage--workbench" aria-labelledby="home-title">
        <section className="mode-chooser mode-chooser--workbench">
          <div className="landing-intro">
            <h1 id="home-title" className="mode-home-wordmark"><span>Tetra</span><span>Morph</span></h1>
          </div>
          <div
            className="mode-gates mode-gates--workbench"
            data-selection={previewMode}
            aria-label={copy.labels.selectMode}
            data-testid="mode-list"
          >
            {MODE_ORDER.map((mode) => {
              const item = modeCopy(language, mode);
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

function PuzzleSilhouette({ id, label }: { id: PuzzleId; label: string }) {
  const anchorPath = puzzleAnchorSilhouettePath(id);
  return (
    <svg
      className="puzzle-silhouette"
      viewBox="0 0 40 48"
      role="img"
      aria-label={label}
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
  language = DEFAULT_LANGUAGE,
}: {
  progress: PuzzleProgress;
  selectedId: PuzzleId;
  onSelect: (id: PuzzleId) => void;
  onStart: () => void;
  onBack: () => void;
  language?: AppLanguage;
}) {
  const selected = campaignLevel(selectedId);
  const selectedName = puzzleDisplayName(language, selected.id, selected.name);
  const copy = appCopy(language);
  const selectedComplete = progress.completedLevelIds.includes(selected.id);
  const selectedBest = puzzleBestPieceCount(progress, selected.id);
  return (
    <main id="game" lang={language} className="library-shell library-shell--console" data-testid="puzzle-library">
      <header className="library-header console-header">
        <button className="library-back" type="button" aria-label={copy.labels.leaveRun} onClick={onBack}>
          <b aria-hidden="true">←</b><span>{copy.labels.modeHome}</span>
        </button>
        <Brand compact />
      </header>
      <section className="console-workbench" aria-labelledby="library-title">
        <aside className="console-focus" aria-live="polite" aria-label={copy.phrasing.selectedPuzzle(selectedName)}>
          <div className="console-focus__well" key={selected.id}>
            <div className="console-focus__board">
              <PuzzleSilhouette id={selected.id} label={copy.phrasing.puzzleBoard(selectedName)} />
            </div>
          </div>
          <section className="console-focus__copy">
            <div className="console-focus__heading">
              <h2 className={`console-focus__title${selectedComplete ? ' console-focus__title--complete' : ''}`}>{selectedName}</h2>
              {selectedBest !== null && <span className="console-focus__best" data-testid="selected-puzzle-start-best">{copy.phrasing.currentBest(selectedBest)}</span>}
            </div>
            <div className="console-focus__action">
              <button className="primary-action console-focus__start" type="button" data-testid="start-selected-puzzle" aria-label={copy.phrasing.startPuzzle(selectedName)} onClick={onStart}>{copy.labels.start}</button>
            </div>
          </section>
        </aside>
        <nav className="console-route" aria-label={copy.phrasing.puzzleList(CAMPAIGN_LEVELS.length)} data-testid="level-list">
          <div className="console-route__heading">
            <h1 id="library-title">{copy.labels.puzzle}</h1>
          </div>
          <ol className="console-bands" aria-label={copy.labels.puzzleBands}>
            {PUZZLE_ROW_BANDS.map((band, bandIndex) => {
              const rows = bandIndex + 5;
                const activeBand = band.some((level) => level.id === selected.id);
                return (
                  <li className={`console-band ${activeBand ? 'console-band--active' : ''}`} data-rows={rows} aria-label={copy.phrasing.rowBand(rows)} key={band[0]!.id}>
                  <span className="console-band__label" aria-hidden="true"><small>{copy.phrasing.rowBand(rows)}</small></span>
                  <ol className="console-nodes">
                    {band.map((level) => {
                      const complete = progress.completedLevelIds.includes(level.id);
                      const hasAnchor = getPuzzleDefinition(level.id).anchorCells.length > 0;
                      const selectedLevel = selectedId === level.id;
                      const bestPieces = puzzleBestPieceCount(progress, level.id);
                      const levelName = puzzleDisplayName(language, level.id, level.name);
                      return (
                        <li className={`console-node ${selectedLevel ? 'console-node--selected' : ''}`} key={level.id}>
                          <button
                            type="button"
                            data-testid="level-row"
                            data-level-id={level.id}
                            data-unlocked="true"
                            data-anchor={hasAnchor || undefined}
                            data-best-pieces={bestPieces ?? undefined}
                            aria-pressed={selectedLevel}
                            aria-label={copy.phrasing.levelNode(String(level.index).padStart(2, '0'), levelName, rows, complete, bestPieces)}
                            onClick={() => onSelect(level.id)}
                          >
                            <span>{String(level.index).padStart(2, '0')}</span>
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
  variant = 'result',
  language = DEFAULT_LANGUAGE,
}: {
  mode: RunMode;
  records: readonly ScoreRecord[];
  highlightRecord?: ScoreRecord | null;
  variant?: 'result' | 'settings';
  language?: AppLanguage;
}) {
  const copy = appCopy(language);
  const survival = mode === 'race';
  const sprint = mode === 'sprint';
  const highlightKey = highlightRecord ? scoreRecordKey(highlightRecord) : null;
  const title = variant === 'settings'
    ? copy.labels.leaderboard
    : copy.phrasing.modeLeaderboard(modeCopy(language, mode).label);
  return (
    <section className={`result-leaderboard result-leaderboard--${variant}`} data-testid={variant === 'settings' ? 'settings-leaderboard' : undefined} aria-label={title}>
      <header>
        <strong>{title}</strong>
        <span>{copy.phrasing.leaderboardCriterion(survival)}</span>
      </header>
      {records.length === 0 ? <p>{copy.labels.noRecords}</p> : (
        <ol>
          {records.map((record, index) => (
            <li key={`${record.completedAt}:${index}`} data-current-record={scoreRecordKey(record) === highlightKey || undefined}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <strong>{sprint ? copy.phrasing.lineCount(record.lines) : survival ? elapsedTimeLabel(record.elapsedTicks, language) : copy.phrasing.lineCount(record.lines)}</strong>
              <small>{copy.phrasing.leaderboardDetail(formatScore(record.score, language), record.pieces, record.lines, survival, sprint, formatDate(record.completedAt, language))}</small>
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

function PuzzleUndoButton({ onRequestUndo, language, disabled = false }: { onRequestUndo: () => void; language: AppLanguage; disabled?: boolean }) {
  const copy = appCopy(language);
  return (
    <button
      className="touch-key touch-key--undo"
      type="button"
      data-testid="touch-undo"
      aria-label={`${copy.labels.undo} (Z)`}
      aria-keyshortcuts="Z"
      disabled={disabled}
      onClick={onRequestUndo}
    >
      <b aria-hidden="true">↶</b><small>{copy.labels.undo}</small>
    </button>
  );
}

function AudioControls({
  enabled,
  musicEnabled,
  volume,
  onEnabledChange,
  onMusicEnabledChange,
  onVolumeChange,
  language,
}: {
  enabled: boolean;
  musicEnabled: boolean;
  volume: number;
  onEnabledChange: (enabled: boolean) => void;
  onMusicEnabledChange: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
  language: AppLanguage;
}) {
  const copy = appCopy(language);
  const percent = Math.round(volume * 100);
  return (
    <section className="audio-controls" aria-label={copy.labels.soundControls}>
      <div className="audio-controls__switches">
        <button
          className="audio-toggle"
          type="button"
          data-testid="audio-toggle"
          data-arrow-nav
          aria-label={enabled ? copy.labels.turnSoundOff : copy.labels.turnSoundOn}
          aria-pressed={enabled}
          onClick={() => onEnabledChange(!enabled)}
        >{enabled ? copy.labels.soundOn : copy.labels.soundOff}</button>
        <button
          className="audio-toggle"
          type="button"
          data-testid="music-toggle"
          data-arrow-nav
          aria-label={musicEnabled ? copy.labels.turnMusicOff : copy.labels.turnMusicOn}
          aria-pressed={musicEnabled}
          onClick={() => onMusicEnabledChange(!musicEnabled)}
        >{musicEnabled ? copy.labels.musicOn : copy.labels.musicOff}</button>
      </div>
      <label className="audio-volume">
        <span>{copy.labels.volume}</span>
        <input
          type="range"
          data-testid="audio-volume"
          min="0"
          max="100"
          step="1"
          value={percent}
          aria-label={copy.labels.volume}
          onChange={(event) => onVolumeChange(Number(event.currentTarget.value) / 100)}
        />
        <output>{percent}%</output>
      </label>
    </section>
  );
}

export function SettingsRecord({
  mode,
  puzzleId,
  leaderboard,
  progress,
  language = DEFAULT_LANGUAGE,
}: {
  mode: GameMode;
  puzzleId: PuzzleId;
  leaderboard: Leaderboard;
  progress: PuzzleProgress;
  language?: AppLanguage;
}) {
  const copy = appCopy(language);
  if (mode === 'puzzle') {
    const bestPieces = puzzleBestPieceCount(progress, puzzleId);
    return (
      <section className="settings-record settings-record--puzzle" data-testid="settings-record" aria-label={copy.labels.currentRecord}>
        <span>{copy.labels.currentRecord}</span>
        <strong>{bestPieces === null ? copy.labels.notCompleted : copy.phrasing.minimumMoves(bestPieces)}</strong>
      </section>
    );
  }

  return <LeaderboardPanel mode={mode} records={recordsForMode(leaderboard, mode)} variant="settings" language={language} />;
}

function LanguageControl({ language, onChange }: { language: AppLanguage; onChange: (language: AppLanguage) => void }) {
  const copy = appCopy(language);
  return (
    <section className="language-control" aria-label={copy.labels.language}>
      <span>{copy.labels.language}</span>
      <div role="group" aria-label={copy.labels.language}>
        <button type="button" data-testid="language-zh" data-arrow-nav aria-pressed={language === 'zh-CN'} onClick={() => onChange('zh-CN')}>{copy.labels.chinese}</button>
        <button type="button" data-testid="language-en" data-arrow-nav aria-pressed={language === 'en'} onClick={() => onChange('en')}>{copy.labels.english}</button>
      </div>
    </section>
  );
}

function SettingsShortcutGuide({ mode, language }: { mode: GameMode; language: AppLanguage }) {
  const copy = appCopy(language);
  return (
    <section className="settings-shortcuts" data-testid="settings-shortcuts" aria-label={copy.labels.keyboard}>
      <strong>{copy.labels.keyboard}</strong>
      <span><kbd>S</kbd> {copy.labels.settingsShortcut}</span>
      <span><kbd>P</kbd> {copy.labels.pauseResume}</span>
      <span><kbd>R</kbd> {copy.labels.restartConfirm}</span>
      <span><kbd>Esc</kbd> {copy.labels.back}</span>
      <span><kbd>← →</kbd> {copy.labels.select}</span>
      <span><kbd>↑ ↓</kbd> {copy.labels.switch}</span>
      <span><kbd>Enter</kbd> {copy.labels.activate}</span>
      <span><kbd>← →</kbd> {copy.labels.move}</span>
      <span><kbd>↑</kbd> {copy.labels.rotate}</span>
      <span><kbd>↓</kbd> {copy.labels.softDrop}</span>
      <span><kbd>Space</kbd> {copy.labels.hardDrop}</span>
      {mode === 'puzzle' && <span><kbd>Z</kbd> {copy.labels.undo}</span>}
    </section>
  );
}

export function RunStats({ state, language = DEFAULT_LANGUAGE }: { state: GameState; language?: AppLanguage }) {
  const copy = appCopy(language);
  const modeLabel = modeCopy(language, state.mode).label;
  if (state.mode === 'race') {
    const nextSeconds = survivalCountdownSeconds(state);
    return (
      <section className="run-stats" data-testid="stats" aria-label={`${modeLabel}${language === 'en' ? ' ' : ''}${copy.labels.modeData}`}>
        <article data-stat-role="score"><span>{copy.labels.score}</span><strong>{formatScore(state.score, language)}</strong></article>
        <article data-stat-role="lines"><span>{copy.labels.lines}</span><strong>{state.lines}</strong></article>
        <article data-stat-role="survival-bedrock"><span>{copy.labels.bedrock}</span><strong>{state.survivalBedrockRows}</strong></article>
        <article data-stat-role="survival-next" data-urgent={state.survivalRisePending || nextSeconds <= 5 || undefined}>
          <span>{copy.labels.nextRise}</span><strong>{survivalCountdownLabel(state, language)}</strong>
        </article>
      </section>
    );
  }
  if (state.mode === 'puzzle') {
    return (
      <section className="run-stats run-stats--puzzle" data-testid="stats" aria-label={`${modeLabel}${language === 'en' ? ' ' : ''}${copy.labels.modeData}`}>
        <article data-stat-role="puzzle-targets"><span>{copy.labels.originalBlocks}</span><strong>{state.puzzleTargetCells.length}/{state.puzzleInitialTargetCount}</strong></article>
        <article data-stat-role="puzzle-placed"><span>{copy.labels.placed}</span><strong>{state.pieceCount}</strong></article>
        <article data-stat-role="objective">
          <span>{copy.labels.goal}</span><strong>{copy.labels.clearOriginalBlocks}</strong>
        </article>
      </section>
    );
  }
  if (state.mode === 'sprint') {
    return (
      <section className="run-stats run-stats--mutation" data-testid="stats" aria-label={`${modeLabel}${language === 'en' ? ' ' : ''}${copy.labels.modeData}`}>
        <article data-stat-role="score"><span>{copy.labels.score}</span><strong>{formatScore(state.score, language)}</strong></article>
        <article data-stat-role="lines"><span>{copy.labels.lines}</span><strong>{state.lines}</strong></article>
        <article data-stat-role="mutation-speed"><span>{copy.labels.fall}</span><strong>{fallCadenceLabel(state, language)}</strong></article>
        <article data-stat-role="mutation-carriers"><span>{copy.labels.core}</span><strong>{state.mutationCarriers.length + (state.mutationActiveCarrier ? 1 : 0)}</strong></article>
      </section>
    );
  }
  return (
    <section className="run-stats" data-testid="stats" aria-label={`${modeLabel}${language === 'en' ? ' ' : ''}${copy.labels.modeData}`}>
      <article data-stat-role="score"><span>{copy.labels.score}</span><strong>{formatScore(state.score, language)}</strong></article>
      <article data-stat-role="lines"><span>{copy.labels.lines}</span><strong>{state.lines}</strong></article>
      <article data-stat-role="classic-combo"><span>{copy.labels.combo}</span><strong>{state.combo}</strong></article>
      <article data-stat-role="fall-cadence"><span>{copy.labels.fall}</span><strong>{fallCadenceLabel(state, language)}</strong></article>
    </section>
  );
}

function mutationEffectLabel(item: MutationItem, ticks: number, language: AppLanguage): string {
  return appCopy(language).phrasing.mutationTimer(itemLabel(language, item), Math.ceil(ticks / TICKS_PER_SECOND));
}

export function MutationStatus({ state, language = DEFAULT_LANGUAGE }: { state: GameState; language?: AppLanguage }) {
  if (state.mode !== 'sprint') return null;
  const copy = appCopy(language);
  const candidates: Array<{ item: MutationItem; ticks: number }> = [
    { item: 'freeze', ticks: state.mutationFreezeTicks },
    { item: 'collapse', ticks: state.mutationCollapseTicks },
    { item: 'multiplier', ticks: state.mutationMultiplierTicks },
  ];
  const active = candidates.filter((effect) => effect.ticks > 0);
  const showInstant = active.length === 0 && state.mutationLastItem === 'bomb' && state.mutationLastItemTicks > 0;
  return (
    <section className="mutation-status" data-testid="mutation-status" aria-label={copy.labels.mutationStatus}>
      <strong>{copy.labels.mutationStatus}</strong>
      <div>
        {state.mutationActiveCarrier && <span data-mutation-state="carrier">{copy.labels.carrierCore}: {itemLabel(language, state.mutationActiveCarrier.item)}</span>}
        {active.map((effect) => <span key={effect.item} data-mutation-state={effect.item}>{mutationEffectLabel(effect.item, effect.ticks, language)}</span>)}
        {showInstant && <span data-mutation-state="bomb">{copy.labels.bombResolved}</span>}
        {!state.mutationActiveCarrier && active.length === 0 && !showInstant && <span data-mutation-state="idle">{copy.labels.waitingForCore}</span>}
      </div>
    </section>
  );
}

export function eventMessage(event: GameEvent, language: AppLanguage = DEFAULT_LANGUAGE): string {
  const copy = appCopy(language);
  if (event.type === 'lines-cleared') return copy.phrasing.eventLinesCleared(event.count);
  if (event.type === 'bedrock-raised') return copy.phrasing.eventBedrockRaised(event.height);
  if (event.type === 'bedrock-lowered') return copy.phrasing.eventBedrockLowered(event.height);
  if (event.type === 'paused') return copy.labels.pausedMessage;
  if (event.type === 'resumed') return copy.labels.resumedMessage;
  if (event.type === 'puzzle-undone') return copy.labels.undoMessage;
  if (event.type === 'mutation-activated') {
    if (event.item === 'bomb') return copy.labels.bombResolved;
    return copy.phrasing.eventItemTriggered(itemLabel(language, event.item));
  }
  if (event.type === 'finished') return copy.labels.targetReached;
  if (event.type === 'game-over') return copy.labels.runEnded;
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
  puzzleProgress = defaultPuzzleProgress(),
  onRunFinished,
  language = DEFAULT_LANGUAGE,
  onLanguageChange,
}: {
  mode: GameMode;
  puzzleId: PuzzleId;
  onExit: (destination: ExitDestination) => void;
  onCanonicalCompletion: (state: GameState) => void;
  leaderboard?: Leaderboard;
  puzzleProgress?: PuzzleProgress;
  onRunFinished?: (record: ScoreRecord) => void;
  language?: AppLanguage;
  onLanguageChange?: (language: AppLanguage) => void;
}) {
  const copy = appCopy(language);
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const exitWasPlayingRef = useRef(false);
  const restartWasPlayingRef = useRef(false);
  const settingsWasPlayingRef = useRef(false);
  const languageRef = useRef(language);
  const lastRecordedRunRef = useRef<string | null>(null);
  const [runSeed] = useState(() => mode === 'puzzle' ? APP_SEED : randomRunSeed());
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(runSeed, mode, mode === 'puzzle' ? puzzleId : undefined));
  const [countdownDigit, setCountdownDigit] = useState<EntryCountdownDigit | null>(3);
  const [exitOpen, setExitOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(1);
  const [resultRecord, setResultRecord] = useState<ScoreRecord | null>(null);

  const changeAudioEnabled = useCallback((enabled: boolean) => {
    runtime?.setAudioEnabled(enabled);
    setAudioEnabled(enabled);
  }, [runtime]);

  const changeMusicEnabled = useCallback((enabled: boolean) => {
    runtime?.setMusicEnabled(enabled);
    setMusicEnabled(enabled);
  }, [runtime]);

  const changeAudioVolume = useCallback((volume: number) => {
    runtime?.setAudioVolume(volume);
    setAudioVolume(volume);
  }, [runtime]);

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
      musicEnabled,
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
          const runKey = `${nextState.seed}:${nextState.mode}:${nextState.elapsedTicks}:${nextState.pieceCount}:${nextState.score}:${nextState.lines}`;
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
          || event.type === 'mutation-activated'
          || event.type === 'finished'
          || event.type === 'game-over'
        ));
        if (notable) setLiveMessage(eventMessage(notable, languageRef.current));
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
        setLiveMessage(appCopy(languageRef.current).labels.runStarted);
        focusBoard();
      }, 3000),
    ];
    void nextRuntime.mount(host).then(() => {
      if (disposed) return;
      nextRuntime.setReducedMotion(motionQuery.matches);
      host.querySelector('canvas')?.setAttribute('aria-label', appCopy(languageRef.current).phrasing.boardLabel);
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
    runtime?.setMusicEnabled(musicEnabled);
    runtime?.setAudioVolume(audioVolume);
  }, [audioEnabled, audioVolume, musicEnabled, runtime]);

  useEffect(() => {
    languageRef.current = language;
    const documentTarget = browserPlatform.documentTarget();
    if (documentTarget?.documentElement) documentTarget.documentElement.lang = language;
    const canvas = hostRef.current?.querySelector('canvas');
    if (canvas) canvas.setAttribute('aria-label', appCopy(language).phrasing.boardLabel);
  }, [language, runtime]);

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
      mutation: state.mode === 'sprint' ? {
        activeCarrier: state.mutationActiveCarrier?.item ?? null,
        lockedCarriers: state.mutationCarriers.length,
        freezeTicks: state.mutationFreezeTicks,
        collapseTicks: state.mutationCollapseTicks,
        multiplierTicks: state.mutationMultiplierTicks,
        lastItem: state.mutationLastItem,
      } : null,
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

  const openSettings = useCallback(() => {
    if (!runtime || settingsOpen || restartConfirmOpen) return;
    const runtimeState = runtime.getState();
    if (runtimeState.status !== 'playing' && runtimeState.status !== 'paused') return;
    settingsWasPlayingRef.current = runtimeState.status === 'playing';
    if (settingsWasPlayingRef.current) runtime.togglePause();
    runtime.setInputEnabled(false);
    setSettingsOpen(true);
  }, [restartConfirmOpen, runtime, settingsOpen]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    runtime?.setInputEnabled(true);
    if (settingsWasPlayingRef.current && runtime?.getState().status === 'paused') runtime.togglePause();
    settingsWasPlayingRef.current = false;
    focusBoard();
  }, [focusBoard, runtime]);

  const restartRun = useCallback(() => {
    setExitOpen(false);
    setSettingsOpen(false);
    setRestartConfirmOpen(false);
    settingsWasPlayingRef.current = false;
    restartWasPlayingRef.current = false;
    runtime?.setInputEnabled(true);
    runtime?.restart();
    runtime?.start();
    focusBoard();
  }, [focusBoard, runtime]);

  const requestRestart = useCallback(() => {
    if (!runtime || restartConfirmOpen) return;
    const runtimeState = runtime.getState();
    if (runtimeState.status !== 'playing' && runtimeState.status !== 'paused') return;
    restartWasPlayingRef.current = runtimeState.status === 'playing' || settingsWasPlayingRef.current;
    if (runtimeState.status === 'playing') runtime.togglePause();
    // The confirmation is a UI transaction: no keyboard control may leak through it.
    runtime.setInputEnabled(false);
    settingsWasPlayingRef.current = false;
    setSettingsOpen(false);
    setRestartConfirmOpen(true);
  }, [restartConfirmOpen, runtime]);

  const cancelRestart = useCallback(() => {
    setRestartConfirmOpen(false);
    runtime?.setInputEnabled(true);
    if (restartWasPlayingRef.current && runtime?.getState().status === 'paused') runtime.togglePause();
    restartWasPlayingRef.current = false;
  }, [runtime]);

  const requestPuzzleUndo = useCallback(() => {
    if (!runtime || countdownDigit !== null || state.mode !== 'puzzle' || exitOpen || restartConfirmOpen || settingsOpen) return;
    const runtimeState = runtime.getState();
    if (runtimeState.status !== 'playing' || runtimeState.puzzleUndoHistory.length === 0) return;
    runtime?.undoPuzzle();
    focusBoard();
  }, [countdownDigit, exitOpen, focusBoard, restartConfirmOpen, runtime, settingsOpen, state.mode]);

  const resumeRun = useCallback(() => {
    if (runtime?.getState().status === 'paused') runtime.togglePause();
    focusBoard();
  }, [focusBoard, runtime]);

  useEffect(() => {
    const handleRestartShortcut = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.code !== 'KeyR' || keyboardEvent.repeat || keyboardEvent.isComposing) return;
      if (countdownDigit !== null || state.status !== 'playing' || exitOpen || restartConfirmOpen || settingsOpen) return;
      keyboardEvent.preventDefault();
      requestRestart();
    };
    return browserPlatform.listenWindow('keydown', handleRestartShortcut);
  }, [countdownDigit, exitOpen, requestRestart, restartConfirmOpen, settingsOpen, state.status]);

  useEffect(() => {
    const handleSettingsShortcut = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.code !== 'KeyS' || keyboardEvent.repeat || keyboardEvent.isComposing) return;
      if (countdownDigit !== null || exitOpen || restartConfirmOpen || settingsOpen) return;
      keyboardEvent.preventDefault();
      openSettings();
    };
    return browserPlatform.listenWindow('keydown', handleSettingsShortcut);
  }, [countdownDigit, exitOpen, openSettings, restartConfirmOpen, settingsOpen]);

  const requestExit = useCallback(() => {
    if (!runtime || countdownDigit !== null || exitOpen || restartConfirmOpen || settingsOpen) return;
    const runtimeState = runtime.getState();
    if (runtimeState.status !== 'playing' && runtimeState.status !== 'paused') return;
    exitWasPlayingRef.current = runtimeState.status === 'playing';
    if (exitWasPlayingRef.current) runtime.togglePause();
    runtime.setInputEnabled(false);
    setExitOpen(true);
  }, [countdownDigit, exitOpen, restartConfirmOpen, runtime, settingsOpen]);

  const cancelExit = useCallback(() => {
    setExitOpen(false);
    runtime?.setInputEnabled(true);
    if (exitWasPlayingRef.current && runtime?.getState().status === 'paused') runtime.togglePause();
    exitWasPlayingRef.current = false;
  }, [runtime]);

  useEffect(() => {
    const handlePuzzleUndoShortcut = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.code !== 'KeyZ' || keyboardEvent.repeat || keyboardEvent.isComposing) return;
      if (countdownDigit !== null || state.mode !== 'puzzle' || state.status !== 'playing' || exitOpen || restartConfirmOpen || settingsOpen) return;
      keyboardEvent.preventDefault();
      requestPuzzleUndo();
    };
    return browserPlatform.listenWindow('keydown', handlePuzzleUndoShortcut);
  }, [countdownDigit, exitOpen, requestPuzzleUndo, restartConfirmOpen, settingsOpen, state.mode, state.status]);

  useEffect(() => {
    const handleExitShortcut = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.code !== 'Escape' || keyboardEvent.repeat || keyboardEvent.isComposing) return;
      if (countdownDigit !== null || state.status !== 'playing' || exitOpen || restartConfirmOpen || settingsOpen) return;
      keyboardEvent.preventDefault();
      requestExit();
    };
    return browserPlatform.listenWindow('keydown', handleExitShortcut);
  }, [countdownDigit, exitOpen, requestExit, restartConfirmOpen, settingsOpen, state.status]);

  const terminal = terminalCopy(state, language);
  const modeLabel = modeCopy(language, state.mode).label;
  const exitDestination: ExitDestination = state.mode === 'puzzle' ? 'puzzle-library' : 'home';
  const pauseOpen = state.status === 'paused' && !exitOpen && !restartConfirmOpen && !settingsOpen;
  const resultOpen = terminal !== null && !exitOpen && !restartConfirmOpen && !settingsOpen;
  const storedRecords = state.mode === 'puzzle' ? [] : recordsForMode(leaderboard, state.mode);
  const leaderboardRecords = resultRecord && scoreRecordRank(storedRecords, resultRecord) === null
    ? recordsForMode(insertScoreRecord(leaderboard, resultRecord), resultRecord.mode)
    : storedRecords;
  const resultRank = state.mode === 'puzzle' ? null : scoreRecordRank(leaderboardRecords, resultRecord);
  const puzzleDoublePreview = state.mode === 'puzzle';

  return (
    <main id="game" lang={language} className="play-shell" data-testid="game-screen">
      <header className="play-topbar" data-testid="cluster-header">
        <button
          className="topbar-action"
          type="button"
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            requestExit();
          }}
          aria-label={state.mode === 'puzzle' ? copy.labels.leavePuzzle : copy.labels.leaveRun}
          aria-keyshortcuts="Escape"
        >← {copy.labels.back}</button>
        <div className="play-identity">
          <Brand compact />
          <h1 data-testid="current-mode">{modeLabel}</h1>
        </div>
        <div className="topbar-actions">
          <button
            className="topbar-action topbar-action--settings"
            type="button"
            data-testid="open-settings"
            aria-label={`${copy.labels.settings} (S)`}
            aria-keyshortcuts="S"
            aria-expanded={settingsOpen}
            disabled={countdownDigit !== null || (state.status !== 'playing' && state.status !== 'paused')}
            onClick={openSettings}
          >{copy.labels.settings}</button>
        </div>
      </header>

      <section className="play-surface" aria-label={`${modeLabel} ${copy.labels.gamePanel}`}>
        <section className="game-arena" data-testid="game-cluster" aria-label={`${modeLabel} ${copy.labels.gameArea}`}>
          <div ref={hostRef} className="canvas-host" data-testid="canvas-host" />
          <section
            className={`board-frame ${countdownDigit !== null ? 'board-frame--countdown' : ''}`}
            data-testid="board-frame"
            aria-label={copy.phrasing.boardLabel}
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
              <RunStats state={state} language={language} />
              <MutationStatus state={state} language={language} />
            </div>
            <div className={`preview-rail ${puzzleDoublePreview ? 'preview-rail--puzzle' : ''}`}>
              <p className="rail-label">{puzzleDoublePreview ? `${copy.labels.next} · 2` : copy.labels.next}</p>
              <div
                className="next-slot"
                data-testid="next-slot"
                data-preview-count={puzzleDoublePreview ? 2 : 1}
                aria-label={puzzleDoublePreview ? copy.labels.twoUpcoming : copy.labels.nextPiece}
              />
            </div>
          </aside>
        </section>

          <section className={`touch-deck ${state.mode === 'puzzle' ? 'touch-deck--puzzle' : ''}`} data-testid="touch-rail" aria-label={state.mode === 'puzzle' ? copy.labels.puzzleTouchControls : copy.labels.touchControls}>
          <TouchButton action="left" label={copy.labels.moveLeft} glyph="←" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="right" label={copy.labels.moveRight} glyph="→" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="rotate-cw" label={copy.labels.rotate} glyph="↻" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="soft-drop" label={copy.labels.softDrop} glyph="↓" runtime={runtime} disabled={countdownDigit !== null} />
          <TouchButton action="hard-drop" label={copy.labels.hardDrop} glyph="⇣" runtime={runtime} disabled={countdownDigit !== null} />
          {state.mode === 'puzzle' && <PuzzleUndoButton language={language} onRequestUndo={requestPuzzleUndo} disabled={countdownDigit !== null || state.status !== 'playing' || state.puzzleUndoHistory.length === 0} />}
        </section>
      </section>

      <ActionSheet
        open={pauseOpen}
        title={copy.labels.pauseTitle}
        description=""
        onCancel={resumeRun}
        onConfirm={resumeRun}
      >
        <button className="primary-action" data-autofocus type="button" onClick={resumeRun}>{copy.labels.continue}</button>
      </ActionSheet>

      <ActionSheet
        open={settingsOpen}
        title={copy.labels.settings}
        description=""
        dismissOnBackdropClick
        onCancel={closeSettings}
      >
        <section className="settings-sheet" data-testid="settings-sheet" aria-label={copy.labels.settings}>
          <section className="settings-controls" data-testid="settings-controls" aria-label={copy.labels.controls}>
            <strong>{copy.labels.controls}</strong>
            {onLanguageChange && <LanguageControl language={language} onChange={onLanguageChange} />}
            <AudioControls
              enabled={audioEnabled}
              musicEnabled={musicEnabled}
              volume={audioVolume}
              onEnabledChange={changeAudioEnabled}
              onMusicEnabledChange={changeMusicEnabled}
              onVolumeChange={changeAudioVolume}
              language={language}
            />
            <div className="settings-sheet__actions">
              <button className="secondary-action" type="button" data-testid="settings-restart" data-arrow-nav onClick={requestRestart}>{copy.labels.restart}</button>
              <button className="primary-action" data-autofocus type="button" data-arrow-nav onClick={closeSettings}>
                {settingsWasPlayingRef.current ? copy.labels.continue : copy.labels.returnToPause}
              </button>
            </div>
          </section>
          <SettingsShortcutGuide mode={state.mode} language={language} />
          <ModeRuleSummary mode={state.mode} language={language} testId="settings-rules" />
          <SettingsRecord
            mode={state.mode}
            puzzleId={state.puzzleId ?? puzzleId}
            leaderboard={leaderboard}
            progress={puzzleProgress}
            language={language}
          />
        </section>
      </ActionSheet>

      <ActionSheet
        open={restartConfirmOpen}
        title={copy.labels.restartTitle}
        description=""
        tone="danger"
        onCancel={cancelRestart}
        onConfirm={restartRun}
      >
        <button className="primary-action" data-autofocus data-testid="confirm-restart" type="button" onClick={restartRun}>{copy.labels.confirm}</button>
        <button className="secondary-action" type="button" onClick={cancelRestart}>{copy.labels.cancel}</button>
      </ActionSheet>

      <ActionSheet
        open={exitOpen}
        title={copy.labels.leaveTitle}
        description=""
        tone="danger"
        onCancel={cancelExit}
      >
        <button className="primary-action" data-autofocus type="button" onClick={cancelExit}>{copy.labels.stay}</button>
        <button className="secondary-action" type="button" onClick={() => onExit(exitDestination)}>
          {exitDestination === 'puzzle-library' ? copy.labels.leavePuzzle : copy.labels.leaveRun}
        </button>
      </ActionSheet>

      <ActionSheet
        open={resultOpen}
        title={terminal?.title ?? copy.labels.resultTitle}
        description={terminal?.detail ?? ''}
        tone={terminal?.success ? 'success' : 'danger'}
      >
        {state.mode !== 'puzzle' && <>
          <LeaderboardPanel mode={state.mode} records={leaderboardRecords} highlightRecord={resultRank !== null ? resultRecord : null} />
          {resultRecord && resultRank === null && <p className="result-rank-notice" data-testid="result-rank-notice">{copy.labels.currentRunMissedLeaderboard}</p>}
        </>}
        <button className="primary-action" data-autofocus type="button" onClick={restartRun}>{state.mode === 'puzzle' ? copy.labels.replay : copy.labels.playAgain}</button>
        <button className="secondary-action" type="button" onClick={() => onExit(exitDestination)}>
          {exitDestination === 'puzzle-library' ? copy.labels.leavePuzzle : copy.labels.leaveRun}
        </button>
      </ActionSheet>

      <div className="sr-only" aria-live="polite">{liveMessage}</div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [language, setLanguage] = useState<AppLanguage>(readLanguage);
  const [mode, setMode] = useState<GameMode>('marathon');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<PuzzleId>(CAMPAIGN_LEVELS[0]!.id);
  const [progress, setProgress] = useState<PuzzleProgress>(readPuzzleProgress);
  const [leaderboard, setLeaderboard] = useState<Leaderboard>(readLeaderboard);
  const [introducedModes, setIntroducedModes] = useState<readonly GameMode[]>(readModeRuleIntros);
  const [ruleIntroMode, setRuleIntroMode] = useState<GameMode | null>(null);

  useEffect(() => {
    const documentTarget = browserPlatform.documentTarget();
    const copy = appCopy(language);
    if (documentTarget?.documentElement) documentTarget.documentElement.lang = language;
    const skipLink = documentTarget?.querySelector<HTMLAnchorElement>('.skip-link');
    if (skipLink) skipLink.textContent = copy.labels.skipToGame;
    const bootScreen = documentTarget?.getElementById('boot-screen');
    if (bootScreen) bootScreen.setAttribute('aria-label', copy.labels.loading);
  }, [language]);

  const changeLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage);
    writeLanguage(nextLanguage);
  }, []);

  const openMode = useCallback((nextMode: GameMode) => {
    setMode(nextMode);
    setScreen(nextMode === 'puzzle' ? 'puzzle-library' : 'game');
  }, []);

  const enterMode = useCallback((nextMode: GameMode) => {
    if (!introducedModes.includes(nextMode)) {
      setRuleIntroMode(nextMode);
      return;
    }
    openMode(nextMode);
  }, [introducedModes, openMode]);

  const beginIntroducedMode = useCallback(() => {
    if (ruleIntroMode === null) return;
    const nextIntroduced = introducedModes.includes(ruleIntroMode)
      ? introducedModes
      : Object.freeze([...introducedModes, ruleIntroMode]);
    setIntroducedModes(nextIntroduced);
    writeModeRuleIntros(nextIntroduced);
    openMode(ruleIntroMode);
    setRuleIntroMode(null);
  }, [introducedModes, openMode, ruleIntroMode]);

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
    <div className="app" lang={language}>
      {screen === 'home' && <ModeHome onEnter={enterMode} language={language} />}
      {screen === 'puzzle-library' && (
        <PuzzleLibrary
          progress={progress}
          selectedId={selectedPuzzleId}
          onSelect={setSelectedPuzzleId}
          onStart={startPuzzle}
          onBack={() => setScreen('home')}
          language={language}
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
          puzzleProgress={progress}
          onRunFinished={recordRun}
          language={language}
          onLanguageChange={changeLanguage}
        />
      )}
      <ActionSheet
        open={ruleIntroMode !== null}
        title={ruleIntroMode === null ? appCopy(language).labels.rules : `${modeCopy(language, ruleIntroMode).label} ${appCopy(language).labels.rules}`}
        description={appCopy(language).labels.firstEntry}
        onCancel={() => setRuleIntroMode(null)}
        onConfirm={beginIntroducedMode}
      >
        {ruleIntroMode !== null && <ModeRuleSummary mode={ruleIntroMode} language={language} testId="entry-mode-rules" />}
        <button className="primary-action" data-autofocus type="button" onClick={beginIntroducedMode}>{appCopy(language).labels.start}</button>
        <button className="secondary-action" type="button" onClick={() => setRuleIntroMode(null)}>{appCopy(language).labels.back}</button>
      </ActionSheet>
    </div>
  );
}
