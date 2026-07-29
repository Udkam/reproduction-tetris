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
