# T31-R1 — Status, Arrival, and Activation Correction

Status (2026-08-05): **IN PROGRESS** from `main@a7034ea`.

## Why this correction exists

T31 is not accepted. Player review found that the Mutation ledger still exposes
redundant active-state copy and countdown text, simultaneous rows can visually collide,
the active tetromino still reads as appearing nearly complete, and the Ice and
Supergravity activation animations remain unclear and unattractive.

This correction stays inside the accepted T31 boundary. It does not change Mutation
mechanics, scoring, timers, deterministic Core state, queue order, collision, themes,
layout, audio, Survival, Puzzle, or the queued T32 curriculum rebuild.

## Visible status contract

- Each active effect row shows only its item signal, localized item name, and one thin
  remaining-time line. `生效中` / `Active` and visible seconds are removed.
- Remaining seconds stay available through the row's accessible label; removing visible
  countdown copy must not remove assistive context.
- Concurrent effects occupy independent rows with stable spacing. Names never overlap
  another row or the time line, and the line is a one-pixel instrument rather than a
  pill-shaped bar.

## Row-wise arrival contract

- Arrival is spatial, not an opacity or scale reveal. Core keeps the canonical hidden
  spawn rows. The lowest occupied row is the first slice wholly visible in board row 1;
  higher occupied rows cross the board mouth only after the current gravity interval.
- For a two-row piece there is therefore a verifiable first beat containing only the
  lower occupied row. The upper row then enters while the lower row advances to board
  row 2. Cells sharing a source row travel together as one connected slice.
- The renderer clips the active piece at the board mouth instead of shifting hidden
  cells into the well. The ghost remains hidden until spatial entry has settled. Core
  spawn coordinates, collision, input timing, gravity, queue, and replay state remain
  authoritative; reduced motion may jump between the same canonical Core positions.
- Supergravity landing guidance, the eventual independent-column board settlement, and
  all `piece-locked` feedback coordinates must resolve to the same final per-column
  cells, including a piece whose Supergravity timer expires while its landing latch is
  still active.

## Ice and Supergravity activation language

- Ice activation becomes a short, board-local cold-front sweep: a soft upper frost bloom
  resolves into a few clipped facets at the cleared carrier cells. It must not recolor
  the whole board, draw a hard horizontal boundary, or hide the playfield.
- Supergravity activation becomes a short downward compression wave rooted in the
  triggered columns: broad translucent pressure ribbons contract toward the carrier,
  followed by a compact downward release. It must not use a central symbol, screen flash,
  full-width bar, or rain-like particle field.
- Both effects keep a distinct static reduced-motion endpoint and remain independent of
  sustained-state feedback.

## Evidence and rollback

- Focused UI/style tests prove the exact visible status content and frameless row layout.
- Core, presentation, and renderer tests prove hidden-row clipping, lower-row-first
  entry at the configured gravity interval, delayed ghost, final Supergravity event
  coordinates, activation geometry, and reduced-motion endpoints.
- Browser evidence must capture simultaneous status rows, lower-row-only and fully
  entered arrival frames, and the Ice/Supergravity activation frames from the final
  source candidate.
- Status, arrival, activation, evidence, and closure remain separate rollback commits.
