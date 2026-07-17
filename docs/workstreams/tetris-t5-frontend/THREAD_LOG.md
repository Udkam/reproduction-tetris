# Tetris T5 Frontend Workstream Log

## 2026-07-16 — QUEUED

- Task: `TETRIS-T5-FRONTEND-001`
- Branch: `codex/tetris-recovery`
- Visual direction: `青流蓝图 / Aqua Blueprint`.
- Scope: mode home, all-available Puzzle library, new game composition, light
  cyan/light-blue tokens, new Pixi cell language, accessibility and responsiveness.
- Exact path boundary: the Frontend paths listed in `CURRENT_TASK.md` plus this log.
- Forbidden: core rules/definitions, T3/T4 evidence, coordinator docs, changelog,
  commit/push.
- Blocker: waits for the T5 Core candidate and independent core QA.
- Next: remain read-only until coordinator authorization.

## 2026-07-17 — CANDIDATE READY

- Task: `TETRIS-T5-FRONTEND-001`
- Branch: `codex/tetris-recovery`
- Writer intake HEAD: `72f584183a8dae90195748b9436dda788c9df55b`
- Coordinator documentation commits received while the writer was active:
  - `336a89c` removed `index.html` from the writer boundary after the user directed
    that the existing Vite entry remain unchanged.
  - `8c3a78b` clarified that delivery remains a browser HTML page, not a native app,
    PWA wrapper, or installable package.
- Final parent HEAD before this candidate: `8c3a78beb5cbe92cbf95f5b97b85297928cc0525`.

### Exact changed paths

- `src/App.tsx`
- `src/styles.css`
- `src/puzzleProgress.ts`
- `src/puzzleProgress.test.ts`
- `src/game/render/theme.ts`
- `src/game/render/TetrisRenderer.ts`
- `src/game/render/presentation.ts`
- `src/ui/ActionSheet.tsx`
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`

`index.html`, package manifests/locks, Core rules/definitions/fixtures, runtime,
coordinator documents, changelog, T3/T4 evidence, and QA archives have no writer diff.

### Delivered behavior

- Replaced the always-mounted legacy composition with three explicit page states:
  mode home → Puzzle library → game. Home and library mount no runtime or canvas;
  game mounts exactly one, and confirmed exit destroys it before the destination page
  appears.
- Added three original, full-size mode entrances under the player-facing `青流方阵`
  identity. Race copy is exactly endless acceleration/endurance semantics and its HUD
  contains score, lines, and speed tier with no 20-line target or remaining-line value.
- Made all six Puzzle rows enabled. The library shows only name, board-empty goal,
  continuous seven-bag input, and optional completion state; no difficulty, lock,
  budget, remaining-piece value, or suggested solution is exposed.
- Migrated local presentation progress to completion-only schema v2 at
  `qingliu:puzzle-completion:v2`. Strict parsing orders/deduplicates known IDs, malformed
  data fails closed, and legacy v1 highest-unlocked data migrates only the completions
  that necessarily preceded that marker. Availability never depends on progress.
- Rebuilt the page as the original Aqua Blueprint system: light cyan/blue surfaces,
  AA-oriented dark text/actions, clipped corners, blueprint ticks, and one offset cyan
  route line. The old warm mineral/shadow/inset language is absent.
- Replaced minos with seven cool flat planes sharing a deep-cyan outline and one clipped
  corner. Active outlines are stronger, locked cells remain flat, Next reuses the same
  primitive, and ghost cells contain only four corner brackets.
- Added accessible pause, exit-confirmation, and result ActionSheets with labelled
  dialogs, initial focus, Tab/Shift+Tab trapping, Escape/cancel, and opener focus
  restoration. Escape propagation is intentionally stopped inside a sheet so it cannot
  also toggle the runtime pause binding.
- All visible buttons are at least 44 × 44 CSS px; the canvas has a 3 px focus ring.
  The live `prefers-reduced-motion` media-query listener calls
  `GameRuntime.setReducedMotion` in place and preserves canonical state.
- Added read-only `window.render_game_to_text` plus deterministic `window.advanceTime`
  forwarding in DEV for the prescribed web-game smoke loop. No state replacement,
  replay injection, or fabricated browser setup was added.

### Commands and evidence actually run

- Initial `npm.cmd run typecheck` — PASS.
- Initial targeted
  `npm.cmd run test -- src/puzzleProgress.test.ts src/game/render/presentation.test.ts`
  — PASS, 6 files / 22 tests.
- Final targeted
  `npm.cmd run test -- src/puzzleProgress.test.ts src/game/render/presentation.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 9 files / 33 tests.
- After the final source change, final `npm.cmd run typecheck` — PASS.
- After the final source change, final `npm.cmd run test` — PASS,
  37 files / 237 tests.
- After the final source change, final `npm.cmd run build` — PASS; Vite transformed
  739 modules.
- Ran the prescribed `develop-web-game` Playwright client with the supplied
  `action_payloads.json`; it drove real left/hard-drop bursts, wrote state JSON, and
  produced screenshots that were opened and visually inspected. The existing local
  Playwright 1.61.1 npm cache was exposed through ignored temporary `node_modules`
  junctions only; no dependency or lockfile changed, and no temporary capture is part
  of the candidate.
- Inspected the mode home, all-level Puzzle library, Marathon board, graphical Next,
  and a 390 × 844 DPR3 Level 6 Puzzle after three visible hard-drop button clicks.
  Text state and canvas agreed on mode, level, piece count, active piece, and Next.
- Browser matrix at 1440 × 900, 2048 × 1152, 390 × 844 DPR3, 844 × 390 DPR3, and
  360 × 800 passed with one canvas, zero DOM cells, exact viewport-sized gameplay
  documents, 1:2 board geometry, minimum 44 × 44 buttons, and zero board overlap with
  stats, Next, or touch controls. No console/page error was recorded.
- Pause/resume, focus trap, keyboard and button Escape paths, exit cancel/confirm,
  home → game → home canvas teardown, three consecutive Puzzle locks, and live reduced
  motion changes were exercised. Reduced-motion toggles preserved a frozen canonical
  state byte-for-byte.
- `git diff --check` — PASS before candidate staging; line-ending notices only.

### Handoff

- Blocker: none.
- Push: not performed; coordinator owns integration and push decisions.
- Next: create one bounded writer candidate commit, then route its exact SHA to
  independent read-only final QA before changelog integration.
