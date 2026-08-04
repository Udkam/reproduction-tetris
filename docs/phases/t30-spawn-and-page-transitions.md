# T30 — In-Well Piece Arrival and Route Transitions

Status (2026-08-04): **ACCEPTED**. Contract `dae3853`, renderer `4c1d7a2`, navigation
`19a17e6`, and evidence `2da8a37` form the rollback chain. Final gates and independent
read-only QA pass with no P0–P3 finding.

## Objective

Make a newly active tetromino visibly arrive without ever drawing outside the well, and
replace hard page cuts with one short route handoff. Both changes are presentation-only
and preserve deterministic Core state, gameplay timing, URLs, accessibility, themes,
and the one-Pixi-Canvas architecture.

## Phase A — contract

Completed at `dae3853`.

- Freeze the renderer-only generation key, 210 ms maximum, cell order, ghost delay,
  reduced-motion endpoint, route ownership, fallback, and exact changed paths.
- Commit only `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, this file, and `progress.md`.

## Phase B — active-piece arrival

Completed at `4c1d7a2`.

- Add pure clamped arrival-progress helpers and direct boundary/order tests.
- Start arrival only when an active generation becomes drawable; do not consume the
  ready/countdown period while the active piece is hidden.
- Draw the four cells at safe projected coordinates with deterministic staggered
  opacity/scale. Do not animate Core coordinates or add display objects.
- Hold the ghost until the piece is legible; clear the effect on restart, undo,
  terminal state, destroy, or reduced motion.

## Phase C — route handoff

Completed at `19a17e6`.

- Route push/replace/popstate through one transition helper.
- Use the browser View Transition API when present and a keyed route-surface entry
  fallback otherwise. Do not defer or duplicate history changes.
- Add bounded CSS for old/new surfaces and a no-translation reduced-motion override.

## Phase D — evidence and acceptance

Completed at `2da8a37`; closure records the accepted disposition without reopening
product source.

- After the final source edit, run focused tests, then exactly one typecheck, complete
  suite, production build, and bounded browser batch.
- Capture source-bound frames for an early/mid/complete arrival and Home → Puzzle
  library → Home transitions. Audit one Canvas, zero DOM cells, zero console errors,
  route correctness, no clipping, reduced motion, and cleanup.
- Obtain independent read-only QA of the exact candidate range before changelog closure,
  the scoped secret scan, and push.

## Rollback

Revert the navigation checkpoint to restore hard route cuts without touching rendering.
Revert the renderer checkpoint to restore immediate active-piece rendering without
touching Core. Contract/evidence/closure commits remain independently reviewable.
