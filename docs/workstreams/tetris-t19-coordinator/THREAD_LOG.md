# T19 Coordinator Workstream Log

## 2026-08-01 — Phase 12 shared UI/type checkpoint

- Task ID: `T19-P12.1`
- Base SHA: `6ccc77b`
- Owner: primary coordinator; one production writer
- Exact paths: `package.json`, `package-lock.json`, `index.html`, `src/main.tsx`,
  `src/App.tsx`, `src/App.test.ts`, `src/design/tokens/{typography.ts,tokens.test.ts}`,
  `src/styles/{tokens.css,hud.css,settings.css,settings.test.ts}`,
  `src/game/render/TetrisRenderer.ts`, `THIRD_PARTY_NOTICES.md`, and the four exact
  font-license add/remove paths under `licenses/fonts/`.
- Implementation: the leave dialog keeps left/default keyboard focus but gives
  `Back to home` the filled primary role; Settings is one compact outer console whose
  Rules, Controls, Keyboard, and Record regions are separated by hierarchy rather than
  nested cards; local Barlow Semi Condensed and Fira Code Variable replace the rejected
  Space Grotesk/Geist pairing, including notices and exact license copies.
- Commands actually run: exact npm install/uninstall, focused Vitest with one worker,
  checkpoint typecheck, `git diff --check`, targeted legacy-font search, and
  `osv-scanner scan --lockfile package-lock.json --format table`.
- Evidence: focused `3 files / 52 tests` pass; typecheck passes; the scoped OSV scan
  finds 158 packages and no issue; no obsolete product font import/config remains.
- Acceptance boundary: source checkpoint is green but not visually accepted. No Vite
  server, browser, watcher, indexer, or child agent was started.
- Next action: commit the exact shared-UI/font paths, then open P12.2 Survival Core and
  Renderer without overlapping this checkpoint.

## 2026-08-01 — Phase 12 contract checkpoint

- Task ID: `T19-P12.0`
- Base SHA: `ac11e016d459a82bd2242650632cd8a1c936c253`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/phase 12.md`
  - `docs/progress.md`
  - `progress.md`
  - `docs/workstreams/tetris-t19-coordinator/THREAD_LOG.md`
- Commands actually run: targeted UTF-8 Git/status/contract/source inspection, scoped
  npm registry metadata queries for candidate font packages, and read-only inspection
  of existing Puzzle route artifacts. No test, build, server, browser, watcher,
  indexer, or persistent helper was started.
- Evidence: clean `main@ac11e016`; Phase 11 is closed. Fontsource reports
  `@fontsource/barlow-semi-condensed@5.3.0` and
  `@fontsource-variable/fira-code@5.3.0`, both OFL-1.1. Existing route artifacts hold
  public-command canonical and alternate completions for all fifty Puzzle levels.
- Decision: replace live solver statistics with authored pre-play lessons backed by
  replay evidence; replace geology decals/irregular boulders with flat/square solid
  geometry; make unresolved falling-stone contact explicitly non-locking while coupled
  support descends; replace carded Settings and rejected Space Grotesk/Geist pairing.
- Resource note: no child agent, listener, browser, or project server is running.
- Blocker: the current route enumerator intentionally excludes timed mid-fall tricks;
  P12.3 must add direct public-command replay proof for the anchor side-slip rather
  than claiming it from the old hard-drop-only artifact.
- Next action: commit this docs-only checkpoint, then open P12.1 shared UI/typography.
