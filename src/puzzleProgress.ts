import { PUZZLE_DEFINITIONS, type GameState, type PuzzleId } from './game/core';
import {
  PUZZLE_HARD_MASTERY_GROUPS,
  puzzleHardMasteryGroup,
  puzzleOptimalCertificate,
  type PuzzleHardMasteryGroup,
} from './puzzleMastery';

/** Current persisted format. Keep every former key for one-way local migration and rollback. */
export const PUZZLE_PROGRESS_KEY = 'tetramorph:puzzle-completion:v5';
export const LEGACY_V5_PUZZLE_PROGRESS_KEY = 'qingliu:puzzle-completion:v5';
export const V4_PUZZLE_PROGRESS_KEY = 'qingliu:puzzle-completion:v4';
export const V3_PUZZLE_PROGRESS_KEY = 'qingliu:puzzle-completion:v3';
export const V2_PUZZLE_PROGRESS_KEY = 'qingliu:puzzle-completion:v2';
export const LEGACY_PUZZLE_PROGRESS_KEY = 'tetris:puzzle-progress:v1';
const PROGRESS_VERSION = 5;
const V4_PROGRESS_VERSION = 4;
const V3_PROGRESS_VERSION = 3;
const V2_PROGRESS_VERSION = 2;
const LEGACY_PROGRESS_VERSION = 1;
export const PUZZLE_CAMPAIGN_REVISION = 2;

/** Intro and Easy are exploration space; only Hard is mastery-gated. */
export const INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT = 30;

export interface PuzzleProgress {
  version: typeof PROGRESS_VERSION;
  campaignRevision: typeof PUZZLE_CAMPAIGN_REVISION;
  /** Canonical IDs only; completion history derives the current access frontier. */
  completedLevelIds: PuzzleId[];
  /** Lowest number of locked pieces from a real completed attempt, by canonical level. */
  bestPieceCounts: Partial<Record<PuzzleId, number>>;
}

export interface CampaignLevel {
  id: PuzzleId;
  name: string;
  index: number;
  total: number;
  difficulty: number;
}

export type PuzzleCategoryId = 'intro' | 'easy' | 'hard';

export interface PuzzleCategory {
  id: PuzzleCategoryId;
  levels: readonly CampaignLevel[];
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

export const PUZZLE_CATEGORIES: readonly PuzzleCategory[] = Object.freeze([
  Object.freeze({ id: 'intro', levels: Object.freeze(CAMPAIGN_LEVELS.slice(0, 10)) }),
  Object.freeze({ id: 'easy', levels: Object.freeze(CAMPAIGN_LEVELS.slice(10, 30)) }),
  Object.freeze({ id: 'hard', levels: Object.freeze(CAMPAIGN_LEVELS.slice(30)) }),
]);

/** Revision 2 re-authors these stable positions; their former clears are not equivalent. */
export const PUZZLE_REVISION_2_CHANGED_IDS: readonly PuzzleId[] = Object.freeze([
  ...CAMPAIGN_LEVELS.slice(0, 10).map(({ id }) => id),
  ...CAMPAIGN_LEVELS.slice(11, 14).map(({ id }) => id),
  CAMPAIGN_LEVELS[35]!.id,
  CAMPAIGN_LEVELS[37]!.id,
  ...CAMPAIGN_LEVELS.slice(45, 50).map(({ id }) => id),
]);
const PUZZLE_REVISION_2_CHANGED_ID_SET = new Set<PuzzleId>(PUZZLE_REVISION_2_CHANGED_IDS);

/**
 * The v4 workshop used this difficulty-sorted visible order. Keep it literal: Phase 7
 * re-authors these boards but retains each ID at the same ordinal so completion history
 * remains meaningful. Its personal-best values belong to the retired boards and are
 * validated during migration but deliberately not promoted into campaign revision 1.
 */
export const V4_CAMPAIGN_ORDER: readonly PuzzleId[] = Object.freeze([
  't3r-shaft-01',
  't3r-shaft-02',
  't3r-shaft-03',
  't3r-cascade-05',
  't3r-shaft-04',
  't3r-cascade-06',
  't5r-delta-07',
  't5r-lattice-09',
  't5r-drift-08',
  't5r-rift-10',
  't5r-pulse-14',
  't5r-arc-13',
  't5r-current-12',
  't5r-prism-11',
  't5r-horizon-15',
  't6r-cairn-17',
  't6r-terrace-18',
  't6r-keystone-20',
  't6r-bastion-19',
  't6r-veil-16',
]);

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

const ROW_BAND_LENGTH = 5;

function buildRowBands(levels: readonly CampaignLevel[]): readonly (readonly CampaignLevel[])[] {
  if (levels.length === 0 || levels.length % ROW_BAND_LENGTH !== 0) {
    throw new Error('Puzzle row bands require a non-empty campaign divisible into five-level groups.');
  }
  const tiers: (readonly CampaignLevel[])[] = [];
  for (let cursor = 0; cursor < levels.length; cursor += ROW_BAND_LENGTH) {
    const tier = levels.slice(cursor, cursor + ROW_BAND_LENGTH);
    if (tier.length !== ROW_BAND_LENGTH) throw new Error('Puzzle row band is incomplete.');
    tiers.push(Object.freeze(tier));
  }
  return Object.freeze(tiers);
}

/** Legacy five-level grouping retained for save-order compatibility and diagnostics only. */
export const PUZZLE_ROW_BANDS = buildRowBands(CAMPAIGN_LEVELS);
/** @deprecated Compatibility export for the same canonical five-level bands. */
export const CAMPAIGN_TIERS = PUZZLE_ROW_BANDS;

export interface PuzzleTierGate {
  /** The already-open tier whose completions are counted. */
  prerequisiteTier: readonly CampaignLevel[];
  /** The next closed tier this gate will unlock. */
  unlocksTier: readonly CampaignLevel[];
  completedCount: number;
  requiredCount: number;
}

interface PuzzleTierGateDefinition {
  prerequisiteTier: readonly CampaignLevel[];
  unlocksTier: readonly CampaignLevel[];
  requiredCount: number;
}

const PUZZLE_TIER_GATES: readonly PuzzleTierGateDefinition[] = Object.freeze([]);

const LEVEL_IDS = new Set<PuzzleId>(CAMPAIGN_LEVELS.map((level) => level.id));
const V4_LEVEL_IDS = new Set<PuzzleId>(V4_CAMPAIGN_ORDER);
const V2_LEVEL_IDS = new Set<PuzzleId>(V2_CAMPAIGN_ORDER);

if (
  V4_CAMPAIGN_ORDER.length !== 20
  || V4_LEVEL_IDS.size !== V4_CAMPAIGN_ORDER.length
  || V4_CAMPAIGN_ORDER.some((id) => !LEVEL_IDS.has(id))
) {
  throw new Error('Frozen v4 Puzzle campaign order must retain its twenty historic IDs exactly once.');
}

if (
  V2_CAMPAIGN_ORDER.length !== 20
  || V2_LEVEL_IDS.size !== V2_CAMPAIGN_ORDER.length
  || [...V2_LEVEL_IDS].some((id) => !V4_LEVEL_IDS.has(id))
) {
  throw new Error('Frozen v2 Puzzle campaign order must contain every historic v4 Puzzle ID exactly once.');
}

export function defaultPuzzleProgress(): PuzzleProgress {
  return {
    version: PROGRESS_VERSION,
    campaignRevision: PUZZLE_CAMPAIGN_REVISION,
    completedLevelIds: [],
    bestPieceCounts: {},
  };
}

function isPuzzleId(value: unknown): value is PuzzleId {
  return typeof value === 'string' && LEVEL_IDS.has(value as PuzzleId);
}

function isV2PuzzleId(value: unknown): value is PuzzleId {
  return typeof value === 'string' && V2_LEVEL_IDS.has(value as PuzzleId);
}

function isV4PuzzleId(value: unknown): value is PuzzleId {
  return typeof value === 'string' && V4_LEVEL_IDS.has(value as PuzzleId);
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

function orderedV4Unique(ids: readonly PuzzleId[]): PuzzleId[] {
  const completed = new Set(ids);
  return V4_CAMPAIGN_ORDER.filter((id) => completed.has(id));
}

function isBestPieceCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function orderedBestPieceCounts(
  value: unknown,
  completedIds: readonly PuzzleId[],
): Partial<Record<PuzzleId, number>> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const completed = new Set(completedIds);
  const entries = Object.entries(raw);
  if (!entries.every(([levelId, count]) => isPuzzleId(levelId) && completed.has(levelId) && isBestPieceCount(count))) {
    return null;
  }
  const ordered: Partial<Record<PuzzleId, number>> = {};
  for (const level of CAMPAIGN_LEVELS) {
    const count = raw[level.id];
    if (count !== undefined) ordered[level.id] = count as number;
  }
  return ordered;
}

function validHistoricBestPieceCounts(
  value: unknown,
  completedIds: readonly PuzzleId[],
): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const completed = new Set(completedIds);
  return Object.entries(value as Record<string, unknown>).every(
    ([levelId, count]) => isV4PuzzleId(levelId) && completed.has(levelId) && isBestPieceCount(count),
  );
}

function completedIdsFrom(progress: PuzzleProgress | null | undefined): PuzzleId[] | null {
  if (
    !progress
    || progress.version !== PROGRESS_VERSION
    || progress.campaignRevision !== PUZZLE_CAMPAIGN_REVISION
    || !Array.isArray(progress.completedLevelIds)
    || !progress.completedLevelIds.every(isPuzzleId)
  ) return null;
  return orderedUnique(progress.completedLevelIds);
}

function bestPieceCountsFrom(progress: PuzzleProgress, completedIds: readonly PuzzleId[]): Partial<Record<PuzzleId, number>> | null {
  return orderedBestPieceCounts(progress.bestPieceCounts, completedIds);
}

function completedIdSetFrom(progress: PuzzleProgress): ReadonlySet<PuzzleId> {
  const completedIds = completedIdsFrom(progress);
  if (completedIds === null || bestPieceCountsFrom(progress, completedIds) === null) {
    return new Set();
  }
  return new Set(completedIds);
}

function unlockedLevelIdsFrom(progress: PuzzleProgress): ReadonlySet<PuzzleId> {
  const completed = completedIdSetFrom(progress);
  const completedIds = completedIdsFrom(progress) ?? [];
  const bestPieceCounts = bestPieceCountsFrom(progress, completedIds) ?? {};
  const unlocked = new Set<PuzzleId>(completed);
  for (const level of CAMPAIGN_LEVELS.slice(0, INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT)) {
    unlocked.add(level.id);
  }

  for (const gate of PUZZLE_TIER_GATES) {
    const completedCount = gate.prerequisiteTier.reduce(
      (count, level) => count + Number(completed.has(level.id)),
      0,
    );
    if (completedCount < gate.requiredCount) break;
    for (const level of gate.unlocksTier) unlocked.add(level.id);
  }
  for (const group of PUZZLE_HARD_MASTERY_GROUPS) {
    const certificate = puzzleOptimalCertificate(group.prerequisiteId)!;
    const best = bestPieceCounts[group.prerequisiteId];
    if (best === undefined || best > certificate.masteryOperations) continue;
    for (const levelId of group.hardLevelIds) unlocked.add(levelId);
  }
  return unlocked;
}

export interface PuzzleMasteryGateStatus {
  group: PuzzleHardMasteryGroup;
  optimalOperations: number;
  requiredOperations: number;
  bestOperations: number | null;
  unlocked: boolean;
}

export function puzzleMasteryGateStatus(
  progress: PuzzleProgress,
  levelId: PuzzleId,
): PuzzleMasteryGateStatus | null {
  const group = puzzleHardMasteryGroup(levelId);
  if (!group) return null;
  const certificate = puzzleOptimalCertificate(group.prerequisiteId)!;
  const bestOperations = puzzleBestPieceCount(progress, group.prerequisiteId);
  return {
    group,
    optimalOperations: certificate.optimalOperations,
    requiredOperations: certificate.masteryOperations,
    bestOperations,
    unlocked: isPuzzleComplete(progress, levelId)
      || (bestOperations !== null && bestOperations <= certificate.masteryOperations),
  };
}

/** Returns the first unsatisfied gate on the canonical, already-open frontier. */
export function nextPuzzleTierGate(progress: PuzzleProgress): PuzzleTierGate | null {
  const completed = completedIdSetFrom(progress);
  for (const gate of PUZZLE_TIER_GATES) {
    const completedCount = gate.prerequisiteTier.reduce(
      (count, level) => count + Number(completed.has(level.id)),
      0,
    );
    if (completedCount < gate.requiredCount) {
      return {
        prerequisiteTier: gate.prerequisiteTier,
        unlocksTier: gate.unlocksTier,
        completedCount,
        requiredCount: gate.requiredCount,
      };
    }
  }
  return null;
}

export function parsePuzzleProgress(raw: string | null): PuzzleProgress {
  if (raw === null) return defaultPuzzleProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleProgress();
    const candidate = value as {
      version?: unknown;
      campaignRevision?: unknown;
      completedLevelIds?: unknown;
      bestPieceCounts?: unknown;
    };
    if (candidate.version !== PROGRESS_VERSION || !Array.isArray(candidate.completedLevelIds)) {
      return defaultPuzzleProgress();
    }
    if (candidate.campaignRevision !== 1 && candidate.campaignRevision !== PUZZLE_CAMPAIGN_REVISION) {
      return defaultPuzzleProgress();
    }
    if (!candidate.completedLevelIds.every(isPuzzleId)) return defaultPuzzleProgress();
    const priorCompletedLevelIds = orderedUnique(candidate.completedLevelIds);
    const priorBestPieceCounts = orderedBestPieceCounts(candidate.bestPieceCounts, priorCompletedLevelIds);
    if (priorBestPieceCounts === null) return defaultPuzzleProgress();
    const completedLevelIds = candidate.campaignRevision === PUZZLE_CAMPAIGN_REVISION
      ? priorCompletedLevelIds
      : priorCompletedLevelIds.filter((id) => !PUZZLE_REVISION_2_CHANGED_ID_SET.has(id));
    const bestPieceCounts: Partial<Record<PuzzleId, number>> = {};
    for (const id of completedLevelIds) {
      const best = priorBestPieceCounts[id];
      if (best !== undefined) bestPieceCounts[id] = best;
    }
    return {
      version: PROGRESS_VERSION,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds,
      bestPieceCounts,
    };
  } catch {
    return defaultPuzzleProgress();
  }
}

/**
 * Migrates the retired all-open v4 workshop. Completion survives at the same canonical
 * ordinals; best counts are only validated because their boards are being re-authored.
 */
export function migrateV4PuzzleProgress(raw: string | null): PuzzleProgress {
  if (raw === null) return defaultPuzzleProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleProgress();
    const candidate = value as { version?: unknown; completedLevelIds?: unknown; bestPieceCounts?: unknown };
    if (candidate.version !== V4_PROGRESS_VERSION || !Array.isArray(candidate.completedLevelIds)) {
      return defaultPuzzleProgress();
    }
    if (!candidate.completedLevelIds.every(isV4PuzzleId)) return defaultPuzzleProgress();
    const completedLevelIds = orderedV4Unique(candidate.completedLevelIds);
    if (!validHistoricBestPieceCounts(candidate.bestPieceCounts, completedLevelIds)) {
      return defaultPuzzleProgress();
    }
    return {
      version: PROGRESS_VERSION,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: orderedUnique(completedLevelIds).filter((id) => !PUZZLE_REVISION_2_CHANGED_ID_SET.has(id)),
      bestPieceCounts: {},
    };
  } catch {
    return defaultPuzzleProgress();
  }
}

/** Migrates the former completion-only v3 record into v5's revisioned format. */
export function migrateV3PuzzleProgress(raw: string | null): PuzzleProgress {
  if (raw === null) return defaultPuzzleProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleProgress();
    const candidate = value as { version?: unknown; completedLevelIds?: unknown };
    if (candidate.version !== V3_PROGRESS_VERSION || !Array.isArray(candidate.completedLevelIds)) {
      return defaultPuzzleProgress();
    }
    if (!candidate.completedLevelIds.every(isV4PuzzleId)) return defaultPuzzleProgress();
    return {
      version: PROGRESS_VERSION,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: orderedUnique(orderedV4Unique(candidate.completedLevelIds))
        .filter((id) => !PUZZLE_REVISION_2_CHANGED_ID_SET.has(id)),
      bestPieceCounts: {},
    };
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
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: orderedUnique(orderedV2Unique(candidate.completedLevelIds))
        .filter((id) => !PUZZLE_REVISION_2_CHANGED_ID_SET.has(id)),
      bestPieceCounts: {},
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
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: orderedUnique(V2_CAMPAIGN_ORDER.slice(0, Math.max(0, nextIndex)))
        .filter((id) => !PUZZLE_REVISION_2_CHANGED_ID_SET.has(id)),
      bestPieceCounts: {},
    };
  } catch {
    return defaultPuzzleProgress();
  }
}

export function isPuzzleComplete(progress: PuzzleProgress, levelId: PuzzleId): boolean {
  return completedIdsFrom(progress)?.includes(levelId) ?? false;
}

/** The selector only exposes a value after a real canonical successful run. */
export function puzzleBestPieceCount(progress: PuzzleProgress, levelId: PuzzleId): number | null {
  const completedIds = completedIdsFrom(progress);
  if (completedIds === null || !completedIds.includes(levelId)) return null;
  return bestPieceCountsFrom(progress, completedIds)?.[levelId] ?? null;
}

/** Counts the canonical frontier plus individually replayable historical completions. */
export function unlockedPuzzleLevelCount(progress: PuzzleProgress): number {
  return unlockedLevelIdsFrom(progress).size;
}

export function isPuzzleUnlocked(progress: PuzzleProgress, levelId: PuzzleId): boolean {
  return unlockedLevelIdsFrom(progress).has(levelId);
}

export function nextLockedPuzzleLevel(progress: PuzzleProgress): CampaignLevel | null {
  const unlocked = unlockedLevelIdsFrom(progress);
  return CAMPAIGN_LEVELS.find((level) => !unlocked.has(level.id)) ?? null;
}

/**
 * Records one canonical Puzzle completion. UI access is gated separately; this
 * persistence boundary requires canonical identity and a genuine finished Core state.
 */
export function recordCanonicalPuzzleCompletion(
  progress: PuzzleProgress,
  state: GameState,
  expectedLevelId?: PuzzleId,
): PuzzleProgress {
  const completedIds = completedIdsFrom(progress);
  const bestPieceCounts = completedIds === null ? null : bestPieceCountsFrom(progress, completedIds);
  const levelId = state.completedLevelId ?? state.puzzleId ?? expectedLevelId ?? null;
  const snapshotIdentityMismatch = (
    state.completedLevelId !== null
    && state.puzzleId !== null
    && state.completedLevelId !== state.puzzleId
  );
  if (
    completedIds === null
    || bestPieceCounts === null
    || state.mode !== 'puzzle'
    || state.puzzleCompletion !== 'finished'
    || levelId === null
    || !LEVEL_IDS.has(levelId)
    || snapshotIdentityMismatch
    || (expectedLevelId !== undefined && levelId !== expectedLevelId)
    || !isBestPieceCount(state.pieceCount)
  ) return progress;

  const existingBest = bestPieceCounts[levelId];
  if (completedIds.includes(levelId) && existingBest !== undefined && state.pieceCount >= existingBest) return progress;

  return {
    version: PROGRESS_VERSION,
    campaignRevision: PUZZLE_CAMPAIGN_REVISION,
    completedLevelIds: orderedUnique([...completedIds, levelId]),
    bestPieceCounts: {
      ...bestPieceCounts,
      [levelId]: existingBest === undefined ? state.pieceCount : Math.min(existingBest, state.pieceCount),
    },
  };
}
