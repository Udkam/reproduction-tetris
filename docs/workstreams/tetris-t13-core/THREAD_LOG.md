# T13 Endgame Core Workstream Log

## 2026-07-23 — TETRIS-T13-ENDGAME-004 source checkpoint

- Base: `c284d4c`; candidate: `b789833`
  (`feat(puzzle): author multi-route endgame workshop`). Exact paths:
  `src/game/core/puzzles.ts`, `src/game/core/puzzleRouteSearch.ts`, their focused
  Core tests, and `puzzle-endgame-results.json`.
- Result: all 20 Puzzle starts are now legal zero-clear hard-drop histories rather
  than hand-excavated masks. The public workshop order is calibrated across five
  five-row, five six-row, five seven-row, and five eight-row endgames. Six boards
  contain one coordinate-pinned, non-target anchor in a bottom-row release gap; a
  direct regression proves the anchor changes the next ordinary clear while never
  covering an original target.
- Choice design: each level owns a fixed seven-bag gameplay seed and two independently
  Core-replayed public-input route families. They diverge on the first landing, so the
  alternate is a structural opening choice rather than a cosmetic late variation.
  The recorded routes are proof and guide material only: no timer, lock count, or
  unique-answer constraint is exposed to the player.
- Commands run: `npm.cmd run typecheck`; focused Core suite
  `npm.cmd run test -- src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts
  src/game/core/puzzleFlow.test.ts src/game/core/puzzleSolverResults.test.ts`
  (8 files / 59 tests passed); and
  `npm.cmd run test -- src/game/core/puzzleRouteSearch.test.ts` (1 file / 3 tests
  passed). The formal route artifact was emitted beforehand by a full 20-level Core
  replay with primary and alternate streams; each route finishes with zero targets.
- Evidence: `puzzle-endgame-results.json` schema 6 records all 20 setup seeds/counts,
  anchors, ordered campaign positions, route metrics, compact public command streams,
  and first-divergence locks. Local candidate search scratch material remains ignored
  under `.local/audits/t13-endgame-search/` and is not product source.
- Blocker: none. Next: replace the retired tier gating and guide copy with an all-open,
  non-spoiling workshop presentation, then validate the page against the new Core data.
