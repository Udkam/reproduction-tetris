# T16 Phase 9 browser evidence

## Candidate

- Phase base: `4fc15b8`
- Final product-source candidate: `348209f`
- Evidence-contract tip before capture: `dc9abbf`
- Browser URL: `http://127.0.0.1:5178/`
- Captured: 2026-07-31
- Scope: home pointer-leave behavior, square two-page Puzzle gallery, ready-state
  visibility, and mode-aware result ledgers

The navigation, countdown, and result frames in this directory were regenerated from
the final product-source candidate. One managed Chrome process was used for the full
batch and closed afterward. The official web-game client then completed one bounded
iteration and exited without a console-error artifact.

`ordinary-line-clear.png`, `survival-stonefall-same-column.png`, and
`survival-stonefall-state.json` are retained accepted renderer evidence from the
earlier unchanged Phase-9 source checkpoint. They are not used as proof for the
navigation, ready-state, or result-ledger corrections recorded here.

## Final gates

- `npm.cmd run typecheck`: PASS
- `npm.cmd run test -- --maxWorkers=1`: PASS — 29 files, 260 tests
- `npm.cmd run build`: PASS — 756 modules
- Build note: Vite retained its existing non-blocking chunk-size advisory.

## Browser acceptance matrix

### Home

- `1440×900`, `844×390`, `390×844`, and `360×800` have equal document
  client/scroll geometry.
- Every frame has four entry controls, zero Canvas, and zero DOM game cells.
- After hovering Mutation and moving the pointer outside the mode region, the measured
  hover count is `0`; active/data-selected/pressed-state count is also `0`.
- English renders with `lang="en"`.
- Under `prefers-reduced-motion: reduce`, all four mode cards report `0s`
  transition duration.

### Puzzle gallery

- Page one is `01–25`, page two `26–50`; only twenty-five functional level controls
  are mounted at once and the active range exposes the correct `aria-selected` state.
- Every level control is square. Minimum measured sides are `95.02 px` at
  `1440×900`, `91.5 px` at `1280×720`, `46 px` at `844×390`, `64.8 px` at
  `390×844`, and `58.8 px` at `360×800`.
- Desktop gaps are `12 px`; short-landscape gaps are `6 px`; portrait gaps are
  `8 px`. Grid width/height equal scroll width/height in every frame.
- Chinese and English page-two frames retain the connected preview, localized name,
  current best, and Start action without clipping.

### Ready-state visibility

- Countdown `3 / 2 / 1` reports exactly `10 / 20 / 30` visible locked cells and
  `1 / 2 / 3` staged bedrock rows.
- All three ready frames report no preview bounds, hidden preview layer, empty preview
  queue, zero active cells, and zero ghost cells.
- The first playing frame restores one Next preview plus four active and four ghost
  cells while retaining thirty bedrock cells.
- Every frame contains exactly one Canvas, zero DOM cells, and no document overflow.

### Result ledgers

- Classic presents `消行 / 分数`; Survival presents only
  `生存时间 / 消行`; Mutation presents `Lines / Score`.
- Ranked Classic, Survival, and Mutation runs show an explicit current-run rank and
  current leaderboard row.
- The seeded Classic comparison shows `未进入前 5` and no current-run row, proving
  the unranked branch.
- Result frames at `1440×900`, `844×390`, and `390×844` have equal document
  client/scroll geometry.

## Artifacts

- `browser-evidence.json` — machine-readable geometry and semantic assertions
- `home-1440x900-zh.png`, `home-1440x900-en.png` — desktop home
- `home-844x390-zh.png`, `home-390x844-zh.png`, `home-360x800-zh.png` —
  compact home frames
- `home-reduced-motion.png` — reduced-motion home
- `selector-1440x900-page1-zh.png`, `selector-1440x900-page2-zh.png`,
  `selector-1440x900-page2-en.png` — desktop two-page gallery
- `selector-1280x720-zh.png`, `selector-844x390-zh.png`,
  `selector-390x844-zh.png`, `selector-360x800-zh.png` — responsive square gallery
- `survival-countdown-3-row1.png`, `survival-countdown-2-row2.png`,
  `survival-countdown-1-row3.png`, `survival-playing-first.png` — ready-to-playing
  visibility sequence
- `result-classic-1440x900-zh.png`,
  `result-classic-unranked-844x390-zh.png`,
  `result-survival-844x390-zh.png`, `result-mutation-390x844-en.png` — ranked,
  unranked, localized result ledgers

See `MANIFEST.sha256` for artifact integrity hashes.
