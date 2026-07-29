# T15 Phase 7 Puzzle-50 Workstream Log

## Contract preparation — 2026-07-30

- Task: `t15_puzzle_contract`.
- Rollback base: `d78e0e580ceb9375afb57fc8c4230624e4a54a77`.
- Writer: coordinator; no product path is open in this checkpoint.
- Exact contract paths:
  - `docs/DESIGN.md`
  - `docs/CURRENT_TASK.md`
  - `docs/phases/phase 7.md`
  - `docs/phases/README.md`
  - `docs/workstreams/tetris-t15-coordinator/PHASE_MATRIX.md`
  - `docs/workstreams/tetris-t15-puzzle/THREAD_LOG.md`
  - `progress.md`
- Read-only baseline found:
  - current v4 persistence has 20 stable IDs and an all-open policy;
  - its v2 invariant would throw when a twenty-first current ID is added;
  - setup currently requires 8–14 drops, making a legal three-row target band
    impossible;
  - the selector hard-codes four bands and `bandIndex + 5`;
  - normal tests would be too expensive if they re-searched all fifty levels.
- Contract decisions:
  - retain the old 20 IDs in their current visible ordinal positions and add
    `tm-puzzle-21` through `tm-puzzle-50`;
  - re-author all fifty boards into exact 3/4/5/6/7-row curricula;
  - preserve migrated completion but not mislabel old-board best counts as current;
  - require two early-diverging Core-replayed routes for every level;
  - restore explicit progressive unlocking while preserving individually completed
    legacy entries;
  - keep the selector composition and use internal scrolling only.
- Tool note: Serena `initial_instructions` returned `Transport closed` twice during
  baseline orientation. The coordinator stopped retrying and used targeted no-daemon
  repository reads; no Serena process was retained.
- Resource contract: the 2026-07-30 dynamic budget supersedes the earlier temporary
  strong-serial hold. Static audits may run in green; shared source still has one
  writer, and no more than two heavy tasks overlap. Amber serializes new heavy work;
  red starts none. No WMI/CIM.
- Commands actually run: targeted `git status`, `git log/show`, `rg`, and UTF-8
  `Get-Content` only. No test, build, browser, server or product command.
- Evidence: repository line inspection plus one independent static schema/progress
  audit; two broader audit turns were interrupted instead of allowing idle work to
  accumulate.
- Blocker: none for the contract checkpoint.
- Next action: commit this exact docs-only contract, record its SHA, then implement
  v5 persistence against the still-frozen twenty-level source baseline.
