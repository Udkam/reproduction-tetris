# T18 Coordinator Workstream Log

## 2026-07-31 — Phase 11 contract checkpoint

- Task ID: `T18-P11.0`
- Base SHA: `a2d6670f6e1c6cfbf61eee232c3d4468c38dc65e`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/phase 11.md`
  - `docs/progress.md`
  - `progress.md`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
- Commands actually run: targeted UTF-8 Git, contract, current source, skill, resource,
  and official font-license inspection only. No test, build, server, browser, or
  persistent helper started.
- Evidence: `main`, tracking, and `origin/main` matched at the clean accepted Phase-10
  tip. The player's nine findings are frozen as explicit material, interaction,
  typography, information, and deterministic Puzzle-analysis outcomes. Space
  Grotesk Variable and Geist Mono Variable are selected as locally packaged UI/data
  candidates; browser acceptance remains mandatory before they can be accepted.
- Resource note: work remains single-writer. No project listener or browser exists;
  heavy gates and managed browser evidence are deferred to the final candidate.
- Blocker: none.
- Next action: commit this docs-only checkpoint, then open P11.1 palette and geology.

## 2026-07-31 — P11.1 bright enamel and connected geology checkpoint

- Task ID: `T18-P11.1`
- Base SHA: `e184dc513aae96e006e4e04f881dd1c250425737`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/game/render/theme.ts`
  - `src/game/render/theme.test.ts`
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Commands actually run:
  - focused Renderer/theme test, first run: `43/45` passed; one intended old
    per-cell-decal count and one too-dark material endpoint failed
  - corrected focused Renderer/theme test: `45/45` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: all seven ordinary materials use brighter faces and signal edges while
  retaining dark perimeters and contrast floors. Bedrock now limits large mineral
  planes, fractures, chip, and pit counts at component scale rather than stamping
  every cell; internal seams are subdued. A vertical one/two-stone event owns a
  joined boulder treatment distinct from the permanent shelf.
- Blocker: real-frame visual acceptance is deliberately deferred to the immutable
  candidate; this is a source-green recovery point, not final visual acceptance.
- Next action: commit P11.1, then open P11.2 Mutation atmosphere and projection.

## 2026-07-31 — P11.1 visual rejection and corrective boundary

- Task ID: `T18-P11.1R`
- Rejected checkpoint: `74e3720`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/phase 11.md`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Evidence: direct player review correctly rejected component-scale decals as an
  insufficient material change. Reducing decal repetition still leaves the ordinary
  square body and therefore cannot make bedrock or falling events read as rock.
- Corrective boundary: the next renderer slice must bypass the ordinary-cell body for
  both geology roles. Bedrock owns a continuous no-grid rock shelf; falling events own
  irregular vector boulders with real lit/shadow faces. An early real Survival frame
  is required before P11.2 may open.
- Blocker: P11.1 is reopened; `74e3720` is a recovery point, not an accepted visual.
- Next action: commit this docs-only correction, replace geology geometry, run focused
  proof, then inspect one managed real frame and release the browser/server.

## 2026-08-01 — P11.1R no-grid rock geometry checkpoint

- Task ID: `T18-P11.1R-SOURCE`
- Base SHA: `0abae4838424c6159b6bdf389514eca1d4d8b767`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Commands actually run:
  - focused Renderer/theme test: `45/45` passed
  - `npm.cmd run typecheck`: passed
  - official web-game client: two bounded Survival inspections, including a live
    two-stone event; no console-error artifact emitted
  - exact listener release for owned Node PIDs `31300` and `30340`; port `5178`
    verified without a listener after each batch
- Evidence: geology now exits the ordinary-cell path before rounded rectangles,
  cell seams, or cell relief are painted. A rectangular bedrock component becomes
  one jagged continuous silhouette with one lit ridge, three connected structural
  planes, and four non-grid fracture branches. Falling one/two-stone components use
  irregular octagonal bodies with integral light/shadow faces and an overlapping
  vertical join. Real frames verified the absence of the old square bedrock grid and
  showed the two descending bodies as boulders rather than textured tiles.
- Blocker: final palette/geology acceptance still depends on the integrated browser
  comparison round; the temporary frames are diagnostic and remain outside Git.
- Next action: commit this corrective source recovery point, then open P11.2.

## 2026-08-01 — P11.2a truthful Supergravity projection checkpoint

- Task ID: `T18-P11.2A`
- Base SHA: `cb6051227c17e9c154fc3b27146ae6cb87b1072a`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/game/render/presentation.ts`
  - `src/game/render/presentation.test.ts`
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Commands actually run:
  - focused presentation/Renderer test: `51/51` passed
  - first typecheck exposed readonly snapshot and test-spy typing only; corrected
  - repeated focused test: `51/51` passed
  - repeated `npm.cmd run typecheck`: passed
- Evidence: one pure renderer query clones the settled board, places the rigid hard-
  drop body, applies Core's existing `collapseSprintColumns`, and maps every source
  cell to its real independently settled row. Both drawn ghost and public renderer
  snapshot use that result. Direct proof covers asymmetric support, the ordinary
  rigid projection when inactive, repeated determinism, and zero board mutation.
- Blocker: none for projection. Atmosphere and activation visuals remain open.
- Next action: commit P11.2a, then implement the Ice/Supergravity/Bomb visual grammar.
