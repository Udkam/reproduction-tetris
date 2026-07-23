# T13.9 Independent QA Workstream Log

## 2026-07-24 — TETRIS-T13.9-INDEPENDENT-QA-023 verdict

- **Review boundary:** read-only review of product range `59bc5ef..02b9ba9` at
  candidate `02b9ba9b25865c604642e6b6919a11aa00b282e0`; coordinator evidence record
  reviewed at `92c778f`. No product source, task/design contract, coordinator record,
  Puzzle definition, queue, route, or selector file was edited by this reviewer.
- **Commands actually run:** `git diff --name-only 59bc5ef..02b9ba9`; focused source
  inspection of the Core carrier lifecycle, `MUTATION_MATERIALS`, and renderer event
  path; `node .local\\audits\\t13-9-mutation\\audit.mjs` against the existing
  coordinator-owned `http://127.0.0.1:5176`; `git status --short` and listener review.
  The browser audit passed at 1440 × 900, reduced-motion 390 × 844, and 844 × 390:
  seeded `2` produced an active bomb carrier after two locks, the visually inspected
  desktop capture showed its full coral four-cell body plus core, there was exactly one
  canvas and zero DOM cells, all tested viewports had no overflow, and the audit
  collected zero console/page errors. It also confirmed clean home copy, first-entry
  and Settings rules, three-row Survival copy with 13→6 pressure, and Puzzle-library
  entry. The candidate path list contains no Puzzle definition, queue, route, or
  selector-source path.
- **Static verification that passes:** `theme.ts` assigns four distinct, high-contrast
  full materials (ice blue, violet, coral, warm gold); `drawCellGroups` uses those
  overrides for both active/ghost and locked carriers; Core only schedules carriers in
  the fourth mode after two locks from seeded random state. The existing direct tests
  cover material contrast and the normal 380 ms item-coloured flash lifecycle.
- **Finding — P2, FAIL:** reduced-motion activation feedback is erased before it can
  render. `render()` calls `consumeEvents(events)` and then
  `advanceEffects(deltaMs)` before `drawEffects()`. On a `mutation-activated` event,
  `consumeEvents()` sets `mutationFlash.duration` to `1` when reduced motion is on;
  a normal ticker delta is greater than 1 ms, so `advanceEffects()` clears the flash
  before `drawEffects()` reads it. This contradicts the active contract that reduced
  motion keeps one static item-coloured activation state. The four materials remain
  visible, but the requested trigger feedback is absent for reduced-motion users.
- **Disposition:** **FAIL — do not accept or push `59bc5ef..02b9ba9` yet.** The
  coordinator must repair the reduced-motion flash ordering/duration, add a direct
  regression that renders an activation with a realistic frame delta, then rerun the
  final renderer/browser evidence and request a fresh independent verdict.
- **Exact changed path:** this QA verdict only:
  `docs/workstreams/tetris-t13-independent-qa/THREAD_LOG.md`.
- **Next action:** coordinator fixes the P2 reduced-motion renderer defect; this QA
  workstream remains read-only until a new candidate SHA is supplied.
