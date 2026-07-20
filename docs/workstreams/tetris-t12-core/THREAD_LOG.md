# T12 Core Workstream Log

## 2026-07-21 — TETRIS-T12.6-CORE-ANCHOR-002 source candidate

- Base: `6cc1ebf`; candidate: `433562f` (`feat(puzzle): restore immutable curriculum anchors`).
- Exact paths: `src/game/core/puzzles.ts`, `src/game/core/puzzles.test.ts`,
  `src/game/core/puzzleCampaign.test.ts`, `src/game/core/puzzleFlow.test.ts`,
  `src/game/core/puzzleSolverResults.test.ts`, and
  `docs/workstreams/tetris-t12-core/puzzle-solver-results.json`.
- Result: nine authored levels now carry ten total immutable single anchors (one
  selected board carries two). Every anchor is above its initial three-through-seven
  row target band, outside the opening spawn lane, excluded from original-target
  ownership, and loaded as the renderer's existing anchor material. The route artifact
  is schema v4 and records every anchor coordinate alongside the pre-existing command
  stream.
- Commands run: `npm.cmd run typecheck`; `vitest run`
  `src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts`
  `src/game/core/puzzleFlow.test.ts src/game/core/puzzleSolverResults.test.ts`
  (8 files / 58 tests passed). The replay test proves every final board preserves each
  anchor at its original world coordinate after ordinary line resolution.
- Blocker: none. Next: replace the Puzzle atlas selector with the T12.6 current rail,
  then run the single final whole-slice verification and independent QA.

## 2026-07-20 — TETRIS-T12.5-CORE-041 source candidate

- Base: `69eec5f`; integrated source candidate: `d2469e3`.
- Exact paths: `src/game/core/puzzles.ts`, `src/game/core/types.ts`,
  `src/game/core/engine.ts`, `src/game/core/puzzles.test.ts`,
  `src/game/core/puzzleCampaign.test.ts`, `src/game/core/puzzleFlow.test.ts`,
  `src/game/core/puzzleSolverResults.test.ts`, `src/game/core/puzzleUndo.test.ts`,
  `src/game/input/InputController.ts`, `src/game/input/InputController.test.ts`,
  `src/game/runtime/GameRuntime.ts`, `src/game/runtime/GameRuntime.test.ts`,
  `src/game/runtime/qaScenario.ts`, `src/game/runtime/qaScenario.test.ts`,
  `src/game/render/presentation.test.ts`, `src/puzzleProgress.ts`,
  `docs/workstreams/tetris-t12-core/puzzle-solver-results.json`,
  `scripts/capture-tetris-t3-evidence.py`, and `tools/solve-puzzle-campaign.cpp`.
- Result: all twenty deterministic levels are shallow direct target bands: early
  levels are obvious single-piece gaps, then one ordinary rotation, then clear vertical
  I channels. No authored anchor, timed input, budget, or budget terminal remains.
  The route fixture is a Core-dispatched clearability proof only—not an optimum or
  player limit.
- Undo: a nonrecursive pre-lock checkpoint restores board, target ownership, active
  piece, queue/randomizer, timers, score, lines, and count. The hard-drop path snapshots
  before translation and scoring, so the previously observed score residue is covered.
- Commands run: focused Core/input/runtime undo matrix (10 files / 72 tests), focused
  curriculum/replay matrix (12 files / 69 tests), focused presentation test (3 files /
  16 tests), then coordinator final typecheck/full suite/build.
- Independent read-only Core QA accepted `69eec5f..d2469e3` with no P0–P2 finding;
  its disposition is recorded in `aa23394`. Next: coordinator publication only.
