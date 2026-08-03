# T26 Coordinator Workstream Log

- Task ID: `tetris-t26-coordinator`
- Base SHA: `2d4f3ecc7d51ee756ac55442088be59aa0d7d0f9`
- Owner: primary coordinator / final acceptance and push owner; product source frozen
- Status: Phases A-F verified; the first final-QA findings are corrected; only the
  independent read-only recheck and coordinator acceptance remain open.
- Historical Phase-A paths reviewed:
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
- Historical B-C paths: `package.json`, `package-lock.json`, `index.html`, `licenses/`,
  `src/main.tsx`, `src/design/tokens/typography.ts`, `src/styles/tokens.css`,
  `src/ui/localization.ts`, `src/App.tsx`, `src/ui/ActionSheet.tsx`,
  `src/styles/settings.css`, `src/styles/hud.css`, and direct tests. The exact set was
  reduced to files genuinely changed before each checkpoint.
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
- Historical pre-repair RC audit checkpoint: source then lacked the Home positioning
  line, reused detailed Settings rules in first-entry sheets, and rendered only
  `3–2–1`; Settings then lacked
  player reduced-motion and visible touch controls. These are recorded in
  `docs/RC_AUDIT.md` without relabelling the prior accepted evidence.
- Phase-B product: `29405e2` plus cascade correction `2198b92`; evidence `96b8854`.
  Exact source paths were `src/App.tsx`, `src/ui/localization.ts`, `src/styles.css`, and
  `src/App.test.ts`. The browser matrix covers English desktop, Chinese 390 x 844,
  English 844 x 390 reduced motion, countdown, and Start. Audit result: zero browser
  errors, clipped text, horizontal overflow, DOM board cells, or extra Canvas; Start
  has one Canvas and populated Next; Chinese inspected body length is 48 characters.
- Phase-B commands: focused App/Settings tests (`52 passed`), typecheck, complete suite
  (`310 passed / 3 skipped`), 768-module build, and one controlled evidence runner.
  Preview PID 27104 and manual dev PID 23588 were released; ports 4187/4188 have no
  listener.
- Blocker: final independent read-only QA recheck only.
- Next action: obtain the final exact-range disposition on this docs-only correction.
  No Phase-C implementation work remains open.

## 2026-08-03 — Phase-F candidate rejected; portable-release correction opened

- Phases D and E are verified. Phase-F source-bound showcase evidence is commit
  `6916300`; public release copy is commit `62163b1`.
- First final independent read-only QA returned 0 P0, 2 P1, and 1 P2. It rejected
  candidate `62163b1` because Phase-E/F capture scripts depend on a personal absolute
  Codex Playwright path, status documents disagree about the RC phase, and npm metadata
  remains `0.1.0` while release copy claims a v1.0 RC.
- Authorized correction paths are npm metadata/lockfile, active T26 evidence runners
  and readmes, regenerated Phase-E/Phase-F evidence, and coordinator-owned status/release
  documents. Product gameplay, presentation, Puzzle data/order, ranking, persistence,
  and renderer behavior remain frozen.
- Required gates after the correction: clean install from the committed lockfile,
  typecheck, complete suite, production build, refreshed source-bound browser evidence,
  one-shot OSV and gitleaks scans, then a second independent read-only QA decision.
- Resource boundary: one short-lived evidence server/browser at a time; record and
  release its exact PID/port; no watcher, indexer, Serena, or persistent helper.
- Blocker: final acceptance is fail-closed on the correction and second QA pass.
- Next action: commit this contract checkpoint, then align Playwright/version metadata.

## 2026-08-03 — Portable correction frozen for second QA

- Checkpoints: contract `3dc5dfb`; metadata/lock `e4e97a1`; portable browser runners
  `85a3431`; refreshed evidence `6d2255a`.
- Version is `1.0.0-rc.1` in package and lock metadata. Playwright `1.61.1` is a pinned
  development dependency, imports resolve by package name, and a scoped executable-script
  scan finds no personal home/Codex path.
- Final post-source commands pass: typecheck; complete suite (`318 passed / 3 skipped`);
  production build (756 modules); committed-lock `npm ci`; clean `npm ls --depth=0`;
  OSV Scanner 2.4.0 with no issue.
- Phase-E lifecycle audit and Phase-F six-frame audit bind to source `85a3431` in Chromium
  `149.0.7827.55`, report no browser errors or cleanup residue, and leave no listener on
  ports `4191` or `4192`. The three changed Phase-F frames were visually inspected.
- Redacted gitleaks 8.30.1 passes for `2d4f3ec..98d71ef` with no finding.
- Blocker: second independent read-only QA only.
- Next action: commit this scan disposition, rescan the resulting final HEAD, then request
  exact-range QA without opening a server, browser, test, build, or writer process.
