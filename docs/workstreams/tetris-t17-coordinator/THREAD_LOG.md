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

## 2026-07-31 — Phase 10 Puzzle completion transaction and prism celebration

- Task ID: `T17-P10.7`
- Base SHA: `a05cd846073ede94c6a59b3524a9e64c8555e40e`
- Owner: primary coordinator
- Exact paths:
  - `src/puzzleProgress.ts`
  - `src/puzzleProgress.test.ts`
  - `src/App.tsx`
  - `src/App.test.ts`
  - `src/ui/localization.ts`
  - `src/styles.css`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - `npm.cmd run test -- --run src/puzzleProgress.test.ts src/App.test.ts --maxWorkers=1 --fileParallelism=false`
    (first run: `51/52`; the new integration test assumed Chinese while jsdom
    correctly selected its English navigator language)
  - one filtered re-run after pinning the test language: `1/1` passed
  - the same full focused command: `52/52` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: the all-open fifty-level gallery and persistence layer now share one
  eligibility contract. A canonical finished Puzzle records even when the retired
  progressive frontier would have called it locked; Core/current-selection identity
  mismatches still fail closed. The parent synchronously writes the versioned snapshot
  before scheduling React presentation, so immediate return or unmount cannot discard
  a clear. A direct integration test enters level 50, finishes with the optional
  `completedLevelId` absent, verifies storage before result dismissal, returns to the
  library, and sees both its completion tick and `13`-move best.
- Presentation evidence: first, record, and repeat clears now use exactly
  `恭喜你破解谜题`, `刷新个人纪录`, and `谜题已破解`; the only body statistic is
  `当前最优步数`. The former eyebrow is absent. The compact mineral-white result uses
  one violet/teal prism, ten bounded fragments, a four-pixel earned edge, and a static
  reduced-motion state.
- Resource note: one Vitest worker, no file parallelism, no server, watcher, browser,
  Serena, WMI/CIM, or new sub-agent.
- Blocker: none for P10.7. Final visual fit, keyboard focus, bilingual copy, and reduced
  motion remain in the immutable browser batch.
- Next action: commit this green checkpoint, then open P10.8 Survival entry/cavern and
  local typography.

## 2026-07-31 — Phase 10 Survival continuous cave-shelf checkpoint

- Task ID: `T17-P10.8A`
- Base SHA: `90745a22f5c0978368c901201a724a12da4763f2`
- Owner: primary coordinator
- Exact paths:
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `src/game/render/theme.ts`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts --maxWorkers=1 --fileParallelism=false`:
    `38/38` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: every one-second Survival countdown beat now translates the complete
  visible cave shelf by one row rather than revealing a detached top strip. The
  movement uses the frozen `680 ms` continuous rise plus `140 ms` settle contract;
  reduced motion still snaps to the completed row. Permanent bedrock and clearable
  falling stone now use deterministic irregular silhouettes and cached fracture
  variants from one cold-slate family: bedrock is darker and compacted, while falling
  stone is lighter with a complete outline and fresh fracture plane. Ordinary
  tetromino materials and their rounded relief remain unchanged.
- Resource note: one Vitest worker, no file parallelism, no server, watcher, browser,
  Serena, WMI/CIM, or new sub-agent.
- Blocker: none for P10.8A. Real-frame motion, material readability, and reduced-motion
  acceptance remain in the single final browser batch.
- Next action: commit this green renderer checkpoint, then complete P10.8B local
  typography and Back-to-home copy.

## 2026-07-31 — Phase 10 local typography and Back-to-home checkpoint

- Task ID: `T17-P10.8B`
- Base SHA: `4070ee96243e898e98a861084217983664651a75`
- Owner: primary coordinator
- Exact paths:
  - `index.html`
  - `package.json`
  - `package-lock.json`
  - `THIRD_PARTY_NOTICES.md`
  - `licenses/fonts/*`
  - `src/assets/fonts/TetraMorphUISans-subset.otf`
  - `src/assets/fonts/SmileySans-Oblique.woff2`
  - `src/main.tsx`
  - `src/design/tokens/typography.ts`
  - `src/design/tokens/tokens.test.ts`
  - `src/styles.css`
  - `src/styles/tokens.css`
  - `src/styles/navigation.css`
  - `src/ui/localization.ts`
  - `src/App.test.ts`
  - `src/game/render/TetrisRenderer.ts`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - scoped official GitHub release/API inspection for WenYuan Fonts `v1.000` and
    Smiley Sans `v2.0.1`
  - one-shot `pyftsubset` generation and FontTools name-table inspection/renaming
  - `npm.cmd install @fontsource-variable/sora@5.3.0 @fontsource/ibm-plex-mono@5.3.0`
    and removal of the superseded Space Grotesk, Noto Sans SC, and JetBrains Mono
    packages
  - focused six-file test: first run `64/65`; a notice assertion expected
    `reserved` while the notice correctly used `reserves`
  - the same six-file test after correcting that assertion: `65/65` passed
  - focused token/navigation recheck after the final wordmark correction: `10/10`
    passed
  - `npm.cmd run typecheck`: passed
  - source-to-cmap coverage check: all `326` CJK characters currently used by
    application source are present in the packaged UI subset
  - `git diff --check`: passed
- Evidence: Playwrite NZ Basic is now isolated to the sole TetraMorph wordmark at its
  real `400` weight. Chinese UI/body uses the locally packaged WenYuan-derived
  `TetraMorph UI Sans`; the subset and every variable-instance name were renamed
  because upstream reserves its original family names. Chinese display headings at
  least `28 px` use unmodified Smiley Sans, English UI uses Sora Variable, and HUD,
  countdown, ranking, date, level, keycap, and score numerals use IBM Plex Mono.
  Every family and its OFL notice is packaged locally; CSS contains no remote font
  URL. The old font packages and hard-coded family declarations are absent.
  Player-facing `返回模式 / Back to modes` and `返回模式首页` copy is globally replaced
  by `返回首页 / Back to home`.
- Resource note: all downloads, subsetting, installs, and tests were bounded one-shot
  processes. Tests used one worker with no file parallelism; no server, watcher,
  browser, Serena, WMI/CIM, or new sub-agent was started.
- Blocker: none for P10.8B. Real glyph shape, heading restraint, geometry stability
  after `document.fonts.ready`, and zero runtime font request remain in the single
  final browser batch.
- Next action: commit this green typography checkpoint, then freeze and run P10.9
  exactly-once final gates.

## Phase 10 final-gate contrast correction

- Task ID: `T17-P10.9A`
- Base SHA: `a4edf5d`
- Exact changed paths:
  - `src/game/render/theme.ts`
  - `src/game/render/theme.test.ts`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - first final `npm.cmd run typecheck`: passed
  - first final single-worker full test: failed only the cold-slate material
    contract (`272/273` passed); production build was therefore not started
  - focused `src/game/render/theme.test.ts`: exposed both the stale exact-value
    fixture and a real `2.974:1` / `1.807:1` bedrock-to-well contrast regression
  - focused test after the bounded palette correction: `7/7` passed
  - `git diff --check`: passed
- Evidence: the gate was not weakened. The permanent bedrock endpoints were moved to
  the nearest readable cold-slate range (`0x64727a` to `0x57646b`) while remaining
  visually older and darker than the clearable falling-stone material. Both endpoint
  assertions retain the frozen `>= 3:1` board-well contrast threshold.
- Resource note: all commands were one-shot and single-worker; no browser, server,
  watcher, Serena, WMI/CIM, or sub-agent was started.
- Blocker: the first final candidate is invalidated by this correction.
- Next action: commit the correction, then run one replacement final typecheck,
  full test, and production build against the new source tip.

## 2026-07-31 — Phase 10 replacement final gates and browser evidence

- Task ID: `T17-P10.9-10`
- Base SHA: `7f45c55ccfea1cdf50a785bf249d1cec831473ac`
- Owner: primary coordinator
- Exact paths:
  - `docs/qa/evidence/t17-phase10/*`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - replacement `npm.cmd run typecheck`: passed
  - replacement full
    `npm.cmd run test -- --maxWorkers=1 --fileParallelism=false`: `29` files /
    `273` tests passed
  - replacement `npm.cmd run build`: passed with `758` modules and only the existing
    non-blocking bundle-size advisory
  - one bounded Vite `127.0.0.1:5178` plus headless Chrome browser-evidence batch
  - JSON parse and `28/28` SHA-256 manifest recomputation: passed
- Evidence: the final batch covers Home, Classic, Survival, Mutation, and Puzzle in
  Chinese/English and desktop/portrait/short-landscape. It proves restart countdown,
  visible Next under leave confirmation, ranked/unranked mode-first results,
  continuous one/two/three-row Survival entry, natural one- and two-stone events,
  item-bearing Mutation Next, simultaneous Ice/Supergravity/multiplier states,
  effect expiry, first Puzzle clear, a six-move new best over ten, a slower six-move
  replay retaining five, persisted library completion, keyboard range tabs, reduced
  motion, local-only fonts, stable post-font geometry, one gameplay Canvas, zero DOM
  cells, zero overflow, and zero console/page errors.
- Candidate: evidence commit
  `87d7586fabc2dc5819d8d36965f123132654b58f`, whose parent is the exact frozen
  product source.
- Resource note: the managed browser was closed, the owned Node/Vite PID was stopped
  by exact PID after its parent shell ended, Chrome count returned to zero, and ports
  `4178`, `5178`, and `5179` are free. No WMI/CIM, watcher, Serena, or extra server
  was used.
- Blocker: none.
- Next action: independent read-only QA and scoped secret scan.

## 2026-07-31 — Phase 10 independent QA and security acceptance

- Task ID: `T17-P10.11`
- Base SHA: `87d7586fabc2dc5819d8d36965f123132654b58f`
- Owner: primary coordinator; independent reviewer:
  `/root/phase9_independent_qa`
- Exact paths:
  - read-only `ad0e31b..87d7586`
  - read-only `docs/qa/evidence/t17-phase10`
  - `docs/CURRENT_TASK.md`
  - `docs/phases/phase 10.md`
  - `docs/logs/CHANGELOG.md`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - independent source/test/evidence/manifest review only; no test, build, browser,
    service, or edit
  - `gitleaks git --redact --no-banner --no-color --log-opts
    "1f4847225c562163ad748fd2a76e4f4023778442..HEAD" .`: `13` commits,
    approximately `158.37 KB`, no leaks
  - targeted Git status/log/range checks
- Independent disposition: `ACCEPT`; P0/P1/P2 all zero. The reviewer confirms the
  evidence commit parent equals the frozen source, all `28/28` registered files exist
  and hash exactly, no extra evidence file exists, all `58` changed paths remain in
  Phase 10 scope, and the source/test assertions cover the direct Puzzle, Survival,
  Mutation, result, navigation, restart, Settings, and typography requirements.
- Blocker: none.
- Next action: commit coordinator acceptance docs, push `main` non-force, verify exact
  local/tracking/remote equality, then write the final closeout checkpoint.

## 2026-07-31 — Phase 10 coordinator publication and closeout

- Task ID: `T17-P10.12`
- Base SHA: `6b4bfd7d46e609f23e0641eb907b7502e4012080`
- Owner: primary coordinator
- Exact paths:
  - `docs/CURRENT_TASK.md`
  - `docs/phases/phase 10.md`
  - `docs/logs/CHANGELOG.md`
  - `docs/workstreams/tetris-t17-coordinator/THREAD_LOG.md`
- Commands actually run:
  - `git push origin main`: non-force push from accepted base through coordinator
    acceptance succeeded
  - `git rev-parse HEAD`, `git rev-parse origin/main`, and
    `git ls-remote origin refs/heads/main`: all resolved
    `6b4bfd7d46e609f23e0641eb907b7502e4012080`
  - direct `Get-Process` and `netstat` lifecycle checks: zero managed Chrome process
    and no listener on `4178`, `5178`, or `5179`
- Evidence: product source `7f45c55`, browser evidence `87d7586`, independent
  `ACCEPT`, final gates, manifest, local fonts, gitleaks, and the first publication
  are all complete. This checkpoint changes only the durable closure record.
- Blocker: none.
- Next action: commit and push this documentation-only closeout, verify final
  local/tracking/remote equality once, and release the completed goal.
