import { PUZZLE_DEFINITIONS, type GameState, type PuzzleId } from './game/core';

export const PUZZLE_PROGRESS_KEY = 'qingliu:puzzle-completion:v2';
export const LEGACY_PUZZLE_PROGRESS_KEY = 'tetris:puzzle-progress:v1';
const PROGRESS_VERSION = 2;
export const INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT = 3;

export interface PuzzleProgress {
  version: typeof PROGRESS_VERSION;
  /** Canonical completions drive the next sequential campaign unlock. */
  completedLevelIds: PuzzleId[];
}

export interface CampaignLevel {
  id: PuzzleId;
  name: string;
  index: number;
  total: number;
  difficulty: number;
}

export const CAMPAIGN_LEVELS: readonly CampaignLevel[] = Object.freeze(
  PUZZLE_DEFINITIONS.map((level, index) => Object.freeze({
    id: level.id,
    name: level.name,
    index: index + 1,
    total: PUZZLE_DEFINITIONS.length,
    difficulty: level.difficulty,
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

function completedIdsFrom(progress: PuzzleProgress | null | undefined): PuzzleId[] | null {
  if (
    !progress
    || progress.version !== PROGRESS_VERSION
    || !Array.isArray(progress.completedLevelIds)
    || !progress.completedLevelIds.every(isPuzzleId)
  ) return null;
  return orderedUnique(progress.completedLevelIds);
}

function unlockedLevelIdsFrom(progress: PuzzleProgress): ReadonlySet<PuzzleId> {
  const completedIds = completedIdsFrom(progress);
  const initialCount = Math.min(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT, CAMPAIGN_LEVELS.length);
  const sequentialCount = Math.min(
    CAMPAIGN_LEVELS.length,
    initialCount + (completedIds?.length ?? 0),
  );
  return new Set([
    ...CAMPAIGN_LEVELS.slice(0, sequentialCount).map((level) => level.id),
    ...(completedIds ?? []),
  ]);
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
 * the levels that necessarily preceded it into canonical completions and rejects
 * unknown or malformed legacy data.
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
  return completedIdsFrom(progress)?.includes(levelId) ?? false;
}

/**
 * The first three levels form the on-ramp. Every distinct canonical completion
 * opens precisely one additional sequential entry, never more than the campaign.
 * A historic valid completion itself also remains selectable after migration.
 */
export function unlockedPuzzleLevelCount(progress: PuzzleProgress): number {
  return unlockedLevelIdsFrom(progress).size;
}

export function isPuzzleUnlocked(progress: PuzzleProgress, levelId: PuzzleId): boolean {
  return unlockedLevelIdsFrom(progress).has(levelId);
}

export function nextLockedPuzzleLevel(progress: PuzzleProgress): CampaignLevel | null {
  const unlockedIds = unlockedLevelIdsFrom(progress);
  return CAMPAIGN_LEVELS.find((level) => !unlockedIds.has(level.id)) ?? null;
}

/** Records only a core-reported canonical Puzzle completion. */
export function recordCanonicalPuzzleCompletion(progress: PuzzleProgress, state: GameState): PuzzleProgress {
  const completedIds = completedIdsFrom(progress);
  if (
    completedIds === null
    || state.mode !== 'puzzle'
    || state.puzzleCompletion !== 'finished'
    || state.completedLevelId === null
    || !LEVEL_IDS.has(state.completedLevelId)
    || !isPuzzleUnlocked(progress, state.completedLevelId)
    || completedIds.includes(state.completedLevelId)
  ) return progress;

  return {
    version: PROGRESS_VERSION,
    completedLevelIds: orderedUnique([...completedIds, state.completedLevelId]),
  };
}
