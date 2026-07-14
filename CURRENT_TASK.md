# Current Task

## Active slice: T2 — D4 Offset Drop candidate awaiting independent QA

Branch: `codex/tetris`

Baseline: `0a28a1f4efad72296e46b0a91d859c45cc300edf` (accepted and pushed T1)

Status: **candidate awaiting independent QA**. The local candidate is not a release,
has not been independently accepted, and must not be pushed from this status.

### Authorized scope

- Remove player Hold/暂存 from the deterministic core, renderer, input, controls,
  replay/hash coverage, and all player-facing UI.
- Preserve the completed Hold removal, Marathon/Race rules, and leaderboard work;
  finish a third, deterministic, clean-room Puzzle mode under the frozen `DESIGN.md`
  rules without adding a fourth mode.
- Implement the D4 Offset Drop UI from read-only design SHA
  `7fc81433736e3279f7a7075f0d9054ec31d5c67f`: the compact 1:2 game cluster, complete
  mode names, ready/playing/pause/mode-switch contracts, unique Next, and responsive
  desktop/portrait/landscape layouts.
- Version and harden local leaderboard persistence, mode-specific validation, sorting,
  and migration without putting storage into the core.
- Keep the accepted Pixi/React architecture, fast held soft drop, and responsive
  desktop/portrait/landscape composition intact. Do not create DOM board cells.
- Add final-candidate evidence for rules, ready surfaces, play, completion,
  leaderboard, pause, geometry, one canvas, zero DOM cells, and zero console errors.

### Frozen non-goals

- No gameplay changes outside the frozen three-mode rules and presentation shell.
- No render-architecture rewrite, DOM cell grid, multiplayer, accounts, backend, or
  online leaderboard.
- No copied commercial assets, music, fonts, logos, screens, level layouts, or exact
  trade dress.
- No work in `E:\Proj\Game-1-temple` and no interaction with
  `docs/screenshots/temple/`.

### Completed implementation evidence

The coordinator accepted the D4 development visual gate and the 001A mode-switch
preview-removal correction. The checked-in formal evidence under
`docs/qa/evidence/tetris-t2/` contains 16 real-runtime captures across 1440 × 900,
390 × 844 DPR3, and 844 × 390 DPR3; rules/replay proof; input proof; geometry; and
PNG/JSON SHA-256 records. It reports `result: "passed"`, one canvas, zero gameplay
DOM cells, no overflow, and zero console/page errors.

### Candidate gate record

No `npm ci` was needed because the existing dependency tree was available. Before the
001A correction, the same worktree completed one full 47/47 Vitest run and one build.
After the correction, `npm.cmd run typecheck` and the renderer/runtime delta suite
(2 files, 5 tests) passed. The one formal browser capture later completed with
`result: "passed"`; it must not be rerun. The candidate is committed locally only and
is now handed to independent QA for clean verification and acceptance.
