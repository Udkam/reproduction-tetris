import { PUZZLE_DEFINITIONS, type GameState, type PuzzleId } from './game/core';

/** Current persisted format. Keep v2/v1 keys for one-way local migration only. */
export const PUZZLE_PROGRESS_KEY = 'qingliu:puzzle-completion:v3';
export const V2_PUZZLE_PROGRESS_KEY = 'qingliu:puzzle-completion:v2';
export const LEGACY_PUZZLE_PROGRESS_KEY = 'tetris:puzzle-progress:v1';
const PROGRESS_VERSION = 3;
const V2_PROGRESS_VERSION = 2;
const LEGACY_PROGRESS_VERSION = 1;

/** T13 treats the set as an open workshop: every specimen is selectable immediately. */
export const INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT = PUZZLE_DEFINITIONS.length;

export interface PuzzleProgress {
  version: typeof PROGRESS_VERSION;
  /** Canonical IDs only; completion is history, never an access gate. */
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

/**
 * The v2 save format predates T12.4's temporary solver ordering. Keep its literal
 * natural-ID order so T12.5 can retain valid completions while restoring the gentle
 * authored curriculum order. Migration uses it only to interpret old data.
 */
export const V2_CAMPAIGN_ORDER: readonly PuzzleId[] = Object.freeze([
  't3r-shaft-01',
  't3r-shaft-02',
  't3r-shaft-03',
  't3r-shaft-04',
  't3r-cascade-05',
  't3r-cascade-06',
  't5r-delta-07',
  't5r-drift-08',
  't5r-lattice-09',
  't5r-rift-10',
  't5r-prism-11',
  't5r-current-12',
  't5r-arc-13',
  't5r-pulse-14',
  't5r-horizon-15',
  't6r-veil-16',
  't6r-cairn-17',
  't6r-terrace-18',
  't6r-bastion-19',
  't6r-keystone-20',
]);

const ROW_BAND_LENGTHS = [5, 5, 5, 5] as const;

function buildRowBands(levels: readonly CampaignLevel[]): readonly (readonly CampaignLevel[])[] {
  const tiers: (readonly CampaignLevel[])[] = [];
  let cursor = 0;
  for (const length of ROW_BAND_LENGTHS) {
    const tier = levels.slice(cursor, cursor + length);
    if (tier.length !== length) throw new Error('Puzzle row bands require exactly twenty levels.');
    tiers.push(Object.freeze(tier));
    cursor += length;
  }
  if (cursor !== levels.length) throw new Error('Puzzle row bands contain an unassigned level.');
  return Object.freeze(tiers);
}

/** Four visible 5/6/7/8-row workshop bands; these are presentation grouping only. */
export const PUZZLE_ROW_BANDS = buildRowBands(CAMPAIGN_LEVELS);
/** @deprecated Compatibility export; no access gate is derived from these groups. */
export const CAMPAIGN_TIERS = PUZZLE_ROW_BANDS;

export interface PuzzleTierGate {
  /** The already-open tier whose completions are counted. */
  prerequisiteTier: readonly CampaignLevel[];
  /** The next closed tier this gate will unlock. */
  unlocksTier: readonly CampaignLevel[];
  completedCount: number;
  requiredCount: number;
}

const LEVEL_IDS = new Set<PuzzleId>(CAMPAIGN_LEVELS.map((level) => level.id));
const V2_LEVEL_IDS = new Set<PuzzleId>(V2_CAMPAIGN_ORDER);

if (V2_CAMPAIGN_ORDER.length !== LEVEL_IDS.size || V2_LEVEL_IDS.size !== LEVEL_IDS.size
  || [...V2_LEVEL_IDS].some((id) => !LEVEL_IDS.has(id))) {
  throw new Error('Frozen v2 Puzzle campaign order must contain every current Puzzle ID exactly once.');
}

export function defaultPuzzleProgress(): PuzzleProgress {
  return { version: PROGRESS_VERSION, completedLevelIds: [] };
}

function isPuzzleId(value: unknown): value is PuzzleId {
  return typeof value === 'string' && LEVEL_IDS.has(value as PuzzleId);
}

function isV2PuzzleId(value: unknown): value is PuzzleId {
  return typeof value === 'string' && V2_LEVEL_IDS.has(value as PuzzleId);
}

/** Normalizes persisted IDs to the *current* campaign order after migration. */
function orderedUnique(ids: readonly PuzzleId[]): PuzzleId[] {
  const completed = new Set(ids);
  return CAMPAIGN_LEVELS.filter((level) => completed.has(level.id)).map((level) => level.id);
}

/** Normalizes a v2 record without borrowing semantics from a future campaign order. */
function orderedV2Unique(ids: readonly PuzzleId[]): PuzzleId[] {
  const completed = new Set(ids);
  return V2_CAMPAIGN_ORDER.filter((id) => completed.has(id));
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

function unlockedLevelIdsFrom(_progress: PuzzleProgress): ReadonlySet<PuzzleId> {
  return new Set<PuzzleId>(CAMPAIGN_LEVELS.map((level) => level.id));
}

/** T13 has no locked progression frontier; retained for callers that render a nullable notice. */
export function nextPuzzleTierGate(_progress: PuzzleProgress): PuzzleTierGate | null {
  return null;
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

/** Migrates a v2 canonical-ID record into the current tiered campaign format. */
export function migrateV2PuzzleProgress(raw: string | null): PuzzleProgress {
  if (raw === null) return defaultPuzzleProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleProgress();
    const candidate = value as { version?: unknown; completedLevelIds?: unknown };
    if (candidate.version !== V2_PROGRESS_VERSION || !Array.isArray(candidate.completedLevelIds)) {
      return defaultPuzzleProgress();
    }
    if (!candidate.completedLevelIds.every(isV2PuzzleId)) return defaultPuzzleProgress();
    return {
      version: PROGRESS_VERSION,
      completedLevelIds: orderedUnique(orderedV2Unique(candidate.completedLevelIds)),
    };
  } catch {
    return defaultPuzzleProgress();
  }
}

/**
 * The old v1 record stored the next sequentially selectable level. Its old campaign
 * order is frozen with v2 so a later curriculum reorder cannot reinterpret its frontier.
 */
export function migrateLegacyPuzzleProgress(raw: string | null): PuzzleProgress {
  if (raw === null) return defaultPuzzleProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleProgress();
    const candidate = value as { version?: unknown; nextUnlockedLevelId?: unknown };
    if (candidate.version !== LEGACY_PROGRESS_VERSION || !isV2PuzzleId(candidate.nextUnlockedLevelId)) {
      return defaultPuzzleProgress();
    }
    const nextIndex = V2_CAMPAIGN_ORDER.indexOf(candidate.nextUnlockedLevelId);
    return {
      version: PROGRESS_VERSION,
      completedLevelIds: orderedUnique(V2_CAMPAIGN_ORDER.slice(0, Math.max(0, nextIndex))),
    };
  } catch {
    return defaultPuzzleProgress();
  }
}

export function isPuzzleComplete(progress: PuzzleProgress, levelId: PuzzleId): boolean {
  return completedIdsFrom(progress)?.includes(levelId) ?? false;
}

/** Completion history never changes the workshop's available specimen count. */
export function unlockedPuzzleLevelCount(progress: PuzzleProgress): number {
  return unlockedLevelIdsFrom(progress).size;
}

export function isPuzzleUnlocked(progress: PuzzleProgress, levelId: PuzzleId): boolean {
  return unlockedLevelIdsFrom(progress).has(levelId);
}

export function nextLockedPuzzleLevel(progress: PuzzleProgress): CampaignLevel | null {
  void progress;
  return null;
}

/** Records only a core-reported completion; every current level is selectable. */
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
