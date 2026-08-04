# T32 — Puzzle Curriculum Rebuild

Status: **ACTIVE / FINGERPRINT GREEN / ROSTER CONTRACT FREEZE**
Recorded: 2026-08-05
Repository: `E:\Proj\reproduction-tetris`
Accepted product/evidence base: `main@735effe`
Current implementation base: `main@da8e2b9`

## Admission gate

T31 is accepted and closed on source `7c4a9a1` plus evidence `735effe`; final gates and
independent QA pass with no P0-P3 findings. The post-T31 audit is frozen below. It
authorized the first isolated fingerprint checkpoint. Commit `da8e2b9` now provides
green exact, symmetry-normalized, and near-topology comparison without changing a
board. Campaign definitions, routes, mastery data, progression, and Puzzle UI remain
read-only until the technique roster below is committed and the next exact writer/path
slice is admitted. Inherited T27 evidence and
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

## Frozen curriculum roster

The ten rebuilt Intro positions isolate one decision each. The names below are stable
technique IDs for authoring and proof; player-facing names remain open until the board
and route evidence is green.

| Position | Stable ID | Technique | Required readable decision |
| ---: | --- | --- | --- |
| 01 | `t3r-shaft-01` | `complete-row` | finish one obvious low-row gap without adding a covered target cell |
| 02 | `t3r-shaft-02` | `preserve-well` | keep a one-column route from the board mouth to the target band open |
| 03 | `t3r-shaft-03` | `build-support` | place support before a bridge so no unreachable pocket is created |
| 04 | `t3r-cascade-06` | `retain-opening` | clear locally while preserving the residue's only entry corridor |
| 05 | `t3r-shaft-04` | `read-queue` | choose the current landing that preserves a compatible slot for the following piece |
| 06 | `t3r-cascade-05` | `avoid-hole` | reject the tempting flat fill that covers an original target cell |
| 07 | `t5r-delta-07` | `edge-to-centre` | reduce a small triangle from its shoulders toward the centre |
| 08 | `t5r-lattice-09` | `split-lanes` | allocate the current and following pieces across two constrained lanes |
| 09 | `t5r-rift-10` | `choose-gate` | keep the continuation-compatible one of two apparently safe openings |
| 10 | `t5r-drift-08` | `anchor-side-slip` | move laterally at anchor height to enter a pocket that cannot be hard-dropped into |

Each Intro board is authored backward from at least two non-equivalent successful
public-Core routes. A mirror, translation, final soft-drop variation, or renamed queue
is not a second solution.

The twenty all-open Easy positions are grouped by the same evidence vocabulary:

| Technique family | Easy positions |
| --- | --- |
| anchor navigation | 11, 16, 22, 26, 27 |
| clear order | 12, 17, 21 |
| queue / branch choice | 23, 30 |
| preserve well / opening | 13, 15, 25, 28 |
| support / bridge | 14, 18, 20, 24 |
| avoid hole / recover | 19, 29 |

These are authoring hypotheses until two replayed routes produce the same measurable
precondition, decisive event, and continuation invariant. They cannot unlock Hard
content merely because the label appears in this table.

The candidate Hard proof map is frozen for validation, not yet activation:

| Hard | Easy prerequisite candidate | Technique / added pressure |
| ---: | ---: | --- |
| 31 | 13 | preserve a turning well through consecutive clears |
| 32 | 28 | preserve an opening under an anchor pinch |
| 33 | 14 | support a bridge across an offset level |
| 34 | 13 | retain a multi-level stepped well |
| 35 | 14 | order multiple support stages |
| 36 | 24 | clear a lower triangle from edge to centre |
| 37 | 23 | split a fixed queue between two corridors |
| 38 | 24 | preserve pyramid shoulders before the apex |
| 39 | 19 | avoid a covered hole in narrow edge space |
| 40 | 14 | support a folded bridge in stages |
| 41 | 12 | clear segmented horizontal targets in order |
| 42 | 24 | reduce a stepped edge toward the centre |
| 43 | 23 | choose the fixed-queue continuation branch |
| 44 | 14 | support twin towers before crossing the centre |
| 45 | 28 | retain a diagonal corridor opening |
| 46 | 13 | protect a deep edge well |
| 47 | 20 | open and preserve the hollow beneath a suspended roof |
| 48 | 12 | clear separated slots in a dependency order |
| 49 | 13 | switch between multiple wells without sealing either |
| 50 | 23 | choose the only safe branch for the fixed queue |

The first exact-certificate candidate set is positions **12, 13, 14, 19, 20, 23, 24,
and 28**. Positions 15, 17, 18, 21, 25, 29, and 30 are fallbacks. Positions 11, 16,
22, 26, and 27 cannot gate Hard content while the exhaustive solver rejects anchors.
No numeric optimum or `optimum + 5` threshold is admitted until the exhaustive search
closes and its public-Core route replays.

Revision-2 route artifacts additionally bind `definitionHash`, `campaignRevision`,
`initialPreconditions`, `decisiveEvent`, `continuationInvariant`, `routeHash`,
`techniqueId`, and the dependent Hard puzzle's `hardeningDelta`. Changed definitions
reset completion and best-operation records; unchanged records survive only when their
stable ID and definition hash both match.

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
2. **Fingerprint foundation** — complete at `da8e2b9`: exact/symmetry/near-topology
   comparison and direct campaign audit, without changing a board.
3. **Roster contract correction** — in progress: final board/order/name/category table, technique
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
- [x] Exact, symmetry-normalized, and near-topology fingerprint tests are green at
  `da8e2b9` before any campaign definition changes.
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

Open boxes remain unverified implementation or proof work.
