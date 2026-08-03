# T26 Coordinator Workstream Log

- Task ID: `tetris-t26-coordinator`
- Base SHA: `2d4f3ecc7d51ee756ac55442088be59aa0d7d0f9`
- Owner: primary coordinator / sole writer until an immutable candidate is ready for
  independent read-only QA
- Status: Phase A verified and archived; Phase-C typography/Settings correction
  verified; RC programme remains active
- Exact Phase-A paths under review:
  - contract/archive: `docs/CURRENT_TASK.md`, `docs/DESIGN.md`,
    `docs/phases/rc-1.0.md`, `progress.md`, this log, `docs/logs/CHANGELOG.md`
  - metadata/public entry: `package.json`, `package-lock.json`, `README.md`
  - persistence: `src/App.tsx`, `src/App.test.ts`, `src/leaderboard.ts`,
    `src/leaderboard.test.ts`, `src/puzzleProgress.ts`, `src/puzzleProgress.test.ts`
  - DEV-QA identity: `src/game/runtime/GameRuntime.ts`,
    `src/game/runtime/GameRuntime.test.ts`, `src/App.tsx`, `src/App.test.ts`,
    `scripts/qa_tetris.py`, `scripts/capture-tetris-t3-evidence.py`
- Commands run: read-only Git/document/source audit; scoped `rg` identity and storage
  inventory; `npm.cmd install --package-lock-only --ignore-scripts`; targeted App,
  leaderboard, Puzzle-progress, and runtime tests; Python AST parse for both maintained
  QA scripts; final typecheck, complete test suite, and production build.
- Evidence: `308 passed / 3 skipped`; 760 transformed build modules; active legacy-name
  scan clean. Former storage values migrate one way into `tetramorph:*` keys without
  deletion. No Phase-A server, browser, listener, or helper process was started.
- Active B-C paths: `package.json`, `package-lock.json`, `index.html`, `licenses/`,
  `src/main.tsx`, `src/design/tokens/typography.ts`, `src/styles/tokens.css`,
  `src/ui/localization.ts`, `src/App.tsx`, `src/ui/ActionSheet.tsx`,
  `src/styles/settings.css`, `src/styles/hud.css`, and direct tests. The exact set will
  be reduced to files genuinely changed before each checkpoint.
- Accepted source: `310d83a6b9cba97de845effc02a7ed673454d789`.
- Accepted evidence: `32b4457`; `docs/evidence/t26/audit.json` plus eleven runner/frame
  artifacts cover Home, all three English Settings tabs, Chinese Settings, portrait
  Controls, short-landscape Rules, Pause, and English Mutation data.
- Accepted typography: Playwrite only for the wordmark; Space Grotesk English UI; Noto
  Sans SC Chinese UI; Geist Mono data. The browser audit reports zero clipped text,
  text-ink overlap, wrong English/data face, horizontal overflow, DOM board cells, or
  browser errors across all nine states.
- Accepted composition: three compact Settings tabs; full-width run actions; balanced
  Gameplay/Shortcuts columns; Back/Settings pointer reachability above Pause; visible
  Next; exactly one gameplay Canvas.
- Final commands: `npm.cmd ci`; focused App/HUD/typography tests; `npm.cmd run
  typecheck`; complete `npm.cmd run test`; `npm.cmd run build`; one source-bound browser
  evidence batch via `node docs/evidence/t26/run-settings-evidence.mjs`.
- Final gates: typecheck pass; `309 passed / 3 skipped`; 768 transformed modules; nine
  audit states; both Pause hit targets and both real successor transitions true.
- Resources: evidence-owned Vite PID released; no listener remains on port `4186`.
- Blocker: none
- Next action: keep product source frozen and open only the next explicitly authorised
  RC slice. Phase B first experience and Phases D-F remain unfinished.
