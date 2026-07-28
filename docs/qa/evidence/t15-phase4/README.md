# T15 Phase 4 Survival browser evidence

- Source candidate: `cc8c71f`
- Browser: Playwright Chromium `149.0.7827.55`
- Final gates: typecheck passed; 26 files / 203 tests passed; production build
  transformed 753 modules.
- Desktop deterministic sequence: warning column `[8]` became spawn column `[8]`;
  the independent stone landed after 414 additional fixed ticks.
- Responsive checks: 1280×720 desktop, 390×844 portrait, and 844×390
  reduced-motion landscape.
- Every scenario reported zero console/page errors, one gameplay Canvas, zero DOM
  board cells, and no horizontal overflow.
- Visual inspection confirms the accepted brown bedrock, distinct cracked slate
  stone, column-local warning, visible falling/landing endpoints, four-card pressure
  HUD, and complete `M:SS` Survival clock.

`capture_phase4.py` regenerates the JSON and six PNGs from a running candidate at
`http://127.0.0.1:4178/`. The JSON binds each PNG by SHA-256 and records the canonical
Core and renderer snapshots used by the assertions.
