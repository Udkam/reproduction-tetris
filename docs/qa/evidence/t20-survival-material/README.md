# T20 Survival material harmony evidence

- Candidate source SHA: `eadeac6`
- Viewports: `1440×900` normal motion and `1280×720` reduced motion
- Canonical state: Survival active play with three bedrock rows; the warning captures are taken at the seeded two-second falling-stone warning window.
- Browser contract: one PixiJS canvas, zero DOM board cells, no horizontal or vertical overflow, no browser console errors.

## Captures

- `survival-active-wall-1440x900-zh.png`: ordinary active play, showing the continuous cold-slate mineral wall and flat gameplay contact edge.
- `survival-warning-phase-a-1440x900-zh.png` and `survival-warning-phase-b-1440x900-zh.png`: opposite phases of the short warm warning flash with a persistent source-column arrow.
- `survival-warning-reduced-1280x720-zh.png`: the static reduced-motion warning endpoint.
- `browser-evidence.json`: canonical state, geometry, viewport assertions, console capture, and SHA-256 hashes. It verifies that the normal warning frames differ while the two reduced-motion samples are pixel-identical.

## Final gates

- `npm.cmd run typecheck`: passed.
- `npm.cmd run test -- --maxWorkers=1 --no-file-parallelism`: 32 files passed, 1 skipped; 297 tests passed, 3 skipped.
- `npm.cmd run build`: passed (Vite emitted only the existing chunk-size advisory).
