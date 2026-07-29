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

## Levels 01–10 audit correction candidate — 2026-07-30

- Task: `t15_puzzle_01_10_source_writer`.
- Base: audit-disposition checkpoint `df6e593`.
- Product correction: `2ce309b`.
- Exact changed paths:
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleFlow.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `docs/workstreams/tetris-t15-puzzle/solve-puzzle-batch.mjs`
- `puzzle-levels-01-10.json` was regenerated at the documented bounds and remained
  byte-identical, so it has no Git delta. SHA-256:
  `BA6DBABA314D34165F47DAC33E47CB721EA40E5B30E4EB152E5A0D83D2F597BF`.
- Correction claim:
  - every registered definition exposes and validates explicit `targetRows`;
  - validation, flow tests, source-bound artifact tests and the runner consume
    that metadata directly;
  - a requested range cannot cross a canonical ten-level boundary.
- Evidence:
  - `05–14` probe — expected exit 1 before loader creation; no output file;
  - permitted `01–10` solver — 10 levels / 20 routes verified; artifact hash
    unchanged;
  - four focused Core files — PASS, 4 files / 21 tests, one worker;
  - `npm.cmd run typecheck` — PASS.
- No full suite, build, browser, listener or persistent solver ran.
- Frozen throughout: layouts, names, seeds, setup histories, anchors and both
  completing routes.
- Next action: same curriculum/artifact reviewer statically re-audits
  `bf23126..2ce309b`; no product writer resumes until that verdict.

## Levels 01–10 correction acceptance and 11–20 tooling handoff — 2026-07-30

- Reviewed range: `bf23126..2ce309b`.
- Same rejecting curriculum/artifact reviewer returns `ACCEPT`;
  P0=0, P1=0, P2=0, P3=0, GAP=0.
- Static evidence:
  - 20 explicit target-row map IDs match all 20 registered definitions;
  - validation, tests and runner directly consume `definition.targetRows`;
  - `05–14` rejection occurs before loader creation and before any output write;
  - all 20 frozen `endgame(...)` calls are identical across the range;
  - schema-7 artifact remains the same Git blob and SHA-256.
- Levels 01–10 are accepted and closed.
- Open writer: coordinator as `t15_puzzle_11_20_authoring_writer`.
- Exact open path:
  - `docs/workstreams/tetris-t15-puzzle/search-puzzles.mjs`
- Claim boundary: require an explicit target-row argument in the contract range
  3–7, accept explicit setup-count subsets from 5–15, and use the selected row
  count in scoring, candidate acceptance, validation and output metadata.
- Required proof: `node --check`; two identical bounded four-row smoke runs;
  direct schema, row-count, placement-count, four-cells-per-drop, encoding and
  no-full-row assertions; exact temporary-file and Node-process cleanup.
- Closed: product definitions, IDs, names, seeds, anchors, routes, Core,
  localization, progress/unlock, App, CSS, renderer and every other mode.
- Next action: implement and checkpoint the generalized authoring tool; only then
  open the 11–20 product/route slice.

## 11–20 setup authoring checkpoint — 2026-07-30

- Task: `t15_puzzle_11_20_authoring_writer`.
- Base: `4d4b028`.
- Tooling checkpoint: `306106a`.
- Exact changed path:
  - `docs/workstreams/tetris-t15-puzzle/search-puzzles.mjs`
- Claim: one required `--target-rows 3..7` argument and a `5..15` setup-count
  subset now drive scoring, acceptance, validation and output metadata; the
  first-batch hard-coded three-row constant is gone.
- Static gate: `node --check` — PASS.
- Deterministic four-row smoke:
  - fixed inputs: target rows 4, seed start `1588444900`, four seeds, setup count
    7, two candidates, beam 128, node budget 500,000;
  - both runs completed with two candidates, 91,142 attempted landings and no
    budget exhaustion;
  - both files had SHA-256
    `6D2B28645AEDAC5897F80AC325B2B9FECC02D00502F6A0BB72405CDB27FB104B`;
  - direct assertions passed for schema, explicit row metadata, four occupied
    rows, setup count, four cells per drop, legal encoding and no full row.
- The exact temporary outputs were deleted. The first post-delete expression
  used invalid repeated `Test-Path -LiteralPath` syntax and emitted a
  nonterminating PowerShell error; a corrected standalone check then confirmed
  both files absent. Both short Node processes exited; no listener or server ran.
- Open writer: coordinator as `t15_puzzle_11_20_source_writer`.
- Exact open paths:
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleCampaign.test.ts`
  - `src/game/core/puzzleFlow.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `src/ui/localization.ts`
  - `docs/workstreams/tetris-t15-puzzle/solve-puzzle-batch.mjs`
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-11-20.json`
- Claim boundary: retain visible IDs/ordinals 11–20; replace only their board
  setup, name, level seed and two authored one-anchor placements; set explicit
  target rows to four; freeze two early-diverging public-Core completion routes.
- Closed: 01–10, new 21–50 IDs, persistence, progress/unlock, App/selector, CSS,
  renderer, dependencies and other modes.
- Next action: generate a bounded four-row pool, select a readable progression,
  register only 11–20, solve two routes each, freeze the source-bound artifact,
  and run only focused Core proof plus typecheck.

## Levels 11–20 source candidate — 2026-07-30

- Task: `t15_puzzle_11_20_source_writer`.
- Base: `d14e21e`.
- Candidate: `cdd5e43`.
- Exact changed paths:
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleCampaign.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `src/ui/localization.ts`
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-11-20.json`
- Source claim:
  - visible IDs and ordinals 11–20 are retained;
  - all ten definitions replay legal zero-clear four-row setup histories;
  - explicit target-row metadata is four for every definition;
  - concise structural names replace the legacy names in both languages;
  - exactly levels 11 and 16 carry one immutable headroom anchor each;
  - shorter public-Core route length progresses
    `7, 9, 10, 10, 11, 11, 12, 12, 13, 14`;
  - every route pair first diverges at lock 1.
- Anchor safety: both anchors sit above the four target rows and in columns whose
  four target cells are already occupied, preventing the anchor from filling the
  last missing cell of a target row.
- Frozen artifact:
  - schema 7, batch 11–20, 10 levels, 20 routes, two anchor cells;
  - search bounds: max locks 18, primary beam 600, alternate beam 480;
  - SHA-256
    `BCA55D167E9609D06CF642A373A9AB268E71AD2E7B78486DB48A87CB67F8480E`.
- Verification:
  - focused Core proof — PASS, 4 files / 21 tests, one worker;
  - `npm.cmd run typecheck` — PASS;
  - `git diff --check` — PASS before exact-path staging.
- Resource disposition:
  - the controlled solver exited normally; PID 22596 is absent;
  - both candidate pools and both solver logs were deleted from `.local`;
  - no development server, browser, listener or full build was started.
- Product is frozen. Next action: two independent read-only static audits compare
  `d14e21e..cdd5e43` against the Phase-7 contract. Levels 21–50 remain closed until
  both verdicts are resolved.

## Levels 11–20 static audits and correction opening — 2026-07-30

- Audited product range: `d14e21e..cdd5e43`; candidate record: `cbaf84e`.
- Curriculum/artifact audit: `ACCEPT`; P0=0, P1=0, P2=0, P3=0, GAP=0.
  It matched schema, campaign order, 20 source-bound routes, lock-1 divergence,
  monotonic shorter-route progression, bilingual structural names, source seeds,
  setups, anchors, hash and honest non-optimality claim.
- Rules/scope audit: `REJECT`; P0=0, P1=0, P2=0, P3=0, GAP=1.
  It accepts scope, setup legality, IDs/ordinals, explicit four-row metadata,
  anchor coordinates/immutability and all route completion evidence. The sole gap
  is that route replay does not explicitly assert that no emitted
  `lines-cleared.rows` value equals an anchor's canonical board row.
- Coordinator disposition: relevant, bounded evidence gap; no gameplay or
  curriculum defect is claimed.
- Reopened writer: coordinator as `t15_puzzle_11_20_anchor_row_proof_writer`.
- Exact open path:
  - `src/game/core/puzzleSolverResults.test.ts`
- Required correction: during both frozen public-dispatch route replays, inspect
  existing line-clear event row coordinates and assert no clear targets any
  authored anchor row. Definitions, route streams, artifact bytes, names, seeds,
  Core, UI, and levels 21–50 remain frozen.
- Required proof: four focused Core files / one worker, typecheck, diff check,
  artifact hash unchanged, then narrow static re-audit by the rejecting reviewer.

## Levels 11–20 anchor-row proof candidate — 2026-07-30

- Base: `4785615`.
- Correction candidate: `bb0210f`.
- Exact changed path:
  - `src/game/core/puzzleSolverResults.test.ts`
- Correction: both frozen route replays derive canonical anchor board rows, inspect
  every public `dispatch()` transition, and reject any `lines-cleared.rows` value
  that targets one of those rows.
- Frozen: all definitions, setup histories, seeds, names, route streams, artifact
  bytes, Core behavior, UI and later batches.
- Verification:
  - focused Core proof — PASS, 4 files / 21 tests, one worker;
  - `npm.cmd run typecheck` — PASS;
  - `git diff --check` — PASS;
  - 11–20 artifact SHA-256 remains
    `BCA55D167E9609D06CF642A373A9AB268E71AD2E7B78486DB48A87CB67F8480E`.
- Next action: the same rules reviewer statically re-audits only the GAP closure.

## Levels 11–20 correction acceptance and 21–30 handoff — 2026-07-30

- Re-audited range: `cdd5e43..bb0210f`; candidate record: `4e72f9d`.
- Same rejecting rules reviewer returns `ACCEPT`;
  P0=0, P1=0, P2=0, P3=0, GAP=0.
- Static closure:
  - canonical anchor rows are derived from registered definitions;
  - both frozen routes still execute each command through public `dispatch()`;
  - every real `lines-cleared.rows` coordinate is rejected if it equals an
    authored anchor row;
  - final completion, target exhaustion, anchor count and position proof remains;
  - definitions, setups, names, seeds, routes and artifact bytes are unchanged.
- Levels 11–20 are accepted and closed.
- Open task: `t15_puzzle_21_30_candidate_authoring`.
- Execution-only tool:
  - `docs/workstreams/tetris-t15-puzzle/search-puzzles.mjs`
- Claim boundary: use the unchanged generalized authoring tool to generate
  deterministic five-row candidates under explicit seed, setup-count, beam and
  node budgets. Output stays under `.local` and is not product.
- Sequence: one small smoke process, direct assertions and cleanup; then at most
  one full candidate-pool process if the smoke is healthy.
- Closed: all product source/tests, new IDs, localization, progress/unlock,
  App/selector, CSS, renderer, route artifact, dependencies and other modes.
- Next action: generate and inspect a five-row pool without overlapping tests,
  builds, browser automation or another solver.

## 21–30 candidate authoring checkpoint and source opening — 2026-07-30

- Task: `t15_puzzle_21_30_candidate_authoring`.
- Tool: unchanged `search-puzzles.mjs`.
- Repeated smoke:
  - target rows 5, six seeds, setup counts 8/9/10, four candidates, beam 256,
    node budget 2,000,000;
  - both runs completed four candidates in 1,110,822 attempted landings without
    exhaustion;
  - both outputs had SHA-256
    `1D6444FF989A7817A224B0146BBE4AC1634842B28FA40DC5CDFD4052558DFE10`.
- Full pool:
  - target rows 5, 48 seeds from 1618033988, setup counts 9/10, 60 candidates,
    beam 384, node budget 20,000,000;
  - completed 60 unique board keys across 23 setup seeds in 9,357,752 attempted
    landings without exhaustion;
  - all candidates use ten complete hard drops, 40 original cells, five occupied
    floor rows, empty headroom and no initially full row;
  - SHA-256
    `5C4E61ADF2117FD1B2E47924B8DC713AE0EA44812E86577919FA66993D46768C`.
- Resource disposition: both smoke files and both process logs were deleted;
  generator PID 2664 exited; only the ignored candidate pool remains.
- Open writer: coordinator as `t15_puzzle_21_30_source_writer`.
- Exact open paths:
  - `src/game/core/types.ts`
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleCampaign.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `src/ui/localization.ts`
  - `src/puzzleProgress.ts`
  - `src/puzzleProgress.test.ts`
  - `src/App.test.ts`
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-21-30.json`
- Claim boundary: add IDs 21–30, ten five-row definitions, exactly three safe
  one-anchor levels, bilingual names, 30-definition five-level roster grouping
  that remains all-open, two public-Core routes per new level and the batch
  artifact. App source and visual composition do not change.
- Closed: 01–20 definitions/artifacts, gradual unlock, App source, selector/CSS,
  renderer, dependencies, later batches and other modes.
- Next action: select ten diverse pool entries, register the source, solve and
  reorder complete packages by route evidence, then run only the focused
  definition/campaign/route/progress/App tests plus typecheck.

## 21–30 anchor-carrier correction — 2026-07-30

- The first uncommitted 30-roster source selection passes 5 files / 62 focused
  definition, campaign, flow, progress and App tests.
- Route diagnostics at max locks 24, primary beam 600 and alternate beam 480:
  - unanchored level 21 completes in 11/11 locks;
  - level 22 completes in 17/18 locks;
  - the provisional central anchor package has no primary route;
  - moving that anchor one headroom row higher still has no primary route;
  - removing it completes the same board/seed in 11/15 locks;
  - moving the anchor quota to full-height center or edge columns on other
    ten-drop boards still yields no primary route.
- Disposition: the failure is the dense 40-cell anchor-carrier selection. Do not
  enlarge the solver budget or relax the three-anchor requirement.
- Reopened execution-only task: use unchanged `search-puzzles.mjs` once to create
  a bounded nine-drop/five-row anchor-specific candidate pool under `.local`.
- Ordinary ten-drop candidates remain available. Replace only three provisional
  anchor packages, prefer edge full columns, and require each replacement to pass
  an individual public-Core route probe before a full 21–30 solver run.
- No source checkpoint has been staged or committed; the exact 21–30 source paths
  and every earlier accepted batch remain frozen from external writers.
