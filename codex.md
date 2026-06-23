# Codex Work Log

## v7-loop-20260623-195154-f683

### Stage 1: Project reset and audit docs

Phase: documentation and loop setup.

Actions taken:

- Confirmed `main` is up to date with `origin/main`.
- Created the v7 loop directory structure.
- Added required v7 planning and audit files.
- Added required agent log files.
- Recorded the rule that every stage must verify, commit, and push to `origin main`.

Verification commands and results:

- `git status --short`: only Stage 1 documentation files are untracked.
- `npm run typecheck`: passed.
- `npm run verify`: passed, current baseline still reports 60/60 existing levels.
- `npm run smoke:api`: passed; `node:sqlite` ExperimentalWarning is non-fatal.
- `npm run smoke:ui`: passed; known blind spot remains for current 3D crate counting.

Changed files:

- `docs/v7-loop/CURRENT_RUN_ID.txt`
- `docs/v7-loop/v7-loop-20260623-195154-f683/*`
- `codex.md`

Risks:

- Stage 1 only establishes documentation and process; product code is not changed yet.

Next steps:

- Commit and push Stage 1.
- Begin Stage 2 route/runtime cleanup.

### Stage 2: Project reset and route cleanup

Phase: runtime v6 retirement.

Actions taken:

- Removed v6 3D level definitions from the exposed runtime catalog.
- Removed the visible `立体演示 (dev)` menu entry.
- Updated README, claude.md, and package description to mark v6 2.5D as retired and v7 as the current rebuild.
- Kept old 2.5D source code as unreachable historical reference for now.

Verification commands and results:

- `npm run typecheck`: passed.
- `npm run verify`: passed, 52/52 current exposed levels.
- `npm run smoke:api`: passed, `/api/levels` returns 52 levels.
- `npm run smoke:ui`: passed for all exposed levels.
- `npx tsx -e "...LEVELS check..."`: passed with `count=52`, no `3d*`, no `is3D`.
- `npm run build`: passed.
- A direct `node` import check failed because TypeScript source imports use `.js` specifiers before build; replaced with the `tsx` check.

Changed files:

- `README.md`
- `claude.md`
- `package.json`
- `src/engine/levels.ts`
- `src/web/ui.ts`
- v7 loop docs and agent logs

Risks:

- Old 2.5D source still exists but is not visible in the runtime catalog. Later stages should remove or archive it as the v7 shell replaces legacy UI.

Next steps:

- Commit and push Stage 2.
- Begin Stage 3 sci-fi art system and UI shell.
