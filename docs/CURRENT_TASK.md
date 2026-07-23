# Current Task — T13 Endgame Workshop, Direct Controls, and Sprint

Branch: `main`

Current base: coordinator-verified T12.7 recovery record `550d77e`. It is historical
evidence only: its target-floor boards and tier gate are superseded by this task, and
its local walkthrough output remains historical ignored evidence and is not regenerated
in this delivery.

Current execution status (2026-07-24): **IMPLEMENTATION — the verified T13.5
candidate has one newly opened Puzzle-selector polish slice.** The preceding source
range, targeted checkpoints, full suite, typecheck, build, canonical route replay
coverage, and desktop/portrait/landscape browser evidence remain recorded. This slice
removes redundant selected-level metadata and completion glyphs, then expresses a
completed Puzzle level through its selected name color. It must receive direct UI tests
and a fresh browser frame before the coordinator record and user-authorized `main`
push resume. No independent QA disposition has been issued, so no acceptance is
claimed. The earlier T12/T13 narratives below are retained as provenance only; this
section is the authoritative live scope.

### Authoritative active delivery goals (2026-07-24)

1. **Product boundary and future packaging readiness.** Work only in this standalone
   clean-room repository. Keep the page-facing plain-text `Tetris` title without a
   Chinese companion title or copied trade dress. Do not package yet, but keep browser
   lifecycle, storage, keyboard/touch, focus, audio teardown, responsive layout, and
   platform seams safe for a later desktop wrapper; do not add Electron/Tauri/native
   dependencies or an installer in this delivery.
2. **Four clearly different modes.** Classic and Survival begin each run from fresh
   random seven-bag sequences; Puzzle keeps fixed canonical queues. Classic ranks by
   cleared lines. Survival starts with seven bedrock rows, uses fixed 40-tick gravity,
   raises pressure every three cleared lines from 13 seconds down to 6 seconds, and
   ranks by survival time. Collapse remains a fresh random, endless column-settling
   run: it ends only at top-out, ranks its top ten by lines, score, best chain, then
   fewer pieces, and must never resemble Classic or show a time limit.
3. **Puzzle authoring and readability.** Keep twenty deterministic, legal 5–8-row
   endgames with unlimited ordinary input, no piece budget, no timed/volatile blocks,
   B undo, and two upcoming pieces. Levels remain all-open. Names are short structural
   Chinese labels. Fixed anchors are sparse, are never initial target cells/rows, sit
   directly above the target band, visibly affect a legal landing or post-clear state,
   and have two Core-replayed early-divergent routes. The selected preview must show
   real board cells, targets, and anchors clearly with cohesive material colors.
4. **Puzzle guidance and results.** Remove the current player-facing strategy/hint
   system entirely—no trigger, unlock condition, cue, route/step UI, or hidden command
   transcript. Keep routes only as regression evidence. Do not create or regenerate
   `Solutions/` images in this delivery. Persist each level's real minimum successful
   locked-piece count, show it compactly in the selector, and change only the Puzzle
   success primary action to `重来`; other modes retain `再来一局`.
5. **Visual, controls, and concise copy.** Keep entry/home/Puzzle pages calm and
   original: no decorative grids/stray horizontal rules, meaningless English/telemetry,
   invalid block glyphs, thumbnails, or clipped active pieces. Preserve clear selected
   preview motion and reduced-motion fallbacks. Promote the active mode name. The
   in-run right header becomes one accessible `设置` control; `S` opens the same sheet
   containing effects/music, volume, pause/continue, and confirmation-gated restart.
   Every visible rule must state only objective, distinct mechanic, and ranking basis.
   All two-action sheets expose visible `←`/`→` selection, and `Enter` activates the
   selected action; pointer, touch, Escape, and cancel behavior remain correct.
   In the Puzzle selector, remove the selected `X 行残局` label and all visible
   completion checkmarks; when the selected level is completed, use its name color—not
   an extra glyph or row-count label—to communicate that state. Preserve the compact
   personal-best count and concise anchor fact where applicable.
6. **Audio.** Rework every original event contour so 100% effects are distinct and
   audible but never electrical or harsh. Add only an original, user-gesture-gated,
   separately toggleable procedural music bed. It must stop or suspend correctly on
   mute, pause, restart, unmount, and browser audio suspension; no external media,
   samples, or copyrighted music.
7. **Verification, resource hygiene, and release.** After each source checkpoint run
   targeted tests. At the final candidate run typecheck, the current-source full suite,
   build, Core route replay validation (without walkthrough-image generation), and
   desktop/portrait/landscape browser evidence. Prove one canvas, zero DOM cell grid,
   no overflow/console error, reduced motion, controls/shortcuts, storage behavior,
   and audio/runtime teardown. Before and after long test/browser phases, inspect only
   Tetris-owned processes, ports, and memory; release only clearly idle Tetris
   resources, never shared Codex tooling. Then update logs/changelog, commit exact
   paths, push `main`, and state any remaining independent-QA blocker explicitly.

### Historical reconciliation notes (superseded by the ledger above)

The following notes preserve the sequence of earlier corrections. An item is not
complete merely because a local implementation exists; it remains open until its
stated proof belongs to the final candidate.

1. **Puzzle anchor and curriculum repair.** Move the sparse fixed pegs out of original
   target rows and into visible headroom, retain only positions that materially change
   a legal landing or post-clear state, and keep all twenty boards approachable with
   multiple early-divergent solutions. Recompute the six affected routes (campaign
   01, 08, 13, 15, 16, and 18), update the schema route artifact, short structural
   names. Player-facing Puzzle hints are removed; walkthrough-image generation is
   deferred. Audit the selected preview so
   target cells, fixed pegs, and the actual endgame shape remain clear and compatible.
2. **Collapse correctness and presentation.** Verify the endless top-out-only rule,
   current-chain/best-chain/score/lines rail, absence of decorative horizontal rules,
   and local top-ten table sorted by lines, score, chain, then fewer pieces. Confirm
   incompatible timed Collapse rows cannot leak into the new table.
3. **Survival pressure.** Verify the seven-row opening, fixed 40-tick fall cadence,
   one-row reward per three lines, and the corrected 13-second-to-6-second pressure
   curve in both Core and visible play.
4. **Audio finishing pass.** Redesign every existing event contour so it is distinct,
   audible at the default 100%, and non-electrical/non-harsh. Add an original,
   user-gesture-gated optional procedural music bed with independent control and no
   persistent source after pause, restart, unmount, or browser suspension.
5. **Settings, hierarchy, and copy.** Make the active mode name prominent. Replace
   the right-header control cluster with a single accessible **设置** control and `S`
   shortcut; place effects, music, volume, pause/continue, and confirmation-gated
   restart inside it. Recheck every visible explanation: it must state only the mode
   objective, distinct mechanic, and ranking basis in concise factual language. Every
   two-action confirmation sheet must support `←`/`→` focus selection and `Enter` on
   that selected action.
6. **Puzzle completion record.** Persist each canonical level's lowest successful
   locked-piece count, show that compact best on the all-open selector, and retain
   graceful no-storage behavior. The Puzzle result primary action is `重来`, while
   non-Puzzle results remain `再来一局`.
7. **Final evidence and release.** After the source slices, run targeted tests, then
   typecheck, the current-source full suite, build, route replay/walkthrough
   validation (but no walkthrough-image generation), and real desktop/portrait/landscape browser evidence. Verify controls
   and shortcuts, one canvas/zero DOM cells, no overflow or console errors, reduced
   motion, and runtime/audio teardown; record the evidence, update the changelog,
   commit exact paths, push `main`, and report any remaining blocker explicitly.
   Before and after every long test/browser phase, inspect project-owned processes,
   listeners, and memory; release only clearly Tetris-owned idle resources, verify the
   release, and never terminate Codex-owned shared tooling or another project's work.

### T13.5 persistent Collapse, readable anchors, and faster Survival correction

The user accepts Collapse's column-settling play but rejects its 75-second cutoff and
the repeated horizontal rules in its right rail. This correction supersedes the
time-limit portion of T13.2: Collapse is an endless score/chain run that ends only at
ordinary top-out and retains the top ten top-outs, sorted first by cleared lines then
score, best chain, and fewer pieces. Its rail must expose score/current chain/best
chain/lines with no clock and no
decorative horizontal dividers through stats, Next, or controls. Existing timed
Collapse records are incompatible and must not be retained alongside the new mode;
valid Classic and Survival data continues to migrate.

The same user review reopens the fixed Puzzle anchor authoring boundary. The twenty
legal setup histories, fixed queues, unlimited ordinary play, B undo, selected-preview
contract, and five-through-eight-row bands remain; no volatile/timed Puzzle mechanism
may return. Reauthor only the sparse immutable-anchor subset, names, hint copy, and
route artifact as one Core-verifiable unit; local walkthrough images are deferred. Every anchor must be
above the initial target-row band, never overlap an original target, make at least one
landing or post-clear result differ from the no-anchor state, and retain two public
Core-replayed routes with an early lock divergence. Replace opaque level names with
short structural Chinese labels. Separately, Survival pressure changes from 15→8 to
13→6 seconds while retaining the one-second-per-three-lines curve, seven-row opening,
fixed 40-tick gravity, and three-line bedrock reward.

Authorized source/test boundary: Collapse Core constants/types/engine/sprint and
direct tests; leaderboard and persistence tests; App/App tests/styles; Survival
constants/race/runtime tests; and the coupled Puzzle definition/progress/route
artifact/direct-test paths, plus the removal of the existing hint UI and persistence.
No renderer primitive, package dependency, or
desktop package target is in scope. Before a candidate claim: run direct tests after
each checkpoint, then typecheck, the unqualified current-source suite, build, route
replay validation, and a desktop/portrait/landscape browser pass.

Cross-boundary exception: retiring the Collapse timer changes one inseparable behavior
across Core terminal state, local score schema, HUD/result text, and direct tests. Its
single source checkpoint may use the named Collapse/Survival/persistence/UI paths above
despite the ordinary ten-path budget; it may not capture any unrelated path.

Audio follow-up boundary: after the rule and Puzzle source checkpoints are stable,
perform one separate audio slice limited to the existing AudioEngine/runtime/app control
paths and their direct tests. It may improve event contours and add user-gesture-gated,
original procedural music with an independent control. Do not add third-party music,
network media, renderer dependencies, or a second canvas; verify mute/volume/pause/
restart/unmount lifecycle behavior before the final candidate.

Settings and copy follow-up boundary: this same App-level finishing pass may replace
the exposed right-header control cluster with one accessible **设置** trigger and its
`S` shortcut. The sheet may contain the existing effects/volume controls, the new music
control, pause/continue, and confirmation-gated restart; no game rule or Core input
mapping changes are implied. The header's current mode name becomes visually primary,
and visible mode descriptions are reduced to concise factual objective/mechanic/ranking
copy. `src/App.tsx`, `src/App.test.ts`, `src/styles.css`, the existing ActionSheet
component where necessary, and direct audio/runtime tests are the authorized UI scope.

### T13.2 fourth-mode Collapse correction

The user clarified that the rejected fourth mode is Sprint, not Puzzle. Puzzle is
closed: no further source, selector, preview, level, queue, anchor, undo, hint, or
visual changes are authorized. The coordinator may replace only the current Sprint
implementation and its direct Core/runtime/leaderboard/App/test bindings with a new
75-second **坍缩** score attack. It must apply independent per-column settling after
every lock and again after each clear, resolving resulting lines as a scoring cascade, rank completed rounds by
score/best-chain/lines/fewer pieces, and never present a rubble target, time-to-finish,
or `冲刺` label. Required source scope is the existing Sprint Core paths, constants,
types, leaderboard/persistence paths, relevant App bindings/tests, and styles; the
gameplay renderer may receive only the smallest event/presentation support needed for
the visible cascade state. This is a fresh mechanics candidate, not a claim that the
current excavation Sprint was accepted.

### T13.3 current Solution artifact routing

The current Puzzle product remains closed: this checkpoint may not change a Puzzle
definition, setup, queue, anchor, route, rule, selector, or visual surface. It owns
only the local walkthrough map. `Solutions/` must contain exactly the regenerated
current `Solution-1.md` through `Solution-20.md` files and their linked SVG snapshots,
each replayed from the schema-6 T13 artifact's primary public route. The walkthroughs
are evidence of one feasible route, never a unique-answer or mathematical-optimum
claim. The durable explicit generator belongs at
`tools/generate-puzzle-walkthroughs.mjs`, while stale T12 docs, images, candidate
scratch data, and obsolete local scripts move together—without deletion—to
`.local/audits/t12.6-walkthrough-legacy-20260724/`. `Solutions/` remains ignored;
the generator, its documentation, and archive record are versioned. Required proof is
one successful regeneration, twenty readable Markdown files with linked snapshots,
Core terminal validation for all routes, and a clean Git/local top-level map. The
2026-07-24 recovery produced exactly twenty `Solution-x.md` files with 265 linked SVG
snapshots; the versioned generator replayed all schema-6 primary routes to `finished`
with zero targets remaining. The `Solutions/` top level is now exactly those twenty
walkthroughs and their twenty image directories, while the retained legacy material is
under the documented `.local/audits/` route.

### T13.4 production-test discovery correction

Default `npm.cmd run test` currently discovers an ignored historical walkthrough test
under `.local/audits/`, whose relative imports intentionally no longer resolve after
the recovery archive move. This is a test-discovery boundary defect, not a Puzzle
route, Core, or gameplay failure. The coordinator may modify only the Vite/Vitest
configuration and direct test/documentation paths necessary to limit the default suite
to current `src/` tests. Historical tests below `docs/workstreams/` and ignored local
archives remain preserved evidence but are excluded from the product command.

Required proof is a default `npm.cmd run test` that completes with only current source
tests, followed by `npm.cmd run typecheck` and `npm.cmd run build`. Do not modify any
Puzzle source, rule, setup, queue, anchor, selector, preview, or visual surface in
this correction. Result (2026-07-24): the configured default suite now discovers only
23 current `src/` files and passes all 138 tests. Typecheck, build, and the final
desktop/portrait/landscape browser audit also pass on candidate `dc9acca`; the generic
web-game client still cannot cross the app's countdown because no deterministic
`advanceTime` hook exists, so the real-time browser audit remains authoritative.

### T13.1 feedback-correction checkpoint

The user rejected the decorative grid/telemetry treatment and the 40-line Sprint as
too close to Classic. Before final validation, the coordinator must complete one
bounded correction sequence:

1. **Quiet-surface visual checkpoint:** `src/App.tsx`, `src/App.test.ts`, and
   `src/styles.css` remove background field lines, technical/decorative copy, large
   ordinals, redundant counters/footer copy, arbitrary pixel stacks, and slanted
   pseudo-block ornaments. They retain four reachable mode actions, the one selected
   real Puzzle preview, 20 open Puzzle controls, all existing routes, 44 px controls,
   keyboard semantics, and reduced-motion final state. Only exact four-cell, connected
   mode glyphs may remain. The one real Puzzle preview must become more legible rather
   than more ornamental: larger actual cells, coherent high-separation material
   colors on its dark well, and a quiet distinct anchor accent; numeric stops stay
   sparse and never become thumbnails.
2. **Excavation Sprint checkpoint:** `src/game/core/sprint.ts` and its direct test,
   `src/game/core/constants.ts`, `src/game/core/types.ts`, `src/game/core/engine.ts`,
   relevant Core exports/rules tests, `src/App.tsx`, and `src/App.test.ts` may replace
   the empty-board 40-line target with a fresh-seed seven-row ordinary rubble field
   whose original opening cells must all clear through normal lines. It must preserve
   fixed brisk gravity, fresh live-mode seven-bags, lower-time Sprint ranking, and
   all non-Sprint rules. No Puzzle source, renderer primitive, persistence format,
   external dependency, or package target is in scope.
3. **Correction proof:** run the new direct Core/UI tests and typecheck after each
   source checkpoint; after the final source edit, rerun build and browser evidence
   for desktop, portrait, and landscape. The earlier whole-suite attempts are recorded
   as inconclusive: one 124-second default run and one single-worker no-output run
   were stopped rather than treated as passing. Do not claim final T13 completion
   until a complete suite result is obtained or a concrete, isolated blocker is
   recorded.

### T13 implementation boundaries and checkpoints

1. **Contract and file-map checkpoint (coordinator):** `docs/DESIGN.md`, this task
   file, `docs/progress.md`, and the T13 coordinator log define endgame provenance,
   all-open selection, anchor impact, direct shortcut parity, Sprint semantics,
   artifact routing, and the ordered reversible checkpoints before product edits.
2. **Input checkpoint:** `src/App.tsx`, `src/App.test.ts`,
   `src/game/input/InputController.ts`, `src/game/input/InputController.test.ts`, and
   `src/game/runtime/GameRuntime.ts`/its direct test own only P/R/Enter parity and the
   single-action pause sheet. `R` must request the same React confirmation as the
   visible restart control; it cannot restart via Runtime input.
3. **Endgame Core checkpoint (authorized atomic exception):**
   `src/game/core/puzzles.ts`, Puzzle direct tests, the route-search helper/tests, and
   `docs/workstreams/tetris-t13-core/puzzle-endgame-results.json` may move together.
   The twenty definitions, legal setup histories, target ownership, anchors, route
   evidence, and difficulty ordering are atomically coupled; this is expressly allowed
   to exceed the normal file/line budget. It changes no ordinary physics, renderer, or
   randomizer rule.
4. **Puzzle access and guidance checkpoint:** `src/puzzleProgress.ts`,
   `src/puzzleProgress.test.ts`, `src/puzzleHints.ts`, and `src/puzzleHints.test.ts`
   may replace the retired tier gate with all-open access and rebind compact,
   non-spoiling guidance to the schema-6 route evidence. Historic completion records
   remain valid player history; no Core rule, renderer, or generic storage migration
   is changed.
5. **Collapse checkpoint (authorized integration exception):**
   `src/game/core/types.ts`, `src/game/core/constants.ts`, `src/game/core/engine.ts`,
   `src/game/core/index.ts`, `src/game/core/sprint.ts`,
   `src/game/core/sprint.test.ts`, `src/game/runtime/GameRuntime.test.ts`,
   `src/leaderboard.ts`, `src/leaderboard.test.ts`, `src/App.tsx`, `src/App.test.ts`,
   `src/styles.css`, and `src/game/render/theme.test.ts` may change together only to
   replace Sprint with the 75-second 坍缩 score attack: settle each column after every
   lock and again after every clear, score chain depth, rank completed runs by
   score/chain/lines/pieces, persist the renamed record schema, and bind the exact
   HUD/home/result surface. These Core/persistence/UI/style paths are atomic because
   the revised `GameState`, storage schema, and four mode surfaces must typecheck as
   one behavior; this expressly permits the documented path/line-budget exception.
   No Puzzle source or visual surface, renderer primitive, dependency, or packaging
   target is included.
6. **Workshop presentation checkpoint (authorized visual exception):** `src/App.tsx`,
   `src/App.test.ts`, and `src/styles.css` own the all-open relay copy/layout/motion
   and the four-mode home treatment. The responsive four-band circuit, focus well,
   selection scan, reduced-motion fallback, and semantic test must move together, so
   this exact three-path UI/test checkpoint may exceed the normal 500-line source
   budget. It cannot be split without an intermediate selector that contradicts the
   open-workshop contract. It requires direct typecheck/App coverage before its local
   checkpoint and the final whole-range typecheck, suite, build, and browser pass. No
   Core authoring, storage migration, or desktop packaging target is mixed into it.
7. **Desktop-readiness checkpoint (no package):** `src/platform/browserPlatform.ts`,
   its direct test, `src/App.tsx`, `src/puzzleHints.ts`, `src/ui/ActionSheet.tsx`, and
   the smallest GameRuntime/AudioEngine paths plus their direct tests may make storage,
   visibility, timer, focus, keyboard, and audio capability loss safe to host in a later
   desktop shell. The adapter owns safe storage reads/writes, media-query subscription,
   timeout/frame cancellation, visibility/window listener teardown, focus deferral, and
   AudioContext construction; unavailable capabilities must become no-ops or default
   values rather than change a game run. Do not add Electron, Tauri, Capacitor, native
   dependencies, installers, signing, or an actual packaged artifact. Core rules, route
   artifacts, renderer primitives, and Vite browser delivery remain authoritative.
8. **Local recovery and archive checkpoint:** move stale ignored captures only into the
   documented `.local/` archive routes, regenerate `Solutions/Solution-1.md` through
   `Solution-20.md` plus their images from the final primary paths, and leave all such
   local files ignored. Do not delete material by wildcard or stage it.
9. **Final coordinator checkpoint:** after the last source edit, run the exact final
   typecheck, full suite, build, and one desktop/portrait/landscape browser evidence
   pass; record base SHA, ordered commits, exact paths, commands, local cleanup,
   evidence, desktop-readiness disposition, blocker, and next action in the T13 log; update changelog, commit the
   record, push `main`, and verify both Git and the supported local artifact map are
   clean. Independent read-only Core and visual/browser QA remains required before an
   acceptance claim.
10. **Gravity-workbench presentation refinement (authorized visual exception):** the
    user rejected the interim loose mode-card stack and sparse relay selector. Only
    `src/App.tsx`, `src/App.test.ts`, and `src/styles.css` may replace them with the
    documented unified four-lane mode field and compact endgame console: a single
    selected real preview plus a dense four-band, all-open numeric matrix. Preserve
    the 20-entry access contract, unique preview, no thumbnails/corner dots/lock
    states, B undo, 44 px controls, reduced-motion fallback, and all existing routes.
    The exact three-path visual/test unit may exceed 500 lines because responsive
    composition, keyboard semantics, and motion must remain coherent. It must not
    alter Core, persistence, package tooling, assets, or gameplay rendering.

---

# Current Task — T12.7 Multi-route Puzzle Guidance and Curriculum Calibration

Branch: `main`

Current base: repository-hygiene recovery record `c47b90c`. The T12.6 candidate and
its local walkthroughs remain valid recovery evidence, but its single-route artifact is
not sufficient for this task.

Current execution status (2026-07-22): **CANDIDATE VERIFIED — T12.7 deepens the T12.6
Puzzle campaign with replay-verified alternatives and a gradual in-game strategy
guide.** The player is never told that a recorded route is the only way through a
level. Every one of the twenty fixed-seed levels now has two real Core-replayed route
families whose locked placements diverge at lock one or two, while remaining an
approachable ordinary falling-block composition with three through seven
original-target rows and the accepted sparse immutable anchors.

The guide is Puzzle-only and presentation/persistence-only. It unlocks for a canonical
level after two placed pieces or twenty active seconds, persists through restart, then
offers a structural reading cue and two named verified strategy families. A chosen
family reveals one placement intention at a time; no guide button may dispatch an input,
change the queue, change completion, or reveal a mandatory raw command stream. `B`
undo remains the player recovery path. Classic, Survival, their random sequences,
physics, normal line resolution, renderer, audio, dependencies, and browser assets are
closed.

The curriculum audit may change authored patterns and their stable per-level seeds only
when the current stream cannot furnish two readable routes. Any retained or revised
level preserves its canonical ID, original-target win condition, anchor restrictions,
fixed deterministic Puzzle queue, and completion migration. Difficulty/order is
recomputed from all replayed routes, considering target rows, shortest route locks,
planning complexity, meaningful divergence, and recovery room; it cannot regress into a
forced trick. The selector's existing tier gate continues to state the canonical
two-completions-per-previous-tier rule.

The candidate audit found genuine alternate locked placements for all existing streams,
with alternate routes needing no more than two extra locks (and matching the canonical
lock count on levels 07 and 17). The authored patterns, seeds, IDs, and ascending
canonical difficulty order are therefore retained rather than churned merely to create
input variation. Candidate source checkpoints are `8ad3943` through `c17fdcd`; ignored
local `Solutions/` walkthroughs were regenerated from the retained canonical routes
only. Final coordinator validation passed `npm.cmd run typecheck`, the full Vitest
suite (47 passed / 1 skipped files; 294 passed / 2 skipped tests), `npm.cmd run build`
(744 modules), and live desktop/portrait/landscape browser audits. Independent
read-only Core and visual/browser QA remains required before any acceptance claim; a
user-authorized recovery push must remain explicitly pending that QA.

### T12.7 writer boundaries and checkpoint sequence

1. **Contract checkpoint (coordinator):** `docs/DESIGN.md` and this task file define
   the multi-route, sequence, hint-unlock, and verification contract before source
   changes.
2. **Route/curriculum checkpoint (coordinator):**
   `src/game/core/puzzles.ts`, its direct Puzzle tests,
   `src/game/core/puzzleRouteSearch.ts`,
   `src/game/core/puzzleRouteSearch.test.ts`,
   `src/game/core/puzzleSolverResults.test.ts`, and
   `docs/workstreams/tetris-t12-core/puzzle-solver-results.json` own only the authored
   curriculum, deterministic alternative search/replay, route metrics, and evidence.
   This checkpoint may exceed the normal line budget if all twenty route records must
   move together; it changes no live physics or game rules.
3. **Guidance checkpoint (coordinator):** `src/puzzleHints.ts`,
   `src/puzzleHints.test.ts`, `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`
   own hint persistence, route-family presentation, unlock copy, responsive layout,
   and accessibility. It does not modify Core state or runtime input.
4. **Local reference recovery:** regenerate ignored `Solutions/Solution-1.md` through
   `Solutions/Solution-20.md` and embedded images from the new canonical routes after
   the route checkpoint. They stay ignored and are never staged.
5. **Evidence and handoff:** run focused route/persistence/UI tests, then exactly one
   final typecheck, full suite, build, and desktop/portrait/landscape browser pass
   covering the locked guide, both strategy choices, one-step disclosure, restart
   persistence, no gameplay mutation, and reduced motion. Record base SHA, exact
   candidate paths, commands, evidence, blocker, and next action in the T12 workstream
   log. Obtain independent read-only Core and visual/browser QA before an acceptance
   claim; a user-authorized recovery push must still state that it is pending QA.

---

# Current Task — T12.6 Layered Puzzle Curriculum and Current-Observatory Selector

Branch: `main`

Current base: accepted T12.5 coordinator publication `3709fa3`; prior source
checkpoints remain historical evidence. T12.5 source `d2469e3` is accepted and must
not be rewritten.

Current execution status (2026-07-21): **IN PROGRESS — T12.6 replaces the accepted
T12.5 shallow one- through four-row curriculum and campaign-atlas presentation with
a replay-verified three- through seven-row curriculum and a minimal animated current
observatory.**

T12.6 preserves the normal fixed-seed seven-bag, original-target-only win condition,
unlimited ordinary play after a route, local `B` undo, existing seven-tier unlock
semantics, one selected preview, and all Classic/Survival behavior. It changes only
the authored twenty Puzzle boards/route evidence, the QA replay that consumes an
authored route, and the library's presentation.
There are no timed pieces, piece budgets, altered row resolution, or hidden setup
cells. A small authored distribution of immutable single anchors is restored: anchors
are non-target cells, never count toward victory, stay at their world coordinates on
ordinary line clears, and are limited to zero, one, or two per selected board. They
must not occupy an initial original-target row or create an initial hidden-spawn
blocker; every placement requires a route replay. `01–03` use three original target rows, `04–06` four, `07–10` five,
`11–15` six, and `16–20` seven; every band is contiguous at the floor and every row
is initially incomplete. Within each band, verified Core routes must increase the
stable difficulty tuple `(targetRowCount, locks, rotations, horizontalMoves,
commandCount, id)` without a lower row-band appearing later.

The player-facing unlock statement remains explicit: levels `01–03` are open on a
new save; complete any two in the immediately preceding three-level tier to open the
next tier through `16–18`; complete any two of `16–18` to open `19–20`. Completion
IDs retain their migration behavior. The new selector is a text-light **current
observatory**: one dominant dark selected preview, a sparse numbered switchback route,
and only one occurrence of the selected level name/status/start action. The full unlock
policy is one compact always-visible transit line, not a prose dashboard. It must use a
one-shot observatory-field reveal and selected-well sweep motion, with a full
reduced-motion fallback; it must not reintroduce level thumbnails, corner dots, a
dot-progress system, cards, text walls, or the rejected atlas planes. The selector uses
bundled local Latin typography plus system CJK fallbacks only, so its first frame never
depends on a remote font request. Visible copy is number-led and deliberately sparse:
only the selected name/status/required fixed-anchor note/start action appear in the
focal stage, while the transit line is the sole explanatory sentence. Decorative
technical English, duplicate field labels, row counters, and section captions are out
of scope.

### T12.6 writer boundaries and checkpoint sequence

1. **Contract checkpoint (coordinator):** `docs/DESIGN.md` and
   `docs/CURRENT_TASK.md` define the three- through seven-row, current-observatory contract
   before source changes.
2. **Core-route checkpoint (coordinator):**
   `src/game/core/puzzles.ts`, `src/game/core/puzzles.test.ts`,
   `src/game/core/puzzleCampaign.test.ts`, `src/game/core/puzzleFlow.test.ts`,
   `src/game/core/puzzleSolverResults.test.ts`, and
   `docs/workstreams/tetris-t12-core/puzzle-solver-results.json` own the new boards,
   validation, replayed route metrics, and sorted campaign evidence. This checkpoint
   is explicitly allowed to exceed 500 changed lines because twenty complete authored
   board patterns and their twenty replay command streams must be reviewed together;
   it changes no physics or runtime interface.
3. **Selector checkpoint (coordinator):** `src/App.tsx`, `src/App.test.ts`, and
   `src/styles.css` own the current-observatory markup, state copy, responsive behavior, and
   motion. This checkpoint is explicitly allowed to exceed 500 changed lines only if
   replacing the former atlas selectors requires it; no renderer or gameplay path is
   included.
4. **Local recovery artifacts:** `Solutions/Solution-1.md` through
   `Solutions/Solution-20.md` and their embedded images are regenerated only after
   the Core route checkpoint. They remain ignored by the existing `Solutions/` rule,
   are never staged, and are inspected as local reference material.
5. **QA replay repair (coordinator):** `src/game/runtime/qaScenario.ts` and
   `src/game/runtime/qaScenario.test.ts` may consume the current recorded public
   route for `t5r-drift-08` only. This is a deterministic test-fixture update, not a
   new solver, simulation rule, or runtime game behavior.
6. **Evidence and acceptance:** after the last source change, run focused tests, then
   exactly one final typecheck, full suite, build, and desktop/portrait/landscape
   browser-evidence pass. Record candidate SHA/range and evidence; obtain independent
   read-only Core and visual/browser QA; only then append coordinator log/changelog,
   commit exact documentation paths, and push `main`.

The coordinator owns every checkpoint, local walkthrough generation, browser evidence,
independent-QA request/disposition, exact-path staging, changelog, and push. No other
repository, asset, audio, dependency, randomizer, line-resolution, or score path is
in scope.

---

Historical T12.5 task text (accepted at `3709fa3`) follows for provenance only.

Current execution status (2026-07-19): **IN PROGRESS — T12.5 replaces the unaccepted
T12.4 budget/reorder candidate with a low-pressure twenty-level Puzzle curriculum,
Puzzle-local undo, and a themed campaign-atlas selector.**
Independent renderer QA rejected T12.1 candidate `7ae1190..b0889c7` on a P2
fractional-edge scale overhang, so it is not accepted. Source `95c7da7` remains the
locally verified T12 baseline; T11 remains a recoverable baseline at `a76eea2`, pending
its separate independent QA disposition.

T12.5 keeps the twenty-level fixed-seed campaign and its completion-store compatibility,
but replaces T12.4's dense boards, retained anchors, solver budgets, and budget-driven
ordering before publication. Each new authored board is deliberately shallow and
intuitive: direct gaps first, ordinary rotations next, then clear two- through four-row
vertical channels. No new curriculum board has an anchor or timed input. Success is
strictly removal of all original targets; no count of placed pieces can fail a run.
Every selected route is revalidated through Core `dispatch()` as a clearability and
difficulty-order proof only, never as an optimum or player restriction.

Puzzle receives a current-run-only undo stack. `B` and an equivalent visible Puzzle
control restore the exact pre-lock checkpoint for the most recently locked piece,
including target ownership, board, active piece, queue/randomizer, timers, score,
lines, and piece count. The history never persists, changes seed/queue order, appears
in Classic/Survival, or becomes a QA state-injection surface. It is a no-op when there
is no prior lock.

A fresh campaign still opens `01–03`. The page must state the full gate rule visibly:
complete any two of `01–03` for `04–06`, then any two of each preceding three-level
tier for the next tier through `16–18`; complete any two of `16–18` for `19–20`.
Sealed rows remain readable yet inert. The archive visual is rebuilt as an original
campaign atlas with a restrained route/terrain hierarchy and one selected canonical
preview only—no entry thumbnails, corner dots, or ornamental progress dots.

### T12.5 writer boundaries and checkpoint sequence

This is one explicitly authorized atomic source checkpoint despite exceeding the normal
path and line budget. Its exact paths are
`docs/workstreams/tetris-t12-core/puzzle-solver-results.json`,
`scripts/capture-tetris-t3-evidence.py`, `src/App.tsx`, `src/App.test.ts`,
`src/game/core/engine.ts`, `src/game/core/puzzleCampaign.test.ts`,
`src/game/core/puzzleFlow.test.ts`, `src/game/core/puzzleSolverResults.test.ts`,
`src/game/core/puzzles.test.ts`, `src/game/core/puzzles.ts`,
`src/game/core/puzzleUndo.test.ts`, `src/game/core/types.ts`,
`src/game/input/InputController.test.ts`, `src/game/input/InputController.ts`,
`src/game/render/TetrisRenderer.test.ts`, `src/game/render/TetrisRenderer.ts`,
`src/game/render/presentation.test.ts`, `src/game/runtime/GameRuntime.test.ts`,
`src/game/runtime/GameRuntime.ts`, `src/game/runtime/qaScenario.test.ts`,
`src/game/runtime/qaScenario.ts`, `src/puzzleProgress.ts`, `src/styles.css`, and
`tools/solve-puzzle-campaign.cpp`. The Core/input/runtime writer owns the deterministic
rules and undo state; the UI/renderer writer owns atlas composition and presentation;
the coordinator owns the integrated checkpoint and all subsequent evidence/QA/docs.

The checkpoint cannot be split into individually typechecking commits: removing the
canonical budget field while adding `GameRuntime.undoPuzzle()` changes the Core state
contract, input mapping, runtime surface, React HUD, and renderer event handling at the
same time. The atlas markup and its responsive/reduced-motion selectors are likewise a
single visual contract. It changes no ordinary physics or row resolution. Required
whole-range verification is typecheck, direct Core/input/runtime/UI/renderer tests, the
full suite, production build, desktop/portrait/landscape browser evidence, and separate
read-only Core and visual QA before acceptance.

The coordinator owns the contract/progress/workstream logs, browser evidence,
changelog, exact-path staging, independent QA, and push.

The player-facing identity changes to the short plain-text `Tetra`. It makes the
four-cell falling-block vocabulary legible without a copied logo treatment or a visible
Chinese companion name. Browser title, loading shell, visible header, and accessible
live copy must no longer present `Tetris` as the game title.

T12 removes all volatile/expiring Puzzle input behavior, related renderer material,
HUD state, expiry events, audio, timers, and volatile support settlement. Puzzle inputs
are exclusively ordinary fixed-seed seven-bag pieces. Its sparse anchors remain, but
are now coordinate-pinned through every line-clear resolution: ordinary cells resolve
inside anchor-delimited vertical segments, target identity follows that exact movement,
and no anchor may be displaced by clearing a row below it.

The existing 0–100% header audio control stays in place. At 100% its master/headroom,
compressor, and sine envelopes must be materially louder without reviving the rejected
electrical landing sound or allowing an unclipped overlapping mix.

Survival's opening bedrock height changes from ten rows to exactly seven. Its existing
15→8-second pressure, three-line removal, fixed 40-tick gravity, restart behavior,
and ranking order remain unchanged.

### T12.1 archive worktable and active-piece boundary correction

T12.1 changes neither simulation nor campaign content. The 20-level archive remains
fixed-seed, text-first, and selected-preview-only, but its flat three-column card wall
is rebuilt as a calmer archive worktable: a continuous opened-count rail, clearly
separated catalog records, solid readable sealed states, and a single selected detail
instrument. It must not restore per-level thumbnails, upper-corner dots, or any
decorative progress-dot system.

The user-visible Survival screenshot also exposes a renderer-only defect: a normal
interpolated active piece can be drawn above the top board frame when the core piece
uses its hidden spawn buffer. T12.1 must preserve the hidden buffer and every core
deterministic/replay coordinate. It instead clamps the active group's rendered vertical
presentation at the first visible board row and removes a rotation-scale overhang while
that clamp is engaged. Ghost, lock, board, and Next rendering must retain their existing
contracts.

T12.1 allowed product/test paths are `src/App.tsx`, `src/App.test.ts`,
`src/styles.css`, `src/game/render/TetrisRenderer.ts`, and the direct renderer or
presentation test that proves the clamped active-group offset. It may update only this
task/design contract before source and the progress/workstream records after verified
source. It must not edit Core, Puzzle definitions, replay fixtures, sequence generation,
audio, storage, dependencies, or the formal changelog.

Required T12.1 candidate evidence: a direct renderer/presentation test exercises a
stale negative interpolation offset at the visible top row and proves no active group
can cross the well; targeted App coverage preserves 20 rows, exactly one selected
preview, three initially enabled entries, inert sealed entries, and accessible state
labels. Browser evidence at desktop and narrow mobile must visibly inspect the revised
archive, an initial Survival board, the outer board geometry, the active input, and zero
console errors. Then typecheck, full suite, build, and fresh independent visual/browser
and renderer QA are required before changelog integration or publication.

T12.1 local verification is complete for `7ae1190 fix(t12): contain active piece
presentation` and `b0889c7 feat(t12): refine puzzle archive worktable`: targeted
`src/App.test.ts` and `src/game/render/presentation.test.ts` pass (27 tests), followed
by final `npm.cmd run typecheck`, the full `npm.cmd run test` (41 files / 293 tests,
with 1 file / 2 tests skipped), and `npm.cmd run build` (741 modules). Browser review
has zero console errors at 1280×720, 390×844, and 844×390. It confirms 20 archive rows,
zero catalog thumbnails, exactly one selected preview, a semantic `3 / 20` progress bar,
and no horizontal overflow. A frozen real Survival frame records an active `J` at core
`y:20` while presentation remains stale at `y:19.542…` (`offsetY:-0.457…`); the visible
piece remains fully inside the board's top edge. This is candidate evidence only:
independent renderer and visual/browser QA remain mandatory before changelog integration
or publication.

### T12.2 renderer QA correction — effective-edge scale guard

Renderer QA found that T12.1 neutralizes a rotation pulse only for an unshifted source
edge cell or a numerically changed clamp. It misses an interior group whose unchanged
interpolation offset lands it exactly on the visible top/bottom edge (for example local
rows `1–2` at `-1 × unit`). The group then retains a `1.035` scale and may leak a
fractional face/stroke beyond the well. T12.2 must calculate edge contact from the
effective post-offset bounds and force scale `1` whenever either rendered group bound
touches an edge, regardless of whether the clamp changed its number.

T12.2 allowed product/test paths are `src/game/render/TetrisRenderer.ts`,
`src/game/render/presentation.ts`, and `src/game/render/presentation.test.ts`. It may
update only this task/design contract before source and the progress/workstream records
after verification. Core, spawn rows, collision, seeds, queues, replay fixtures, Puzzle
content, UI, styles, audio, storage, dependencies, and the formal changelog remain
closed. Required proof adds translated-to-top and translated-to-bottom regression cases
which retain their offset yet report effective edge contact; a fresh browser top-edge
capture plus typecheck, full suite, build, and renewed independent renderer QA are
required before candidate status is restored.

### T12.3 Puzzle double-Next, archive viewport fit, and local solution artifact

Puzzle now needs planning visibility for its next two fixed inputs. The renderer must
draw `queue[0]` and `queue[1]` as an ordered compact pair in the existing Puzzle Next
slot, with an explicit two-item label and accessible description. Classic and Survival
remain single-Next; no mode may mutate, pre-consume, randomize, or otherwise alter its
queue merely to display it. Ready/terminal states retain no preview.

Visual QA accepted the archive interaction/content at 1280×720, 390×844, and 844×390,
but found a small 1280×720 document overflow (`scrollHeight:765`), so T12.3 also reduces
the desktop archive shell height enough to keep the outer document within the viewport
while letting only the catalog scroll internally. The known renderer P2 remains open
until T12.2 is re-reviewed.

The requested Level 01 walkthrough is a local player artifact at
`Solutions/Solution-1.md`; `Solutions/` must be ignored by Git. Its content must be
derived from the fixed deterministic solver route, document every lock's board snapshot,
and name the route's Core-replayed verified lock count as a playable upper bound, not
as a mathematical optimum. It is not a product asset and must not enter the Git
candidate.

T12.3 allowed product/test paths are `.gitignore`, `src/App.tsx`, `src/App.test.ts`,
`src/styles.css`, `src/game/render/TetrisRenderer.ts`,
`src/game/render/presentation.ts`, and `src/game/render/presentation.test.ts`; the
ignored local artifact is `Solutions/Solution-1.md`. It may update this/design contract
before code and progress/workstream records after verification. Core rules, Puzzle
definitions, setup histories, seeds, queue generation, audio, storage, dependencies,
and the formal changelog remain closed. Required proof adds direct queue-preview tests,
desktop/portrait/landscape browser inspection of the second Puzzle preview, zero console
errors, no document-level overflow, and renewed independent renderer plus visual/browser
QA before formal acceptance or publication.

### T12.4 current Puzzle solver recalculation, campaign reorder, doubled budgets, and tiered unlocks

The user requires every Puzzle level—not only the former first level—to have a
correctly Core-replayed route before any difficulty, budget, or player walkthrough
claim is published. This supersedes all inherited `SOLVER_PIECE_BUDGETS` values and
old reference-route assumptions. The legacy fifteen-route fixture is historical input
only; it cannot itself be presented as a current solution or budget authority.

The solver record defines a finite public-command domain: legal move, rotation,
soft-drop, hard-drop, and required settlement ticks. It independently replays every
published route through `dispatch()` with the actual seed, target mapping, and
line-clear behavior. Its result field is `verifiedSolutionLocks`: a reproducible,
playable upper bound with exact command stream and replay digest, **not** a claim of
global mathematical optimality. Failed or timed-out searches are excluded from the
artifact rather than converted into a budget.

The recalibration keeps anchor mechanics but reduces unsupported coverage. Retained
fixed overlays are `t3r-shaft-01`, `t3r-shaft-03`, and `t5r-prism-11`; current
overlays without a verified route are removed. All IDs, authored boards, setup
histories, and seeds remain stable. `PUZZLE_DEFINITIONS` is reordered by ascending
`verifiedSolutionLocks`, with ties by `(anchor count, soft-drop commands,
public-command count, id)`. Each revised `puzzlePieceBudget` is exactly twice that
level's `verifiedSolutionLocks`, with no separate `+10` slack.

The new unlock frontier is tiered after that ordering: levels 01–03 are initially
open; levels 04–06, 07–09, 10–12, 13–15, 16–18, and 19–20 each open when any two
distinct canonical completions in the immediately preceding tier exist. Valid stored
completion IDs migrate without loss, unlocked IDs are always recomputed from the new
order, and a direct caller cannot record a completion for a still-locked level. The
archive must state the next tier condition concisely and accessibly.

T12.4 opens the following paths after its solver-contract checkpoint:

- `tools/solve-puzzle-campaign.*` and only directly related solver verification helpers;
- one committed solver-result artifact under `docs/workstreams/tetris-t12-core/`;
- `src/game/core/puzzles.ts`, its direct tests, and the current Puzzle campaign
  verifier/reference fixture only as needed to make the verified route bounds
  authoritative;
- `src/puzzleProgress.ts`, `src/puzzleProgress.test.ts`, `src/App.tsx`,
  `src/App.test.ts`, and directly related styles for tier-gate persistence/copy;
- `Solutions/Solution-1.md` as a deliberately ignored local player walkthrough,
  regenerated only after the reordering identifies the new level 01;
- `docs/DESIGN.md`, this task record, `docs/progress.md`, and the assigned T12 core,
  frontend, and coordinator logs.

T12.4 does not authorize changed physics, rotation, row resolution, authored
setup/board content, seed generation, audio, dependencies, browser assets,
or work in another repository. The source chain must keep solver infrastructure,
authoritative core data, progress migration, and archive UI as separately reviewable
checkpoints. After the last source change: run focused solver/replay/progress tests,
one final typecheck, full test suite, build, and one browser matrix covering a new
archive, tier unlock transition, Puzzle double Next, and the renderer top edge. Fresh
independent Core and visual/browser QA must accept the final contiguous candidate
before `CHANGELOG.md` integration or push.

> Historical T11 notes below are retained for traceability. T12.4 supersedes their
> Puzzle `+10` budget, legacy unlock, and anchor-coverage statements.

T11 replaces the old board-empty Puzzle goal with a target-clear budget. Every initial
ordinary authored cell is an original target, receives a renderer-owned special
marker, and remains a target while rows clear or it moves through the bounded volatile
settlement path. Every later player cell is non-target. The current budget X is the
shortest lock count among that level's verified deterministic solver routes plus ten
locks of fixed slack; success can occur on its Xth resolved lock, while remaining
targets after that lock produce an explicit Puzzle budget failure. Sparse anchor
overlays remain, but are seeded only into initially wholly empty visible rows so they
never share a starting row with target cells or prevent their objective. The in-level
statistics show remaining original targets plus an explicit locks-remaining countdown.
Volatile
five-second input expiry remains Puzzle-only and never makes a player lock a target.

Survival opens with ten unbreakable bedrock rows. The 15→8-second pressure and each
three-line bedrock removal remain, while gravity becomes one fixed faster cadence for
the entire Survival run: no line count can accelerate the active piece. Header restart
uses exactly `确认` with no description. Audio is re-authored as a sine-only,
envelope-shaped event palette, with the hard drop owning its landing sound so a lock
event cannot recreate an electrical buzz.

Classic and Survival receive a freshly generated run seed on every new run, restart,
or replay; Puzzle always retains the selected level's deterministic seed. When a
terminal Classic/Survival score survives leaderboard insertion, its row is highlighted
in the result table; otherwise the result sheet displays a compact non-qualification
notice.

Required T12 evidence before any publication: targeted core/replay/UI coverage for all
twenty fixed-seed levels and progressive unlock persistence; stationary anchors when
clearing both their own and lower rows; target-coordinate mapping through that
resolution; absence of any volatile timer, event, material, or HUD state; and boosted
bounded sine routing at full volume; and seven-row Survival opening/restart/pressure.
Then run typecheck, the full suite, build, and one browser action pass with the
locked/unlocked archive, visible target/budget state, and zero browser errors.
Independent Core and visual/browser QA must accept the extended candidate before
changelog integration or acceptance.

### T12 source-checkpoint exception — coupled rule migration

The following exact T12 candidate range is permitted to exceed the normal per-commit
path budget because it removes a required `GameState`/`GameEvent` contract across core,
renderer, audio, React HUD, DEV state, persistence, and direct tests while introducing
the twenty-ID campaign those consumers must type-check against. This is not file-count
bundling: any intermediate SHA which changes the typed volatile fields/events without
their consumers would fail the build, while the archive cannot expose its new IDs before
the core validates them. The coordinator owns the entire range and must run the whole
targeted matrix, final typecheck, full suite, production build, and browser pass.

Exact product/test paths: `index.html`; `src/App.tsx`; `src/App.test.ts`;
`src/main.tsx`; `src/styles.css`; `src/puzzleProgress.ts`;
`src/puzzleProgress.test.ts`; `src/game/audio/AudioEngine.ts`;
`src/game/audio/AudioEngine.test.ts`; `src/game/core/board.ts`;
`src/game/core/board.test.ts`; `src/game/core/constants.ts`;
`src/game/core/engine.ts`; `src/game/core/puzzleFlow.test.ts`;
`src/game/core/puzzleCampaign.test.ts`; `src/game/core/puzzles.ts`;
`src/game/core/puzzles.test.ts`; `src/game/core/types.ts`;
`src/game/render/TetrisRenderer.ts`; `src/game/render/theme.ts`; and
`src/game/render/theme.test.ts`.

T12 local verification is complete for the candidate: targeted matrix 14 files / 109
tests; `npm.cmd run typecheck`; full `npm.cmd run test` (41 files / 292 tests, with 1
file / 2 tests skipped); and `npm.cmd run build` (741 modules) all pass. The final
browser pass has no console errors and visibly proves Tetra home branding, a 20-row
archive with only 01–03 enabled, Puzzle target/budget/anchor state, and a seven-row
Survival opening. This is evidence for independent QA, not acceptance or changelog
authority.

Local candidate evidence now covers the target budget/state transitions, fixed ten-row
Survival opening and cadence, fresh ordinary-run seeds, fixed Puzzle selection, audio
event routing, restart confirmation, leaderboard result feedback, and target marker.
`npm.cmd run typecheck` passes; the final full suite passes (40 files / 288 tests,
with 1 file / 2 tests skipped); the final production build passes (741 modules).
The prescribed Race action capture shows ten bedrock rows and 40-tick fixed gravity;
the live Puzzle browser review shows the warm-gold target brackets, target/budget
statistics, Next preview, one canvas, and zero console errors.

Publication exception (2026-07-19): the user explicitly authorizes a recovery
push of the committed candidate to `origin/main`. This publication preserves a
recoverable remote checkpoint only; it does not replace the pending independent
Core and visual/browser QA or mark T10 accepted.

The correction also adds explicit header controls beside Pause: mute plus a
0–100% master-volume slider (default 100%), then a standalone `重新开始` button.
Clicking the header restart button must first open a confirmation sheet, whose
primary confirmation is available through Enter. The Pause sheet contains only
continue and exit actions. `R` remains the immediate deterministic restart during
play, pause, or terminal states. A compressor safety stage and louder distinct
feedback must make game events audible without placing browser audio APIs in
`src/game/core`.
Hard drop specifically uses a restrained paired sine landing thump instead of an
electrical-sounding waveform sweep. The local Classic leaderboard ranks by cleared
lines, while Survival ranks by `elapsedTicks` (longer survival first); both visible
primary labels must match their persisted sort order.

The shared Pixi canvas owns the dark Next well and canonical tetromino while the
DOM `next-slot` remains only a transparent geometry anchor. This prevents the
opaque compact information band from covering the Next rendering at narrow
viewports; the visible preview must equal `queue[0]` at desktop, portrait, and
landscape sizes.

---

# Historical Current Task — T9 Survival Descent and Puzzle Archive

Branch: `main`

Current base: `beb47643ca6e80cbdae2fbb2a7459b1d6fffc1e6`

Current execution status (2026-07-19): **T9 is authorized and in progress.**

Status: **CANDIDATE READY — pending independent Core and visual/browser QA**

T8 remains the accepted baseline at `32ed0c7`. T9 candidate range is
`502f978..15e6412`: it adds the five-layer opening, 15→8-second / three-line Survival
descent, a matching three-line gravity ladder, a prominent home `Tetris` heading, and
the Puzzle archive surface. Typecheck, 269 passed / 2 skipped tests across 40 files,
the 741-module production build, and browser inspection of the homepage, Puzzle archive,
and real Survival opening passed. Independent Core and visual/browser QA are required
before coordinator acceptance or push. The completed cleanup removes the archive
selection dot and all per-level miniature boards; it retains only the selected preview.
The requested unbreakable random cells and ten-second incoming-piece rule are a later
Puzzle-contract decision, not part of this candidate. This file retains earlier slice
contracts below as historical record.

## Slice N — progressive gravity and timed Survival pressure

Task ID: `TETRIS-T7-TIMED-SURVIVAL-MOTION-019`

Base: clean accepted and pushed coordinator tip
`d0bbb7dc32e0e625b5aa41a2e58453975057efb7`.

Core writer boundary:

- `src/game/core/constants.ts`, `src/game/core/types.ts`, `src/game/core/board.ts`, and
  `src/game/core/engine.ts`;
- directly related `src/game/core/race.test.ts` and `src/game/core/rules.test.ts`;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md` after source freeze.

Core acceptance is the exact gravity, timer, pending-rise, five-line removal, ordering,
pause/restart, overflow, replay/hash, and Puzzle-compatibility contract in `DESIGN.md`.
The Core checkpoint must keep Puzzle's thirty references unchanged and may not edit
React, Pixi, runtime, styles, dependencies, evidence, or coordinator documents.

Frontend/renderer writer boundary after Core source freeze:

- `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`;
- `src/game/runtime/qaScenario.ts` and `src/game/runtime/qaScenario.test.ts` only to
  replace obsolete five-lines-raises-bedrock evidence with public-command timed-rise
  and five-line-removal evidence;
- `src/game/render/TetrisRenderer.ts` and its direct presentation/renderer tests only
  for brief deterministic bedrock rise/removal feedback;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after source freeze.

Frontend acceptance:

- remove the mode `.phase-seam` and action-sheet colored lead bar at every viewport;
- show the concise complete rules and direct fall cadence/countdown values frozen in
  `DESIGN.md`, including `40 秒`, `每 5 行`, `-2 秒`, and `最短 10 秒`;
- add only the bounded entrance, hover/focus, bedrock feedback, and urgency motion;
  reduced motion must suppress presentation transforms without altering rules;
- preserve exactly one canvas, zero DOM board cells, 44 px actions, lifecycle/input
  safety, layout, palette, ordinary tetromino geometry, Puzzle library, dependencies,
  and `index.html`.

Each writer creates exact-path source and log checkpoints without push. After the last
source edit, the coordinator runs exactly one final typecheck, full suite, build, and
browser-evidence pass, then routes the exact source and evidence to independent static
and visual QA before changelog integration or push.

Disposition: **ACCEPTED**.

- Core source `ff90d61` implements the shared Classic/Survival gravity curve, timed
  pending pressure, safe rise ordering, five-line one-row removal, pause/restart,
  overflow, replay/hash, and unchanged Puzzle cadence/references.
- Final product source `356440cf0f785b2558745c6eddd307b1654525e6` removes both
  decorative bars, exposes complete concise rules and direct cadence/countdown values,
  adds bounded home/bedrock feedback, and explicitly disables its transforms and
  transitions for reduced motion.
- Final gates passed: typecheck; 40 test files with 39 passed / 1 skipped; 269 tests
  with 267 passed / 2 skipped; 739-module production build; and a completed 25-capture
  browser matrix with zero unexpected errors.
- Evidence `9ef2708` proves the public-command first rise at 2763 ticks with one full
  `BBBBBBBBBB` row, then the five-line reward at zero bedrock / zero pressure / 38
  seconds. Independent static and visual QA both accepted with no P0–P3 finding and
  reproduced all 27 evidence hashes.
- Dependencies, `index.html`, Puzzle definitions/references, ordinary material tokens,
  and separate game repositories remain unchanged.

## Slice M — warm mineral bedrock recolor

Task ID: `TETRIS-T6-BEDROCK-RECOLOR-018`

Base: accepted and pushed T6 coordinator tip
`2c7e5f3352ceaae48db48f0134ed9970a6e3e696`.

One writer may change only:

- `src/game/render/theme.ts`;
- `src/game/render/theme.test.ts` for the exact token and contrast regression;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after source freeze.

Acceptance:

- change only `BEDROCK_MATERIAL` to the exact warm rock-brown tokens frozen in
  `DESIGN.md`;
- retain the existing bedrock geometry, divided facets, material rendering path,
  Survival behavior, five-line threshold, and all seven ordinary piece materials;
- both bedrock face endpoints keep at least 3:1 contrast against the board well and
  the material remains unequal to every tetromino material;
- run the focused theme test and typecheck before an exact-path source checkpoint;
- after the final source change, run exactly one final typecheck, complete suite,
  build, and browser-evidence pass; route the exact candidate to independent read-only
  visual QA before changelog integration or push.

No layout, copy, Core/runtime/Puzzle data, dependency, `index.html`, ordinary piece
palette, renderer geometry, or separate game repository change is authorized.

Disposition: **ACCEPTED**.

- Source `4b27a98` changes only the four `BEDROCK_MATERIAL` tokens and their direct
  regression. Contract `07fdbbf`; source-log tip `da39948`.
- Final gates passed: typecheck; 40 test files with 39 passed / 1 skipped; 263 tests
  with 261 passed / 2 skipped; 739-module production build; prescribed action client;
  and one completed 24-capture formal browser matrix.
- Independent static QA found no P0–P3 issue and reproduced 5.455291:1 / 3.248488:1
  face-to-well contrast. Independent visual/evidence QA accepted both wide Survival
  originals plus 24/24 captures and 26/26 raw-Git-blob checksums with zero browser
  error or integrity failure.
- Evidence `367a443` binds exact source `4b27a98` and candidate tip `da39948`; its
  public-command replay shows 24 cleared lines, four full bedrock rows, and canonical
  bottom row `BBBBBBBBBB`.

## Slice L — three independent mode rules

Task ID: `TETRIS-T6-THREE-DISTINCT-MODES-017`

Contract base: accepted and pushed T5 coordinator tip
`c0340b1d3e30007473da6a7a4ec0fed72a22df38`.

User-visible outcome:

- Classic is fixed-speed chain-score survival: 48 ticks per automatic cell for the
  full run; consecutive clearing pieces build a visible `连消` counter and score
  bonus, while any non-clearing lock breaks the chain;
- Survival replaces player-facing Race: it uses Classic's fixed 48-tick gravity and
  raises one permanent, unbreakable bedrock row from the bottom for every five
  cumulative cleared lines;
- Puzzle shares Classic's fixed 48-tick speed but starts from one of fifteen authored
  legal endgames and wins only when the complete canonical board becomes empty.

Core writer boundary:

- `src/game/core/constants.ts`, `src/game/core/board.ts`,
  `src/game/core/engine.ts`, and `src/game/core/types.ts`;
- directly related tests under `src/game/core/*.test.ts`;
- `src/game/render/theme.ts`, `src/game/render/TetrisRenderer.ts`, and their directly
  related tests only for the minimum type-safe bedrock material/render binding;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md` after the source checkpoint.

Atomic boundary exception: canonical bedrock widens `BoardCell` from
`PieceType | null` to `PieceType | BedrockCell | null`. The same source checkpoint
must therefore bind a real bedrock material and renderer path; casting the sentinel to
`PieceType`, leaving an undefined material lookup, or committing a typechecking but
runtime-broken intermediate state is forbidden. This exact Core + renderer bridge is
pre-authorized despite crossing the normal subsystem boundary and remains within the
default ten-path checkpoint budget.

Core acceptance:

- Classic, Survival, and Puzzle remain at 48 ticks after any line or piece count;
- Classic and Survival use fixed base line-clear scores `40 / 100 / 300 / 1200`;
  Classic alone adds `50 × (combo - 1)` after the first consecutive clearing piece;
- Classic combo starts at `0`, becomes `1` on the first clearing piece, increments on
  every immediately consecutive clearing piece, and resets on a non-clearing lock;
  Survival and Puzzle remain at combo `0` and receive no combo bonus;
- Classic and Survival keep compatibility `state.level` exactly `0` and emit no
  `level-up`; Puzzle alone preserves its invisible accepted score/event serialization
  so the thirty frozen solution event digests and final hashes remain unchanged, but
  gravity, UI, and success never read that level;
- Survival's internal key remains `race`, but it has no speed curve or successful
  line-count terminal state;
- each crossed five-line threshold clears/scores first, then shifts the remaining
  board up and adds one full bedrock row; bedrock blocks pieces, never clears, and
  overflow from the top ends the run before the next spawn;
- restart reconstructs zero bedrock, while deterministic replay/hash includes the
  canonical bedrock state and height;
- Puzzle board-empty success and continuous seeded seven-bag input remain unchanged;
- focused Core tests and typecheck pass before an exact-path source checkpoint.

Frontend/renderer writer boundary after Core source is frozen:

- `src/App.tsx` and `src/App.test.ts`;
- `src/styles.css` only for the renamed semantic statistic role;
- `src/game/runtime/qaScenario.ts` and `src/game/runtime/qaScenario.test.ts` only to
  replace obsolete Race-speed evidence with real Survival bedrock evidence;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after the source checkpoint.

Frontend acceptance:

- Classic statistics are exactly score, cleared lines, and current `连消`;
- no player-facing or DEV text snapshot describes a Classic level; the detached text
  snapshot exposes the current combo instead;
- every visible `竞速` label becomes `生存`; Survival statistics are score, cleared
  lines, and bedrock height, with no speed-tier copy;
- bedrock renders as a restrained coherent mineral stratum compatible with the frozen
  palette, visibly distinct from all seven tetromino materials and retaining readable
  unit seams;
- Puzzle retains its existing level/placed/cleared objective statistics;
- no layout, ordinary tetromino theme/geometry, control, countdown, dependency, or
  `index.html` change is authorized;
- focused App tests, typecheck, and the prescribed browser action client pass.

After the two source checkpoints, the coordinator runs exactly one final typecheck,
complete test suite, build, and browser-evidence pass. Each source boundary receives
independent read-only cross-QA. Formal evidence, changelog integration, and push occur
only after both verdicts accept the exact combined source candidate.

Disposition: **ACCEPTED**.

- Core + type-safe bedrock source: `34184cb`; frontend/runtime binding source:
  `5a3c35af325e4fa43841190e8acfb4867c8f1ebc`; source-log tip: `2308d80`.
- Final gates passed: typecheck; 40 test files with 39 passed / 1 skipped; 263 tests
  with 261 passed / 2 skipped; 739-module production build; one formal browser pass.
- Independent Core QA accepted `34184cb`. Independent combined browser QA accepted
  `34184cb + 5a3c35a` after a 695-command public replay reached 24 cleared lines and
  four canonical bedrock rows at desktop and portrait with zero browser errors.
- Formal evidence `a26d989` binds 24 captures to exact source `5a3c35a` and candidate
  tip `2308d80`; independent evidence QA inspected 24/24 original PNGs and reproduced
  26/26 raw-Git-blob SHA-256 entries with zero integrity failure.
- `index.html`, dependencies, Puzzle definitions/references, accepted ordinary
  tetromino geometry/palette, and every separate game repository remain unchanged.

## User-visible problems to resolve

1. Keep the page named only `Tetris`, preserve the accepted composition and divided
   facet geometry, and apply only the exact coordinated `雾昼矿物` light retone frozen
   in `DESIGN.md`.
2. Keep the dedicated entry page with separate Classic (`经典`), Race, and Puzzle
   entrances. The internal `marathon` key remains compatibility-only.
3. Make Race endless accelerating normal play. It has no line target and stops only
   through player exit or top-out.
4. Rebuild all fifteen Puzzle levels as difficult authored endgames generated from
   explicit legal tetromino stacking histories: automatic gravity, replenishing seeded
   seven-bag input, no finite piece budget, every level unlocked, exact source-piece
   colors, and at least two proven successful routes per level.
5. Keep all level layouts, copy, frontend composition, block language, and assets
   original. Similar games are abstract mechanics research only.
6. Remove the current engineering-dashboard vocabulary, oversized slogan, custom
   brand glyph, `青流方阵` name, grid/coordinate/route decoration, clipped corners,
   oversized level cards, rounded ceramic/jelly blocks, stepped mode bands, legacy
   `路线` copy, and bracket-style ghost cells.
7. Remove repeated descriptions of ordinary play. Visible copy is limited to names,
   controls, score/statistics, completion state, and the immediate objective; full
   ARIA labels remain available without duplicating prose visually.

## Baseline policy

- Do not reset or rewrite `dd7e31e`; it remains a historical ancestor.
- Do not merge the rejected T4 preservation branch into T5.
- Migrate the valid 44 px and real-UI QA requirements into T5, not the old T4 styling.
- Do not modify T3/T4 screenshots, manifests, fixtures, capture scripts, or logs.
- New fixtures, logs, and browser evidence use T5-specific paths.
- Frontend candidate `b480e7db93aa7b6f2b2a1feb160985f4aa42e493` and its evidence
  child `9b7e552e83426d5578d86010571a4cbce83616ac` are rejected visual history.
  They must not be pushed or described as the current frontend baseline.
- Frontend candidate `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18` is the second
  presentation rejected by the user. It must not be accepted through local font or
  copy fixes and is not the visual baseline for the next writer.
- Preserve from `c9135f3` only the verified lifecycle, accessibility, input/rule
  behavior, and detached `structuredClone` QA snapshot regression. Its rounded mode
  bands, ceramic cell material, page composition, and copy are superseded.
- Local commit `e552b3c86e59b801f6d69045a94211e3f1c97e34` completed the rejected
  bright spectral surface immediately before the latest user review. It is a clean
  historical checkpoint only. It must not receive independent acceptance, formal
  evidence, changelog integration, or push.

## Slice A — T5 Core

Task ID: `TETRIS-T5-PUZZLE-NORMALPLAY-002`

The Race and leaderboard work in candidate `3bf170ec252cc971b1f65d73b4649fabb2500dbb`
remains eligible. Its finite authored Puzzle queues, budget failures, no-gravity rule,
and single-route fixtures are superseded. The uncommitted removal of the live
`replayScenario` state-injection surface is retained as part of this slice.

The core writer may change only:

- `src/game/core/constants.ts`, `engine.ts`, `puzzles.ts`, `types.ts`, `random.ts`, and
  `index.ts` if public exports require it;
- directly related tests under `src/game/core/*.test.ts`, including a new focused
  Puzzle-flow test if useful;
- `src/game/runtime/qaScenario.ts`, `qaScenario.test.ts`, `GameRuntime.ts`, and
  `GameRuntime.test.ts` to migrate obsolete finite-Puzzle QA and permanently remove
  live state-replacement/replay injection;
- `src/leaderboard.ts` and `src/leaderboard.test.ts` for endless-Race records;
- `src/puzzleProgress.test.ts` only to replace hard-coded old 3–5-piece completion
  fixtures; `src/puzzleProgress.ts` remains forbidden;
- `src/game/render/presentation.test.ts` only to replace hard-coded old Puzzle queue
  expectations; renderer/presentation production files remain forbidden;
- `docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts` only to decouple
  frozen T3 evidence from current T5 production definitions and verify the unchanged
  historical artifacts internally; T3 fixtures/logs remain forbidden and the test
  must stay in full Vitest discovery;
- new or revised `docs/workstreams/tetris-t5-core/**` authoring helpers, fixtures, and
  `THREAD_LOG.md`.

The core writer must not edit `src/App.tsx`, `src/styles.css`,
`src/puzzleProgress.ts`, `src/game/render/**`, T3/T4 evidence, coordinator docs,
changelog, or the frontend log.

Core acceptance:

- no Race line count produces `finished`;
- Race speed uses locked pieces plus cleared lines, grows monotonically, and reaches
  its safe cap;
- each Puzzle definition has one stable seed and an original 8–12-row board meeting
  the topology constraints in `DESIGN.md`; numeric difficulty and finite queues/budgets
  are removed from production authority;
- Puzzle shares Marathon automatic gravity, scoring, SRS, lock/entry/clear timing, and
  continuously replenishing deterministic seven-bag generation;
- sampling 84 pieces per level proves twelve full seven-bags without exhaustion;
- every level has two deterministic successful public-command routes for the same seed,
  each using 18–35 pieces and meeting the semantic route-diversity metrics in
  `DESIGN.md`; verifier execution uses 70 locks only as a non-product guard;
- canonical board empty is success; an unsolved board never fails because a queue or
  budget ended, and normal top-out remains the gameplay failure;
- restart produces the exact authored board, seed, randomizer, and hash;
- mounted runtime exposes no replay or canonical-state replacement hook;
- focused tests and the new T5 verifier pass;
- after the last Core source change, one typecheck, one complete Vitest suite, and one
  build pass without weakening or deleting historical evidence checks;
- candidate SHA and exact evidence are logged before independent read-only QA.

## Slice B — T5 Frontend

Task ID: `TETRIS-T5-FRONTEND-001`

Base SHA: `630fb30e115db9d0b4e6328e679987f9e8608939`

Core QA result: **ACCEPT** — focused 22 files / 140 tests, typecheck, and diff check
passed independently.

Frontend result: **REJECTED BY USER** at candidate `b480e7d`; coordinator evidence
child `9b7e552` is obsolete. The path list and acceptance bullets below are retained as
historical slice evidence only and do not authorize further Aqua Blueprint work.

The frontend writer may change only:

- `src/App.tsx`;
- `src/styles.css`;
- `src/puzzleProgress.ts` and `src/puzzleProgress.test.ts`;
- `src/game/render/theme.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `src/game/render/presentation.ts` and its test when necessary;
- new components under `src/ui/**`;
- directly related frontend/presentation tests when required;
- new `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The frontend writer must not change core rules, Puzzle definitions/fixtures, build
configuration, dependencies, T3/T4 evidence, changelog, or coordinator docs.

The rejected slice's detailed visual acceptance is archived in its workstream log.
Only its verified lifecycle, accessibility, progress, and mode-rule behavior may be
retained; its brand, page composition, CSS language, and cell renderer are forbidden
as the new visual baseline.

## Coordinator final integration

After both accepted slices and the last product change, run exactly one final:

1. `npm.cmd run typecheck`;
2. `npm.cmd run test`;
3. `npm.cmd run build`;
4. T5 browser-evidence pass at every required viewport.

Browser evidence must use visible UI, exercise at least three consecutive Puzzle locks
under automatic gravity, and compare visible level, placed-piece count, active piece,
and Next preview with canonical state. Internal state replacement is not valid setup
evidence.

The coordinator routes the exact combined candidate to independent read-only QA,
resolves findings with newly bounded writer slices, updates
`docs/logs/CHANGELOG.md`, commits the documentation delta, and decides whether to push.

## Slice C — final QA snapshot isolation fix

Task ID: `TETRIS-T5-FINAL-QA-FIX-001`

Base SHA: `9b7e552e83426d5578d86010571a4cbce83616ac`

Independent final QA result on the base: **REJECT** with one blocker. The DEV-only
`window.__TETRIS_D4_QA__.collect()` surface returns the object from
`GameRuntime.getState()` directly, so page script can mutate canonical state through
the returned reference. All other audited areas passed, including the visual review,
evidence checksums, `index.html` boundary, typecheck, and targeted tests.

Status: **superseded as a standalone slice**. The exact state-isolation requirement is
carried into Slice D so no work continues against the rejected visual candidate.

The frontend fix writer may change only:

- `src/App.tsx`;
- one directly related frontend test file under `src/**` when needed;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change `GameRuntime`, core rules, renderer, styles, Puzzle data,
dependencies, `index.html`, coordinator documents, changelog, or any committed browser
evidence. The implementation must make `collect().state` a detached structured clone
without adding any state setter, replay injector, or replacement hook. A regression
test must mutate nested fields of the returned snapshot and prove the source canonical
state is unchanged.

After the fix candidate is independently accepted, the coordinator regenerates the
T5 browser evidence against the exact new product SHA, reruns the final gates required
after the last source change, and routes the exact evidence child to independent QA
before changelog integration or push.

## Slice D — clean light `Tetris` frontend replacement

Task ID: `TETRIS-T5-FRONTEND-REDESIGN-002`

Result: **REJECTED BY USER** at candidate
`c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`. Independent review additionally found
8–11 px mobile statistic text and legacy `路线` copy. The slice below is historical
evidence only and grants no further write authority.

Base SHA: coordinator documentation child of
`1ec551ef902bd331b411cee95e35d2f8e879eb51`.

The frontend writer may change only:

- `src/App.tsx` and `src/styles.css`;
- `src/game/render/theme.ts` and `src/game/render/TetrisRenderer.ts`;
- `src/ui/ActionSheet.tsx`;
- new or directly related frontend/renderer tests under `src/**`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change `index.html`, dependencies, Vite/build configuration,
`src/game/core/**`, Puzzle definitions/references, `GameRuntime`, input/audio/storage
semantics, `puzzleProgress.ts`, `presentation.ts`, coordinator documents, changelog,
historical T3/T4 evidence, or committed T5 browser evidence.

Implementation requirements:

- preserve the existing conditional `home → puzzle-library → game` lifecycle, the
  `GameSession` key, async mount disposal guard, media-query cleanup, pointer capture,
  and exact one-runtime/one-canvas teardown behavior;
- use plain text `Tetris` for visible branding, the canvas label, and startup live
  message; remove `青流方阵`, its glyph, English brand subtitle, blueprint labels,
  coordinates, route decoration, page grid, diagonal band, ticks, cut corners, and
  giant marketing copy;
- home: compact introduction plus three 96–112 px rounded horizontal mode bands,
  lightly stepped on desktop and all visible without scroll at 390 × 844;
- Puzzle: compact six-row selector plus selected details; desktop uses list/detail
  columns, mobile expands the selected row in place; no sticky overlay may cover a row;
- game: one coherent rounded surface with a dominant board and one right information
  rail on desktop, compact information above the board on mobile, and controls aligned
  with that surface; retain existing test IDs and DOM geometry anchors;
- renderer: rounded ceramic cells with same-hue lower edge and restrained top
  highlight; active/locked/ghost remain distinguishable; ghost is a complete rounded
  outline; Board and Next reuse the primitive; remove cut corners, universal thick
  outline, bracket ghost, blueprint ticks, and Pixi `NEXT` text duplication;
- DEV `__TETRIS_D4_QA__.collect().state` is a detached structured clone. Direct tests
  mutate snapshot `status`, `active.x`, `queue[0]`, and a nested board cell and prove
  canonical runtime state and nested identities remain isolated;
- visible mobile body copy is at least 12 px, statistics at least 14 px, touch labels
  at least 11 px; every button remains at least 44 × 44 CSS px;
- retain reduced-motion, accessible action-sheet, keyboard/touch, mode rule, all-level
  availability, continuous Puzzle stream, and endless Race behavior unchanged.

Writer validation order: targeted frontend tests while editing, then after the final
source change one typecheck, one complete Vitest suite, one production build, and a
writer browser smoke at desktop plus 390 × 844 and 360 × 800. Record exact paths,
commands, screenshots inspected, and candidate SHA; do not push.

After the writer candidate, independent read-only visual/functional QA must accept the
exact SHA before the coordinator replaces all obsolete T5 browser evidence across the
five required viewports. Only the final evidence child may proceed to changelog and
push.

## Slice E — light neo-tech minimal `Tetris` frontend

Task ID: `TETRIS-T5-FRONTEND-TECH-MINIMAL-003`

Product source baseline:
`c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`

Writer base: the coordinator documentation commit that introduces this Slice E
directly above the product baseline.

The single frontend writer may change only:

- `src/App.tsx`;
- `src/App.test.ts`;
- `src/styles.css`;
- `src/game/render/theme.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `src/ui/ActionSheet.tsx`;
- one new directly related renderer test under `src/game/render/**` if required,
  excluding `presentation.ts` and `presentation.test.ts`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change:

- `index.html`;
- `package.json`, `package-lock.json`, `vite.config.*`, or `tsconfig*.json`;
- `src/main.tsx`;
- `src/game/core/**`, `src/game/runtime/**`, `src/game/input/**`, or
  `src/game/audio/**`;
- `src/game/render/presentation.ts` or `presentation.test.ts`;
- `src/puzzleProgress.ts`, `src/puzzleProgress.test.ts`, `src/leaderboard.ts`, or
  `src/leaderboard.test.ts`;
- `DESIGN.md`, `CURRENT_TASK.md`, `progress.md`, or `docs/logs/CHANGELOG.md`;
- `docs/qa/evidence/**`, historical T3/T4 workstreams/evidence, or existing committed
  T5 evidence.

Implementation requirements:

- preserve the conditional `home → puzzle-library → game` lifecycle, `GameSession`
  key, asynchronous mount disposal guard, media-query cleanup, pointer capture, and
  exact one-runtime/one-canvas teardown behavior;
- preserve the detached `collect().state` structured clone and the direct regression
  that mutates `status`, `active.x`, `queue[0]`, and one nested board cell without
  changing canonical state or nested identities;
- keep home and Puzzle library at zero runtimes and zero canvases; gameplay mounts
  exactly one Pixi runtime/canvas and never creates a DOM gameplay cell grid;
- use plain-text `Tetris`, the frozen light neo-tech minimal tokens, a single 1+2 mode
  surface, and the one-shot `phase seam`; do not reintroduce grids, CAD, scanlines,
  technical English decoration, badges, toy/glass styling, marketing hero copy,
  settings rows, floating card piles, or stepped rounded bands;
- the small selected-mode visual, if present, uses an original four-cell edge-lit
  plate composition and remains functional/subordinate rather than a brand mark;
- Puzzle stays one coherent all-enabled selection surface. `App.tsx` may read-only
  import the existing `CAMPAIGN_LEVELS` initial boards to derive one SVG/path
  silhouette, but it must not copy, mutate, or redefine canonical Puzzle data;
- the game stays one coherent surface with a flat information dock and one integrated
  five-action control deck;
- renderer cells use the 3–4 px edge-lit plate primitive in both Board and Next, with
  no white highlight bar, thick lower lip, ceramic/jelly bevel, detached unit shadow,
  universal dark outline, cut corner, or bracket ghost;
- remove player-visible legacy `路线` copy. Use `解法`, `本局`, or `对局` only when
  semantically correct;
- at 390 × 844 and 360 × 800 all three mode entrances are completely visible. At
  844 × 390 there is no clipped copy, overlap, horizontal overflow, or accidental page
  scroll;
- computed mobile body/touch copy is at least 12 px, statistic labels at least 14 px,
  statistic values at least 18 px, and every button at least 44 × 44 CSS px;
- preserve reduced motion, accessible action sheets, keyboard/touch controls,
  all-level Puzzle availability, continuous deterministic Puzzle play, and endless
  Race behavior unchanged.

Writer validation order: targeted frontend tests while editing, then after the final
source change one typecheck, one complete Vitest suite, one production build, and one
browser smoke covering 1440 × 900, 2048 × 1152, 390 × 844, 360 × 800, and 844 × 390.
The writer must inspect the actual captures, record computed text/button sizes and
exact changed paths in the workstream log, create one candidate commit, and not push.

After the candidate, independent read-only visual and functional QA must accept the
exact SHA before the coordinator regenerates T5 evidence or updates the changelog.

## Slice F — narrow Puzzle goal and portable evidence correction

Task ID: `TETRIS-T5-FRONTEND-NARROW-COPY-FIX-005`

Base SHA: coordinator contract child of rejected evidence commit
`221c8218b338abeaae6be4e3d73d24fb74550c76`.

Status: **PRODUCT ACCEPTED** at
`56288cde99f8121fd2bb6be51836385fb9d30883`; the old six-level formal evidence remains
rejected and is superseded by the later fifteen-level direction.

Independent visual QA found that `narrow-puzzle-360x800.png` ellipsizes the essential
Puzzle goal to `清空完整棋...`. Independent static QA also found that the evidence
generator hashed the Windows CRLF working-tree bytes of `browser-evidence.json`, while
Git stored the normalized LF blob; exact-commit verification therefore matched only
17 of 18 listed evidence files. All other visual, interaction, scope, and evidence
checks passed.

The single frontend fix writer may change only:

- `src/styles.css`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change `App.tsx`, renderer/theme, tests, Core/runtime/Puzzle data,
`index.html`, dependencies/build configuration, coordinator documents, changelog, or
any evidence path.

Product acceptance:

- at 360 × 800 Puzzle gameplay shows the complete `清空完整棋盘` value with no
  ellipsis or clipping and computed `scrollWidth <= clientWidth`;
- statistic labels remain at least 14 px, values remain at least 18 px, touch labels
  remain at least 12 px, and all visible buttons remain at least 44 × 44 CSS px;
- the fix redistributes narrow Puzzle statistic space rather than hiding copy,
  scaling the page, or changing gameplay content;
- 390 × 844 Puzzle, 844 × 390 gameplay, all mode-home layouts, Board/Next geometry,
  one-canvas/zero-DOM-cell behavior, and all accepted rules remain unchanged;
- after the final source change, run one typecheck, one complete Vitest suite, one
  production build, and a bounded 360/390/844 browser comparison; inspect the actual
  captures, log exact computed values, create one candidate commit, and do not push.

Independent read-only product QA accepted the exact two-path candidate: the complete
goal measured `clientWidth == scrollWidth` at 360/390/844, retained 18 px values and
44 px controls, and produced one canvas, zero DOM cells, no overflow, and no console
errors. Because the user then expanded the campaign, the coordinator does not
regenerate the obsolete six-level evidence. The final combined evidence must later:

- write generated JSON and checksum text with explicit LF bytes before hashing;
- regenerate the complete required first-viewport capture set against the accepted
  product SHA;
- prove every `SHA256SUMS.txt` entry against the exact commit's raw Git blobs;
- route the new evidence child through independent static, browser, and visual QA
  before changelog integration or push.

## Slice G — fifteen-level multi-color Puzzle core

Task ID: `TETRIS-T5-PUZZLE-CAMPAIGN-15-006`

Status: **CORE ACCEPTED** at
`48a229ef55b94d7b6e1de4ba88539bebb1909ec0`. Independent read-only QA accepted the
exact commit with a clean worktree and no blocking finding.

Product base: `56288cde99f8121fd2bb6be51836385fb9d30883`.

Writer base: `ef2d7472eeb2cf461c5408101f045207605334ec`.

The single Core writer may change only:

- `src/game/core/types.ts`;
- `src/game/core/puzzles.ts`;
- `src/game/core/puzzles.test.ts`;
- `src/game/core/puzzleCampaign.test.ts`;
- `src/game/core/puzzleFlow.test.ts`;
- `src/puzzleProgress.test.ts`;
- `docs/workstreams/tetris-t5-core/search-puzzles.mjs`;
- `docs/workstreams/tetris-t5-core/puzzle-references.json`;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md`;
- at most one new reference-builder helper under
  `docs/workstreams/tetris-t5-core/` when required.

The Core writer must not change `engine.ts`, `random.ts`, `puzzleProgress.ts`, React,
CSS, renderer/theme, runtime/input/audio, dependencies, `index.html`, coordinator
documents, changelog, or formal browser evidence.

Core acceptance:

- production exports exactly fifteen all-enabled definitions; the old six IDs, seeds,
  occupancy masks, and two route placement streams remain compatible;
- nine new definitions have original names, unique nonzero seeds, original occupancy
  masks, 9–12 occupied rows, six or more occupancy-row shapes, four density classes,
  covered cavities in five or more columns, and at least eight buried holes;
- every starting board is deterministically colorized with at least five piece types,
  and all seven types occur across the campaign; this salted color pass never consumes
  or changes the gameplay randomizer;
- geometry validation normalizes every occupied character before measuring topology,
  so colors cannot fake row-shape or cavity diversity;
- every seed still produces twelve consecutive complete seven-bags in the first 84
  pieces and replenishes indefinitely in production;
- every one of the fifteen levels has two same-seed 28–35-lock successful routes
  through production `createInitialState` and public `dispatch` only; each route uses
  all seven incoming types, six landing columns, six effective rotations, three setup
  locks, and three separated clear phases; paired routes have at least three semantic
  placement differences and an intermediate board-hash divergence;
- search may use at most two concurrent seed processes and unique ignored outputs;
  failed seeds/candidates are replaced rather than weakening route or topology gates;
- after the final Core source change, run one typecheck, one complete Vitest suite,
  one production build, and the complete 30-route verifier. Inspect exact generated
  references, log commands/results, create one Core candidate commit, and do not push.

Independent read-only Core QA must accept the exact Slice G candidate before Slice H
starts. A Core-only 15-level candidate is not releasable through the six-row frontend.

## Slice H — `经典`, multi-color palette, and fifteen-level library

Task ID: `TETRIS-T5-FRONTEND-CAMPAIGN-15-007`

Status: **FUNCTIONAL CANDIDATE READY** at
`248ca89551ce1293abe88e651c9953e132c816be`, but **VISUALLY REJECTED / SUPERSEDED** by
the user's request for a more premium page and bright redesigned blocks. It is a clean
fallback, not a release candidate and not eligible for formal evidence or push.

Product base: independently accepted Slice G candidate
`48a229ef55b94d7b6e1de4ba88539bebb1909ec0`.

Writer base: the coordinator acknowledgement commit that opens Slice H.

The single frontend writer may change only:

- `src/App.tsx`;
- `src/App.test.ts`;
- `src/styles.css`;
- `src/game/render/theme.ts`;
- one new focused `src/game/render/theme.test.ts` if useful;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The frontend writer must not change Core/Puzzle definitions or references,
`puzzleProgress.ts`, renderer logic, presentation/runtime/input/audio, dependencies,
`index.html`, coordinator documents, changelog, or formal browser evidence.

Frontend acceptance:

- all player-facing mode copy and accessibility labels say `经典`; no visible
  `马拉松` remains. Internal `marathon`, `enter-marathon`, and CSS mode keys remain
  unchanged for deterministic compatibility;
- Board and Next use the exact seven-piece mineral-signal palette frozen in
  `DESIGN.md`; it is more varied than the rejected blue-only set and does not use the
  standard commercial piece-color mapping or a toy-rainbow treatment;
- the canonical multi-color starting board is visible in gameplay. Any library
  silhouette groups canonical cells into a bounded number of SVG paths by piece type,
  not a DOM cell grid and not a copied decorative layout;
- every `六关`/`六个` hard-code is removed. Copy and aria derive the exact count from
  `CAMPAIGN_LEVELS.length`;
- desktop and 844 × 390 show one continuous 3 × 5 all-enabled level matrix beside the
  selected detail/start region, with all fifteen rows/buttons inside the first
  viewport at 844 × 390; 360/390 use a two-column matrix and a separate in-flow detail
  region, with normal library scrolling allowed;
- all fifteen entries stay mounted, enabled, keyboard/touch reachable, and carry the
  existing `level-row`, `data-level-id`, `aria-pressed`, and stable start selectors;
- real UI proves selection/start for the first, middle, and fifteenth levels and
  matches canonical `puzzleId`, name, active piece, Next, and multi-color locked cells;
- preserve the accepted 1+2 home, phase seam, complete 360 px goal, 44 px controls,
  12/14/18 px type floors, one-canvas lifecycle, accessibility, reduced motion,
  continuous Puzzle, and endless Race;
- after the final frontend source change, run one typecheck, one complete Vitest
  suite, one production build, and the five-viewport browser matrix. Inspect actual
  captures, log exact values, create one frontend candidate commit, and do not push.

Slice H's functional and responsive results carry into Slice I, but its visual QA was
stopped when the user rejected the finish. No Slice H formal evidence is regenerated.

## Slice I — premium spectral surface and bright precision blocks

Task ID: `TETRIS-T5-PREMIUM-BRIGHT-BLOCKS-008`

Status: **REJECTED BY USER** at local commit
`e552b3c86e59b801f6d69045a94211e3f1c97e34`. It is unpushed and is not eligible
for QA or evidence. The path list and acceptance bullets below are historical only and
grant no further Slice I authority.

Product base: rejected-as-final but functionally complete candidate
`248ca89551ce1293abe88e651c9953e132c816be`.

Writer base: the coordinator contract commit that opens Slice I.

The single frontend/render writer may change only:

- `src/App.tsx`;
- `src/App.test.ts`;
- `src/styles.css`;
- `src/game/render/theme.ts`;
- `src/game/render/theme.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- at most one new focused test under `src/game/render/`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change Core/Puzzle definitions, references or routes,
`puzzleProgress.ts`, presentation/runtime/input/audio, dependencies, `index.html`,
coordinator documents, changelog, or formal evidence.

Slice I acceptance:

- all 28 piece material values exactly match the bright luminous-spectrum table in
  `DESIGN.md`; no muted material from `248ca89` remains;
- Board and Next share one precision-slab renderer primitive with 1.25–2.5 px radius,
  one fine same-hue dark edge, no permanent inner perimeter, no detached unit shadow,
  and no candy/ceramic/mineral bevel. Active uses only a low-intensity light-color
  aura; locked is flat; Ghost is a full fine outline with at most 3% fill;
- canonical silhouettes use the same bright mapping, at most one path per present
  piece type, and no DOM gameplay grid;
- page refinement uses the exact `spectral glass light` tokens in `DESIGN.md`: ice
  base, near-white translucent surfaces, cyan/cobalt/violet state families, and coral
  only as a small Puzzle/selection signal. It replaces template-like flatness with
  controlled depth, tighter type/spacing hierarchy, and the single three-stop spectral
  rail. It does not add a dark neon theme, uncontrolled rainbow, decorative telemetry,
  repeating page grid, marketing hero, external font/asset, or copied trade dress;
- the 15-level matrix remains continuous. Selected state is unmistakable without
  becoming a floating card; repetitive cell copy is shortened without hiding names;
  at 360/390 the fifteenth odd item spans the two-column row instead of leaving an
  empty half-cell, and the selected detail remains outside/after the list;
- HUD, Next, statistics, and the five-action control deck read as one coherent game
  instrument rather than repeated rounded cards. All existing selectors, action order,
  labels, 44 px controls, 12/14/18 px floors, complete goal, and accessibility remain;
- visible `经典`, endless Race, continuous Puzzle, exact 15 all-enabled levels,
  first/eighth/fifteenth canonical bindings, seven locked colors, 1+2 mode home,
  reduced motion, and one-canvas/zero-DOM-cell lifecycle do not regress;
- the writer runs targeted theme/renderer/App tests while iterating and the prescribed
  real Playwright action client after each meaningful visual change. After the final
  product source change, run one typecheck, one complete suite, one production build,
  and one five-viewport browser matrix; inspect every library, home, and gameplay PNG,
  create one candidate commit, and do not push.

Independent read-only functional and visual QA must accept the exact Slice I candidate
before the coordinator regenerates explicit-LF formal evidence, updates the changelog,
or decides whether to push.

## Slice J — legal authored Puzzle endgames

Task ID: `TETRIS-T5-PUZZLE-AUTHORED-ENDGAMES-009`

Status: **ACCEPTED** at Core checkpoints `ee0d996` and `2d282b6`, with final frozen
product/source SHA `26ef004dc4ab11de8caeee6605bbe21044c5d950` after Slice J-R.
Independent read-only QA accepted the contiguous range
`50be21d70abab887051b85d412a102f0b77eb9d2..676d804c2be74b107d429c61639ecc03e70e6509`.

Product base: rejected visual checkpoint
`e552b3c86e59b801f6d69045a94211e3f1c97e34`; its accepted mode/runtime behavior
remains the deterministic base, but its visual result is not accepted.

Writer base: the coordinator documentation commit that opens Slice J directly above
the product base.

The single Core writer may change only:

- `src/game/core/puzzles.ts`;
- `src/game/core/puzzles.test.ts`;
- `src/game/core/puzzleCampaign.test.ts`;
- `docs/workstreams/tetris-t5-core/search-puzzles.mjs`;
- `docs/workstreams/tetris-t5-core/build-puzzle-references.test.ts`;
- `docs/workstreams/tetris-t5-core/puzzle-references.json`;
- at most one new directly related authoring/reference helper under
  `docs/workstreams/tetris-t5-core/`;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md`.

The Core writer must not change `engine.ts`, `random.ts`, `pieces.ts`, `board.ts`,
runtime/input/audio/render/frontend paths, `puzzleProgress.ts`, dependencies/build
configuration, `index.html`, coordinator documents, changelog, or formal browser
evidence.

Slice J acceptance:

- remove `BOARD_COLOR_SALT`, `colorizeBoardRows`, random hole excavation as production
  authority, and every per-cell color draw;
- keep the fifteen IDs, names, order, and gameplay seeds, but replace all masks and
  all thirty route/reference streams;
- each definition owns a separate setup seed and 16–22 explicit
  `{ type, rotation, x }` placements. Type must match the setup seed's next seven-bag
  draw; landing `y` is derived by ordinary hard drop and is never authored/injected;
- public-command setup replay starts from an empty Marathon board, uses rotation,
  horizontal movement, and hard drop only, produces zero line clears/top-out/hidden
  occupancy, and byte-matches the production Puzzle board;
- every source owner remains exactly four cells matching its canonical tetromino
  rotation and material type. Same-type source pieces do not share an orthogonal edge,
  so every visible same-color component is one recognizable tetromino;
- every endgame occupies 8–12 rows, uses all seven types, has at least seven row
  shapes, four density classes, five covered-cavity columns, and eight buried holes;
  masks are pairwise unique with Hamming distance at least 20;
- every level retains automatic gravity and the indefinitely replenishing gameplay
  seven-bag, and has two public-dispatch successful routes of 30–42 locks meeting the
  strengthened diversity thresholds in `DESIGN.md`;
- the reference verifier proves all thirty routes, the fifteen setup replays, and the
  first 84 gameplay pieces as twelve complete seven-bags. Search uses at most two
  concurrent processes; failed candidates are replaced rather than weakening gates;
- after the last Core source change, run one typecheck, one complete Vitest suite, one
  production build, and the complete setup/route verifier. Inspect the exact reference
  JSON, log paths/commands/results, create one candidate commit, and do not push.

Independent read-only Core QA must accept the exact Slice J candidate before Slice K
opens. The old random-color masks, state hashes, reference SHA, screenshots, and
routes are rejected evidence and may not be reused.

## Slice J-R — migrate the stale Puzzle browser-QA route

Task ID: `TETRIS-T5-QA-ROUTE-MIGRATION-009R`

Status: **ACCEPTED** at source checkpoint
`26ef004dc4ab11de8caeee6605bbe21044c5d950`; runtime log checkpoint `aab0dc9` and
Core final-gate log checkpoint `676d804` are accepted read-only records.

Trigger: the post-source full suite passed 39 files / 251 tests and failed only
`src/game/runtime/qaScenario.test.ts` because `PUZZLE_CHALLENGE_QA_ROUTE` still owns
the rejected pre-Slice-J first-level placements. The new first level retains the same
35-lock / 22-line public-command completion contract.

The runtime-QA fixture writer may change only:

- `src/game/runtime/qaScenario.ts`;
- `src/game/runtime/qaScenario.test.ts` only if a direct assertion must change;
- `docs/workstreams/tetris-t5-runtime/THREAD_LOG.md`.

Slice J-R acceptance:

- replace only the frozen `PUZZLE_CHALLENGE_QA_ROUTE` placement stream with the new
  signed first-level route; do not import the large reference JSON into production
  source and do not alter Race fixtures;
- preserve `replayPuzzleChallenge` as public `start` / rotate / move / hard-drop /
  tick dispatch only, with 35 locks, 22 lines, deterministic hash, finished status,
  completed `t3r-shaft-01`, and next level `t3r-shaft-02`;
- do not change Core, engine, timing, rendering, frontend, input/audio/storage,
  dependencies, `index.html`, coordinator documents, changelog, or evidence;
- run the focused `qaScenario.test.ts`, explicit-path stage/diff checks, create one
  bounded runtime-QA source checkpoint, and do not push.

After Slice J-R is green, the Core writer runs the still-pending single final build and
complete 15-setup / 30-route verifier; the already completed final typecheck and full
suite attempt remain recorded, but acceptance requires one green complete suite after
the fixture migration. Independent QA reviews the contiguous Slice J + J-R range.

## Slice K — `暮海矿物` theme and minimal visible copy

Task ID: `TETRIS-T5-DEEP-MINERAL-MINIMAL-010`

Status: **REJECTED BY INDEPENDENT QA** at log candidate `9c128ab`; frozen product
source `1b1bfdbf150afa6708859b81cf12cd876b77d320` remains the repair base only.

Product base: independently accepted Slice J + J-R candidate
`676d804c2be74b107d429c61639ecc03e70e6509`.

Writer base: the coordinator documentation checkpoint that opens Slice K directly
after the accepted product base.

Commit-policy plan: use bounded linear source checkpoints rather than one opaque UI
commit. Theme/renderer, visible App composition/copy, and CSS surface/responsive finish
are separate reviewable claims when their hand-authored range would otherwise exceed
500 lines. Each checkpoint keeps its direct tests green; the expensive final gates and
browser matrix run once after the last product-source change.

The single frontend/render writer may change only:

- `src/App.tsx`;
- `src/App.test.ts`;
- `src/styles.css`;
- `src/game/render/theme.ts`;
- `src/game/render/theme.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- at most one new focused renderer test under `src/game/render/`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The frontend writer must not change Core/Puzzle definitions, setup histories,
references/routes, `puzzleProgress.ts`, presentation/runtime/input/audio, dependencies,
`index.html`, coordinator documents, changelog, or formal evidence.

Slice K acceptance:

- implement the exact `暮海矿物` page tokens and seven-piece four-value table in
  `DESIGN.md`; page and pieces form one natural, coordinated deep spectrum with no
  fluorescent, candy-rainbow, or clashing complementary accents;
- replace the blurred luminous material with the frozen matte anodized primitive:
  135-degree low-delta fill, 1.25–1.75 px radius, one 0.75–1 px dark edge, no locked
  shadow/inner ring/highlight, active using one signal edge and no BlurFilter, zero-fill
  Ghost with one 1 px signal outline, and Board/Next sharing the primitive;
- use solid page/control surfaces. The phase seam is the only page gradient; remove
  backdrop blur, ambient color blobs, gradient CTA, glow shadow, and plastic/glass
  styling. Preserve measured AA and at least 3:1 board-cell contrast endpoints;
- home visibly contains only `Tetris`, one `选择模式`, the three names, their terse
  statistic/objective lines, and `开始` / `选关`; remove the standalone selected-mode
  preview copy and every banned explanatory string in `DESIGN.md`;
- Puzzle rows contain only ordinal, name, and optional completion. Selected detail
  contains silhouette, `目标  清空棋盘`, and `开始`; remove repeated objectives and
  seven-bag/rule explanations;
- game retains mode/level, back, pause, score/statistics, `清空棋盘`, Next, keyboard
  controls, and five touch actions, while removing `本局数据`, long mode-rule copy,
  and explanatory pause/exit paragraphs. ARIA remains complete;
- preserve all stable selectors, internal `marathon`, exact fifteen enabled entries,
  first/eighth/fifteenth canonical binding, 44 px controls, 12/14/18 px floors,
  reduced motion, one-canvas/zero-DOM-cell lifecycle, endless Race, and continuous
  Puzzle behavior;
- run targeted App/theme/renderer tests while editing. After the final source change,
  run one typecheck, one complete suite, one build, the prescribed action client, and
  one five-viewport home/library/game browser matrix; inspect every PNG, log exact
  evidence, create bounded linear source checkpoints plus a log-only checkpoint, and
  do not push.

Independent read-only functional and visual QA must accept the exact Slice K candidate
before the coordinator regenerates explicit-LF formal evidence, updates the changelog,
or decides whether to push.

## Slice K-R — Google typography, coherent dividers, and QA motion repair

Task ID: `TETRIS-T5-MINERAL-TYPE-DIVIDER-011`

Status: **SUPERSEDED — the K-R candidate was repaired and accepted only through
Slice K-R2**.

Product base: rejected-as-final Slice K candidate
`9c128abae1c3ddb3e1de2e783be0b1c37210fc9c`; all accepted Core behavior and the
coordinated mineral palette/material remain fixed.

The repair writer may change only:

- `src/App.tsx` only for canonical silhouette cohesion;
- `src/styles.css`;
- `src/App.test.ts` only for direct visible-copy/structure regression coverage;
- `src/game/render/theme.ts`;
- `src/game/render/theme.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `src/game/render/presentation.ts`;
- `src/game/render/presentation.test.ts`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

Slice K-R acceptance:

- import the exact `Space Grotesk` + `Noto Sans SC` Google Fonts CSS v2 request frozen
  in `DESIGN.md` as the first CSS statement, with `display=swap` and the complete
  system fallback. Do not edit `index.html`, add a dependency, imitate a logo, or
  require the network for legibility/layout correctness;
- apply the pairing consistently to title/UI/numerals, then verify both successful
  font loading and a blocked-font fallback at the five required viewports. No font
  swap may clip names, controls, statistics, or the complete `清空棋盘` goal;
- replace the generic statistic odd/even borders with explicit Classic/Race/Puzzle
  geometry. Puzzle level and objective span full rows on the desktop dock, placed and
  cleared share one middle row, and no viewport contains the reported half divider,
  stray vertical segment, or empty fake quadrant;
- restore visible `Next` and the compact keyboard map at 390 × 844, 360 × 800, and
  844 × 390 without shrinking below 12 px, breaking the board's 1:2 geometry,
  clipping the goal, or adding gameplay scroll;
- reduce `surface-in` to at most 4 px over 180 ms. Cap the ordinary line-clear tonal
  sweep to nine 60 Hz presentation ticks (150 ms) without changing Core clear delay;
  reduced motion must show no positional or sweep transition;
- replace isolated cell plates with cohesive tetromino components. Orthogonally
  adjacent same-material cells bridge the old gap and do not retain full internal
  outlines; any seam stays at or below 0.35 px / 22% alpha. Active, Next, Ghost, and
  locked-board rendering use the same grouping logic, while the canonical silhouette
  substantially closes its per-cell gaps without exceeding one path per piece type;
- add only the frozen directional mineral relief: a 0.75–1.25 px low-alpha signal
  bevel on exposed top/left edges and the material dark edge on exposed bottom/right
  edges. Preserve the exact 28 colors and prohibit white highlight bars, inner rings,
  double outlines, glow, blur, glass, detached shadows, or plastic/candy gloss;
- test the grouping helper with canonical I/O/T/S/Z/J/L cells, proving internal edges
  are suppressed and the Ghost perimeter has no internal cell boxes. Visually inspect
  active, locked, Next, all fifteen authored boards, and post-line-clear fragments at
  desktop and mobile sizes;
- preserve the exact palette/material values, concise copy, `经典`, stable selectors,
  fifteen enabled levels, first/eighth/fifteenth binding, 44 px controls, 12/14/18 px
  floors, one canvas/zero DOM cells, lifecycle, endless Race, and continuous Puzzle;
- run focused App/presentation/renderer tests while editing. After the final product
  source change, run one typecheck, one complete suite, one production build, the
  prescribed action client, and a fresh five-viewport home/library/game matrix with
  original-detail inspection. Use bounded linear source checkpoints if the cohesive
  renderer and typography/layout claims together exceed 500 hand-authored modified
  lines, plus a log-only checkpoint; do not push.

Independent static/functional and visual/browser QA must accept the exact K-R source
checkpoint before formal evidence, changelog integration, or push.

## Slice K-R2 — Semantic statistic roles and landscape action containment

Task ID: `TETRIS-T5-MINERAL-SEMANTIC-REPAIR-012`

Status: **ACCEPTED — source `effb353`, candidate tip `ba5d387`, formal evidence
`c0832e4`**.

Product base: rejected-as-final Slice K-R candidate
`f4fcbb582ac5dfd8fce6fa4a2e3e7cc91e0f4102`; frozen product source
`e38c55c4631beb68eecb648b84d205e4376245b0` remains the implementation base.
Independent static QA rejected generic `nth-child(odd)` inference in the compact
Puzzle statistic grid. Independent visual QA additionally proved every 844 × 390
DPR3 home action cluster is clipped at the shared surface's right boundary in both
loaded-font and blocked-font conditions. All other K-R source and browser gates remain
accepted inputs to this bounded repair, not final release acceptance.

The repair writer may change only:

- `src/App.tsx` only to add explicit statistic-role hooks;
- `src/styles.css` only to replace statistic positional selectors and contain the
  landscape mode actions;
- `src/App.test.ts` only for direct semantic-role/structure regressions;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` only after source is frozen.

Slice K-R2 acceptance:

- every Classic, Race, and Puzzle statistic article exposes an explicit semantic role;
  all statistic spans and dividers select those roles. No statistic geometry may use
  `nth-child`, `nth-of-type`, `odd`, or `even`;
- preserve the exact desktop and compact row topology already accepted visually:
  Puzzle level/objective full-width on desktop, placed/cleared in the middle, and a
  coherent 2 × 2 compact grid with no half line, dangling segment, doubled edge, or
  fake empty quadrant;
- at 844 × 390 DPR3, all three home entrances show their complete action label and
  rounded arrow border. Each mode button and `.mode-gate__action` must have
  `scrollWidth <= clientWidth`; keep each action at least 44 × 44 px and preserve the
  one-surface 1+2 composition;
- preserve the exact typography, palette/material values, cohesive Pixi grouping,
  concise copy, visible Next/keyboard map, 4 px entrance, nine-tick clear sweep,
  fifteen enabled levels, 2:1 board, 44 px controls, and one-canvas lifecycle from
  frozen source `e38c55c`;
- run focused App tests while editing. After the final source change, run one
  typecheck, one complete suite, one production build, the prescribed action client,
  and one fresh five-viewport loaded-font/blocked-font home/library/game matrix with
  original-detail inspection. Create one bounded source checkpoint and one log-only
  checkpoint; do not push.

Independent static/functional and visual/browser QA must accept the exact K-R2 source
checkpoint before formal evidence, changelog integration, or push.

Disposition: independent static/functional and visual/browser QA accepted exact source
range `bcc25d6..effb353`. The post-source candidate tip `ba5d387` changes only the
frontend workstream log. Formal generator `4d2733b` produced 23 screenshots and
evidence child `c0832e4`; independent evidence QA accepted 23/23 original-detail
captures and reproduced all 25/25 raw-Git-blob SHA-256 entries with zero CRLF in the
JSON and checksum manifest.

## Slice K-R3 — divided cohesive facets and stronger mineral depth

Task ID: `TETRIS-T5-MINERAL-DIVIDED-FACETS-013`

Status: **ACCEPTED AS PART OF FINAL SOURCE `48176fe`**. Source checkpoint `acaf405`
remains the frozen geometry/facet baseline and independent frontend cross-QA accepted
it together with K-R5/K-R6.

Branch base: `028c1580cec7eff92013db614b40491fa4eac9d6`; frozen behavior/layout source is
`effb353c0a4d1bef26fa524ed38d3d3653f45eb8`. The previously accepted evidence is a
historical baseline and must be regenerated after this renderer change.

The renderer writer may change only:

- `src/game/render/theme.ts` and `src/game/render/theme.test.ts`;
- `src/game/render/presentation.ts` and `src/game/render/presentation.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after source is frozen.

Slice K-R3 acceptance:

- preserve the exact seven-piece palette and one connected outer silhouette for every
  orthogonally joined same-material component; same-piece neighbours never expose the
  board well or regain four detached shadows/outer boxes;
- keep the board-well channel between separate material components at least 1.6 times
  the perceived internal groove width. The larger outer gap and finer inner seam must
  make whole-piece grouping readable without changing board geometry;
- draw every shared cell boundary exactly once as the frozen dark groove plus
  lower/right light lip, so all four canonical units remain visible in active, locked,
  Next, and Ghost pieces;
- give each filled unit one restrained inset top/left light and bottom/right dark
  facet while keeping the stronger joined outer bevel. The result must read more
  dimensional without white gloss, plastic, candy, glass, blur, glow, or detached
  depth;
- add deterministic seam enumeration tests for I/O/T/S/Z/J/L, including exact shared
  boundary counts, no duplicate seams, complete outer perimeter, and split fragments;
- preserve typography, statistic dividers, visible Next/keyboard map, concise copy,
  `经典`, fifteen enabled legal残局, endless Race, responsive geometry, 44 px controls,
  reduced motion, one canvas, zero DOM cells, lifecycle, and `index.html` unchanged;
- run focused presentation/theme tests while editing. After the final source change,
  run one typecheck, one complete suite, one production build, the prescribed action
  client, and a fresh five-viewport browser pass with original-detail inspection of
  active, locked, Next, Ghost, and dense Puzzle stacks. Create bounded source and
  log-only checkpoints; do not push before independent static and visual QA accept the
  exact candidate.

## Slice K-R4 — shorter grounded lock window

Task ID: `TETRIS-T5-SHORT-LOCK-WINDOW-014`

Status: **ACCEPTED**. Source `f0ec47c`; log `4fed07c`; independent Core cross-QA
accepted the exact source with no finding.

Writer base: the contract checkpoint created from log candidate `400916c`. The writer
may change only:

- `src/game/core/constants.ts`;
- `src/game/core/core.test.ts` for the direct exact-duration regression;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md` after source is frozen.

K-R4 acceptance:

- change `LOCK_DELAY_TICKS` from 30 to exactly 18 (about 300 ms at 60 Hz); preserve
  `MAX_LOCK_RESETS`, move/rotation reset rules, hard drop, entry/clear delays, gravity,
  scoring, hashes, and every other Core constant;
- prove a grounded piece remains movable and unlocked through tick 17 and locks on
  tick 18 in Classic, while existing shared-delay tests continue to prove the same
  constant drives Race and Puzzle behavior;
- run the focused Core tests, typecheck, exact-path staging, and one bounded source
  checkpoint. Do not change renderer/UI/Puzzle data/references, dependencies,
  `index.html`, coordinator docs, formal evidence, or push.

## Slice K-R5 — brighter `雾昼矿物` retone

Task ID: `TETRIS-T5-BRIGHT-MINERAL-RETONE-015`

Status: **ACCEPTED**. Source `fd5f901`; log `1e7e5e3`; independent frontend cross-QA
accepted the exact retone and frozen renderer geometry with no finding.

Writer base: the same contract checkpoint. The writer may change only:

- `src/styles.css`;
- `src/game/render/theme.ts` and `src/game/render/theme.test.ts`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after source is frozen.

K-R5 acceptance:

- replace only page/state/piece color values, shadow, action-ink handling, and
  `color-scheme` with the exact `雾昼矿物` table in `DESIGN.md`; retain the existing
  layout, type scale, spacing, semantic dividers, controls, copy, and phase motion;
- preserve K-R3's joined outer silhouette, larger external gap, narrower internal
  groove, raised unit facets, Ghost guides, and every geometry token unchanged;
- keep the board well deep while page and panels become visibly brighter. Technology
  remains in structural precision, typography, focus, and feedback; add no grid,
  neon, glow, ambient blob, decorative telemetry, new component, or marketing copy;
- freeze exact CSS and Pixi tokens in direct tests and retain AA text/action contrast
  plus at least 3:1 contrast for every piece fill endpoint against the board well;
- run focused theme/App tests and the prescribed action client while editing, then
  create one bounded source checkpoint. Do not change Core/runtime/Puzzle data,
  renderer geometry, dependencies, `index.html`, coordinator docs, formal evidence,
  or push.

After both source checkpoints, the coordinator runs one combined final typecheck,
complete suite, build, and five-viewport browser matrix. Independent cross-QA must
accept the exact combined candidate before formal evidence, changelog integration, or
push.

## Slice K-R6 — input-gated entry countdown

Task ID: `TETRIS-T5-ENTRY-COUNTDOWN-016`

Status: **ACCEPTED AFTER REPAIR**. Initial source `7f0b766`; gate repair `48176fe`;
final log tip `d292b15`. Independent frontend cross-QA rejected the first candidate's
DEV-QA reset/selection bypass, then accepted repaired source `48176fe` with no open
finding.

Writer base: the combined K-R4 + K-R5 log candidate. One writer may change only:

- `src/App.tsx` and `src/App.test.ts`;
- `src/game/runtime/GameRuntime.ts` and `src/game/runtime/GameRuntime.test.ts`;
- `src/styles.css` for the countdown overlay only;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after source is frozen.

K-R6 acceptance:

- Classic/Race mode start and the selected Puzzle start show the existing game shell
  with centered `3`, `2`, `1`, each for exactly 1000 ms; after `1`, remove the overlay,
  enable input, call the public runtime start path exactly once, and focus the canvas;
- keep the canonical game state `ready` for all three seconds. Keyboard, touch, QA,
  gravity, ticks, scoring, audio events, and pause cannot start or mutate the run early;
- expose an explicit runtime input gate with a direct regression test. Keep the gate
  disabled only for the entry countdown and clear held input whenever it changes;
- restarting/replaying an existing run starts immediately under current behavior and
  must not create another countdown. Reduced-motion removes visual interpolation only;
- style one restrained board-local countdown layer using existing palette/type tokens;
  add no new card, copy, neon, glow, telemetry, layout change, or renderer primitive;
- run focused App/runtime tests and the prescribed browser client, then create bounded
  source and log-only checkpoints. Do not change Core rules, Puzzle definitions,
  renderer geometry, dependencies, `index.html`, coordinator evidence/changelog, or
  push.

The coordinator runs the single final typecheck, full suite, build, and five-viewport
matrix only after K-R6 is source-frozen. Cross-QA acceptance of the exact combined
candidate is required before evidence integration or push.

Disposition: **ACCEPTED**. Final product source
`48176fe3d23cbc450fe39b38310c8a6b6eb71945` retains the mature layout and divided
cohesive facet renderer, applies the exact light `雾昼矿物` palette, shortens the shared
grounded lock delay to 18 ticks, and adds one input-gated three-second entry countdown.
Final post-repair gates passed typecheck; 40 test files with 39 passed / 1 skipped;
262 tests with 260 passed / 2 skipped; the 739-module production build; the prescribed
action client; and an exact-source five-viewport matrix. Independent Core QA accepted
K-R4 and independent frontend/browser QA accepted K-R3/K-R5/K-R6 after repair.
Evidence commit `7d374188b8672cef32b5d90023db4f677421d178` contains 24 captures tied to source
`48176fe` and candidate tip `d292b15`, 26/26 matching SHA-256 entries, a visible digit-3
countdown proof, canonical immutability under QA start/reset/selection/action attempts,
one canvas, zero DOM cells, and zero unexpected browser errors. `index.html`,
dependencies, Puzzle definitions/references, and separate game repositories were not
changed by these refinements.
