# Project file map

This repository separates product code, durable records, reusable tooling, and local
generated material. New files should follow this map instead of accumulating at the
repository root.

| Location | Purpose | Versioned |
| --- | --- | --- |
| `src/` | React composition, UI state, and the deterministic game implementation. | Yes |
| `src/game/core/` | Renderer-independent rules, seeded state, Puzzle definitions, and direct tests. | Yes |
| `src/game/{audio,input,render,runtime}/` | Browser-facing subsystems around the Core. | Yes |
| `src/ui/` | Small presentation components shared by application screens. | Yes |
| `docs/` | Active contracts, design direction, changelog, formal QA, screenshots, and workstream records. | Yes |
| `scripts/` | Reusable evidence-capture and QA automation. | Yes |
| `tools/` | Standalone authoring and solver utilities. | Yes |
| `Solutions/` | Local Puzzle walkthrough Markdown and per-lock images; regenerated from current routes. | No |
| `output/` | Local browser-client capture output. | No |
| `.local/` | Local QA workspaces, archived audits, scratch harnesses, and logs. | No |
| `dist/`, `coverage/`, `.vite/`, `.playwright-mcp/`, `node_modules/` | Build, test, and dependency products. | No |

## Root rules

Keep the root limited to project configuration (`package*.json`, TypeScript/Vite
configuration, `.gitignore`), entry files, `README.md`, and the four primary folders
above. Do not leave screenshots, diagnostic logs, generated walkthroughs, or temporary
scripts at the root.

## Local artifact routing

- Put ad hoc screenshots and captured browser states in `.local/audits/<topic>/`.
- Put local diagnostic logs in `.local/logs/`.
- Keep browser-client output below `output/web-game/<run-name>/`.
- Keep the player-readable Puzzle routes below `Solutions/Solution-<n>.md` and their
  adjacent image directory. These files stay ignored and must never be staged.
- Put durable, source-bound QA records only in `docs/qa/` and `docs/screenshots/`.

The historical root captures are retained under `.local/audits/legacy-root/` so they
remain available without obscuring the project entry points.
