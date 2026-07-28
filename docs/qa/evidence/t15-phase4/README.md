# T15 Phase 4 Survival browser evidence

- Source/test candidate: `2af2adfc1640b2d5be2197ec1bf92db8637f70ef`.
  The capture asserts that `HEAD` resolves to this SHA, the declared product paths
  are clean, and their tree matches the candidate before opening Chromium.
- Browser: Playwright Chromium `149.0.7827.55`; fixed ordinary-run seed
  `0x5A0E`.
- Final gates: typecheck passed; 26 files / 203 tests passed; production build
  transformed 753 modules. The unedited stdout is retained in `typecheck.txt`,
  `test.txt`, and `build.txt`.
- The desktop baseline visibly begins with three approved brown bedrock rows.
  At 13 seconds the proof performs one real hard drop so the pending rise resolves;
  the 18-second warning then announces column `[4]`, and the 20-second spawn uses
  column `[4]`. The stone reaches the board 254 ticks after the captured 40-tick
  falling frame (294 ticks after spawn in total).
- Responsive checks cover 1280×720 desktop, 390×844 portrait, and 844×390
  reduced-motion landscape. A separate 1280×720 English capture verifies all four
  Survival labels and the complete `0:18` clock.
- Lifecycle evidence freezes countdown digit `3` for 1.2 seconds while Settings is
  open, exercises pause/resume and restart on the same Canvas, exits/unmounts,
  remounts, and exits again. Global listener ownership returns from 28 mounted to
  the 17-listener home baseline, pending animation frames return from 3 to 0, both
  created audio contexts close, the Canvas count returns to 0, and the QA runtime
  surface is removed after each exit.
- Every scenario reports zero console/page errors, one gameplay Canvas while
  mounted, zero DOM board cells, and no horizontal overflow. Visual inspection
  confirms the brown bedrock, cracked slate stone, column-local warning, falling
  and landing endpoints, four-card pressure HUD, English surface, compact clock,
  Settings countdown compositor, and pause compositor.

`capture_phase4.py` regenerates the JSON and nine PNGs from a running candidate at
`http://127.0.0.1:4178/`. The JSON binds each PNG by SHA-256, records the canonical
Core and renderer snapshots, and includes the candidate and lifecycle assertions.
