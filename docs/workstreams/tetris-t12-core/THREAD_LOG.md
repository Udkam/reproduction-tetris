# T12 Core Workstream Log

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
- Blocker: independent read-only Core QA is pending. Next: accept/reject the exact
  `69eec5f..d2469e3` candidate range without changing source.
