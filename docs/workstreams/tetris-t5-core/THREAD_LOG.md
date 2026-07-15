# Tetris T5 Core Workstream Log

## 2026-07-16 — AUTHORIZED

- Task: `TETRIS-T5-CORE-001`
- Branch: `codex/tetris-recovery`
- Starting HEAD: `dd7e31ea3547c18a797b2308f04161310d1412ce`
- Rule authority: `4c8582854088695ebac90467842dc2bc0cef3a20`
- Scope: endless accelerating Race; longer Puzzle definitions; grounded soft-drop
  lock/queue repair; deterministic T5 references; runtime QA and leaderboard migration.
- Exact path boundary: the Core paths listed in `CURRENT_TASK.md` plus this log.
- Forbidden: frontend/render/progress files, T3/T4 evidence, coordinator docs,
  changelog, commit/push.
- Required candidate: one writer commit with exact commands/evidence and a read-only
  QA handoff.
- Blocker: none.
- Next: implement the bounded core slice.

## 2026-07-16 — CANDIDATE READY

- Task: `TETRIS-T5-CORE-001`
- Branch: `codex/tetris-recovery`
- Writer intake HEAD: `9fc3cae6e07ebcfa8d82769f804c6d80c7d17485`
- Coordinator boundary commits received while the writer was active:
  - `bcf7ce1e33dcb0bf9a7f5d90fd6ee7362cb5d9be` authorized migration of stale
    Puzzle test/runtime QA assertions without opening production frontend/render paths.
  - `3f6a03ae652c75b5bfc74ae131dcd10e7aa7ced0` authorized the verifier-only
    T3 test correction after the full suite exposed its obsolete production coupling.
- Candidate SHA: this single writer commit; exact SHA is reported to the coordinator
  immediately after commit creation.

### Exact changed paths

- `src/game/core/constants.ts`
- `src/game/core/engine.ts`
- `src/game/core/puzzles.ts`
- `src/game/core/types.ts`
- `src/game/core/race.test.ts`
- `src/game/core/puzzles.test.ts`
- `src/game/core/puzzleCampaign.test.ts`
- `src/game/core/puzzleFlow.test.ts`
- `src/game/runtime/GameRuntime.ts`
- `src/game/runtime/GameRuntime.test.ts`
- `src/game/runtime/qaScenario.ts`
- `src/game/runtime/qaScenario.test.ts`
- `src/leaderboard.ts`
- `src/leaderboard.test.ts`
- `src/puzzleProgress.test.ts` (test-only fixture migration authorized by `bcf7ce1`)
- `docs/workstreams/tetris-t5-core/puzzle-references.json`
- `docs/workstreams/tetris-t5-core/search-puzzles.mjs`
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md`
- `docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`
  (verifier-only historical-boundary correction authorized by `3f6a03a`; no T3 data,
  replay, evidence, or log artifact changed)

### Delivered behavior and evidence

- Race has no successful line terminal. Clear resolution at 20 or any other line count
  remains `playing` and spawns the successor.
- Race speed tier is
  `floor(pieceCount / 5) + floor(lines / 4)`, clamped to the 17-entry safe gravity
  curve. Runtime QA now proves a deterministic live 24-line endurance milestone.
- Leaderboard schema v3 accepts only top-out rows. Race ordering is endurance-first:
  pieces, lines, score, then lower elapsed ticks.
- All six T5 Puzzle definitions use grounded solid-skyline boards with seven occupied
  rows, at least four distinct row shapes, 11/13/14/14/15/15 pieces, all seven piece
  types, and no identical-piece run longer than two.
- `puzzle-references.json` freezes six complete public-command routes. Every route uses
  the full budget, at least four effective rotations, at least five landing x values,
  at least one non-clearing lock, and multiple separated clear phases. It records
  initial/final hashes plus command/event digests.
- The same fixture freezes one legal one-column neighboring decision per level; all six
  consume the budget, retain canonical cells, and end `failed-budget` with stable hashes.
- Puzzle automatic gravity remains disabled. A soft-dropped grounded piece now advances
  the shared lock delay, enters the ordinary entry delay, and spawns the exact next
  authored piece. Hard-drop clear/no-clear routes are covered by the full references.
- `search-puzzles.mjs` is retained only as a bounded, deterministic clean-room authoring
  helper. It is not imported by production and is not a test gate; the authoritative
  proof is the real engine `dispatch` verifier in `puzzleCampaign.test.ts`.
- The frozen T3 verifier now checks only its own levels/replays shape, digest, command,
  queue, landing, and static cell-conservation facts. It no longer compares those
  historical artifacts with current T5 production definitions.
- Deprecated `RACE_TARGET_LINES` remains exported only so the still-blocked frontend
  slice compiles; no Core/runtime path reads it. The frontend slice must remove its old
  Race copy and then may remove this compatibility export.

### Commands actually run

- Focused T5 convergence:
  `npm.cmd run test -- src/game/core/race.test.ts src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts src/game/core/puzzleFlow.test.ts src/game/runtime/qaScenario.test.ts src/game/runtime/GameRuntime.test.ts src/leaderboard.test.ts src/puzzleProgress.test.ts src/game/render/presentation.test.ts`
  — PASS, 25 files / 123 tests.
- Historical verifier correction:
  `npm.cmd run test -- docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`
  — final PASS, 3 files / 36 tests.
- First final typecheck exposed TS7022 at the two public-route movement loops. Both
  `beforeX` values were explicitly typed as `number`; no behavior changed.
- The next full suite exposed only the obsolete T3 verifier coupling: 36 files passed,
  1 historical verifier file failed 7 assertions. Work stopped until coordinator commit
  `3f6a03a` opened the verifier-only correction above.
- Final `npm.cmd run typecheck` — PASS.
- Final `npm.cmd run test` — PASS, 37 files / 234 tests.
- Final `npm.cmd run build` — PASS; Vite transformed 739 modules and produced the
  production bundle.
- `git diff --check` — PASS before final gates; line-ending notices only.

### Handoff

- Blocker: none.
- Push: not performed; coordinator owns integration and push decisions.
- Next: independent read-only Core QA must inspect the exact reported candidate SHA,
  rerun only the proportionate Core/T5 checks it needs, and report ACCEPT or REJECT to
  the coordinator before the frontend slice begins.
