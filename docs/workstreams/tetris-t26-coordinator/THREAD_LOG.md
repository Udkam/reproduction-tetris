# T26 Coordinator Workstream Log

- Task ID: `tetris-t26-coordinator`
- Base SHA: `2d4f3ecc7d51ee756ac55442088be59aa0d7d0f9`
- Owner: primary coordinator / sole writer until an immutable candidate is ready for
  independent read-only QA
- Status: Phase A contract open; no Phase-A source accepted yet
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
  inventory; no Phase-A tests, build, server, browser, or helper process yet
- Evidence: active old identity is limited to package/README and the maintained DEV-QA
  surface. Current persistence still writes selected `qingliu:*` and `tetris:*` keys,
  so migration must precede replacement.
- Blocker: none
- Next action: commit this contract, then implement public metadata/README as the first
  source-independent checkpoint.
