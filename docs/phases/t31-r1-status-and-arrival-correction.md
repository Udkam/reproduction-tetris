# T31-R1 — Status, Arrival, and Activation Correction

Status (2026-08-05): **ACCEPTED / CLOSED**. Product/test source `7c4a9a1`; final
browser evidence `735effe`; independent QA P0 0 / P1 0 / P2 0 / P3 0.

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
- The ledger remains frameless, but it is no longer visually timid: the heading, item
  signal, and item name use a stronger size/weight hierarchy, while each item's own
  color gives its one-pixel line a restrained glow. This added prominence must not
  reintroduce row cards, pills, countdown numerals, or decorative separators.
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
  cells into the well. As soon as the lower occupied row enters board row 1, the complete
  final landing guide becomes visible; it does not wait for higher source rows to finish
  entering. Core spawn coordinates, collision, input timing, gravity, queue, and replay
  state remain authoritative; reduced motion may jump between the same canonical Core
  positions.
- Supergravity landing guidance, the eventual independent-column board settlement, and
  all `piece-locked` feedback coordinates must resolve to the same final per-column
  cells, including a piece whose Supergravity timer expires while its landing latch is
  still active. Expiry may remove the global status row, but it must not replace that
  airborne piece's independent-column ghost or lock behavior; only the next spawned
  piece returns to rigid landing.

## Next preview contract

- The transparent DOM slot is geometry only. Pixi renders the immediate queue item on a
  dedicated, unmasked preview plane; the board-mouth mask clips active-piece entry only
  and must never clip the left-rail preview.
- Next remains visible throughout active play and board-local pause/restart/leave
  interruptions. It may be intentionally empty only before a run, after terminal state,
  or during an actual route/mode teardown.
- The preview stays frameless and centered under the `Next` heading, with the tetromino
  large enough to read at the established rail size.

## Ice and Supergravity activation language

- Ice activation becomes a short, board-local burst of four small six-arm snowflakes
  released from the consumed carrier cells. They drift only a short distance and fade
  without recolouring the board, drawing a hard horizontal boundary, or hiding the
  playfield.
- Supergravity activation becomes a short, board-local burst of five gravity factors
  released from the consumed carrier columns. Each factor reads as a compact dense
  purple kite with a short downward chevron tail; the factors separate locally and are
  pulled down before fading. It must not use a central symbol, screen flash, full-width
  bar, pressure ribbon, or rain-like particle field.
- Both effects keep a distinct static reduced-motion endpoint and remain independent of
  sustained-state feedback.

## Evidence and rollback

- Focused UI/style tests prove the exact visible status content, stronger frameless row
  hierarchy, and dedicated unmasked Next plane.
- Core, presentation, and renderer tests prove hidden-row clipping, lower-row-first
  entry at the configured gravity interval, immediate landing guidance from that first
  visible slice, final Supergravity event coordinates, activation geometry, and
  reduced-motion endpoints.
- Browser evidence must capture simultaneous status rows, the lower-row-only arrival
  frame with its complete final landing guide, the fully entered frame, and the local
  Ice snowflake / Supergravity gravity-factor bursts from the final source candidate.
- Status, arrival, activation, evidence, and closure remain separate rollback commits.

## Accepted verification

- Focused UI/Core/renderer coverage passed before the final gate batch.
- Final typecheck, complete suite (`369 passed / 3 skipped`), and production build pass.
- `docs/evidence/t31/audit.json` records one Canvas, zero DOM cells, zero console/page
  errors, a visible independent Next preview, one-pixel frameless status rows, a
  timer-expired but airborne Supergravity latch whose ghost equals its final locked
  cells, and latch removal after lock.
- Final row-arrival frames show the lower occupied row first with the complete landing
  guide already visible, followed by the upper row crossing the board mouth on the
  gravity beat.
- Independent read-only QA accepted the candidate with no P0-P3 findings.
