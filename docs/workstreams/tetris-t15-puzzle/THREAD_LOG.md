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

## 21–30 sparse anchor follow-up — 2026-07-30

- Nine-drop pool: 30 unique boards, 9 setup seeds, 2,167,578 attempted landings,
  no budget exhaustion, SHA-256
  `1CEDE040361A2B8CE9AE30A9AF5570C21EB68A2680EFE61A05ABE947AEA5F073`.
- Direct assertions pass for nine placements, 36 original cells, exactly five
  occupied floor rows, empty headroom and no initially full row.
- The first selected edge-anchor package still has no primary route at the fixed
  24-lock, 600/480-beam bound. Removing only the anchor completes that exact
  board/seed in 19/22 locks with first divergence at lock 4.
- Disposition: retain the pool as diagnostic evidence, but do not use its
  candidates as final anchor carriers. Run one final bounded eight-drop pool so
  the fixed obstacle, not excess source density, supplies the challenge.
- Final intended batch mix: seven ten-drop ordinary levels plus three eight-drop
  one-anchor levels. Search bounds remain unchanged.

## 21–30 final anchor-density correction — 2026-07-30

- Eight-drop pool: 30 unique boards, 24 processed seeds, 1,845,658 attempted
  landings, no budget exhaustion, SHA-256
  `D1DE0E076538B67A4F3DEDE928035B06F2ACB2698D8CDCF8249A548AF785931B`.
- Direct assertions pass for eight placements, 32 original cells, exactly five
  occupied floor rows, empty headroom and no initially full row.
- Three distinct candidates with different setup seeds and already-full target
  columns were installed only as uncommitted probes. All three have no primary
  route at the fixed 24-lock, 600/480-beam bound.
- Disposition: do not ship the eight-drop carriers, enlarge search bounds or
  reduce the three-anchor quota. Reopen the unchanged authoring tool once for a
  bounded seven-drop/five-row pool, then require each selected carrier to pass
  its own two-route probe before the full batch run.
- Intended batch mix is now seven ten-drop ordinary levels plus three seven-drop
  one-anchor levels. All product edits remain uncommitted inside the existing
  `t15_puzzle_21_30_source_writer` path boundary.

## Levels 21–30 source candidate — 2026-07-30

- Task: `t15_puzzle_21_30_source_writer`.
- Base SHA: `01a2953`; contract corrections during authoring:
  `cf1b1f4`.
- Candidate SHA: `0faf9e7`.
- Exact changed paths:
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
- Candidate claim:
  - 10 deterministic five-row levels, seven ordinary / three one-anchor;
  - anchored carriers use seven legal zero-clear setup drops, ordinary carriers
    use ten;
  - 20 public-Core routes, with shorter-route locks
    `9,10,11,11,11,12,13,13,14,17` and divergence at lock 1–3;
  - existing selector composition and all-open transitional access are retained.
- Artifact SHA-256:
  `FF5849E87C2B1EB18F77F24A8D36C958350C2E950A02000E51C74992B1D01360`.
- Commands actually run after the final source change:
  - `npm.cmd run test -- src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts src/game/core/puzzleFlow.test.ts src/game/core/puzzleSolverResults.test.ts src/puzzleProgress.test.ts src/App.test.ts --maxWorkers=1`
    — PASS, 6 files / 64 tests;
  - `npm.cmd run typecheck` — PASS.
- Evidence:
  - all 20 frozen streams replay through public Core commands;
  - every route finishes with zero original targets;
  - all three anchors remain at their fixed coordinates;
  - no real `lines-cleared.rows` value equals an anchor's canonical row.
- Resource disposition: all ignored pools, probes and solver logs were removed;
  every owned generator/solver PID exited. No server or browser was opened.
- Blocker: none. Independent QA is read-only against `0faf9e7`.
- Next action: record independent definition/route/curriculum disposition before
  opening levels 31–40.

## Levels 21–30 independent acceptance — 2026-07-30

- Candidate: `0faf9e7`; record tip: `49fc642`.
- Route/schema QA: ACCEPT, P0=0, P1=0, P2=0, P3=0, GAP=0.
  - independently confirms 10 five-row definitions, 7 ordinary ten-drop and
    3 anchored seven-drop setups, 20 early-diverging routes at 24/600/480;
  - confirms source/artifact binding, real public-Core terminal replay, target
    exhaustion, anchor-row clear rejection and fixed anchor coordinates.
- Curriculum/boundary QA: ACCEPT, P0=0, P1=0, P2=0, P3=0, GAP=0.
  - independently confirms 01–20 source/artifacts are unchanged;
  - confirms measured within-batch order, three spatially distributed anchors,
    v4 frozen-domain compatibility, all-open 30-level transition and six
    five-level presentation bands;
  - confirms `src/App.tsx` and `src/styles.css` have zero candidate delta.
- Both reviews were read-only and ran no npm command, test, build, browser,
  solver, Node helper or WMI/CIM query.
- Disposition: levels 21–30 are ACCEPTED / CLOSED.
- Next action: push the acceptance point, then open a separate 31–40 candidate
  authoring contract.

## Levels 31–40 candidate-authoring contract — 2026-07-30

- Task: `t15_puzzle_31_40_candidate_authoring`.
- Accepted/pushed base SHA: `fc23cfb`.
- Execution-only tool:
  `docs/workstreams/tetris-t15-puzzle/search-puzzles.mjs`.
- Claim boundary:
  - create separate ignored six-row ordinary (11/12 setup drops) and sparse
    anchor pools;
  - select readable wells, shelves, channels, bridges and overhangs;
  - require exactly three one-anchor packages with every target cell in the
    anchor column already occupied;
  - later verify two early-diverging routes at max locks 30, primary beam 600,
    alternate beam 480.
- Candidate generation sequence: one deterministic smoke, direct assertions and
  cleanup; then at most one ordinary and one anchor full-pool process, never
  overlapping tests, builds, browser automation or another solver.
- Closed until pool inspection: all product/tests/artifact paths, IDs 31–40,
  localization, progress/App count adaptation, unlock/v5, selector/CSS, renderer,
  dependencies, levels 41–50 and other modes.
- Resource boundary: one Node generator at a time, no listener, explicit output,
  owned PID/log cleanup, no WMI/CIM.
- Next action: run and repeat the bounded smoke, compare hashes, then generate
  the two full pools only if the smoke is healthy.

## Levels 31–40 candidate-pool checkpoint — 2026-07-30

- Repeated smoke: both runs completed 4 unique six-row candidates in 1,306,060
  attempted landings without exhaustion and matched SHA-256
  `90A65312136B4D3EFA2F7343967F694ABBF0007459B51BFCC3712C50ED3ECE63`.
- Ordinary pool: 60 unique six-row boards across 18 setup seeds, all using 12
  legal zero-clear drops; 11,872,752 attempted landings, no exhaustion, SHA-256
  `95352981F972D305D9435E1B1B2089B9DF37B687DEFBD1DFF0FAF99862211CEF`.
- Direct ordinary assertions pass for contiguous six-row target bands, 48
  original cells, empty headroom, no initially full row and unique board keys.
- The first sparse-anchor pool used 40 seeds and setup counts 7/8. It completed
  5,731,628 attempted landings without exhaustion but produced zero legal
  six-row candidates; diagnostic SHA-256
  `EF5109E0140F8951C77CF2F25118A0E7983A25CDB6716D2DA75A4EBE96B8666D`.
- Disposition: 7/8 is structurally too sparse to form the required six occupied
  rows under the legal setup contract. Do not weaken target-row or anchor rules.
  Reopen only one anchor pool at 9/10 setup drops; ordinary pool and fixed
  30/600/480 route bounds remain unchanged.

## Levels 31–40 source opening — 2026-07-30

- Anchor retry: 50 unique boards across 16 setup seeds, all using 10 legal
  zero-clear drops; 9,413,436 attempted landings, no exhaustion, SHA-256
  `B70A8204D320FB671A575EA6B640D37D4F2D619AA183651DFC4E872A692CCACC`.
- Direct assertions pass for six contiguous occupied floor rows, 40 original
  cells, empty headroom, no initially full row and unique boards.
- 37 candidates expose at least one target column occupied in all six rows.
- Open writer: coordinator as `t15_puzzle_31_40_source_writer`.
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
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-31-40.json`
- Provisional source selection: ordinary pool positions 1, 2, 3, 4, 8, 9 and
  11 from seven setup seeds; anchor pool positions 1, 12 and 31, using safe
  full columns at right, left and center-right.
- Every anchor package needs an individual two-route probe at 30/600/480 before
  the full batch. Failed packages are replaced; bounds and quota do not change.
- Closed: definitions/artifacts 01–30, unlock/v5, App source, selector/CSS,
  renderer, dependencies, levels 41–50 and other modes.
- Next action: register the provisional ten packages, run focused structural
  tests, then probe only the three anchors.

## Levels 31–40 source WIP resource pause — 2026-07-30

- Task: `t15_puzzle_31_40_source_writer`; base SHA: `4f864af`.
- Status: `WIP_UNCOMMITTED`; no candidate or green checkpoint is claimed.
- Provisional packages are registered in:
  - `src/game/core/types.ts`
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleCampaign.test.ts`
  - `src/ui/localization.ts`
  - `src/puzzleProgress.test.ts`
  - `src/App.test.ts`
- The source currently contains seven 12-drop ordinary boards and three
  10-drop one-anchor boards. Anchors are distributed at left, center-right and
  right headroom; names and gameplay seeds remain provisional until route
  metrics order complete packages.
- Commands actually run after registration:
  - `git diff --check` — PASS;
  - no npm, test, typecheck, build, solver, browser or background Node process
    was started.
- Resource blocker: the latest PDH snapshot showed CPU 48.76%, 5,712 MiB
  available RAM and disk queue 0. The available-memory red threshold is caused
  by an external user-owned game process, not a TetraMorph helper; it was
  inspected and left untouched.
- Last green evidence: both source pools retain their recorded SHA-256 values,
  and the selected setup histories were extracted exactly from those pools.
- Next action: when available RAM is at least 8 GiB and CPU is below the red
  threshold, run the focused structural tests once, then probe only anchored
  IDs 32, 36 and 39 at the fixed 30/600/480 route bounds.

## Levels 31–40 sparse-anchor package correction — 2026-07-30

- Resource admission resumed in green at CPU 44.19%, 15,530 MiB available RAM
  and disk queue 0; no resident project helper was started.
- Re-read both nine-drop pools and matched their recorded SHA-256 values.
- Pool A candidate 5's first provisional gameplay seed `3141592653` duplicates
  accepted level 04 and is rejected. One foreground serial seed sweep retained
  the exact board, setup and `{x:0,y:13}` anchor, rejected its first seed, then
  found unique seed `358294691` on attempt 2 with provisional 8/10-lock routes
  diverging at lock 1. The process and its serial children exited normally.
- The three source replacements are now fixed as complete packages:
  - pool A candidate 5: setup `2236068021`, game `358294691`, anchor
    `{x:0,y:13}`;
  - pool A candidate 7: equivalent legal setup `213511`, game `197830471`,
    anchor `{x:9,y:13}`;
  - pool B candidate 13: setup `3236068023`, game `41326521`, anchor
    `{x:9,y:13}`.
- Next action: replace the three rejected ten-drop definitions, run focused
  structural proof, and then solve the registered definitions at 30/600/480.

## Levels 31–40 ordinary package correction — 2026-07-30

- The pre-existing official level-33 run proves that ordinary-pool candidate 2
  completes only with first canonical landing divergence at lock 10. A later
  repeat was stopped after the foreground command exceeded two minutes; its
  exact residual tree `32916 -> 30428 -> 21652` was released and verified gone.
- Current collaboration state contains one running coordinator and three
  completed historical QA agents; no new agent was created for this slice.
- Post-cleanup resource admission is Amber at CPU 74.10%, 20,742 MiB available
  RAM and disk queue 0. The initial local response was intentionally stricter
  than the repository-wide dynamic budget and paused all heavy work.
- A direct non-WMI process inspection then identified 18 idle Codex-child Node
  processes whose exact command lines were only `./mcp/server.mjs` or
  `./mcp/server.mjs --stdio`. All 18 exact PIDs were released and verified
  absent; no name-wide termination was used. Two unrelated pre-existing Vite
  preview processes on port 4398 were preserved because this task does not own
  them. The current task tree still has one running coordinator and three
  completed historical QA records.
- Ordinary-pool candidate 5 (`setupSeed: 1732050833`) is the provisional
  complete-package replacement for level 33. Its route status remains
  unverified; the old package is not retried and the fixed bounds do not change.
- Next action: register candidate 5 with the existing unique gameplay seed,
  perform only light static checks while Amber, then wait for Green before one
  official registered-definition probe.

## Levels 31–40 bounded Amber execution correction — 2026-07-30

- The repository/global dynamic budget remains authoritative: Amber serializes
  new heavy work; only Red prohibits it. The earlier “wait for Green” note is
  therefore superseded rather than allowed to stall the phase indefinitely.
- Current task ownership remains one coordinator, zero running subagents, zero
  MCP Node helpers, no project browser and no overlapping test/build process.
- One registered level-33 solver may run alone with Idle priority, affinity
  restricted to one logical processor, an exact PID, explicit ignored output
  and bounded polling. If it times out or the machine enters Red, release that
  exact process tree before any other action.
- No second solver, test, build, browser or agent may overlap this probe.

## Levels 31–40 candidate-5 resource containment — 2026-07-30

- Registered level 33 ran as exact Node PID `28940`, Idle priority and affinity
  `1`. It completed the primary search and entered alternate search, but total
  machine CPU reached 95.06%; no result artifact had been written.
- Red containment stopped only its verified tree (`conhost 9604`, then Node
  `28940`) and confirmed both absent. The probe is neither a route pass nor a
  route failure; candidate 5 remains unresolved.
- The immediate follow-up returned to Green at CPU 53.57%, 17,163 MiB available
  RAM and disk queue 0. MCP Node count remains zero.
- Four Node processes that appeared during the probe were inspected by their
  full command lines and belong to the separate `E:\Proj\personal-web` Astro
  preview/dev tasks. They were preserved and are not TetraMorph resources.
- Next action: do not overlap that external workload. Resume at most one
  bounded level-33 probe only after a fresh admissible sample, or replace the
  package if its registered alternate search cannot complete within the fixed
  route domain without repeated Red containment.

## Levels 31–40 level-33 route acceptance — 2026-07-30

- A second and final controlled run used new ignored outputs, exact Node PID
  `33692`, Idle priority and affinity `1`; no other TetraMorph heavy task or
  subagent overlapped it.
- The process exited normally after verifying registered `tm-puzzle-33` at the
  unchanged 30-lock / 600-primary / 480-alternate bounds. Routes use 21 and 24
  locks and first diverge at lock 1.
- The one-level schema-7 artifact is 3,693 bytes. Post-exit admission is Green:
  CPU 17.91%, 18,137 MiB available RAM and disk queue 0.
- Candidate 5 is retained as the complete level-33 package. The original
  candidate-2 carrier remains rejected for lock-10 divergence.
- Next action: verify unresolved ordinary IDs 37, 38 and 40 one at a time before
  considering package order or a full 31–40 batch run.

## Levels 31–40 individual route completion and ordering — 2026-07-30

- Remaining registered ordinary packages pass one at a time with no overlap:
  - selection ID 37: 19/21 locks, divergence 1;
  - selection ID 38: 15/18 locks, divergence 1;
  - selection ID 40: 16/17 locks, divergence 1.
- Each solver used Idle priority, affinity `1`, an exact PID and a unique ignored
  artifact; all exited normally. Post-run CPU remained 21.34–27.33%, available
  RAM 17,612–18,049 MiB and disk queue 0.
- Combined selection metrics are:
  - ordinary: 31 `11/13`, replacement 33 `21/24`, 34 `19/23`,
    35 `18/18`, 37 `19/21`, 38 `15/18`, 40 `16/17`;
  - anchors: 32 `8/10`, 36 `9/9`, 39 `9/12`;
  - all first divergences are lock 1–3.
- Curriculum order is fixed as complete packages:
  `曲井`, `左闸`, `错桥`, `阶井`, `悬台`, `右闸`, `双廊`, `回井`,
  `边塔`, `折桥`. Ordinary shorter-route counts rise
  `11,15,16,18,19,19,21`; anchor checkpoints stay distributed at 32, 36
  and 39 because their 36-cell starts naturally require fewer locks.
- Next action: move each setup/gameplay-seed/anchor/name package atomically,
  update bilingual name expectations, then run structural proof before the one
  full registered 31–40 solver.

## Levels 31–40 registered full-batch artifact — 2026-07-30

- Complete-package reorder and bilingual names pass the five structural files,
  62/62 tests, with one worker.
- The only full-batch solver ran as exact Node PID `21804`, Idle priority and
  affinity `1`, with no overlapping TetraMorph test, build, browser, server or
  subagent. It exited normally.
- Tracked schema-7 artifact:
  `docs/workstreams/tetris-t15-puzzle/puzzle-levels-31-40.json`.
- SHA-256:
  `BBA6FB898DD49F59AB3B26F21011C4A73647B67120F9A6BE0ED8E0CF76EFCB3D`.
- Evidence summary:
  - 10 registered levels / 20 public-Core routes;
  - fixed search bounds `30 / 600 / 480`;
  - locks `11/13, 8/10, 15/18, 16/17, 18/18, 9/9, 19/23,
    19/21, 9/12, 21/24`;
  - divergence `2,1,1,1,1,3,3,1,1,1`;
  - anchors only at 32, 36 and 39;
  - ordinary setup count 12 and anchor setup count 9.
- Next action: bind batch 4 into frozen route replay tests, then run the six
  focused files and typecheck before any source checkpoint.

## Levels 31–40 source candidate — 2026-07-30

- Task: `t15_puzzle_31_40_source_writer`.
- Bounded source-opening base: `4f864af`.
- Product checkpoint: `23970c6`.
- Exact committed paths:
  - `src/game/core/types.ts`
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleCampaign.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `src/ui/localization.ts`
  - `src/puzzleProgress.test.ts`
  - `src/App.test.ts`
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-31-40.json`
- Commands after the last source edit:
  - six focused files, 64/64 tests, one worker — PASS;
  - `npm.cmd run typecheck` — PASS;
  - `git diff --check` and cached diff check — PASS.
- Artifact SHA-256:
  `BBA6FB898DD49F59AB3B26F21011C4A73647B67120F9A6BE0ED8E0CF76EFCB3D`.
- All registered solver PIDs exited. MCP count remained zero; the separate
  `personal-web` and port-4398 processes were preserved.
- Product is frozen. Independent QA is read-only against
  `4f864af..23970c6`; no reviewer may modify source, run a solver, npm, build,
  browser, server or WMI/CIM.
- Next action: collect route/artifact and curriculum/boundary verdicts, resolve
  any finding, then record the candidate disposition before push.

## Levels 31–40 independent acceptance — 2026-07-30

- Candidate product: `23970c6`; documentation record tip: `4674061`.
- Independent route/artifact QA: `ACCEPT`, with
  `P0=0, P1=0, P2=0, P3=0, GAP=0`.
  - Confirmed exact IDs 31–40, six-row setup legality, twenty distinct
    public-Core routes at 30/600/480, anchors only at 32/36/39 and unchanged
    anchor coordinates throughout both routes.
  - Independently matched artifact SHA-256
    `BBA6FB898DD49F59AB3B26F21011C4A73647B67120F9A6BE0ED8E0CF76EFCB3D`.
  - Confirmed the first thirty definitions and their three tracked artifacts
    are unchanged.
- Independent curriculum/boundary QA: `ACCEPT`, with
  `P0=0, P1=0, P2=0, P3=0, GAP=0`.
  - Confirmed exact Chinese/English package order, ordinary route progression,
    distributed anchor lessons, unique IDs/names/seeds/derived boards and
    definition-length-driven eight-band compatibility.
  - Confirmed the selector implementation, other modes, dependencies and
    progress-v5 source remain outside this candidate.
- Both reviewers were read-only and deliberately ran no npm, Node, solver,
  build, browser, server, MCP, Serena or WMI/CIM task. Their static uncertainty
  is covered by the candidate's source-bound 64-test replay gate and typecheck
  and is not an open GAP.
- Disposition: accepted. Next action: commit and push this acceptance point,
  then open levels 41–50 as a separate bounded slice.

## Levels 41–50 candidate-authoring contract — 2026-07-30

- Task: `t15_puzzle_41_50_candidate_authoring`.
- Accepted/pushed base SHA: `d8573e3`.
- Execution-only tool:
  `docs/workstreams/tetris-t15-puzzle/search-puzzles.mjs`.
- Claim boundary:
  - author seven-row synthesis candidates in separate ordinary and
    sparse-anchor pools;
  - retain six ordinary 14/15-drop packages and four 11–13-drop packages with
    exactly one supported headroom anchor each;
  - require every anchor at visible `y=12` on an outer or near-outer column
    occupied through all seven target rows;
  - later verify two early-diverging routes at max locks 36, primary beam 720,
    alternate beam 560.
- Candidate generation sequence:
  - two identical 13-drop smoke runs, direct assertions and hash comparison;
  - at most one ordinary pool and one sparse-anchor pool, sequentially;
  - no pool exceeds 24 seeds, 100 retained candidates or 50,000,000 attempted
    landings.
- Closed until pool inspection: all product/tests/artifact paths, IDs 41–50,
  localization, progress/unlock/v5, App source, selector/CSS, renderer,
  dependencies and other modes.
- Resource boundary: no subagent, test, build, browser or second Node-heavy task
  overlaps candidate generation. Each process uses an explicit ignored output,
  is registered by exact PID/command/purpose and is released at completion.
  No listener, MCP, Serena, WMI/CIM or name-only termination.
- Next action: run and repeat the bounded smoke, compare hashes and direct
  invariants, then decide whether the two full pools can open unchanged.

## Levels 41–50 candidate-pool checkpoint and source opening — 2026-07-30

- Smoke A/B used the same target/seeds/count/beam/budget and both exited:
  - 4 candidates, 98,570 attempted landings, no exhaustion;
  - matching SHA-256
    `33C481CE9299B4D0DBC1704A01A660D0B0FCB0DADA93970AA228DE465CFAB5B0`;
  - direct schema, seven-row, 52-cell, no-full-row, headroom and uniqueness
    assertions pass.
- Ordinary pool:
  - target 7, setup counts 14/15, 24 seeds, beam 384, budget 50,000,000;
  - 80 unique candidates, 7,871,052 attempted landings, no exhaustion;
  - setup mix 78×14 and 2×15;
  - SHA-256
    `932B849801F2DBFDAB6CB381023D24AB78D253B543F165EB4AE4CF88D37D0BC9`.
- Sparse-anchor pool:
  - target 7, setup counts 11/12/13, 24 seeds, beam 384, budget 50,000,000;
  - 80 unique candidates, 9,454,272 attempted landings, no exhaustion;
  - setup mix 0×11, 18×12 and 62×13;
  - 42 expose a fully occupied seven-row support column at `x=0/1/8/9`;
  - SHA-256
    `EABC3BA7858C07517668EDDE9266F9A20FB8A020EE972CFDAB6C3555B112D67E`.
- Measured correction: retain anchors only from 12/13-drop carriers. Do not
  reopen 11 drops or weaken target/support/route requirements.
- Provisional complete-package mapping:
  - 41 ordinary 71; 42 anchor 39 / `x=1`;
  - 43 ordinary 55; 44 ordinary 59;
  - 45 anchor 23 / `x=8`; 46 ordinary 22;
  - 47 anchor 45 / `x=0`; 48 ordinary 38;
  - 49 anchor 77 / `x=9`; 50 ordinary 74.
- Controlled PIDs `8972`, `29672`, `2264` and `4412` all exited. No project
  listener, browser, server, test, build, solver, MCP or subagent overlapped.
  Other unowned Node processes were preserved.
- Open writer: coordinator as `t15_puzzle_41_50_source_writer`.
- Exact open paths:
  - `src/game/core/types.ts`
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleCampaign.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `src/ui/localization.ts`
  - `src/puzzleProgress.test.ts`
  - `src/App.test.ts`
  - `docs/workstreams/tetris-t15-puzzle/puzzle-levels-41-50.json`
- Closed: definitions/artifacts 01–40, unlock/v5 source, App source,
  selector/CSS, renderer, dependencies and other modes.
- Next action: commit this source-opening checkpoint, register all ten packages,
  run focused structural proof, then probe only the four anchors at 36/720/560.

## Levels 41–50 sparse-anchor rejection and bounded retry — 2026-07-30

- Green source WIP registers all ten provisional packages on the seven opened
  source/test paths. Focused structural proof passes 5 files / 62 tests with
  one worker; typecheck passes.
- Registered route failures at unchanged 36/720/560:
  - ID 42 / pool position 39 / 12 drops / `x=1`: no primary;
  - ID 45 / pool position 23 / 13 drops / `x=8`: no primary;
  - ID 47 / pool position 45 / 13 drops / `x=0`: no primary;
  - ID 49 / pool position 77 / 12 drops / `x=9`: no primary.
- Read-only injected probes also reject 12-drop position 46 at `x=1` and
  position 57 at `x=8`; both find no primary at the same bound.
- Every controlled test/solver PID exited before the next began. No project
  browser, build, server, listener, subagent, MCP or second heavy Node
  overlapped.
- Disposition: do not enlarge search bounds and do not keep any failed anchor
  package. Reopen one dedicated target-7, 11-drop candidate pool only:
  64 seeds, beam 512, candidate count 60, landing budget 30,000,000.
- WIP status: uncommitted but structurally green on
  `src/game/core/types.ts`, `src/game/core/puzzles.ts`,
  `src/game/core/puzzles.test.ts`, `src/game/core/puzzleCampaign.test.ts`,
  `src/ui/localization.ts`, `src/puzzleProgress.test.ts` and
  `src/App.test.ts`. Batch-5 artifact and route-test binding remain absent.
- Next action: commit this docs-only measured correction, run the one dedicated
  11-drop pool, and inspect supported candidates before another route probe.
