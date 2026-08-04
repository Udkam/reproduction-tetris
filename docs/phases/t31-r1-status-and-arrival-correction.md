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

- A newly active tetromino reveals one occupied row at a time from top to bottom. Every
  cell in the same row shares one progress value and is drawn as one connected slice.
- For a two-row piece there is a verifiable intermediate interval in which the first row
  is complete and the second row has not started, followed by an interval in which the
  second row is entering. The ghost appears only near the end of the arrival.
- The animation uses only already-clamped in-well cell coordinates. It does not change
  Core spawn coordinates, collision, input timing, or replay state. Reduced motion shows
  the final endpoint immediately.

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
- Presentation and renderer tests prove row grouping, intermediate visibility windows,
  delayed ghost, activation geometry, and reduced-motion endpoints.
- Browser evidence must capture simultaneous status rows, early/mid/final row arrival,
  and the Ice/Supergravity activation frames from the final source candidate.
- Status, arrival, activation, evidence, and closure remain separate rollback commits.

