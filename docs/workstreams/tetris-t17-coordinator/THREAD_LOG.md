# T17 Coordinator Workstream Log

## 2026-07-31 — Phase 10 contract checkpoint

- Task ID: `T17-P10.0`
- Base SHA: `1f4847225c562163ad748fd2a76e4f4023778442`
- Owner: primary coordinator
- Exact paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/phase 10.md`
  - `docs/progress.md`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run: targeted UTF-8 contract/Git/source inspection only.
- Evidence: Phase 9 is accepted and pushed; worktree was clean; ten Phase-10 outcomes,
  then the player's two Puzzle supplements, checkpoint order, browser matrix, and
  resource boundary are frozen before source. The active contract now contains twelve
  outcomes, including atomic Puzzle completion/best persistence and a three-state
  success celebration.
- Blocker: machine CPU was above the red admission threshold during orientation, so no
  test, build, browser, server, or heavy helper started.
- Next action: commit this docs-only checkpoint, then open P10.1 shared UI/lifecycle.

## 2026-07-31 — Phase 10 shared UI and lifecycle checkpoint

- Task ID: `T17-P10.1`
- Base SHA: `77e7a6dfb1ab48457c131b80b5a66d59d0a7c437`
- Owner: primary coordinator
- Exact paths:
  - `src/App.tsx`
  - `src/App.test.ts`
  - `src/ui/localization.ts`
  - `src/game/render/presentation.test.ts`
  - `src/game/core/sprint.ts`
  - `src/design/mutationTokens.ts`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - `npm.cmd run test -- src/App.test.ts src/game/render/presentation.test.ts --maxWorkers=1 --fileParallelism=false`
    (first run: one stale copy assertion failed; corrected without broadening scope)
  - the same focused command again: `51/51` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: current Chinese and English terminology uses `下落速度 / Fall speed` with
  `秒/格 / s/cell`, exposes active Ice as `1.0 秒/格`, and presents `超重 /
  Supergravity` plus compact Survival `上升 / Rise`. Settings begins with Rules.
  Restart and Play again reset Core to `ready`, disable input, and re-enter the
  canonical `3 / 2 / 1` gate. The leave confirmation now places Return left and the
  initially focused Stay action right. Presentation coverage freezes the requirement
  that paused Classic and Survival retain their Next queue.
- Resource note: an exact stale CUA Node child (`PID 31732`, parent `node_repl`
  `PID 15564`) was identified by path, parent, start time, and inactivity of every
  collaboration task, then released. Tests were limited to one worker with no file
  parallelism; no server, watcher, browser, or project listener was started.
- Blocker: none for P10.1. Full-suite/build/browser acceptance remains deliberately
  deferred until the final source candidate.
- Next action: commit this green checkpoint, then open P10.2 Survival Core moving
  support with deterministic focused tests.
