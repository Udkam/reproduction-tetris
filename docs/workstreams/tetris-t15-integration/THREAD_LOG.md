# T15 Phase 8 Integration Workstream Log

## TETRIS-T15-PHASE8-CONTRACT-001

- Status: `CONTRACT / PRODUCT FROZEN`.
- Pushed candidate: `4e4cca1e26554323d5712a2e28386c4a9fb4f7e2`.
- Accepted phase boundaries:
  - Phase 1–6 accepted and pushed;
  - fifty-level curriculum, v5 persistence and progressive unlock accepted and
    pushed;
  - direct ordinary-clear rollback accepted and pushed;
  - selector visual redesign explicitly excluded.
- Preserved rejected selector WIP:
  `codex/t15-selector-wip-20260730@dce331b`; it is not part of `main`.
- Static completion evidence before browser:
  - five schema-7 artifacts: 50 unique levels, 100 unique routes, tiers
    3/4/5/6/7 rows;
  - final clean gates: Renderer 39, route/QA 5, typecheck, full 26 files /
    235 tests, 753-module build;
  - Mutation re-audit: PASS, P0–P2/GAP zero, retained narrow ellipsis P3 only;
  - Phase-5 browser manifest: 34 captures, 38/38 hashes, 4/4 gate hashes,
    FIFO, actual Collapse columns, Renderer p95 0.3 ms, rAF p95 8.4 ms,
    final rAF/audio/Canvas zero.
- Open paths:
  - `docs/phases/phase 8.md`;
  - `docs/CURRENT_TASK.md`;
  - coordinator/integration workstream records;
  - `docs/qa/evidence/t15-phase8/**`;
  - final QA verdict documents and acceptance/changelog records.
- Product source, dependencies, config, Puzzle definitions/artifacts and selector
  UI remain closed unless fresh evidence proves a concrete defect.
- Resource boundary: one runner, one managed Vite tree, one Chrome tree and one
  browser batch at a time; no WMI/CIM, Serena, MCP, watcher, resident reader or
  new child agent during capture. Release ports 4178/5178/5179 and every owned
  temporary process before QA.
- Next action: author a fail-closed current-head integration harness, run the
  official web-game client and the managed batch, inspect all frames, then freeze
  raw evidence before manifest/index and serial independent QA.
