# T32 Puzzle Workstream Log

## 2026-08-05 — contract queue checkpoint (WIP_UNCOMMITTED)

- Task ID: `/root/t32_contract_docs`
- Owner: bounded documentation writer; coordinator remains `/root`.
- Base SHA: `2edc1dda8fd873ca8cc4b9e5a404d617c55d1731` on `main`.
- Status: **QUEUED / BLOCKED ON T31 ACCEPTANCE**. No T32 product work is authorized.
- Exact changed paths:
  - `docs/DESIGN.md`
  - `docs/CURRENT_TASK.md`
  - `docs/phases/t32-puzzle-curriculum-rebuild.md`
  - `progress.md`
  - `docs/workstreams/tetris-t32-puzzle/THREAD_LOG.md`
- Contract recorded: 50 total levels; 10 rebuilt Intro; 20 all-open Easy; 20
  mastery-gated Hard; replacements at positions 36/38/47; two public-command Core
  replays for each changed board; exhaustive strict optima for gating Easy boards;
  `optimum + 5` thresholds; replay-auditable technique correspondence.
- Isolation: active T31 Mutation/audio/arrival dirty paths and inherited T27 evidence
  remain owner-controlled, unstaged, and untouched. Any eventual shared-path collision
  is a stop condition.
- Commands actually run: UTF-8 read-only inspection of `AGENTS.md`,
  `docs/COMMIT_POLICY.md`, the active document heads, latest changelog entry, branch,
  base SHA, and target-path status; exact-path directory creation for this log; one
  `apply_patch` invocation for the five declared documentation paths; exact-path
  `git diff --check`, diff-stat, heading/status search, existence check, and UTF-8
  content review for the final documentation delta.
- Tests/build/services/browser: not run by explicit task boundary; no product claim was
  made and no persistent resource was started.
- Evidence: this queued contract and the unchanged open acceptance matrices only.
- Blocker: T31 has not completed implementation and multi-round acceptance.
- Next action: coordinator reviews this exact docs delta, keeps T32 queued, and admits
  T32 only after T31 closure with a renewed Git/path/board audit.

## 2026-08-05 — admission after T31 acceptance

- Task ID: `/root/t32_post_t31_audit`
- Owner: coordinator `/root`; read-only audit may be delegated, but product paths have
  no writer until the roster/path contract is frozen.
- Accepted product/test source: `7c4a9a1`; evidence: `735effe`.
- Admission evidence: final typecheck, complete suite (`369 passed / 3 skipped`), build,
  one-Canvas/zero-error browser audit, and independent QA P0 0 / P1 0 / P2 0 / P3 0.
- Status: **ACTIVE / POST-T31 AUDIT**. No T32 product source edit is yet authorized.
- Inherited exclusions: `docs/evidence/t27/**`,
  `docs/evidence/t27-r1-followup/**`, and unrelated `progress.md` delta.
- Next action: inventory the fifty registered boards, route artifacts, exact/near-
  duplicate topology, strict solver capabilities, progression schema, and source-path
  collisions; then freeze the final 10/20/20 roster and checkpoint budget.

## 2026-08-05 — post-T31 audit freeze

- Task ID: `/root/t32_post_t31_audit`.
- Owner: coordinator `/root`; independent audit was read-only.
- Base SHA: `c43e893` on `main`.
- Status: **AUDIT FROZEN / FINGERPRINT CHECKPOINT AUTHORIZED**.
- Current-state findings: 50 stable IDs; live split 3 Intro / 27 Easy / 20 Hard;
  only the first three fresh levels open; five schema-7 artifacts contain 100 current
  Core-replayed routes; 37 unchanged boards / 74 routes are revalidation candidates;
  changed positions 01-10, 36, 38, and 47 need 26 new routes.
- Strict-proof finding: all three historic exact certificates target positions 04-06
  and become invalid after the Intro rebuild, so reusable T32 gating certificates are
  zero. The current exact solver directly supports anchor-free Easy positions 12-15,
  17-21, 23-25, and 28-30; no optimum or Easy-to-Hard pairing is frozen yet.
- Migration freeze: campaign revision 2; preserve unchanged-board completion/best
  records, clear both for the thirteen changed stable IDs, and do not let historic
  Hard completion unlock sibling Hard content.
- First writer scope: only `src/game/core/puzzleFingerprints.ts` and
  `src/game/core/puzzleFingerprints.test.ts`. `puzzles.ts`, progression, mastery,
  lessons, routes, UI, and evidence remain read-only.
- Commands actually run: targeted UTF-8 reads and `rg` over the T32 contract, campaign,
  progression, mastery, solver and route structure; Git status/log; no tests, build,
  server, browser, watcher, index, or solver.
- Inherited exclusions remain `docs/evidence/t27/**`,
  `docs/evidence/t27-r1-followup/**`, and `progress.md`.
- Next action: commit this audit correction, implement the two-file fingerprint
  foundation, run its focused test/typecheck, and commit the first green source claim.

## 2026-08-05 — fingerprint foundation green

- Task ID: `/root/t32_fingerprint_foundation`.
- Owner: coordinator/writer `/root`.
- Base SHA: `90d12c2` on `main`; source checkpoint: `da8e2b9`.
- Exact changed paths:
  - `src/game/core/puzzleFingerprints.ts`
  - `src/game/core/puzzleFingerprints.test.ts`
- Result: exact structural, reflection/translation-normalized topology, deterministic
  near-topology metrics, and campaign-wide audit are implemented without changing any
  puzzle definition. The current campaign has no exact or normalized-topology
  collision; near matches remain review candidates rather than automatic acceptance.
- Commands actually run:
  - `npm.cmd run test -- src/game/core/puzzleFingerprints.test.ts` — PASS, four tests.
  - `npm.cmd run typecheck` — first run exposed unsupported `findLastIndex`; the bounded
    implementation was corrected, and the final run passed.
  - focused fingerprint test rerun — PASS, four tests.
- Inherited exclusions remained untouched and unstaged: `docs/evidence/t27/**`,
  `docs/evidence/t27-r1-followup/**`, and `progress.md`.
- Next action: commit the evidence-backed Intro/Easy/Hard technique roster, then repair
  the bounded player-reported T31-R2 status/Next/expiry-latch regressions before any
  campaign definition edit.

## 2026-08-05 — rebuilt Intro 01–03 route checkpoint

- Task ID: `/root/t32_intro_01_03`.
- Owner: coordinator/writer `/root`.
- Base SHA: `822cbe2` on `main`; definition checkpoint: `86609c4`; route-proof
  checkpoint: `07bbc83`.
- Status: **GREEN BOUNDED CHECKPOINT / T32 REMAINS ACTIVE**. This is not the complete
  ten-level Intro rebuild and does not authorize a final campaign acceptance claim.
- Exact changed paths:
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `src/game/core/puzzleRouteSearch.test.ts`
  - `docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-01-03.json`
- Definitions: positions 01–03 retain their stable IDs but now use the admitted
  `补行`, `留井`, and `托台` boards. Each setup is a legal six-piece, three-row Core
  replay with no initial full row and no anchor.
- Route proof: the one-shot batch solver emitted two non-equivalent public-command
  routes for every changed board and replayed all six through production Core. Route
  lock counts are `4/4`, `4/8`, and `5/6`; this proves solvability and route plurality,
  not strict optimality.
- Historical evidence boundary: the T15 route JSON remains unchanged. T32 tests overlay
  only the admitted 01–03 records when binding active definitions, preserving the
  historical archive while preventing stale-route false positives.
- Commands actually run:
  - bounded candidate search over seeds `5200001..5200024`, setup counts `5,6,7`,
    30 requested candidates, beam 700, and a 3,000,000-node budget — terminated at the
    budget after producing candidate material; candidate output alone was not accepted
    as proof.
  - `node docs/workstreams/tetris-t15-puzzle/solve-puzzle-batch.mjs --from 1 --to 3
    --max-locks 14 --primary-beam 900 --alternate-beam 750 --output
    docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-01-03.json` — PASS, six
    production-Core replays.
  - `npm.cmd run test -- --run src/game/core/puzzles.test.ts
    src/game/core/puzzleCampaign.test.ts src/game/core/puzzleFingerprints.test.ts` —
    PASS, 15 tests.
  - `npm.cmd run test -- --run src/game/core/puzzles.test.ts
    src/game/core/puzzleCampaign.test.ts src/game/core/puzzleFingerprints.test.ts
    src/game/core/puzzleSolverResults.test.ts src/game/core/puzzleRouteSearch.test.ts` —
    PASS, 21 tests in five files.
- Full suite/build/browser/independent QA: intentionally deferred until the last T32
  source edit. No service, watcher, browser, or persistent solver was started.
- Inherited exclusions remained untouched and unstaged: `docs/evidence/t27/**`,
  `docs/evidence/t27-r1-followup/**`, and `progress.md`.
- Next action: author and prove the bounded 04/06 technique pair, checkpoint it, then
  continue 05/07/08/09 and finally the anchor-side-slip position 10.

## 2026-08-05 — rebuilt Intro 04/06 route checkpoint

- Task ID: `/root/t32_intro_04_06`.
- Owner: coordinator/writer `/root`.
- Base SHA: `aa31a71` on `main`; definition checkpoint: `1b3d997`; route-proof
  checkpoint: `8d4f6b4`.
- Status: **GREEN BOUNDED CHECKPOINT / T32 REMAINS ACTIVE**. Positions 05 and 07–10
  still require their admitted rebuilds, so this is not a complete Intro claim.
- Exact changed paths:
  - `src/game/core/puzzles.ts`
  - `src/game/core/puzzles.test.ts`
  - `src/game/core/puzzleSolverResults.test.ts`
  - `docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-04-06.json`
- Definitions: position 04 now teaches `留口`; position 06 now teaches `避坑`.
  Both retain their stable IDs, use legal six-piece three-row anchor-free setups, and
  begin without a complete row.
- Route proof: the one-shot Core batch solver emitted non-equivalent routes with lock
  counts `4/5` for position 04 and `5/7` for position 06. The temporary 04–06 artifact
  also carries the still-historical position 05 route pair (`5/5`) and must be
  regenerated when position 05 is rebuilt.
- Evidence assembly correction: the first focused replay run correctly exposed that
  stable-ID replacement still preserved the historical file order after positions 04
  and 06 exchanged curriculum slots. The active route view now overlays by stable ID
  and then sorts by current `curriculumPosition`; no historical T15 file was rewritten.
- Commands actually run:
  - `npm.cmd run test -- --run src/game/core/puzzles.test.ts
    src/game/core/puzzleCampaign.test.ts src/game/core/puzzleFingerprints.test.ts` —
    PASS, 15 tests.
  - `node docs/workstreams/tetris-t15-puzzle/solve-puzzle-batch.mjs --from 4 --to 6
    --max-locks 14 --primary-beam 900 --alternate-beam 750 --output
    docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-04-06.json` — PASS, six
    production-Core replays across the three-position batch.
  - the first four-file focused run failed two ordering assertions only; the bounded
    evidence assembly fix above was applied.
  - `npm.cmd run test -- --run src/game/core/puzzles.test.ts
    src/game/core/puzzleCampaign.test.ts src/game/core/puzzleFingerprints.test.ts
    src/game/core/puzzleSolverResults.test.ts` — PASS, 18 tests in four files.
- Full suite/build/browser/independent QA: intentionally deferred until the last T32
  source edit. No listener, watcher, browser, or persistent solver was started.
- Inherited exclusions remained untouched and unstaged: `docs/evidence/t27/**`,
  `docs/evidence/t27-r1-followup/**`, and `progress.md`.
- Next action: rebuild positions 05 and 07–09 in bounded groups, refresh the 04–06
  artifact, create a 07–09 route artifact, and leave the anchor-side-slip position 10
  for the final Intro authoring slice.
