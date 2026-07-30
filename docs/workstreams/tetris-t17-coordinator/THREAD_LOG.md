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

## 2026-07-31 — Phase 10 Survival moving-support checkpoint

- Task ID: `T17-P10.2`
- Base SHA: `8e483569dae53aabde98ae887cb49774e1e0e491`
- Owner: primary coordinator
- Exact paths:
  - `src/game/core/engine.ts`
  - `src/game/core/race.test.ts`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - `npm.cmd run test -- src/game/core/race.test.ts --maxWorkers=1 --fileParallelism=false`:
    `22/22` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: Survival spawn validates against settled board rather than in-flight
  stones, so a due stone and the next ordinary piece may briefly share the entry
  footprint without block-out. Existing overlap can only shrink as the faster stone
  leaves; hard drop cannot lock an overlapping piece, and a lateral collision-free
  escape remains available. When an ordinary piece is supported by a moving event,
  the environmental step is simulated first and both actors advance atomically only
  if every support moves and the candidate piece is clear. A stone that would create
  a new active-piece overlap waits in flight instead of moving or materialising into
  the piece. Focused coverage also freezes repeated-step determinism and hash equality.
- Resource note: one Vitest worker, no file parallelism, no watcher/server/browser.
- Blocker: none for P10.2. Browser animation proof remains part of the immutable final
  candidate rather than this Core checkpoint.
- Next action: commit this green checkpoint, then open P10.3 Mutation same-item event
  aggregation.

## 2026-07-31 — Phase 10 Mutation activation aggregation checkpoint

- Task ID: `T17-P10.3`
- Base SHA: `a9f920537b2519b92396c758664b722277c0d618`
- Owner: primary coordinator
- Exact paths:
  - `src/game/core/engine.ts`
  - `src/game/core/sprint.test.ts`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - `npm.cmd run test -- src/game/core/sprint.test.ts --maxWorkers=1 --fileParallelism=false`:
    `23/23` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: carrier mechanics still execute for every deterministic activation,
  including each repeated Bomb clear and each Multiplier promotion. Presentation
  summaries are grouped by item in first-seen order, deduplicate trigger geometry,
  accumulate Bomb score/removed rows, expose the final multiplier factor, and freeze
  the combined trigger-cell snapshot. Two repeated Bombs therefore perform two
  mechanical clears but emit one Bomb activation cue; repeated Freeze and Multiplier
  carriers likewise emit one cue each while their final timers/factor remain canonical.
- Resource note: one Vitest worker, no file parallelism, no watcher/server/browser.
- Blocker: none for P10.3. Renderer/audio must consume the aggregated event correctly
  in P10.4 and final real-frame evidence.
- Next action: commit this green checkpoint, then open P10.4 Mutation preview,
  Supergravity landing, upper-Ice treatment, and restrained audio.

## 2026-07-31 — Phase 10 Mutation presentation checkpoint

- Task ID: `T17-P10.4`
- Base SHA: `891cf670ba6ba923a54cf3936376896f4bddff6f`
- Owner: primary coordinator
- Exact paths:
  - `src/design/mutationTokens.ts`
  - `src/game/audio/AudioEngine.ts`
  - `src/game/audio/AudioEngine.test.ts`
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - `npm.cmd run test -- src/game/audio/AudioEngine.test.ts src/game/render/TetrisRenderer.test.ts --maxWorkers=1 --fileParallelism=false`
    (first run: `47/48`; one new test referenced an unnamed local layout variable)
  - the same focused command after correcting that test: `48/48` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: every distinct same-frame Mutation item now receives one deterministic
  presentation/audio cue while duplicate events of the same item are ignored at the
  consumer boundary. Ice uses one low-gain glass tap and never starts a sustained
  oscillator. Its persistent field is seven upper-edge alpha bands with sparse
  descending flecks; the reusable whole-world frost filter remains disabled. Next
  retains all four canonical tetromino cells while only its item attachment is scaled
  to fit. Supergravity settlement no longer draws long column rails or moving
  pseudo-cells: each affected column receives two short downward weight marks and one
  dense support imprint.
- Resource note: one Vitest worker, no file parallelism, no server/watcher/browser.
  Process inspection used direct `Get-Process`, not WMI/CIM; no unrelated process was
  stopped.
- Blocker: none for P10.4. Real frame color/opacity and reduced-motion acceptance remain
  in the single final browser batch.
- Next action: commit this green checkpoint, then open P10.5 mode-first result ledger.

## 2026-07-31 — Phase 10 mode-first result ledger checkpoint

- Task ID: `T17-P10.5`
- Base SHA: `7411c06e9c11572435b73b7b9bbfe16e65e27b92`
- Owner: primary coordinator
- Exact paths:
  - `src/App.tsx`
  - `src/App.test.ts`
  - `src/leaderboard.ts`
  - `src/leaderboard.test.ts`
  - `src/ui/localization.ts`
  - `src/styles/result.css`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - `npm.cmd run test -- --run src/App.test.ts src/leaderboard.test.ts --maxWorkers=1 --fileParallelism=false`
    (first run: `42/47`; two stale Classic expectations failed and caused three
    downstream focus tests to inherit an unmounted sheet)
  - the same focused command after updating the direct expectations: `47/47` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: Mutation now ranks and leads with score while retaining cleared lines as
  its only secondary result datum. Survival leads with elapsed time and retains only
  cleared lines. Classic leads and ranks by cleared lines, with used pieces instead
  of score as its secondary datum. Result titles are neutral mode-owned labels rather
  than top-out causes; current-row highlighting, date, top-five truncation, and the
  compact unranked notice remain intact. The two-metric ledger gives the mode-owned
  primary metric greater weight without changing Puzzle completion.
- Resource note: one Vitest worker, no file parallelism, no watcher/server/browser.
- Blocker: none for P10.5. Final real-frame hierarchy and compact-layout acceptance
  remain in the single immutable browser batch.
- Next action: commit this green checkpoint, then open P10.6 Puzzle completion
  persistence and celebration.

## 2026-07-31 — Phase 10 cave, navigation, and typography contract extension

- Task ID: `T17-P10.6`
- Base SHA: `929afe341ec750c1fa1337088cd531de2424593c`
- Owner: primary coordinator
- Exact paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/phase 10.md`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - read-only targeted `rg`, `Get-Content -Encoding UTF8`, Git status/log/diff checks
  - read-only comparison of two Survival entry concepts and two typography systems
  - scoped official/upstream font-license and self-hosting research
  - `git diff --check`: passed before this log-only delta
- Evidence: the active contract now includes three direct additions: Survival's
  canonical one/two/three-row countdown is presented as a continuous shared-shelf
  rise (`680 ms` translation plus `140 ms` settle per beat); permanent bedrock and
  falling stones share one deterministic cached cold-geology family while remaining
  legible by silhouette and movement; every player-facing Back-to-modes action becomes
  Back to home. The local typography roles are frozen as WenYuan Sans for Chinese UI,
  Smiley Sans only for Chinese display headings at least `28 px`, Sora for English UI,
  IBM Plex Mono for numeric data, and Playwrite NZ Basic only for the wordmark. Final
  evidence must prove local loading, stable metrics, reduced motion, and no runtime
  font request.
- Resource note: no test, build, install, server, watcher, browser, Serena, WMI/CIM,
  or new sub-agent was started. Existing read-only comparison results were consumed
  after completion.
- Blocker: none for P10.6.
- Next action: commit this contract checkpoint, then open P10.7 Puzzle completion
  persistence and celebration.
