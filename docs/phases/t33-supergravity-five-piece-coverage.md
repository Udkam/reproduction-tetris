# T33 — Supergravity Five-Piece Coverage

Status: **ACCEPTED 2026-08-06**

## Goal

Make Supergravity cover the next five spawned tetrominoes instead of lasting five
seconds, with deterministic preview/lock agreement across the fifth-piece boundary.

## State contract

1. Award: clearing at least one Supergravity carrier refreshes the future quota to 5.
2. Claim: each successful subsequent spawn decrements the quota once and gives that
   active piece a Supergravity landing latch.
3. Resolve: the latch controls independent-column ghost projection and settlement until
   that piece locks, even when the future quota is already 0.
4. Refresh: another award restores the future quota to 5 without removing or duplicating
   the current active piece's latch.
5. Present: the status ledger shows remaining pieces, not seconds or time progress.

## Acceptance matrix

- [x] The first through fifth post-award pieces use Supergravity projection and lock.
- [x] The sixth post-award piece uses normal projection and lock.
- [x] The fifth piece remains Supergravity-latched while airborne at quota 0.
- [x] Move, rotate, pause, row-wise entry, and ticks do not consume extra quota.
- [x] Re-award refreshes future coverage to 5 and preserves the current latch.
- [x] Mutation status copy is correct in Chinese and English and contains no countdown.
- [x] Deterministic replay, typecheck, full tests, build, and browser evidence pass.
- [x] Independent QA reports no P0-P3 finding before acceptance and push.

## Accepted candidate

- Product source: `60c3fdd`.
- Rule-copy repair: `909f904`.
- Current-source browser evidence: `b887994` with one Canvas and zero failures.
- Final gates: typecheck PASS; `388 passed / 8 skipped`; build PASS.
- Independent read-only QA: PASS after verifying both localization paths and evidence
  provenance.

## Checkpoint order

1. Contract documentation.
2. Core state/engine/tests.
3. UI/localization/tests.
4. Evidence, independent QA, coordinator acceptance, push.

## Exclusions

- No new Mutation item.
- No redesign of unrelated Mutation effects, audio, themes, Puzzle, or Survival.
- No edits to inherited T27 evidence or `progress.md`.
