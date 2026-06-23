# Iteration Log

## Stage 1: Project reset and audit docs

Goal:

- Create v7 run directory and required documentation skeleton.
- Record current failure premise and baseline audit.
- Record agent roster and strict push-per-stage rule.

Actual changes:

- Added `docs/v7-loop/CURRENT_RUN_ID.txt`.
- Added required v7 loop documentation files.
- Added required agent log files.
- Added repo-local `codex.md`.

Verification:

- `git status --short`: only Stage 1 documentation files are untracked.
- `npm run typecheck`: passed.
- `npm run verify`: passed. Current baseline remains 60/60 current levels, including rejected v6 3D levels.
- `npm run smoke:api`: passed. API still returns 60 current levels; Node emitted a non-fatal `node:sqlite` ExperimentalWarning.
- `npm run smoke:ui`: passed. Existing blind spot remains: current 3D levels report `crates=0` because the old UI smoke only counts `.board .crate`.

Failure items:

- No Stage 1 blocker.
- Carry-forward risk: current visual/UI smoke is insufficient for v7 acceptance.

Next step:

- Commit Stage 1 and push to `origin main`.

## Stage 2: Project reset and route cleanup

Goal:

- Retire the user-visible v6 2.5D route without yet rewriting the whole game.
- Remove public 3D level exposure and dev demo entry.
- Update current top-level docs so v6 is not promoted as the active success path.

Actual changes:

- Removed `LEVEL3D_DEFS` from the runtime `LEVEL_DEFS` catalog.
- Removed the visible `立体演示 (dev)` menu button.
- Replaced `README.md` with v7-loop current status and retired-v6 language.
- Replaced `claude.md` with v7-loop current work report.
- Updated `package.json` description.
- Updated the top comment in `src/engine/levels.ts`.

Verification:

- `npm run typecheck`: passed.
- `npm run verify`: passed, current exposed catalog is 52/52.
- `npm run smoke:api`: passed, `/api/levels` now returns 52 levels.
- `npm run smoke:ui`: passed, all current exposed levels win through jsdom.
- `npx tsx -e ...LEVELS check...`: passed with `{"count":52,"ids":[],"is3D":[]}`.
- `npm run build`: passed.
- Discarded check: direct `node` import of TS/JS source failed due extension/runtime mismatch; replaced by the `tsx` catalog check above.

Failure items:

- No Stage 2 blocker.
- Carry-forward risk: unused v6 2.5D source still exists as historical code, but it is no longer in the user-visible runtime catalog.

Next step:

- Commit Stage 2 and push to `origin main`.

## Stage 3: New sci-fi art system and navigation shell

Goal:

- Replace the old paper/wood visual language with a clear 2D sci-fi shell.
- Rebuild the home screen into a command deck with first-class navigation.
- Add user-facing entries for chapter star map, mechanism archive, records, and settings.
- Keep the current 52-level runtime stable while the v7 level/engine rebuild is still pending.

Actual changes:

- Replaced `src/web/styles.css` with a new dark sci-fi 2D visual system: neon grid background, hologram panels, command buttons, chapter map styling, HUD styling, board states, overlays, and responsive mobile rules.
- Rebuilt `showMenu()` in `src/web/ui.ts` into a command-deck home screen.
- Added `章节星图`, `机制档案`, `挑战记录`, and `设置` navigation surfaces.
- Added `showRecords()` and `showSettings()` overlays.
- Removed remaining visible 3D divider/badge handling from the home/level list flow.
- Changed `package.json` description to ASCII-only text after confirming PowerShell had rendered UTF-8 symbols as mojibake in console output.

Verification:

- `npm run typecheck`: passed.
- `npm run verify`: passed, current exposed catalog remains 52/52.
- `npm run smoke:api`: passed, `/api/levels` returns 52 levels.
- `npm run smoke:ui`: passed, all current exposed levels still win through jsdom.
- `npm run build`: passed.
- Temporary DOM audit with `npx tsx -`: passed for `.home-deck`, primary continue button, `#chapter-map`, mechanism archive button, records button, settings button, and no visible `立体演示` / `2.5D` entry.

Failure items:

- Initial temporary DOM audit failed because PowerShell piping converted Chinese regex text into `????`; root cause was ad-hoc script transport encoding, not repo source encoding. Re-ran the same assertions with Unicode escapes and passed.
- Stage 3 is not final v7 acceptance. It still uses the old 52 exposed level data and old mechanics while establishing the new shell.
- Carry-forward risk: no real-browser screenshot audit exists yet; `smoke:visual` is still pending for later stages.
- Carry-forward risk: CSS currently uses local/system font stack names only. Final font decision and license record are still pending.

Next step:

- Commit Stage 3 and push to `origin main`.
- Begin Stage 4 mechanism/data/test foundation.
