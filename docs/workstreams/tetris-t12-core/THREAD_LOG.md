# T12 Core Workstream Log

## 2026-07-22 — TETRIS-T12.7-GUIDANCE-005 coordinator candidate

- Base: `c47b90c`; ordered candidate checkpoints are `8ad3943`
  (`docs(puzzle): define multi-route guidance contract`), `6acccdd`
  (`feat(puzzle): record alternate replay routes`), `8190f72`
  (`feat(puzzle): add gradual strategy guidance`), and `c17fdcd`
  (`fix(puzzle): fit strategy guide in short viewports`). Exact changed source and
  contract paths are `docs/DESIGN.md`, `docs/CURRENT_TASK.md`,
  `docs/workstreams/tetris-t12-core/puzzle-solver-results.json`, `src/App.tsx`,
  `src/App.test.ts`, `src/styles.css`, `src/puzzleHints.ts`, `src/puzzleHints.test.ts`,
  `src/game/core/puzzleRouteSearch.ts`, `src/game/core/puzzleRouteSearch.test.ts`, and
  `src/game/core/puzzleSolverResults.test.ts`. Ignored local `Solutions/` and `.local/`
  evidence paths remain outside the candidate.
- Result: all twenty fixed Puzzle queues have two Core-replayed route families with a
  genuine locked-placement divergence at lock one or two. Alternate routes finish
  within zero to two locks of the canonical replay, so the already ascending
  three-through-seven-row curriculum retains its authored patterns, IDs, queues, and
  unlock order rather than manufacturing a second answer through redundant commands.
  The new guide gates after two placed pieces or twenty active seconds, persists once
  unlocked for that level, presents a structural reading cue plus two named plans and one intention
  at a time, and leaves the live puzzle untouched. Opening pauses a running Puzzle;
  closing resumes that exact state. It retains `B` undo as player-controlled recovery.
- Commands run: targeted route/persistence/UI tests while editing; local ignored
  walkthrough replay plus Markdown-link verification (20 walkthroughs, 126 linked PNG
  snapshots); final `npm.cmd run typecheck`; final `npm.cmd run test` (47 passed / 1
  skipped files; 294 passed / 2 skipped tests); final `npm.cmd run build` (744 modules);
  and a live Playwright audit at 1440 × 900, 390 × 844, and 844 × 390. The browser
  audit used two real desktop hard drops to unlock the guide, switched to the alternate
  strategy and next intention, closed it to prove pause/resume and unchanged runtime
  state, and checked one canvas, zero DOM cells, zero document overflow, zero
  console/page errors, plus `prefers-reduced-motion` transition removal.
- Evidence: local final-candidate screenshots and audit summary are under ignored
  `.local/audits/t12.7-hints/`; the landscape repair keeps the return control readable
  and clickable in the 844 × 390 view. No browser listener, ticker, audio, canvas, Core
  rule, or randomizer change is part of this slice.
- QA disposition: coordinator validation only. Independent read-only Core and
  visual/browser QA is still pending, so this candidate must not be described as
  accepted. Blocker: none for the user-authorized recovery record. Next: push the
  recoverable `main` history, then obtain and record independent QA before acceptance.

## 2026-07-21 — TETRIS-T12.6-OBSERVATORY-004 coordinator candidate

- Base: `d3c643a`; source candidate: `0149f60` through the ordered checkpoints
  `7759c28`, `de6eed7`, `b8e1516`, and `0149f60`. Exact changed paths are
  `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `src/App.tsx`, `src/App.test.ts`,
  `src/styles.css`, and `src/game/runtime/qaScenario.ts`. Ignored local recovery
  paths under `Solutions/` remain outside the candidate.
- Result: Puzzle selection is now the text-light Current Observatory: seven numbered
  route sectors, only the active tier's three compact stops, one dominant selected
  deep-well preview, one selected name/status/anchor note/start action, and a compact
  tier-gate line. It has one-shot field/route/well motion, a complete reduced-motion
  fallback, local bundled-font loading, and no route thumbnails, card wall, duplicate
  field labels, row counters, or technical-English decoration. The runtime QA replay
  now consumes the recorded public route for current `t5r-drift-08`, so the whole
  suite exercises the revised five-row challenge instead of the superseded one-lock
  board.
- Commands run: focused `npm.cmd run typecheck` plus `vitest run src/App.test.ts`
  (13 tests passed); focused `vitest run src/game/runtime/qaScenario.test.ts`
  (3 files / 6 tests passed); final `npm.cmd run typecheck`, `npm.cmd run test`
  (45 passed / 1 skipped files; 287 passed / 2 skipped tests), and `npm.cmd run
  build` (741-module production build passed).
- Browser evidence: local Playwright audit captured 1440 × 900, 390 × 844, and
  844 × 390 selector frames. Each has document dimensions equal to its viewport,
  exactly one selected preview, zero route previews, seven sector controls, three
  active-tier stops, and zero console errors. A 390 × 844 reduced-motion pass reports
  `none` for field, sector, stop, well, and sweep animations. Starting the selected
  board produced exactly one canvas with no console error.
- QA disposition: this is coordinator validation only, not independent acceptance.
  No independent reviewer is available in the current single-coordinator task; any
  recovery push must remain explicitly pending independent read-only Core and visual
  QA.
- Blocker: none for a user-authorized recovery record. Next: append the non-acceptance
  changelog record, create the documentation checkpoint, and push the recoverable
  `main` history without calling the candidate accepted.

## 2026-07-21 — TETRIS-T12.6-SOLUTION-RECHECK-003 local recovery artifacts

- Base: `d3c643a`; no runtime or Core source changed. Persistent local-only outputs are
  ignored `Solutions/Solution-1.md` through `Solutions/Solution-20.md` plus 126 linked
  PNG board snapshots. The ignored local generator and rasterizer remain only to
  regenerate those recovery artifacts; neither enters a source checkpoint.
- Result: every artifact command stream was freshly replayed through public Core
  `dispatch()` from the fixed Puzzle state. All twenty finish on their last command,
  leave zero original targets, match the recorded lock count, and preserve every
  authored immutable anchor at its world coordinate. The campaign remains in ascending
  `(target rows, locks, rotations, moves, command count, id)` order; no reordering was
  required.
- Commands run: local walkthrough generator/replay; focused
  `vitest run src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts
  src/game/core/puzzleFlow.test.ts src/game/core/puzzleSolverResults.test.ts
  src/App.test.ts` (9 files / 71 tests passed); `npm.cmd run typecheck`; and a local
  Markdown-link resolver for all 20 walkthroughs. Three representative PNGs, including
  an anchored level-20 terminal state, were rendered and visually inspected.
- Blocker: none for the local recovery artifacts. Next: finish the selector checkpoint,
  then run the whole-slice verification, independent QA disposition, changelog update,
  and coordinator push.

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
