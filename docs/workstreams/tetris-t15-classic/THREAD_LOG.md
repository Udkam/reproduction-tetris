# T15 Phase 6 Classic Workstream Log

## TETRIS-T15-PHASE6-CONTRACT-001

- Status: `CONTRACT / OPEN`.
- Base SHA: `4f871ac3706f95c2a57679dd0162071c89363ecb`.
- Writer: coordinator acting as `t15_classic_writer`.
- Goal: replace only the shared ordinary line-clear sweep with the frozen row-local
  confirmation, inward contraction/dissolve, and restrained deterministic afterglow.
- Product paths opened for the first source checkpoint:
  - `src/game/render/presentation.ts`;
  - `src/game/render/presentation.test.ts`;
  - `src/game/render/TetrisRenderer.ts`;
  - `src/game/render/TetrisRenderer.test.ts`.
- Frozen paths: Core, runtime, React/UI/CSS, records, localization, Puzzle data and
  selector, Mutation Bomb/Collapse presentation, dependencies and packaging.
- Required evidence: focused helper/geometry tests; final typecheck, full suite and
  build after source freeze; real 1/2/3/4-row, safe-next-frame, reduced-motion and
  responsive browser frames; one Canvas, zero DOM cells/errors/leaks.
- Resource boundary: one heavy process tree at a time; no WMI/CIM; no retained Serena,
  MCP, Vite, browser, test or build helper between checkpoints.
- Next action: commit this docs-only contract, then implement the four-file Renderer
  slice without acquiring another product path.

## TETRIS-T15-PHASE6-ORDINARY-CLEAR-002

- Status: `SOURCE CHECKPOINT / GREEN`.
- Contract SHA: `7aed5effab81cade330bfe63c0eb9d37a1888c6d`.
- Source SHA: `1a163ff3fed7cdf1cb6af6c12f92f291e0593006`.
- Exact changed paths:
  - `src/game/render/presentation.ts`;
  - `src/game/render/presentation.test.ts`;
  - `src/game/render/TetrisRenderer.ts`;
  - `src/game/render/TetrisRenderer.test.ts`.
- Delivered claim:
  - the old broad sweep is replaced by a pure 11-tick renderer timeline inside the
    unchanged 12-tick Core delay;
  - clearing cells retain their real materials, contract less than one quarter-cell
    toward the row centre, dissolve to a bounded residual silhouette, then resolve
    with deterministic row-local dots and short shards;
  - one through four rows share timing/geometry and only scale bounded strength;
  - reduced motion keeps cells stationary and draws only a fading row-local line;
  - Puzzle target markers and Mutation carrier overlays no longer remain statically
    painted over a row while its cells are dissolving.
- Commands actually run:
  - `npm.cmd run test -- src/game/render/presentation.test.ts --maxWorkers=1` —
    PASS, 1 file / 12 tests;
  - repeated focused pair
    `npm.cmd run test -- src/game/render/presentation.test.ts
    src/game/render/TetrisRenderer.test.ts --maxWorkers=1` — final PASS,
    2 files / 39 tests;
  - first `npm.cmd run typecheck` — FAIL only because five new minimal test fixtures
    used direct `as GameState` assertions;
  - corrected `npm.cmd run typecheck` — PASS;
  - `git diff --check` — PASS.
- Disposable browser smoke:
  - the prescribed web-game client entered real Classic with one Canvas and emitted
    no console-error file;
  - an isolated real `TetrisRenderer` pass captured confirmation, contraction,
    afterglow, endpoint, and reduced-motion frames for original-detail inspection;
  - inspection found the first afterglow too faint, so short deterministic shards
    were added and recaptured before source freeze;
  - these temporary frames were deleted after inspection and are explicitly not
    Phase-6 acceptance evidence.
- Resource cleanup: the exact Vite tree `25008 → 29464 → 6392 → 9688`, listener
  4178, all temporary Chromium processes, and the verified Phase-6 temp directory
  were released. No WMI/CIM query was used.
- Blocker: none.
- Next action: freeze a baseline audit for Classic terminology, landing, combo,
  level-up, and top-out. Open another source path only for a proven Phase-6 gap;
  otherwise proceed directly to final source gates and production browser evidence.
