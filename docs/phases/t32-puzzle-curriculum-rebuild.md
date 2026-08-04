# T32 — Puzzle Curriculum Rebuild

Status: **ACTIVE / POST-T31 AUDIT**
Recorded: 2026-08-05
Repository: `E:\Proj\reproduction-tetris`
Accepted product/evidence base: `main@735effe`

## Admission gate

T31 is accepted and closed on source `7c4a9a1` plus evidence `735effe`; final gates and
independent QA pass with no P0-P3 findings. T32 is admitted only to the post-T31
read-only audit. Before its first product edit the coordinator must freeze the audited
board roster, duplicate findings, replay/solver evidence, campaign migration, exact
source paths, and shared-path ownership. Inherited T27 evidence and unrelated dirty
paths remain isolated and may not be edited, staged, reverted, formatted, regenerated,
or silently adopted.

This file freezes a future contract only. It is not evidence that a board is authored,
solved, optimal, migrated, visually accepted, or complete.

## Product outcome

The campaign remains exactly fifty authored Puzzle levels and is reorganized as:

| Category | Count | Availability | Purpose |
| --- | ---: | --- | --- |
| Intro | 10 | immediately available | isolate and teach one readable decision |
| Easy | 20 | immediately available | open practice and mastery qualification |
| Hard | 20 | technique-mastery gate | combine or tighten an already demonstrated decision |

Every Intro board is rebuilt. Historic category position and occupied-row count are
inputs to the audit, not automatic difficulty. Difficulty follows the verified route,
the number and reversibility of meaningful choices, topology pressure, anchor/timing
burden where present, and the cost of a wrong decision.

## Distinct-board contract

The authoring audit computes both an exact canonical fingerprint and a
symmetry-normalized topology fingerprint from ordinary occupancy, anchor occupancy,
target rows, and legal setup state. It then compares the decisive route events. Boards
that differ only by reflection, translation inside unused space, color/owner identity,
name, or one non-decisive cell are near-duplicates and cannot occupy separate campaign
slots without a documented mechanical distinction.

The currently near-repeated campaign positions are replaced as follows:

1. position 36 — a lower-triangle residue whose widening base and narrowing upper rows
   create a deliberate edge-to-centre order;
2. position 38 — a pyramid residue with a readable apex and stepped shoulders that
   demands support preservation rather than routine flat fill;
3. position 47 — occupied side columns and a suspended upper roof around a hollow
   middle, with the centre opening and roof clearance both materially involved in the
   solution.

These are deterministic authored boards, not renderer pictures. Their setup placements
must pass the existing legal spawn, hard-drop, collision, no-hidden-cell, no-initial-
clear, target-band, and anchor contracts. Replacing a stable slot requires an explicit
campaign-revision migration so prior records cannot attach to different geometry.

## Public-command route proof

Every new or changed board receives at least two distinct successful routes. Each route:

- starts from the registered Puzzle initial state and fixed queue;
- uses only public Core commands: move, rotate, soft drop, and hard drop;
- is replayed by the production Core rather than accepted from a renderer, landing
  enumerator, direct state mutation, private command, or solver's internal node;
- reaches canonical completion by clearing every original ordinary cell under real
  anchor, collision, lock, and line-clear rules; and
- records a stable route artifact bound to the board definition and campaign revision.

The second route must differ at a meaningful placement or orientation decision, not
merely replace one hard drop with equivalent soft-drop ticks after the same landing.
Existing unchanged boards retain their accepted routes only after a campaign-wide
replay confirms that reorder, queue, lesson, and progress changes did not invalidate
them.

## Mastery unlock proof

Hard access is based on demonstrated technique, never on total completion count or a
broad hand-authored label. Each Hard level names exactly one certified Easy prerequisite.
A certified prerequisite has an exhaustive public-command certificate proving the
strict minimum number of placed pieces. Its visible unlock threshold is exactly:

`strict optimal placed pieces + 5`

Beam width, timeout-best, heuristic upper bound, or the best route currently known is
not an optimum certificate. Exact search must close the full lower search frontier or
otherwise provide an equally rigorous exhaustive proof checked by direct tests.

Every relation carries an auditable technique signature with:

1. measurable initial-state preconditions (for example well/roof/anchor geometry and
   relevant queue prefix);
2. a decisive placement or clear event extracted from a replayed route; and
3. a post-decision invariant that explains why the continuation becomes solvable or
   avoids extra target burden.

The dependent Hard replay must exhibit the same three-part signature and materially
tighten it. A prerequisite may serve several Hard levels only when all dependants pass
that correspondence. Human-facing lesson copy is derived from this evidence; it cannot
substitute for it.

## Checkpoint chain after admission

1. **Post-T31 audit** — accepted base, dirty-path ownership, current board fingerprints,
   route artifacts, persisted revision, and shared UI-path collisions.
2. **Roster contract correction** — final board/order/name/category table, technique
   families, Easy-to-Hard map, migration version, exact paths, and any commit-budget
   exception.
3. **Campaign definitions** — ten rebuilt Intro boards, the three frozen silhouette
   replacements, duplicate validation, and direct definition tests.
4. **Replay evidence** — two distinct public-command Core routes for every changed
   board plus campaign-wide replay of unchanged artifacts.
5. **Exact mastery evidence** — exhaustive optima for every gating Easy board and
   replay-derived technique-signature correspondence.
6. **Progression and library** — all-open Intro/Easy, mastery-only Hard, migration,
   category presentation, and direct persistence/UI tests.
7. **Final evidence and closure** — one typecheck, complete suite, production build,
   bounded three-category browser audit, multi-round independent QA, changelog,
   coordinator acceptance, scoped scan, and non-force push.

No source/evidence/QA concern may be bundled into the contract checkpoint. The first
green claim is committed before entering the next subsystem.

## Acceptance matrix

- [ ] T31 has accepted closure; T32 still requires the renewed path/board audit before
  source work.
- [ ] Exactly 10 Intro, 20 Easy, and 20 Hard boards are registered.
- [ ] Every Intro board is newly authored; all Intro and Easy boards are available at
  fresh progress state; every Hard board is mastery-gated.
- [ ] No exact or unresolved near-duplicate remains; positions 36/38/47 match the three
  frozen silhouette contracts and remain legal Core-authored states.
- [ ] Every new/changed board has two distinct successful public-command Core replays.
- [ ] Every gating Easy board has an exhaustive strict optimum certificate and uses
  the `optimum + 5` threshold.
- [ ] Every unlock relation passes measurable precondition, decisive-event, and
  continuation-invariant correspondence.
- [ ] Persisted progress migrates without attaching old records to replaced geometry.
- [ ] Focused tests pass at each source checkpoint; final typecheck, complete suite,
  production build, one-Canvas/zero-error browser proof, teardown, and multi-round
  independent QA pass before acceptance.

All boxes remain open at queue time.
