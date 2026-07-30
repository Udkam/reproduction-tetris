# Phase 10 — Pressure Without Ambiguity

Status: `ACTIVE`

Base: `main@1f4847225c562163ad748fd2a76e4f4023778442`

## Goal

Make every live state, environmental interaction, restart boundary, completion record,
final result, and typographic role trustworthy without fragmenting TetraMorph's visual
vocabulary. This phase implements the fifteen direct requirements frozen in
`docs/CURRENT_TASK.md`.

## Checkpoint sequence

| Checkpoint | Boundary | Acceptance before moving on |
| --- | --- | --- |
| P10.0 | Contract and workstream record | Fifteen requirements, semantics, paths, and proof matrix are explicit |
| P10.1 | Localization, HUD, Settings, leave/restart/preview lifecycle | Focused App/localization/presentation tests and typecheck |
| P10.2 | Survival Core moving support | Deterministic Core tests for spawn overlap, carry, blocking, clear, hash, restart |
| P10.3 | Mutation Core event aggregation | Same-item events deduplicated without losing repeated mechanics; FIFO across item types |
| P10.4 | Mutation audio/Renderer/preview | Quiet Ice, upper gradient, complete Next, Supergravity settlement, reduced motion |
| P10.5 | Mode-first results and ranking | Correct primary/secondary metric, top-five order, current row, bilingual layout |
| P10.6 | Contract extension | Continuous Survival entry, cave geology, Back-to-home copy, and local typography are explicit |
| P10.7 | Puzzle progress and celebration | Atomic completion/best/unlock persistence plus three-state success presentation |
| P10.8 | Survival entry, cavern, and typography | Continuous row rise, distinct rock roles, local licensed fonts, stable layout |
| P10.9 | Final source candidate | One final typecheck, full test, build; immutable candidate SHA |
| P10.10 | Browser evidence | Required modes/states/viewports, one Canvas, no overflow/errors/leaks |
| P10.11 | Independent QA and security | Read-only verdict plus scoped gitleaks |
| P10.12 | Coordinator acceptance | Changelog, final docs, push, resource release |

## Browser evidence matrix

- Classic: playing, leave confirmation with Next visible, restart countdown, ranked
  and unranked result.
- Survival: one- and two-stone event, spawn-corridor overlap without false block-out,
  ordinary piece carried by moving stone, all three completed countdown rows plus one
  intermediate continuous-rise frame, one/two-stone rock appearance, restart
  countdown, time-first result.
- Mutation: simultaneous different items, repeated same item, Ice active and expired,
  Supergravity settlement, complete item-bearing Next, score-first result.
- Puzzle: shared restart/leave regression only; definitions, selector, progression,
  and undo remain frozen. Progress proof covers first success, slower replay, new best,
  result dismissal/return before another paint, storage reload, library tick/name,
  unlock propagation, bilingual celebration, and reduced motion.
- Chinese and English; desktop, portrait, and short landscape; reduced motion; keyboard
  Left/Right/Enter/Escape; local font requests only; loaded Chinese display/body,
  English UI, and numeric families; stable geometry after font readiness; one Canvas;
  zero DOM cells; zero console/page errors.

## Resource boundary

- No Serena, WMI/CIM scans, persistent indexer, watcher, or browser for code reading.
- No more than one project server and one browser batch; both have an ownership record
  and are released at the evidence boundary.
- Heavy gates begin only when the machine is below the red resource threshold.
- Focused tests run per source checkpoint; the full suite/build/browser batch run once
  after the last source change.

## Frozen areas

Puzzle content/order/solutions, wordmark, music-off decision, ordinary scoring,
seven-bag behavior, Survival timing constants, level storage, and the single-Canvas
architecture are out of scope unless a direct regression proves they must change.
