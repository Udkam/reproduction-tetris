import { describe, expect, it } from 'vitest';
import {
  PUZZLE_DEFINITIONS,
  type PuzzleDefinition,
  type PuzzleSetupPlacement,
} from './puzzles';
import {
  auditPuzzleFingerprints,
  comparePuzzleTopologies,
  createPuzzleExactFingerprint,
  createPuzzleTopologyFingerprint,
  createPuzzleTopologyProfile,
} from './puzzleFingerprints';
import type { PuzzleId } from './types';

const EMPTY_ROW = '..........';

function fixture(
  id: PuzzleId,
  rows: readonly string[],
  options: {
    anchors?: readonly { x: number; y: number }[];
    placements?: readonly PuzzleSetupPlacement[];
    targetRows?: number;
  } = {},
): PuzzleDefinition {
  return {
    id,
    name: id,
    difficulty: 1,
    targetRows: options.targetRows ?? 3,
    seed: 1,
    setup: {
      seed: 2,
      placements: options.placements ?? [{ type: 'T', rotation: 0, x: 3 }],
    },
    boardRows: [...Array.from({ length: 20 - rows.length }, () => EMPTY_ROW), ...rows],
    hiddenCells: [],
    anchorCells: options.anchors ?? [],
  };
}

describe('T32 puzzle structure fingerprints', () => {
  it('normalizes source colors while retaining legal setup geometry in exact fingerprints', () => {
    const left = fixture('t3r-shaft-01', ['..TT......', '..TT......']);
    const recolored = fixture('t3r-shaft-02', ['..OO......', '..OO......']);
    const differentSetup = fixture('t3r-shaft-03', ['..OO......', '..OO......'], {
      placements: [{ type: 'O', rotation: 0, x: 2 }],
    });

    expect(createPuzzleExactFingerprint(left)).toBe(createPuzzleExactFingerprint(recolored));
    expect(createPuzzleExactFingerprint(left)).not.toBe(createPuzzleExactFingerprint(differentSetup));
  });

  it('canonicalizes unused-column translation and horizontal reflection without losing anchors', () => {
    const left = fixture('t3r-shaft-01', ['.TT.......', '.T........'], {
      anchors: [{ x: 3, y: 18 }],
    });
    const shiftedMirror = fixture('t3r-shaft-02', ['......TT..', '.......T..'], {
      anchors: [{ x: 5, y: 18 }],
    });
    const anchorMoved = fixture('t3r-shaft-03', ['......TT..', '.......T..'], {
      anchors: [{ x: 4, y: 18 }],
    });

    expect(createPuzzleTopologyFingerprint(left)).toBe(createPuzzleTopologyFingerprint(shiftedMirror));
    expect(createPuzzleTopologyFingerprint(left)).not.toBe(createPuzzleTopologyFingerprint(anchorMoved));
  });

  it('reports deterministic one-cell near variants and topology metrics', () => {
    const left = fixture('t3r-shaft-01', ['.TT.......', '.T........']);
    const near = fixture('t3r-shaft-02', ['.TT.......', '.TT.......']);
    const comparison = comparePuzzleTopologies(left, near);
    const profile = createPuzzleTopologyProfile(near);

    expect(comparison).toMatchObject({
      exactMatch: false,
      topologyMatch: false,
      nearTopology: true,
      minimumCellDelta: 1,
    });
    expect(profile).toMatchObject({
      ordinaryCells: 4,
      anchorCells: 0,
      connectedComponents: 1,
      enclosedCavities: 0,
      rowCounts: expect.arrayContaining([2]),
      columnCounts: [2, 2],
    });
  });

  it('keeps the inherited campaign free of exact and symmetry-normalized collisions', () => {
    const audit = auditPuzzleFingerprints(PUZZLE_DEFINITIONS);
    expect(audit.exactConflicts).toEqual([]);
    expect(audit.topologyConflicts).toEqual([]);
    expect(audit.nearCandidates).toEqual(expect.any(Array));
  });
});
