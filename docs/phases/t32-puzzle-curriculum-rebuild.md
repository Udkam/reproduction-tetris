# T32 — Puzzle Curriculum Rebuild

Status: **ACTIVE / AUDIT FROZEN / FINGERPRINT CHECKPOINT AUTHORIZED**
Recorded: 2026-08-05
Repository: `E:\Proj\reproduction-tetris`
Accepted product/evidence base: `main@735effe`

## Admission gate

T31 is accepted and closed on source `7c4a9a1` plus evidence `735effe`; final gates and
independent QA pass with no P0-P3 findings. The post-T31 audit is frozen below. It
authorizes only the first isolated fingerprint checkpoint; campaign definitions,
routes, mastery data, progression, and Puzzle UI remain read-only until that checkpoint
is green and the technique roster is evidence-backed. Inherited T27 evidence and
unrelated dirty paths remain isolated and may not be edited, staged, reverted,
formatted, regenerated, or silently adopted.

This file freezes a future contract only. It is not evidence that a board is authored,
solved, optimal, migrated, visually accepted, or complete.

## Frozen post-T31 audit

The accepted tree currently contains fifty stable Puzzle IDs, but its live categories
are **3 Intro / 27 Easy / 20 Hard**, fresh progress exposes only the first three levels,
and later Easy access still depends on completion-count tiers. `difficulty` is an
authored ordinal rather than a measured difficulty value. T32 therefore retains the
fifty stable IDs and ordinals while changing their curriculum meaning as follows:

| Stable positions | T32 category | Definition action | Fresh availability |
| --- | --- | --- | --- |
| 01-10 | Intro | rebuild every board | all open |
| 11-30 | Easy | retain unless later fingerprint/route proof rejects it | all open |
| 31-50 | Hard | retain except 36, 38, and 47 | mastery only |

The changed-board set is exactly positions **01-10, 36, 38, and 47**. The five current
schema-7 route artifacts contain two Core-replayed routes for all fifty existing
boards; the thirty-seven unchanged boards may retain their seventy-four routes only
after campaign-wide replay against revision 2. The thirteen changed boards require
twenty-six newly replayed routes.

The existing three strict certificates belong to positions 04-06, which are rebuilt
Intro boards under T32. They are not reusable mastery evidence. The directly supported,
anchor-free Easy candidate pool for exhaustive certification is positions
**12-15, 17-21, 23-25, and 28-30**. No Easy-to-Hard relation or optimum number is frozen
until exact search and replay-derived technique signatures exist. Positions 11, 16,
22, 26, and 27 contain anchors and cannot be selected as gating Easy levels unless the
exact proof implementation is first extended and independently justified for anchors.

Campaign revision becomes **2**. Migration preserves completion and best-operation
records only for the thirty-seven unchanged definitions. It removes both fields for
the thirteen changed stable IDs. A completed unchanged Hard level remains replayable,
but that historical completion cannot unlock a sibling Hard level or replace its new
Easy mastery prerequisite; every uncompleted Hard level remains mastery-only.

Inherited T27 evidence, its follow-up directory, and `progress.md` remain isolated.
The audit started no server, browser, watcher, index, or solver process.

## Fingerprint admission checkpoint

Before any board is edited, `src/game/core/puzzleFingerprints.ts` and its direct
`src/game/core/puzzleFingerprints.test.ts` are the only authorized source paths. They
provide three layers of comparison:

1. an exact structural fingerprint of color-normalized ordinary occupancy, anchors,
   target rows, and legal setup geometry;
2. a canonical topology fingerprint normalized across horizontal reflection and
   translation through unused columns while preserving anchor relationships; and
3. deterministic near-topology measurements that flag one-cell/non-decisive variants,
   repeated row/column profiles, cavities, and connected-component structure for later
   route-event adjudication.

Exact or topology-equal boards fail directly. A near-topology match is a blocking audit
candidate until replay evidence proves a distinct decisive event; it is never accepted
because of different colors, names, seeds, or queue labels. This checkpoint does not
rewrite campaign data and does not claim that the current roster is accepted.

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

1. **Post-T31 audit** — complete: accepted base, dirty-path ownership, current category
   split, route artifacts, solver limits, revision, and shared-path boundaries are
   frozen in this document.
2. **Fingerprint foundation** — exact/symmetry/near-topology comparison and direct
   campaign audit, without changing a board.
3. **Roster contract correction** — final board/order/name/category table, technique
   families, Easy-to-Hard map, revision-2 migration, exact paths, and any commit-budget
   exception. Pairings remain open until replay signatures justify them.
4. **Campaign definitions** — ten rebuilt Intro boards, the three frozen silhouette
   replacements, duplicate validation, and direct definition tests.
5. **Replay evidence** — two distinct public-command Core routes for every changed
   board plus campaign-wide replay of unchanged artifacts.
6. **Exact mastery evidence** — exhaustive optima for every gating Easy board and
   replay-derived technique-signature correspondence.
7. **Progression and library** — all-open Intro/Easy, mastery-only Hard, migration,
   category presentation, and direct persistence/UI tests.
8. **Final evidence and closure** — one typecheck, complete suite, production build,
   bounded three-category browser audit, multi-round independent QA, changelog,
   coordinator acceptance, scoped scan, and non-force push.

No source/evidence/QA concern may be bundled into the contract checkpoint. The first
green claim is committed before entering the next subsystem.

## Acceptance matrix

- [x] T31 has accepted closure and the T32 post-T31 path/board/solver audit is frozen.
- [ ] Exact, symmetry-normalized, and near-topology fingerprint tests are green before
  any campaign definition changes.
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
