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

## TETRIS-T15-PHASE6-BASELINE-AUDIT-003

- Status: `AUDIT / GAP / SECOND SOURCE CONTRACT OPEN`.
- Audited source: `1a163ff3fed7cdf1cb6af6c12f92f291e0593006`.
- Documentation tip before this contract: `1ba6c26fc48ec691dd9ea4902654763074cd2fdb`.
- Read-only findings:
  - `RunStats` already exposes explicit Classic roles and the accepted
    `分数 / 消行 / 连消 / 下落速度/格` copy, with direct App coverage; no UI,
    localization, or CSS writer is justified;
  - landing already has a cell-local lock fill and hard-drop trail, but the separate
    `impact` value assigned to hard drop, line resolution, Survival stones, Mutation,
    and level events is never consumed by drawing or geometry;
  - Classic has no renderer cue for a consecutive clear, crossing a ten-line speed
    boundary, or top-out beyond the generic terminal scrim.
- Disposition: do not wire dormant `impact` into global movement because that would
  alter frozen modes. Open a two-file Classic-only Renderer cue checkpoint.
- Exact source paths opened:
  - `src/game/render/TetrisRenderer.ts`;
  - `src/game/render/TetrisRenderer.test.ts`.
- Acceptance: bounded coexisting landing/combo/speed/top-out cues, board-local
  geometry, stationary reduced-motion endpoint, release on lifetime/restart, no cues
  in other modes, and no Core/UI/audio change.
- Resource state: no Vite, browser, test, build, Serena, MCP, or subagent helper
  retained; no WMI/CIM query used.
- Next action: commit this contract, implement and focus-test the two-file slice,
  then freeze all Phase-6 source before final gates.

## TETRIS-T15-PHASE6-CLASSIC-FEEDBACK-004

- Status: `SOURCE FROZEN / GREEN`.
- Contract SHA: `fee0627`.
- Ordered source checkpoints:
  - `a1f3d1b` — bounded Classic-only landing/combo/speed/top-out cue list,
    board-local drawing, immutable Renderer snapshot, lifecycle and geometry tests;
  - `eaed1ac` — visual-smoke correction that moves the floor landing echo into the
    supported cell, adds a restrained light core/contact glow, and leaves the other
    three cue families unchanged.
- Exact changed product paths:
  - `src/game/render/TetrisRenderer.ts`;
  - `src/game/render/TetrisRenderer.test.ts`.
- Delivered behavior:
  - normal non-clearing Classic locks receive support-edge contact feedback;
  - a Classic combo above one and a crossed ten-line speed boundary queue and draw
    together instead of overwriting one another;
  - Classic top-out marks only the spawn zone over the existing terminal scrim;
  - the cue list is capped at six, cloned in Renderer QA snapshots, released by
    lifetime/restart/destroy, and never populated by another mode;
  - reduced motion uses stationary strokes and shorter lifetimes.
- Commands actually run after the final source edit:
  - `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts --maxWorkers=1` —
    PASS, 1 file / 29 tests;
  - `npm.cmd run typecheck` — PASS;
  - `git diff --check` — PASS before each source checkpoint.
- Disposable visual smoke:
  - real Pixi extracts covered landing, combo + speed, top-out, and reduced motion;
  - the first landing frame was rejected as visually merged with the floor edge;
  - the corrected floor frame visibly retains the light contact core inside the
    landed cells; all browser console/page errors remained zero;
  - no disposable PNG was retained as formal evidence.
- Resource disposition:
  - the exact Vite tree `15708 → 8508 → 2740`, listener 4178, temporary Chromium,
    Node REPL bindings, and verified temp directory were released;
  - one accidental `Get-CimInstance` parent lookup occurred during Vite tracing,
    contrary to the resource contract; it was stopped immediately and every later
    process check used only known PID, `Get-Process`, and listener ownership.
- Blocker: none.
- Next action: run the one final source-bound typecheck/full suite/build sequence,
  then create source-bound browser evidence without reopening product code.

## TETRIS-T15-PHASE6-FINAL-GATES-005

- Status: `GATES PASS / EVIDENCE WRITER OPEN`.
- Product candidate: `eaed1ac0962ba7256b44136f7bd4f0faef603970`.
- Gate checkpoints:
  - `55e5a7b` — raw final gate logs;
  - `fb9ccc2` — explicit LF normalisation after the raw-log commit exposed trailing
    Vite whitespace and terminal blank lines;
  - `50e3693` — source binding, hashes, commands and results indexed.
- Final results:
  - `npm.cmd run typecheck` — PASS;
  - `npm.cmd run test -- --maxWorkers=1` — PASS, 26 files / 231 tests;
  - `npm.cmd run build` — PASS, 753 modules; the pre-existing chunk-size warning is
    non-fatal.
- Frozen log hashes:
  - `typecheck.txt` — `4894d6e53b46d1be542291996cb9c1d7fbfd1ab037a1149204c0d80d4d502e86`;
  - `test.txt` — `18757e5a30fb8ae7f0c209814c1c521b34db7e678b4b4de93b45df345cabff76`;
  - `build.txt` — `13f12d3b56f1022db95bb96b6410454355dd7a8f91961c1e4229f42c315ed15f`.
- Evidence route audit:
  - real public-command witnesses exist for one, two and three simultaneous rows;
  - no verified current route produces four simultaneous rows, so formal evidence
    must label its four-row frame as isolated Renderer contract proof rather than a
    runtime replay.
- Exact writer path opened:
  - `docs/qa/evidence/t15-phase6/capture_phase6.py`.
- Resource boundary: one managed Vite/Chrome tree only; no concurrent test/build/QA
  agent; no WMI/CIM; release listener 4178 and the owned browser tree before QA.
- Next action: commit this evidence contract, commit the fail-closed harness, run one
  managed batch, inspect every original PNG, then freeze the evidence candidate.

## TETRIS-T15-PHASE6-BROWSER-EVIDENCE-006

- Status: `EVIDENCE FROZEN / SERIAL QA NEXT`.
- Product candidate: `eaed1ac0962ba7256b44136f7bd4f0faef603970`.
- Evidence checkpoints:
  - `21da461` — initial fail-closed harness;
  - `db3423b` — isolated Renderer uses no unrelated Next queue;
  - `8ff34d5` — landing action and extraction share one browser transaction;
  - `1b9c85f` — zero-tick public QA flush deterministically hands queued events to
    Renderer before transient snapshots;
  - `a231fda` — fifteen original PNGs and managed Vite logs;
  - `d7fb4fa` — browser manifest and nineteen SHA-256 entries.
- Rejected attempts:
  - the first mechanically passing batch was rejected during original-detail review
    because an isolated queue allowed its Next preview to enter the board crop; all
    nineteen uncommitted generated files were explicitly removed;
  - two subsequent runs failed closed at the landing-cue binding until the public
    action, zero-tick Renderer flush and Pixi extraction became atomic;
  - no rejected batch published a partial directory or remained in the repository.
- Final coverage:
  - exhaustive public Core replay locates real one-, two- and three-row witnesses and
    proves the verified route set has no four-row witness;
  - real product/runtime frames cover one-row confirmation, contraction, afterglow,
    safe next active piece and two-piece Puzzle Next;
  - the four-row frame is labelled isolated real-Renderer proof;
  - Classic covers public-runtime landing plus isolated coexisting combo/speed,
    top-out and stationary reduced-motion endpoints;
  - desktop 1440×900, portrait 390×844 and short landscape 844×390 preserve visible
    board, HUD and Next with no document overflow.
- Runtime/lifecycle:
  - exactly one Canvas and zero DOM cells while mounted;
  - same Canvas/listener/audio counts across restart;
  - two Classic unmounts and Puzzle unmount return to the exact home listener set,
    zero Canvas and zero open AudioContexts;
  - browser console/page errors: zero.
- Integrity:
  - all fifteen PNGs inspected at original detail;
  - nineteen manifest/script/PNG/log hashes independently recomputed: PASS;
  - product tree before/after matches `eaed1ac`.
- Resource disposition:
  - managed Vite PID 3704 is released;
  - port 4178 is free;
  - controlled Chrome reports closed;
  - no partial evidence directory remains and no test/build/QA overlapped the run.
- Blocker: none.
- Next action: hand `eaed1ac` plus `d7fb4fa` to one rules QA, then one visual QA,
  then one evidence-integrity QA, strictly serially. Any finding returns to its owning
  source or harness checkpoint before fresh evidence.

## TETRIS-T15-PHASE6-RULES-QA-007

- Status: `REJECT / P2 / CORRECTION WRITER OPEN`.
- Audited product/evidence: `eaed1ac` / `d7fb4fa`.
- P0/P1/P3/GAP: none.
- P2: landing drawing treats every piece-bottom cell as supported. It excludes a cell
  only when another cell of the just-locked piece is immediately below, but never
  checks for the floor or a pre-existing canonical board cell. A horizontal piece
  locked on one support therefore paints contact under airborne overhang cells.
- Accepted unaffected findings:
  - product diff remains within declared Renderer/presentation paths;
  - 11-tick Renderer clear stays inside the 12-tick Core delay;
  - 1–4 row strength, Classic-only bounded cue queue, combo/speed coexistence,
    top-out, reduced motion and lifecycle are otherwise correct;
  - all gate and browser hashes reproduce, and runtime/isolated evidence labelling is
    honest.
- Exact correction paths:
  - `src/game/render/TetrisRenderer.ts`;
  - `src/game/render/TetrisRenderer.test.ts`.
- Required correction: freeze only floor- or locked-board-supported cells when the
  `piece-locked` event is consumed; directly test a one-support overhang. Do not alter
  any other product or evidence path in the source checkpoint.
- Resource state: rules QA ran alone without browser/test/build/MCP/Serena/WMI/CIM and
  has exited.
- Next action: commit this correction contract, implement and focus-test the two-file
  slice, then regenerate final gates and all source-bound browser evidence.
