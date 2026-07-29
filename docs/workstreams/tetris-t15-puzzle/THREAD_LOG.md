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

## Persistence-v5 independent audit and 01–10 tooling handoff — 2026-07-30

- Reviewed range: `455dea4..fbec049`.
- Independent reviewer: existing read-only task
  `/root/phase6_baseline_audit`; no test, build, browser, server or solver command.
- Final verdict: **ACCEPT**, P0–P3/GAP all zero.
- The reviewer initially treated clearing v4 best counts as data loss. On rereading
  the frozen Phase-7 rule—old-board bests remain historical and cannot become
  current-board records—it withdrew that finding.
- Verified behavior:
  - frozen v4 completion migrates in its visible order;
  - retired-board best counts do not become Phase-7 records;
  - successful legacy migration writes v5 and leaves every old key intact;
  - v5-to-v1 read priority and fail-closed current parsing are preserved;
  - the current twenty-level presentation remains all-open.
- The existing four-band builder is intentionally deferred to the later
  unlock/expansion checkpoint, so it is not a persistence-slice gap.
- Open writer: coordinator as `t15_puzzle_01_10_authoring_writer`.
- Exact open path:
  - `docs/workstreams/tetris-t15-puzzle/search-puzzles.mjs`
- Claim boundary: one deterministic, bounded, terminating setup-candidate generator
  for exactly three visible target rows and 5–7 legal zero-clear setup drops. It may
  emit only to an explicit output path. Product definitions, Core solver, route
  artifact, IDs, localization, progress/unlock, App, CSS and renderer remain closed.
- Required focused proof: a small deterministic smoke generation with explicit
  output path, schema/constraint assertions, and verified process exit. Generated
  output is disposable until a separate evidence checkpoint.
- Next action: implement and checkpoint the authoring tool, release its Node process,
  then freeze the exact 01–10 product/solver paths before importing any candidate.

## 01–10 setup authoring checkpoint — 2026-07-30

- Task: `t15_puzzle_01_10_authoring_writer`.
- Base: `32d07b0`.
- Tooling checkpoint: `b6acd46`.
- Exact changed path:
  - `docs/workstreams/tetris-t15-puzzle/search-puzzles.mjs`
- Claim: one dependency-free, deterministic, node-budgeted generator for legal
  5–7-drop candidates whose occupied target band is exactly three visible rows.
- Static gate: `node --check` — PASS.
- Deterministic smoke:
  - fixed inputs: seed start `1588444900`, four seeds, setup counts `5,6`, four
    candidates, beam 128, node budget 300,000;
  - both runs completed with four candidates, 129,292 attempted landings and no
    budget exhaustion;
  - both UTF-8 JSON files had SHA-256
    `18530A8C19C9DDF489178B9E87146F0883C9A4BD24D430856314F7A66C22790E`;
  - direct assertions proved schema 1, exactly 3 occupied rows, complete setup
    counts, four cells per placement, legal board encoding and no full row.
- Both explicit temporary outputs were deleted after inspection. The two short
  script processes exited; no server, browser or persistent solver was started.
- Open writer: coordinator as `t15_puzzle_01_10_source_writer`.
- Exact open paths:
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleCampaign.test.ts`
  - `src/game/core/puzzleFlow.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `src/ui/localization.ts`
  - `docs/workstreams/tetris-t15-puzzle/solve-puzzle-batch.mjs`
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-01-10.json`
- Closed: levels 11–20, new 21–50 IDs, progress/unlock, App/selector, CSS,
  renderer, other modes, dependencies and final evidence.
- Runner form: `.mjs` uses Vite's existing in-process SSR loader only to import the
  TypeScript Core, never listens on a port, closes the loader in `finally`, and
  avoids adding a dependency or a skipped authoring test to the normal suite.
- Next action: generate a bounded candidate pool, register only ten selected
  definitions, replay two early-diverging routes per level through public Core
  dispatch, then freeze their source-bound artifact and focused tests.

## Levels 01–10 source candidate — 2026-07-30

- Task: `t15_puzzle_01_10_source_writer`.
- Base: `1075400`.
- Source candidate: `bf23126`.
- Exact paths:
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleCampaign.test.ts`
  - `src/game/core/puzzleFlow.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `src/ui/localization.ts`
  - `docs/workstreams/tetris-t15-puzzle/solve-puzzle-batch.mjs`
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-01-10.json`
- Product claim:
  - visible IDs and ordinals 01–10 stay fixed while their boards become ten unique
    legal three-row setup histories;
  - concise bilingual structural names replace the retired names;
  - setup counts use six drops for 01–04/08 and five for 05–07/09–10;
  - 01–05 have no anchor and 09 is the single anchored board in this batch;
  - shortest verified locks are `4,4,5,5,5,5,6,6,6,6`;
  - 20/20 routes finish through public Core `dispatch()` and first diverge at lock 1.
- Source-bound artifact schema 7 records each setup, both compact command streams,
  clear distribution, maximum height, peak holes, per-lock branch widths, route
  input metrics, first divergence and anchor count. It explicitly rejects an
  optimality claim.
- Search bounds: maximum 18 locks, primary beam 900, alternate beam 700. One
  in-process Vite SSR loader ran without a listener and closed in `finally`.
- Final focused commands after the last source edit:
  - four Core files — PASS, 4 files / 21 tests, one worker;
  - `npm.cmd run typecheck` — PASS.
- Candidate-pool and one-level probe JSON files were deleted. No full suite, build,
  browser, server or persistent solver was run.
- Product is frozen. Two existing read-only tasks may now audit in parallel:
  one for setup/Core/anchor/scope rules and one for route artifact/difficulty/name
  evidence. Neither may edit or run tests/build/browser/solver.
- Next action: resolve both verdicts before opening levels 11–20.

## Levels 01–10 audit disposition and correction handoff — 2026-07-30

- Candidate: `bf23126`; audit range `1075400..bf23126`.
- The setup/Core/anchor/scope reviewer returns `ACCEPT` with P0–P3/GAP all zero.
- The curriculum/artifact reviewer returns `REJECT` with P0/P1/P3/GAP zero and
  two P2 findings:
  1. target-row count remains derived from difficulty instead of explicit
     per-level metadata;
  2. the runner limits a request to ten entries but does not reject a request
     that crosses canonical ten-level groups.
- Reopened exact paths:
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleFlow.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `docs/workstreams/tetris-t15-puzzle/solve-puzzle-batch.mjs`
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-01-10.json`
- Frozen throughout correction: IDs, ordinals, names, seeds, setup histories,
  anchors and both completing routes.
- Next action: add and validate explicit target-row metadata for every registered
  definition; make the runner reject cross-group ranges before opening its Vite
  loader; regenerate the 01–10 artifact; rerun the four focused Core files plus
  typecheck; return the exact correction range to the rejecting reviewer.
