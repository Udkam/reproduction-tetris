# V1 Browser Evidence

Status: **PASS — ready for independent QA review**

Implementation under review: `cef6ab2` (`cef6ab2b2f45e6a7f7e70579f5ddc951f9380074`), parent `e45d2ea3c5880bd59cc80417aa2272da4976e16a`.

This record covers only the authorized V1 desktop occurrence-addressing and visual-transaction continuity slice. Every image is a real Vite development-mode render of the inline synthetic V1 QA state. These states are not authored levels, serialization, campaign content, or special production rules.

The complete machine-readable record, including full command results, transactions, semantic events, addresses, geometry, DOM/console arrays, raster samples, and per-gate results, is in [`v1-browser-evidence.json`](./v1-browser-evidence.json).

## Capture environment and method

- OS: Windows 11, build `10.0.26100` (`Windows-11-10.0.26100-SP0`).
- Browser: existing system Google Chrome `150.0.7871.115`, launched from `C:\Program Files\Google\Chrome\Application\chrome.exe`; no managed Playwright browser download was used.
- User agent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36`.
- WebGL: WebGL 2.0 through ANGLE/D3D11 on NVIDIA GeForce RTX 4070 SUPER; context-loss state was false. The exact vendor, renderer, version, and shading-language strings are recorded in JSON.
- Server: local Vite development server at `http://127.0.0.1:5173`.
- Isolation: every valid capture and every invalid-query probe used a fresh isolated browser context and page at exactly `1440x900`, reported DPR `1`, and renderer resolution `1`.
- Time authority: the app dispatched the real C1 `PublicCommand` through `EventPipeline`, consumed its real result/events through the production runtime, and sampled the manual `VisualTransactionController` at exact normalized progress. No semantic event was synthesized and no wall-clock/ticker time selected a frame.
- Readiness: the actual Pixi ticker was stopped. Each capture required `explicitRenderRevision === renderRevision`, then required the same render revision and normalized progress after two `requestAnimationFrame` reads.

## Captures

All rows have one canvas, the canvas as the host's only descendant, zero gameplay DOM, CSS/backing/screenshot dimensions `1440x900`, zero warning/error/assert/page-error/unhandled-rejection/request-failure/HTTP 4xx-or-5xx/WebGL-loss events, and stable readiness. Development debug/info messages from Vite and React are preserved as `consoleMessages`; none is a problem event.

| Capture | Exact query | Command / rule | Hashes | Focus before -> after | Progress | Camera `x,y,scale` | Worlds / occurrences / apertures | Render / explicit | PNG SHA-256 |
| --- | --- | --- | --- | --- | ---: | --- | ---: | --- | --- |
| `move-50` | `?qa=v1&case=move&progress=0.5` | `Step(right)` / `walk` | `4a66a0f6 -> dbe19a89` | root -> root | 0.5 | `367.2,198,1.05` | `2 / 3 / 0` | `4 / 4` | `beecc44d9b4c1d843dd10ae7b54d18ef868a8dea7e3e8b0383e10cc7e8e90b23` |
| `enter-00` | `?qa=v1&case=enter&progress=0` | `Step(right)` / `enter` | `dbe19a89 -> d57288e2` | root -> `qa-aperture` | 0 | `367.2,198,1.05` | `2 / 4 / 1` | `4 / 4` | `0f3b2dff649422e2af82179c1d6373c78af90d5bb1e4a62ba5e58ddc8bdde2ef` |
| `enter-50` | `?qa=v1&case=enter&progress=0.5` | `Step(right)` / `enter` | `dbe19a89 -> d57288e2` | root -> `qa-aperture` | 0.5 | `180.3,64.5,1.60625` | `2 / 4 / 1` | `4 / 4` | `6e4437c7b52054962fa7f898206bb02149dac69fed3f75b1245603db74ed0648` |
| `enter-100` | `?qa=v1&case=enter&progress=1` | `Step(right)` / `enter` | `dbe19a89 -> d57288e2` | root -> `qa-aperture` | 1 | `-1128,-870,5.5` | `2 / 3 / 1` | `5 / 5` | `a8102edb9d12f43c69198ec60757bd87a20c5c50424934e32e3b7dc5968a6409` |
| `exit-00` | `?qa=v1&case=exit&progress=0` | `Step(left)` / `exit` | `d57288e2 -> dbe19a89` | `qa-aperture` -> root | 0 | `-1128,-870,5.5` | `2 / 4 / 1` | `4 / 4` | `a8102edb9d12f43c69198ec60757bd87a20c5c50424934e32e3b7dc5968a6409` |
| `exit-50` | `?qa=v1&case=exit&progress=0.5` | `Step(left)` / `exit` | `d57288e2 -> dbe19a89` | `qa-aperture` -> root | 0.5 | `180.3,64.5,1.60625` | `2 / 4 / 1` | `4 / 4` | `e5742da99a2c2498a39ce6118b04ff4d7cb6e9495a63fbea82e1bcd279abab3c` |
| `exit-100` | `?qa=v1&case=exit&progress=1` | `Step(left)` / `exit` | `d57288e2 -> dbe19a89` | `qa-aperture` -> root | 1 | `367.2,198,1.05` | `2 / 3 / 1` | `5 / 5` | `da54d20c653a9f5450ade4a3bf45638f6d087057f61f3a001e6816608da12cb5` |

The complete rendered world-address set is identical in every enter/exit frame:

```text
qa-root / []
qa-root / [qa-aperture]
```

All world, entity-occurrence, container, portal, and port records contain structured root-plus-container-path addresses. Structural address keys are unique within every frame; no stale duplicate world, occurrence, or aperture record was observed.

### Screenshot artifact manifest

- `docs/screenshots/v1/move-50.png` — `beecc44d9b4c1d843dd10ae7b54d18ef868a8dea7e3e8b0383e10cc7e8e90b23`
- `docs/screenshots/v1/enter-00.png` — `0f3b2dff649422e2af82179c1d6373c78af90d5bb1e4a62ba5e58ddc8bdde2ef`
- `docs/screenshots/v1/enter-50.png` — `6e4437c7b52054962fa7f898206bb02149dac69fed3f75b1245603db74ed0648`
- `docs/screenshots/v1/enter-100.png` — `a8102edb9d12f43c69198ec60757bd87a20c5c50424934e32e3b7dc5968a6409`
- `docs/screenshots/v1/exit-00.png` — `a8102edb9d12f43c69198ec60757bd87a20c5c50424934e32e3b7dc5968a6409`
- `docs/screenshots/v1/exit-50.png` — `e5742da99a2c2498a39ce6118b04ff4d7cb6e9495a63fbea82e1bcd279abab3c`
- `docs/screenshots/v1/exit-100.png` — `da54d20c653a9f5450ade4a3bf45638f6d087057f61f3a001e6816608da12cb5`

## Hard-gate results

### Move midpoint

- The move has no portal transition, its active address remains root before and after, and its camera is the stable addressed-root fit: `{x:367.2,y:198,scale:1.05}`.
- The actor center is `{x:192,y:240}` in root space, strictly between the source cell center `{x:144,y:240}` and destination cell center `{x:240,y:240}`.
- Both world frames remain rendered; the ticker is stopped and progress/revision remain unchanged across the readiness reads.

### Bidirectional continuity

The comparator checked camera plus every world/aperture screen, shell, clip, clipped, and rim-segment rectangle at a tolerance of `0.5` CSS px. All difference arrays are empty:

- `enter-100 == exit-00`: PASS.
- `enter-50 == exit-50`: PASS.
- `enter-00 == exit-100`: PASS.

### Midpoint real geometry and authored pixels

At both `enter-50` and `exit-50`, the parent world screen bounds are `{x:180.3,y:64.5,width:1079.4,height:771}` and its four actual outer-rim segments have nonzero ancestor-plus-viewport-clipped geometry. The addressed child world has clipped bounds `{x:681.45,y:419.16,width:77.1,height:61.68}`; the addressed aperture has clipped bounds `{x:673.74,y:403.74,width:92.52,height:92.52}`.

Raster checks sample the screenshot pixels only inside those reported clipped geometry regions. They do not substitute a floor rectangle, generic `getBounds()`, or a nonblank-frame count for the required rim/stroke evidence.

| Frame | Region | Inspected pixels | Exact authored-color pixels | Result |
| --- | --- | ---: | ---: | --- |
| `enter-50` | Parent real outer shell/rim | 264,240 | 263,176 | PASS |
| `enter-50` | Child rim | 1,824 | 1,742 | PASS |
| `enter-50` | Child floor | 4,560 | 2,570 | PASS |
| `enter-50` | Aperture stroke | 1,860 | 1,429 | PASS |
| `exit-50` | Parent real outer shell/rim | 264,240 | 263,176 | PASS |
| `exit-50` | Child rim | 1,824 | 1,742 | PASS |
| `exit-50` | Child floor | 4,560 | 2,570 | PASS |
| `exit-50` | Aperture stroke | 1,860 | 1,429 | PASS |

The JSON record includes the matched authored palette colors and concrete pixel coordinates/RGB values for every region.

### Invalid queries fail closed

| Probe | Exact query | Published reason | Runtime constructed | Reported / actual canvas | Result |
| --- | --- | --- | --- | --- | --- |
| Duplicate parameter | `?qa=v1&qa=v1&case=move&progress=0.5` | `qa-query-must-contain-only-one-qa-case-progress-tuple` | false | `0 / 0` | PASS |
| Extra parameter | `?qa=v1&case=move&progress=0.5&extra=x` | `qa-query-must-contain-only-one-qa-case-progress-tuple` | false | `0 / 0` | PASS |
| Non-exact progress spelling | `?qa=v1&case=move&progress=0.50` | `invalid-qa-progress` | false | `0 / 0` | PASS |

All three pages had an empty host, zero problem events, and no runtime/canvas construction.

## Deferred capabilities

- V3 retained-recursive-scene-graph and performance acceptance remain explicitly deferred. This evidence makes no retained-graph, frame-time, object-count, recursion-depth-budget, or heap claim.
- V4 mobile/reported-DPR-3 and renderer-cap behavior, reduced motion, pointer/touch, accessibility, and general checked-in capture automation remain explicitly deferred. This desktop V1 evidence makes no V4 claim.
- The captures also do not claim V2 material/composition completion, level/content readiness, release readiness, or overall game completion.
