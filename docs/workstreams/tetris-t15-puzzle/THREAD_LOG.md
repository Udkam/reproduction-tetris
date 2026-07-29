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

## Contract checkpoint recorded — 2026-07-30

- Contract checkpoint: `08c0491014c00ff5972ad7471d5bb0126eebae52`.
- Cached paths exactly matched the seven declared docs paths; `git diff --cached
  --check` passed.
- No product, test, dependency, evidence or generated path was included.
- Open writer: coordinator as `t15_puzzle_persistence_writer`.
- Exact open paths:
  - `src/puzzleProgress.ts`
  - `src/puzzleProgress.test.ts`
  - `src/App.tsx`
  - `src/App.test.ts`
- Closed paths: Puzzle definitions/IDs/names, route search/artifact, renderer, CSS,
  other modes, final evidence and changelog.
- Focused gate after the last change in this slice: Puzzle progress tests, affected
  App persistence tests, then typecheck. No full suite/build/browser in this slice.
- Next action: implement v5 and the frozen historic-domain migration without changing
  the current twenty-level all-open runtime.

## Persistence-v5 source checkpoint — 2026-07-30

- Task: `t15_puzzle_persistence_writer`.
- Base: `455dea4`.
- Source checkpoint: `fbec049`.
- Exact changed paths:
  - `src/puzzleProgress.ts`
  - `src/puzzleProgress.test.ts`
  - `src/App.tsx`
  - `src/App.test.ts`
- Claim:
  - current storage is `qingliu:puzzle-completion:v5` with campaign revision 1;
  - v4 visible order and v2 natural order are separate frozen 20-ID domains;
  - v4 completion migrates but retired-board best values do not become current records;
  - v5 is preferred, successful legacy reads write v5 immediately, and old keys stay;
  - the current twenty-level all-open behavior is unchanged in this slice.
- Commands:
  - `git diff --check -- src/puzzleProgress.ts src/puzzleProgress.test.ts
    src/App.tsx src/App.test.ts` — PASS.
  - `npm.cmd run test -- src/puzzleProgress.test.ts src/App.test.ts
    --maxWorkers=1` — PASS, 2 files / 43 tests.
  - `npm.cmd run typecheck` — PASS after correcting test-only literal widening.
  - final focused rerun of the same two test files — PASS, 2 files / 43 tests.
- Cached paths exactly matched the four declared paths; cached diff check passed.
- No full suite, build, browser, solver, server or persistent Node process was started.
- Blocker: none.
- Next action: run one independent read-only static audit of `455dea4..fbec049`;
  correct any persistence/schema finding before opening the 01–10 level batch.
