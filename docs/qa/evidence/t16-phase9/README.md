# T16 Phase 9 browser evidence

## Candidate

- Base: `4fc15b8`
- Final source candidate: `9c515f6`
- Browser URL: `http://127.0.0.1:5178/`
- Captured: 2026-07-31
- Scope: final home pass, 50-level selector, survival countdown/cavern/stonefall, ordinary landing and line-clear feedback, rules/i18n regression

All screenshots in this directory were captured from the final source candidate. The
Playwright client was started only for each bounded capture and exited after the frame
and state artifact were written.

## Final gates

- `npm.cmd run typecheck`: PASS
- `npm.cmd run test`: PASS — 27 files, 252 tests
- `npm.cmd run build`: PASS — 754 modules
- Build note: Vite retained its existing non-blocking chunk-size advisory.

## Browser acceptance matrix

### Home

- 1440×900, 844×390, 390×844, 360×800: no document overflow or clipped mode action.
- Keyboard: Right moves Classic → Survival; Down moves Classic → Puzzle; the selected
  mode is the sole roving-tabindex target.
- English switch: `lang="en"` and the live region is empty after the language change;
  no stale Chinese announcement remains.
- `prefers-reduced-motion: reduce`: layout and content remain complete without relying
  on motion.

### Puzzle selector

- 1440×900, 1280×720, 844×390, 390×844, 360×800: all 50 level targets are present
  without page or selector scrolling.
- At 360×800, the smallest level target is approximately 50.74 px.
- Home/End keyboard navigation focuses level 01/50 respectively.

### Game and rules

- Gameplay contains exactly one canvas and zero DOM board cells.
- Browser console: zero errors and zero warnings during the acceptance pass.
- Chinese rule titles have no inserted space; the first-entry and repeated “规则”
  labels are absent; the acknowledgement action reads “好的”.
- Survival copy states that each event produces a random 1–2 removable stones in one
  random column at twice the normal-piece speed.
- Countdown frames show one, two, then three cold-slate bedrock rows beneath digits
  3, 2, and 1.
- The bounded 24.5-second survival capture records two falling stones with the same
  `x` coordinate in `survival-stonefall-state.json`.
- Ordinary line clear uses a short per-cell face bloom with no full-width horizontal
  line. Landing feedback remains local to the settled piece.

## Artifacts

- `home-1440x900-zh.png` — desktop home
- `home-844x390-zh.png` — landscape compact home
- `home-reduced-motion.png` — reduced-motion home
- `selector-1280x720-zh.png` — desktop 50-level selector
- `selector-360x800-zh.png` — compact portrait selector
- `ordinary-line-clear.png` — deterministic line-clear frame without a horizontal bar
- `survival-countdown-3-row1.png` — digit 3 with one revealed bedrock row
- `survival-countdown-2-row2.png` — digit 2 with two revealed bedrock rows
- `survival-countdown-1-row3.png` — digit 1 with three revealed bedrock rows
- `survival-stonefall-same-column.png` — bounded survival frame with a same-column
  two-stone event
- `survival-stonefall-state.json` — machine-readable frame state for the stone event

See `MANIFEST.sha256` for artifact integrity hashes.
