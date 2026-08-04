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
