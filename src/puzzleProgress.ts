import { PUZZLE_DEFINITIONS, type GameState, type PuzzleId } from './game/core';

export const PUZZLE_PROGRESS_KEY = 'qingliu:puzzle-completion:v2';
export const LEGACY_PUZZLE_PROGRESS_KEY = 'tetris:puzzle-progress:v1';
const PROGRESS_VERSION = 2;

export interface PuzzleProgress {
  version: typeof PROGRESS_VERSION;
  /** Completion is informational. Every campaign level is always available. */
  completedLevelIds: PuzzleId[];
}

export interface CampaignLevel {
  id: PuzzleId;
  name: string;
  index: number;
  total: number;
}

export const CAMPAIGN_LEVELS: readonly CampaignLevel[] = Object.freeze(
  PUZZLE_DEFINITIONS.map((level, index) => Object.freeze({
    id: level.id,
    name: level.name,
    index: index + 1,
    total: PUZZLE_DEFINITIONS.length,
  })),
);

const LEVEL_IDS = new Set<PuzzleId>(CAMPAIGN_LEVELS.map((level) => level.id));

export function defaultPuzzleProgress(): PuzzleProgress {
  return { version: PROGRESS_VERSION, completedLevelIds: [] };
}

function isPuzzleId(value: unknown): value is PuzzleId {
  return typeof value === 'string' && LEVEL_IDS.has(value as PuzzleId);
}

function orderedUnique(ids: readonly PuzzleId[]): PuzzleId[] {
  const completed = new Set(ids);
  return CAMPAIGN_LEVELS.filter((level) => completed.has(level.id)).map((level) => level.id);
}

export function parsePuzzleProgress(raw: string | null): PuzzleProgress {
  if (raw === null) return defaultPuzzleProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleProgress();
    const candidate = value as { version?: unknown; completedLevelIds?: unknown };
    if (candidate.version !== PROGRESS_VERSION || !Array.isArray(candidate.completedLevelIds)) {
      return defaultPuzzleProgress();
    }
    if (!candidate.completedLevelIds.every(isPuzzleId)) return defaultPuzzleProgress();
    return { version: PROGRESS_VERSION, completedLevelIds: orderedUnique(candidate.completedLevelIds) };
  } catch {
    return defaultPuzzleProgress();
  }
}

/**
 * The old v1 record stored the highest selectable level. Migration converts only
 * the levels that necessarily preceded it into informational completions. It never
 * gates any T5 level and rejects unknown or malformed legacy data.
 */
export function migrateLegacyPuzzleProgress(raw: string | null): PuzzleProgress {
  if (raw === null) return defaultPuzzleProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleProgress();
    const candidate = value as { version?: unknown; nextUnlockedLevelId?: unknown };
    if (candidate.version !== 1 || !isPuzzleId(candidate.nextUnlockedLevelId)) return defaultPuzzleProgress();
    const nextIndex = CAMPAIGN_LEVELS.findIndex((level) => level.id === candidate.nextUnlockedLevelId);
    return {
      version: PROGRESS_VERSION,
      completedLevelIds: CAMPAIGN_LEVELS.slice(0, Math.max(0, nextIndex)).map((level) => level.id),
    };
  } catch {
    return defaultPuzzleProgress();
  }
}

export function isPuzzleComplete(progress: PuzzleProgress, levelId: PuzzleId): boolean {
  return progress.completedLevelIds.includes(levelId);
}

/** Records only a core-reported canonical board-empty completion. */
export function recordCanonicalPuzzleCompletion(progress: PuzzleProgress, state: GameState): PuzzleProgress {
  if (
    state.mode !== 'puzzle'
    || state.puzzleCompletion !== 'finished'
    || state.completedLevelId === null
    || !LEVEL_IDS.has(state.completedLevelId)
    || progress.completedLevelIds.includes(state.completedLevelId)
  ) return progress;

  return {
    version: PROGRESS_VERSION,
    completedLevelIds: orderedUnique([...progress.completedLevelIds, state.completedLevelId]),
  };
}
