# Tetra — T12 Progressive Puzzle Curriculum and Anchor Stability Contract

## T12.1 archive worktable and visible-board presentation clamp

The 2026-07-19 follow-up keeps T12's campaign, fixed-seed Puzzle routes, and seven-row
Survival rules intact. It corrects two presentation defects only: the archive must read
as a deliberate campaign instrument rather than a flat card wall, and a buffered-spawn
piece must never become visible beyond the playable well.

- The Puzzle selector is an **archive worktable**. A compact campaign rail communicates
  the opened count as one continuous bar and an explicit `opened / total` value; it has
  no decorative dots. The catalog uses numbered text records with a clear state label
  (open, complete, or sealed), a narrow selected-state edge, and a restrained mineral
  surface. There are no per-level miniatures. The single selected canonical-board
  preview remains in the detail instrument, where its ordinal, difficulty, title, and
  start action form one stable reading order.
- A sealed entry remains readable but inert: it may not take selection, start a run, or
  masquerade as an error state. Its subdued color, solid surface, and state label must
  remain distinguishable without relying on hue alone. Keyboard focus, the existing
  button semantics, responsive reflow, and reduced-motion support remain mandatory.
- The visible twenty-row well is a hard renderer presentation boundary. Core may retain
  its normal hidden spawn buffer and deterministic replay coordinates, but a visible
  active cell, outline, or rotation pulse may not render above the board's top edge.
  When interpolation would move the active group above its first visible row, the
  renderer clamps that presentation offset at the visible boundary and suppresses the
  scale pulse for that frame. This is renderer-only: no spawn coordinate, collision,
  queue, timing, seed, or puzzle setup may change.

## T12 fixed anchors, no timed inputs, progressive access, and stronger feedback

The user's 2026-07-19 direction supersedes T11's volatile Puzzle input mechanism and
the unrestricted fifteen-level archive. It corrects the current anchor clear bug and
changes only Survival's opening bedrock height; Classic and all other Survival rules
remain unchanged.

- Puzzle has exactly twenty original authored levels, ordered from difficulty `01` to
  `20`. Difficulty is a monotonic campaign index authored from target topology,
  cavity recovery demand, and sparse fixed-anchor placement; the route-specific
  solver budget remains a bounded success allowance rather than a linear difficulty
  score. The new `16`–`20` band uses accepted route minima of `30`, `33`, `33`, `34`,
  and `42` locks before its fixed +10 slack. All levels retain a stable, level-owned
  deterministic seed and original clean-room setup history.
- A new save begins with levels `01`–`03` available. Every distinct canonical Puzzle
  completion opens one additional next-locked level, up to all twenty. Completion
  remains persistent, malformed or older data fails closed, and historic completion
  records migrate without losing their completed-level information. Locked entries
  are visible in the archive but cannot be selected or started; completion and unlock
  state are announced accessibly.
- `A` anchors are permanent **coordinate-pinned** obstacles. No line clear, including
  one below an anchor, may change an anchor's `{x,y}`. When an ordinary clear occurs
  in a Puzzle with anchors, normal cells resolve inside the vertical segments delimited
  by those fixed coordinates; normal targets continue to move deterministically and
  are removed only when their own cleared row is resolved. A line containing an anchor
  clears its removable cells while leaving the anchor in place.
- Remove the timed/volatile Puzzle-input design completely. No Puzzle input can expire,
  disappear, invoke support settlement, receive a warm volatile material, show a timer,
  or emit an expiry event/audio cue. Puzzle uses only ordinary deterministic seven-bag
  inputs, original targets, and optional fixed anchors.
- The visible `0–100%` sound control remains beside Pause, but `100%` is rebalanced as
  a clearly audible game mix: a modest master headroom boost, less aggressive
  compression, and stronger bounded sine envelopes. The mix remains transient,
  sine-only, free of distortion-prone waveforms and ambient loops, and must not clip
  ordinary overlapping gameplay cues.
- The archive retains its selected canonical preview as its only board thumbnail. Its
  new progression signal is compact and semantic—difficulty, completion, and lock
  status—not a decorative dot or per-entry miniature board. Touch, keyboard, reduced
  motion, responsive geometry, one canvas, and the plain-text `Tetra` identity remain
  required. The short single-word name communicates the four-cell input vocabulary
  without borrowing the Tetris product name or logo; no Chinese companion name is
  displayed in the product shell.
- Survival now begins with exactly seven warm-mineral bedrock rows. Its 15→8-second
  pressure, one-row-per-three-lines removal, fixed 40-tick gravity, restart behavior,
  ranking, and ordinary-run random-seed contract are unchanged.

## T11 target-marked Puzzle budgets, acoustic refinement, and fixed Survival pace

## T11 target-marked Puzzle budgets, acoustic refinement, and fixed Survival pace

The user's 2026-07-19 direction supersedes T10's permanent Puzzle-anchor overlay,
the five-row / progressive-speed Survival opening, and the previous restart-copy and
audio palette.

- A Puzzle's goal is to clear every *original target block* within that level's
  solver budget `X`. Original targets are the ordinary tetromino cells present in the
  authored visible board at startup; later player locks, active pieces, ghosts, and
  volatile pieces never become targets. Target identity follows its cell through an
  ordinary row clear and the bounded volatile support-settlement rule, and is removed
  only when that original cell clears.
- `X` is the shortest lock count among the level's currently verified deterministic
  public-command solver routes plus ten locks of fixed slack. It is a reproducible
  accepted-solver bound with room for recovery, not a claim of a globally proven
  mathematical optimum. The engine permits success on the Xth lock after line
  resolution; if targets remain then, it ends with the explicit budget failure. Each
  level owns and exposes its own solver result and its applied slack.
- Random permanent `A` anchors remain sparse and deterministic, but may occupy only a
  visible row that was entirely empty in the authored initial board. They never share
  an initial row with original targets, never count as targets, and therefore cannot
  make an all-original-target objective impossible. Five-second volatile inputs remain
  optional, seeded later-play mechanics and never count as original targets.
- Pixi keeps each original target's ordinary material and connected-piece geometry,
  then adds a restrained warm-gold inset corner bracket at its upper-left edge. It is
  a quiet piece of the existing bevel language rather than a dot, rivet, tail, glow,
  or full per-cell outer box. The marker survives normal state updates and moves with
  the canonical target coordinate; it is neither a DOM cell nor a new cell material.
- Puzzle statistics show original targets remaining, the bounded used/available solver
  locks, and a prominent countdown of the locks still available. Terminal success and
  failure copy state the target outcome rather than claiming that the full board is
  empty.
- Survival opens with exactly ten warm-mineral bedrock rows. It retains its 15→8-second
  pressure and three-line bedrock removal, but its automatic gravity is one fixed,
  slightly faster cadence for the whole run. Clearing lines never accelerates the
  falling piece; Classic and Puzzle retain their existing independent cadence rules.
- The restart sheet remains keyboard-confirmable with Enter, but its visible primary
  action is exactly `确认` and it has no explanatory small copy.
- Each new Classic or Survival run, including restart and replay, receives a fresh
  runtime seed and therefore a new seven-bag sequence. Puzzle ignores that runtime
  seed and always restores its selected level's fixed authored sequence.
- A terminal Classic or Survival record that survives leaderboard insertion is visibly
  highlighted in the result table. If it does not survive the ranked list, the result
  sheet instead gives a compact explicit non-qualification notice.
- All game feedback uses short, bounded sine-based acoustic cues with a shared soft
  envelope; square, triangle, and sawtooth voices are removed. A hard drop owns the
  complete landing voice, so its accompanying lock event cannot stack a second sharp
  waveform on top. Event differences come from timing, octave, chord shape, and
  envelope, never buzzy oscillator types or a sustained background loop.

## T10 immutable Puzzle anchors and five-second vanishing inputs

The user's 2026-07-19 direction supersedes the T5 assumption that every Puzzle
cell is removable and that every incoming piece remains active until it locks.

- Historical only — Puzzle owned a second permanent material, the `A` anchor. Anchors were visible,
  deterministic, single-cell blockers: an active tetromino cannot overlap one,
  an anchor is never erased, and a completed non-bedrock row containing anchors
  clears its removable cells while retaining each anchor. Normal rows and
  Survival bedrock semantics remain unchanged.
- Puzzle victory is `removable-board-empty`: every ordinary tetromino cell in
  both the hidden buffer and visible board must be gone; retained anchors do
  not make an otherwise solved level fail. The state hash, replay, renderer,
  preview, and QA text expose this canonical distinction.
- A deterministic, level-seeded subset of Puzzle inputs is volatile. It plays
  and locks normally; from that lock it receives exactly 300 playing ticks
  (5 seconds). Paused, ready, terminal, and non-Puzzle states never consume
  its timer. At zero that locked tetromino disappears, emits `piece-expired`,
  and triggers one deterministic support-resolution pass: only complete
  tetromino components immediately above a newly opened cell may fall straight
  down as far as they can; a component that cannot make a normal
  whole-component fall, or is not reached from that new gap, remains still.
  The expiry neither undoes normal score/line/placed-piece credit nor creates a
  replacement piece.
- The archive keeps all fifteen entries. Every entry retains its previous legal
  setup history, stable seed, deep multi-color endgame mask, and continuous
  seven-bag generation. Anchors are sparse and level-seeded rather than a
  final-three-only rule: four earlier/mid-archive entries receive one anchor,
  the final three receive two, and the remaining entries receive none. Every
  anchor occupies a pre-existing empty visible cell; the overlay is the sole
  added board difficulty and never replaces an authored stack with a simplified
  tutorial shape. Anchored entries also participate in the volatile-input draw,
  so the two mechanics can combine without being mandatory in every puzzle.
- Volatile inputs use a distinct warm-signal material while falling and after
  locking; the ordinary seven-piece materials remain unchanged. Gameplay states
  show `限时块 / 落定后 5 秒` while the marked input is active, then an exact
  rounded-up seconds value while its locked timer remains. The live DEV state
  includes the active volatile records and anchor count so browser evidence can
  compare visible and canonical state.
- Gameplay audio uses a single Web Audio master gain and a compressor safety
  stage. Its default is 100%, with an explicit mute control and a
  persistent-in-session 0–100% volume slider beside Pause. Distinct, audible
  feedback covers start/pause, movement/rotation, hard drop/lock, line clears,
  volatile expiry, Survival pressure, and terminal outcomes; all audio stays
  outside core simulation and must be released on unmount.
- Hard drop is a short paired sine landing thump, not a triangle, square, or
  sawtooth sweep: it must read as physical weight without an electrical buzz.
- The game header keeps three direct controls together: audio, `重新开始`, and
  Pause. Clicking `重新开始` pauses a live run and opens a confirmation sheet;
  Enter confirms its primary action and Escape/cancel restores the prior paused or
  playing state. The Pause sheet itself offers only continue and exit. `R` remains
  the keyboard mapping for an immediate deterministic restart in every
  playable/paused/terminal state; it clears held input and returns to the same
  selected mode or Puzzle level without changing the seed contract.

## T9 five-layer Survival opening and Puzzle archive surface

## T9 five-layer Survival opening and Puzzle archive surface

The user's 2026-07-19 direction supersedes T8's zero-bedrock opening, five-line
reward, 20-to-10-second Survival pressure, and the visually flat Puzzle library.

- Historical only — Survival began with exactly five full, unbreakable warm-mineral bedrock rows.
  Restart creates the same five-row opening; Classic and Puzzle begin with none.
- Survival pressure begins at 15 seconds and shortens by one second on each cumulative
  three-line boundary, to an eight-second floor:
  `max(8, 15 - floor(lines / 3))`. Pending-rise, safe lock/clear ordering, pause,
  restart, deterministic hashes, and top-overflow remain fail-closed.
- Crossing each three-line boundary resolves the ordinary clear, then any already
  pending rise, then removes one bottom bedrock row per crossed boundary when present.
  The timer resets under the new interval even when no bedrock can be removed.
- Survival gravity shares the existing fixed tick table but advances one table step per
  three cleared lines, capped at the existing fastest value. Classic remains on its
  ten-line progression and Puzzle remains at its accepted fixed 48-tick cadence.
- The home-facing plain-text `Tetris` identity is a clear primary heading, not a quiet
  utility label. It remains original editable text, never a copied logo or wordmark.
- Rebuild the Puzzle level selection as an original `解谜档案` surface: compact colored
  board tiles carry level number, name, completion state, and selection signal; the
  selected canonical board becomes a single strong preview and a clearly associated
  start action. Keep all fifteen levels enabled, every touch action at least 44 px,
  the exact 2:1 board data, keyboard focus, responsive portrait/landscape behavior,
  one game canvas, and reduced-motion support.
- Archive tiles carry no decorative status dot and no miniature board. The selected
  canonical board is the only Puzzle thumbnail on the selection surface.

## T8 Interface, Survival, and Records Contract

## T8 mode field, Puzzle library, Survival interval, and records

The user's latest 2026-07-18 direction supersedes the earlier rigid 1+2 mode surface,
small Puzzle return action, cropped Puzzle thumbnails, 40-to-10-second Survival
interval, and missing result leaderboard binding.

- Home is an original Tetris-shaped mode field: the three complete mode entrances land
  in a stepped composition, retain concise factual rules, and use a distinct four-cell
  motif. Puzzle uses a stable T tetromino icon and never tilts or rises on hover.
- The Puzzle library keeps all fifteen levels enabled, gives every desktop level its
  canonical colored endgame thumbnail, enlarges the selected board preview, and exposes
  an unmistakable 44 px or larger `返回模式` action. Library and home copy do not
  repeat `目标：清空棋盘`; the in-game objective statistic remains the active rule.
- Survival bedrock pressure starts at 20 seconds. Each five cumulative cleared lines
  removes one existing bottom bedrock row when present, resets pressure, and reduces
  the next interval by one second to a ten-second floor:
  `max(10, 20 - floor(lines / 5))`.
- The local result leaderboard remains mode-owned and fail-closed. Classic ranks and
  presents cleared lines as its primary record; Survival ranks and presents elapsed
  survival time in descending order. Score, lines, pieces, and timestamp are stable
  secondary tie-breaks only. Puzzle completion continues to use the separate campaign
  store.
- `index.html` owns a lightweight Tetris Loading screen. The four-cell loader is
  removed only after the React surface has painted and becomes static under
  `prefers-reduced-motion`.

## T7 timed Survival and restrained motion refinement

The user's 2026-07-18 review supersedes T6's fixed-speed Classic/Survival contract and
the five-lines-adds-bedrock rule. It also removes the short decorative phase bars on
the mode surface and action sheets, requires the rules to be visible and unambiguous,
and reopens motion only for small stateful feedback.

### Classic and shared falling speed

- Classic and Survival share one line-driven gravity table. Speed tier is
  `floor(clearedLines / 10)` and the exact ticks per automatic row are
  `48, 43, 38, 33, 28, 23, 18, 13, 10, 8, 6, 5, 4, 3`; the last value is the cap.
- Classic retains consecutive-clear combo scoring. It has no terminal line target and
  displays the current automatic fall cadence rather than a player-facing level.
- Puzzle remains at the fixed accepted 48-tick cadence so the fifteen authored
  challenge references and their event/hash evidence stay unchanged.

### Timed Survival pressure and five-line reward

- Survival starts with a 40-second bedrock interval. After every five cumulative
  cleared lines the interval decreases by exactly two seconds, down to a 10-second
  minimum: `max(10, 40 - 2 × floor(lines / 5))`.
- The timer advances only while canonical status is `playing`; pause, ready, game-over,
  and finished states do not consume it. When it reaches zero it becomes pending and
  stops accumulating. The pending row rises at the next safe lock/clear resolution,
  before the next piece spawns, so no active tetromino is teleported or overlapped.
- A timed rise shifts the remaining board upward and appends one full unbreakable
  bedrock row. Top overflow ends the run. Restart clears the timer, pending state, and
  all bedrock.
- Crossing each five-line threshold resolves the ordinary clear first, then any
  already-pending timed rise, then removes exactly one bottom bedrock row if present.
  Removing a row shifts the remaining board down and inserts one empty row at the top.
  The reward resets the timer to zero under the newly shortened interval; if no
  bedrock exists, the interval reduction and timer reset still apply.
- Survival visibly exposes current bedrock height and the next-rise countdown. A
  pending rise reads `待上升`; otherwise the countdown rounds up to complete seconds.
  State hashes and seeded replay include timer and pending pressure.

### Rules, line removal, and motion language

- Remove `.phase-seam` from the mode selector and the colored `action-sheet::before`
  bar. Structural borders remain only where they divide real regions or statistics.
- Home rules stay concise but complete: Classic states combo scoring and acceleration
  every ten lines; Survival states 40-second starting pressure, one-layer removal and
  two-second interval reduction every five lines, plus the ten-second floor; Puzzle
  states authored endgame and board-empty success.
- The game dock repeats only the immediate active rule and direct cadence/countdown
  values. It does not restore long marketing explanations or a generic level label.
- Motion uses three purposeful signatures: one staggered mode-card entrance, a small
  hover/focus tetromino gesture, and brief bedrock rise/removal feedback with countdown
  urgency. No decorative phase line, perpetual ambient loop, glow, confetti, particle
  field, or layout motion is allowed. `prefers-reduced-motion` removes transforms,
  pulses, and renderer feedback without changing timing or canonical state.
- The accepted palette, typography, layout skeleton, divided facet geometry, touch
  controls, countdown gate, and plain-text `Tetris` identity remain unchanged.

## T6 bedrock material refinement

The user's 2026-07-18 review reopens only the Survival bedrock material color. The
existing blue-grey bedrock is too close to the cool-blue tetromino materials and does
not read clearly enough as a permanent geological layer. Replace its four renderer
color tokens with one restrained warm rock-brown material:

- face start `#9C8B73`;
- face end `#76664F`;
- outer edge `#40372D`;
- inner signal edge `#CDBEAA`.

This low-saturation warm mineral set separates bedrock from all seven playable piece
materials while remaining compatible with the cool `雾昼矿物` page and deep navy
well. Both face endpoints must retain at least 3:1 contrast against the well. Bedrock
geometry, divided facets, seams, relief direction, behavior, height thresholds, and
all ordinary tetromino colors remain frozen.

## Status and authority

The user's 2026-07-18 rule review opens T6 only for the three gameplay identities.
Their subsequent request for a more creative separation, followed by the explicit
replacement of Race with Survival, supersedes both earlier T6 drafts:

The accepted T5 layout, typography, `雾昼矿物` palette, divided cohesive tetromino
facets, fifteen authored Puzzle endgames, 18-tick lock window, entry countdown,
responsive behavior, and accessibility remain frozen. T6 supersedes only the former
Classic level progression and the complete Race acceleration rule:

- Classic is fixed-speed chain-score survival: consecutive clearing pieces build a
  visible scoring chain and any non-clearing lock breaks it;
- Survival uses Classic's fixed gravity but raises one permanent unbreakable bedrock
  row from the floor for every five cumulative cleared lines;
- Puzzle uses the same fixed standard speed as Classic but changes the initial board
  and terminal objective to an authored board-clearing challenge.

The serialized `level` field remains pinned to `0` in Classic and Survival. Puzzle
retains its accepted invisible level-based score/event serialization only so all
thirty frozen public-command solution references keep their event digests and final
hashes; Puzzle gravity never reads it, the UI never displays it, and success still
depends only on the canonical board becoming empty. Removing this Puzzle evidence
compatibility requires a separately authorized reference migration.
Classic owns one deterministic `combo` counter. Survival and Puzzle keep it at `0`,
and non-Classic hashes remain stable by excluding that irrelevant field from their
canonical hash payload. The internal mode key remains `race` only for replay/storage
compatibility; every player-facing label is `生存`.

The 2026-07-17 T5 milestone was independently accepted at product source
`effb353c0a4d1bef26fa524ed38d3d3653f45eb8` with formal evidence
`c0832e43dc1cdd31c074066919c229d4a9fe5518`. The user's 2026-07-18 block review
reopens only the tetromino material presentation through bounded Slice K-R3; the
accepted gameplay, layout, typography, palette, copy, and responsive behavior remain
frozen.

The user's 2026-07-16 direction opens T5 and supersedes every conflicting T3/T4
product rule. The later Puzzle clarification in the same session also supersedes the
first T5 finite-queue draft:

- the T4 Mineral Shelf presentation is rejected and must be replaced, not patched;
- Race is endless accelerating play, not a 20-line target;
- Puzzle levels are all available, are not gated by displayed difficulty, and use the
  ordinary continuous falling-piece loop against harder authored clearing goals;
- a deterministic seed is allowed, but Puzzle must never become a short supplied-piece
  exercise or a single-reference-solution memorization task;
- outside games may inform only abstract mechanics such as downstacking or target
  clearing. T5 board layouts, names, copy, visual language, interaction structure,
  code, fixtures, and assets are original clean-room work;
- the reported one-piece Puzzle stall is a release blocker.

The user's 2026-07-17 visual review supersedes the first T5 frontend candidate:

- the player-facing name is the plain-text word `Tetris`;
- `青流方阵`, its custom mark, and the complete Aqua Blueprint presentation are
  rejected rather than eligible for incremental polish;
- the replacement must remain light cyan/light-blue and high contrast, but must read as
  a direct game interface rather than a marketing page or engineering console;
- plain-text naming does not authorize copying a commercial logo, multicolor wordmark,
  proprietary font, existing product layout, or other trade dress.

The user's later typography and panel review authorizes an original open-source Google
Fonts pairing and rejects broken statistic dividers. This does not authorize a logo
font or copied wordmark: `Tetris` remains editable plain text, while typography and
numeric rhythm become part of the surrounding original interface.

The user's subsequent board review rejects the remaining isolated-tile appearance.
Four-cell tetrominoes must read as cohesive dimensional forms rather than four small
plates with four complete outlines. The permitted depth is a restrained machined
mineral relief; this supersedes the earlier flat-cell edge rule but does not restore
plastic gloss, glass, glow, detached shadow, or candy bevels.

The user's 2026-07-18 clarification supersedes only the earlier instruction to make
internal seams nearly disappear. Cohesion belongs to the tetromino's connected outer
silhouette, not to an undivided flat face: all four unit cells remain clearly legible
inside that silhouette. Shared boundaries use engraved two-tone grooves over the same
material base, while a consistent top-left light direction gives each unit a shallow
raised face. A board-well gap between same-piece cells, four detached tile shadows, or
four independent outer boxes is still rejected.

The user's later 2026-07-18 refinement treats the current composition as substantially
complete and opens no page redesign. It authorizes only two controlled changes:

- shorten the shared grounded lock window from 30 to exactly 18 fixed ticks (about
  300 ms at 60 Hz), while preserving the existing movement/rotation reset semantics
  and reset cap;
- brighten the coordinated page, surface, state, and piece palette into the exact
  `雾昼矿物` tokens below. Technology must come from the existing measured grid,
  semantic dividers, typographic rhythm, focus states, and restrained phase motion,
  not from a dark theme, neon, decorative telemetry, or new interface machinery.

The subsequent start-flow refinement adds one functional layer without reopening the
page design. After a player activates Classic or Survival `开始`, or activates `开始` for a
selected Puzzle level, the game shell appears with a centered `3`, `2`, `1` countdown.
Each number occupies exactly one second. The runtime remains in its deterministic
`ready` state throughout the countdown: gravity, elapsed ticks, audio events, keyboard
commands, and touch commands cannot start or mutate the run early. Immediately after
`1`, the overlay is removed, input is enabled, the public runtime start path is called
once, and board focus is restored. Pause/resume, restart, and replay do not create a
second entry countdown. Reduced-motion removes digit transform/opacity animation but
does not shorten or skip the three-second preparation window.

The user's later 2026-07-17 review also rejects the complete second frontend
presentation at `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`. It is not a visual baseline
that can be accepted through local polish. The new authority is light neo-tech
minimal: technology is expressed through exact proportions, fine edge light, clear
state changes, and one restrained motion signature rather than decorative machinery.
The accepted lifecycle, accessibility, rule binding, and detached
`structuredClone` QA snapshot fix in `c9135f3` remain behavioral requirements and
must not regress. Independent review also found 8–11 px mobile statistics and legacy
`路线` copy; both must disappear in the replacement rather than be patched in the
rejected presentation.

The user's later 2026-07-17 direction extends the accepted neo-tech foundation before
release:

- the player-facing `马拉松` name becomes `经典`; the internal deterministic mode key
  remains `marathon` only for compatibility and is never player-facing;
- the seven pieces use an original multi-hue mapping rather than seven near-equal
  cyan/blue fills or the standard commercial piece-color mapping;
- Puzzle contains exactly fifteen all-enabled original levels for this milestone;
- every authored starting board is visibly multi-colored while its color assignment
  stays independent from gameplay randomization and never changes collision geometry;
- the nine new levels strengthen the existing topology and multi-route proof instead
  of duplicating or recoloring the first six.

The user's subsequent review of frontend candidate
`248ca89551ce1293abe88e651c9953e132c816be` rejects its visual finish while preserving
its behavior and responsive information architecture. The page must feel more premium,
and the current muted, double-outlined rounded minos are specifically rejected as ugly.
The latest authority is therefore:

- every piece color is bright, saturated, and clearly separated from the other six;
- the rendering language is a precision luminous slab, not a candy, ceramic, mineral,
  jelly, or plastic tile;
- higher perceived quality comes from hierarchy, controlled translucent depth, one
  spectral cyan-to-blue rail, and reduced component repetition, not dark neon, a
  marketing hero, decorative English telemetry, or copied trade dress;
- all accepted rules, fifteen-level bindings, selectors, accessibility, responsive
  geometry, and lifecycle proofs from `248ca89` remain mandatory.

The user's final color clarification explicitly removes the earlier cyan/green-only
page limitation. The premium page theme is `spectral glass light`: a cool near-white
base with disciplined cyan, cobalt, violet, and small coral state accents. It is not a
dark neon theme and not an unstructured rainbow.

- Base page: cool ice `#F5F7FF`; primary ink `#081426`; muted text `#52627A`;
  cool hairline `#B9CBE4`; translucent surfaces remain near-white.
- State accents: cyan `#00BFC8`, cobalt `#4767F5`, violet `#8A5CF6`, and coral
  `#FF5B7C`. Classic uses cyan-to-cobalt, Race uses cobalt-to-violet, and Puzzle uses
  violet with coral only as a small selection signal.
- The single signature rail is `linear-gradient(90deg, #00BFC8, #4767F5, #8A5CF6)`.
  CTA and focus treatments may use adjacent stops from this rail; they do not mix all
  four accents on every component.
- The background may use at most three broad, very-low-opacity cyan, violet, and coral
  light fields. It still has no repeating page grid, scanline, noise texture, or
  decorative technical coordinates.
- Gameplay piece colors remain the separate bright luminous-spectrum mapping below;
  UI state color never remaps a tetromino material.

The user's latest 2026-07-17 review rejects the resulting local Slice I checkpoint
`e552b3c86e59b801f6d69045a94211e3f1c97e34`. It remains an unpushed historical
checkpoint and is not eligible for QA, evidence, changelog integration, or push. The
following authority supersedes every conflicting bright-spectral, glass, salted-color,
and verbose-copy rule below:

- the complete page and piece palette becomes one natural, mutually compatible deep
  `暮海矿物` spectrum; darker color must create tension through controlled value and
  proportion, not neon glow, black-on-rainbow contrast, or unrelated accent colors;
- minos become matte anodized plates with restrained tonal variation. The bright
  plastic/candy fills, blurred active aura, glass blur, colored ambient light fields,
  gradient CTA fills, and luminous locked-cell treatment are rejected;
- every Puzzle starting board is an authored endgame generated from a frozen legal
  tetromino stacking history. Per-cell salted recoloring and randomly excavated masks
  are forbidden; every initial cell inherits the type and material of the exact source
  tetromino that formed it;
- all fifteen masks, state hashes, and thirty solution references are regenerated.
  Existing IDs, order, and gameplay seven-bag seeds stay stable, but the earlier mask
  and route compatibility promise is explicitly superseded;
- visible copy is reduced to names, controls, score/statistics, and the immediate
  objective. Repeated explanations of ordinary falling-block play are removed while
  full ARIA labels remain available to assistive technology.

The deterministic architecture integrated at
`4c8582854088695ebac90467842dc2bc0cef3a20` remains the rule baseline. The rejected
T4 candidate `dd7e31ea3547c18a797b2308f04161310d1412ce` remains in history but is not
an accepted visual baseline. Its uncommitted follow-up is preserved on local branch
`codex/tetris-t4-rejected-preservation` at
`1362c664629b2a83f0659f836259b84c21750fee`.

T3/T4 screenshots, manifests, reference files, and workstream logs are historical
evidence only. T5 uses new paths and does not rewrite those artifacts.

## Product and architecture invariants

- This is a clean-room deterministic falling-block game for desktop and mobile.
- Delivery remains a browser HTML webpage built by Vite. T5 does not add a native-app
  wrapper, PWA install surface, or packaged application target.
- React owns screen composition and lifecycle. PixiJS owns the board, pieces, preview,
  effects, and frame rendering.
- Gameplay uses one Pixi canvas and no DOM cell grid.
- Core state stays serializable and independent from React, PixiJS, DOM, audio,
  storage, browser timing, and viewport geometry.
- Every DEV/browser diagnostic snapshot must be detached from canonical runtime state.
  Mutating any object returned by a QA collector must not change the live run; no
  collector may expose a writable state reference or state-replacement path.
- There is no Hold mechanic.
- Grounded pieces lock after exactly 18 fixed ticks unless an already-supported legal
  move or rotation resets the timer within the unchanged reset cap. The same shortened
  window applies to Classic, Survival, and Puzzle and remains deterministic.
- Initial entry into a run has exactly one `3`, `2`, `1` countdown. While it is visible,
  the canonical state remains `ready`, every gameplay input is gated, and the runtime
  starts exactly once only after the final second.
- Keyboard and touch expose left, right, clockwise rotation, soft drop, hard drop,
  pause/resume, restart, and an explicit route back to the mode home.
- Restart, mode exit, and unmount must not multiply listeners, tickers, audio nodes, or
  canvases.

## T6 mode rules

### Classic (`marathon` internal key)

- The only player-facing mode name is `经典`; `马拉松` is removed from visible copy
  and accessibility labels.
- Classic is open-ended fixed-speed chain-score survival.
- Gravity is exactly 48 fixed ticks per automatic cell for the complete run. Clearing
  lines and placing pieces never accelerate it.
- Line clears award the fixed base table `40 / 100 / 300 / 1200` for one through four
  simultaneous lines. The first clearing piece starts chain `1`; every immediately
  consecutive clearing piece increases it by one and adds `50 × (chain - 1)` bonus
  points. A locked piece that clears no line resets the chain to `0`. There is no level
  multiplier and no chain bonus in Survival or Puzzle.
- Player-facing statistics are score, cleared lines, and current chain (`连消`).
  `等级` is not displayed or described.
- The run ends only on top-out or explicit player exit.

### Survival (`race` internal key)

Survival is fixed-speed pressure endurance. It shares Classic's 48-tick gravity but
replaces Classic's chain scoring with a board-changing floor hazard.

- The only player-facing name is `生存`; `竞速` and speed-tier copy are removed.
- There is no line target, speed curve, or successful terminal state.
- Seven-bag generation, movement, clearing, base line score, and ordinary top-out
  match normal play. Survival does not use Classic's chain counter or chain bonus.
- For every five cumulative cleared lines, exactly one solid bedrock row rises from
  the bottom. The threshold is cumulative: crossing multiple five-line boundaries in
  one resolution raises the corresponding number of rows.
- A rise occurs after the triggering normal lines have been removed and scored. Each
  rise shifts the entire remaining canonical board upward by one row and appends one
  full bedrock row at the bottom.
- Bedrock is a distinct canonical board-cell material. It blocks movement and locking,
  is visible as one coherent mineral stratum with internal units, and is never returned
  by full-row detection or removed by line clearing.
- If a rise would discard any occupied cell from the canonical top row, the run ends
  immediately as game over before spawning the next piece.
- Player-facing statistics are score, cleared lines, and current bedrock height.
- The run ends only on bedrock overflow, ordinary top-out, or explicit exit.
- Survival leaderboard rows, if retained, are endurance results rather than
  completion-time results.
- All copy and tests referring to “20 行”, “速度档”, Race acceleration, or Race
  completion are removed or migrated.

### Puzzle library

Puzzle is a library of authored board-clearing challenges, not an unlock ladder and
not a finite input-sequence exercise. It changes the starting board and win condition;
movement, rotation, fixed 48-tick gravity, locking, base scoring, line resolution, and
piece generation otherwise follow Classic play.

- All fifteen T5 levels are selectable from first launch. No level row is disabled or
  hidden behind prior completion.
- Numeric difficulty is removed from production definitions and UI. It does not
  control ordering or availability. Completion persistence is informational only.
- The goal remains canonical board empty after ordinary line resolution, including
  the hidden buffer.
- Every level has an empty hidden buffer, a non-empty original 20 × 10 visible board,
  and a stable level seed. That seed drives the shared deterministic seven-bag
  randomizer; the bag replenishes for as long as play continues.
- There is no authored finite queue, piece budget, remaining-piece counter, or
  `failed-budget` outcome. An unsolved run continues until canonical success, top-out,
  restart, or explicit exit.
- Puzzle uses Classic fixed gravity, grounded lock delay, entry delay, soft drop,
  hard drop, and SRS rotation, but not Classic's chain counter or chain bonus. Its
  invisible legacy score/event serialization remains frozen solely for reference
  compatibility. A no-clear lock and a clear both continue through the ordinary
  deterministic spawn path.
- The initial stack occupies 8–12 visible rows and is produced by 16–22 frozen setup
  pieces. It contains all seven piece types, at least seven distinct non-empty row
  shapes, four row-density classes, covered cavities in at least five columns, and at
  least eight buried holes. Repeated floor templates, three or more consecutive rows
  exposing one straight well, and an immediately obvious opening are forbidden.
- Production validation samples the first 84 generated pieces from each level seed and
  proves twelve consecutive complete seven-bags. This is a validation horizon, not a
  gameplay limit.
- Each of the fifteen levels has at least two frozen successful public-command replays for
  the same level seed. Both must clear the canonical board without state injection,
  and their semantic placement streams must differ at five or more locked-piece
  indices by final occupied cell set, landing column, and/or effective rotation. At
  least two intermediate canonical board hashes must diverge before success; a
  different command digest alone is not route diversity.
- Each accepted route uses 30–42 locked pieces, all seven piece types, at least seven
  landing columns, at least eight effective rotations, at least five non-clearing setup
  locks, and at least four separated line-resolution phases. Paired routes differ at
  five or more semantic placement indices, diverge no later than the fifth lock, and
  produce different canonical board hashes at two or more shared indices. These
  metrics establish nontrivial play; neither replay is presented as a unique or
  optimal answer.
- Authoring/verifier search stops a route after 70 locks as a bounded safety guard. The
  guard is not a production queue, gameplay limit, or player failure condition.
- The engine checks canonical-board-empty success after ordinary line resolution and
  otherwise applies normal top-out rules. Malformed initial definitions fail validation
  rather than creating a special player-facing Puzzle failure.
- References initialize through `createInitialState(level.seed, "puzzle", level.id)`
  and use public `dispatch` only. No verifier, runtime QA hook, or browser setup may
  construct, replace, or mutate canonical state.
- Every definition owns a separate `setup.seed` and an explicit ordered
  `setup.placements` list of `{ type, rotation, x }`. The declared type must equal the
  next piece drawn from that setup seed. Landing `y` is never authored or injected; it
  is derived by legal gravity and hard drop from the empty canonical board.
- Product meaning: each level is a frozen mid-game snapshot from a difficult seeded
  normal-play trace. The seed supplies the legal bag order and the signed placement
  history supplies the play already performed; neither a seed alone nor a fabricated
  occupancy mask is treated as the authored endgame.
- Setup replay uses ordinary rotation, horizontal movement, and hard drop. It must
  produce no line clear, top-out, hidden-buffer occupancy, overlap, or invalid spawn.
  Every source owner therefore remains exactly four cells whose normalized geometry
  equals the canonical rotation of its declared tetromino. Two source pieces of the
  same type may not share an orthogonal edge in the final setup, so every visible
  same-color connected component is one recognizable legal tetromino.
- `boardRows` is derived byte-for-byte from the frozen setup history. It is not a
  second handwritten authority. `BOARD_COLOR_SALT`, per-cell color draws, runtime mask
  generation, and production random excavation are removed. The separate gameplay
  seed still starts the ordinary continuously replenishing seven-bag and is never
  consumed by setup construction.
- Tests and the reference builder replay every setup from
  `createInitialState(level.setup.seed, "marathon")` through public `dispatch` only,
  then require the resulting board to match the production Puzzle board exactly. The
  pure production board constructor may reuse canonical shapes and collision helpers
  but must not import the engine or create a dependency cycle.
- The fifteen existing IDs, order, names, and gameplay seeds remain stable so the UI
  and informational completion records remain compatible. The old occupancy masks,
  setup colors, route streams, state hashes, reference SHA, and browser evidence are
  invalidated and regenerated under this authority.
- Topology validation normalizes every occupied piece character to one occupancy bit
  before counting distinct rows, densities, holes, or cavities. Color variation may
  never masquerade as geometric difficulty.
- All fifteen normalized masks are unique and every pair differs in at least 20 of the
  200 visible cells. The signed-in histories are authored and visually reviewed as
  distinct endgame motifs; the authoring/search helper may screen candidates and find
  solutions, but production never generates a board at runtime. A copied mask,
  recolored duplicate, random hole field, or one-obvious-answer opener is rejected.

## T5 `雾昼矿物` precise-light visual direction

The accepted visual target is the existing precise interface re-toned into one bright,
cool mineral daylight spectrum. The page and panels become light; the board well stays
deep so piece geometry remains dominant. This replaces the dark-shell dependency
without changing composition or returning to Aqua Blueprint, rounded ceramic, bright
spectral glass, or plastic luminous slabs. The only player-facing brand is `Tetris`
set as ordinary text in the product type system.

- Technology comes from measured spacing, crisp structural planes, semantic divider
  logic, restrained mineral state colors, functional feedback, and disciplined
  composition. It does not come
  from CAD, dashboards, decorative telemetry, generic neon futurism, or unrelated
  rainbow accents.
- Remove the custom brand glyph, `青流方阵`, `AQUA ROUTE`, coordinates, route lines,
  blueprint grids and ticks, diagonal bands, clipped corners, decorative numbering,
  all-caps engineering labels, oversized slogans, and the rejected stepped mode bands.
- Also forbid scanlines, repeating grids, decorative particles, toy/glass candy or
  plastic blocks, marketing heroes, settings-row layouts, floating-card piles,
  backdrop blur, colored ambient blobs, and technical English used only as decoration.
- Do not imitate an official Tetris logo, multicolor wordmark, commercial font,
  existing product composition, commercial level screen, or other trade dress.
- Per the user's earlier direction, `index.html` remains unchanged as the required
  Vite entry document; it already provides the browser HTML shell and `Tetris` title.
- The only ornamental motion signature is a 2 px teal-to-blue-to-violet `phase seam`: about
  72 px while idle, extending once on selection or focus over 220 ms. It never loops,
  and reduced motion switches state immediately.

### Palette

| Role | Token |
| --- | --- |
| Page | `#DCE7F2` |
| Main / raised / selected surface | `#F7FAFD` / `#EAF1F7` / `#DCE8F2` |
| Board well | `#0B1726` |
| Primary / secondary text | `#14243A` / `#52677F` |
| Line / structural edge | `#B5C5D5` / `#879DB3` |
| Classic / Survival / Puzzle / selection | `#357F78` / `#526EB0` / `#80639D` / `#A75E71` |
| Action / hover / focus / action ink | `#315F96` / `#3D70A8` / `#245E9C` / `#F7FAFD` |
| Success / failure | `#3F7F5D` / `#A64E61` |

The only page gradient is the signature
`linear-gradient(90deg, #357F78, #526EB0, #80639D)` phase seam. Buttons use solid
colors. Primary text on the main surface measures 14.93:1, secondary text 5.56:1,
and action ink on `#315F96` measures 6.25:1. The `#B5C5D5` divider is only a
non-essential separator; selection, focus, and error states always add a stronger or
non-color cue.

### Typography, surfaces, and piece language

- Load the open-source Google Fonts pairing `Space Grotesk` + `Noto Sans SC` from CSS,
  not `index.html`. The frozen CSS v2 request is
  `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap`.
  `Space Grotesk` owns Latin text, the plain `Tetris` title, `Next`, and tabular-style
  numerals; `Noto Sans SC` owns Chinese glyphs. Both fall back through Segoe UI /
  Microsoft YaHei UI / PingFang SC / system sans so a blocked font request remains
  readable, does not create blank text, and preserves the responsive geometry.
- The page uses solid light cool structural planes around one deep board well. It has
  no colored ambient field,
  `backdrop-filter`, repeating grid, measurement mark, grain, diagonal stripe, route
  diagram, gradient CTA, or glow shadow.
- Only the main page/game container may use the restrained `0 18px 44px
  rgba(31, 59, 86, .14)` depth. Internal regions rely on one-pixel structural edges,
  spacing, and tone rather than repeated shadows.
- Primary surfaces use 12–18 px radii. Buttons, action sheets, the board, and cells
  have no clipped corners; nested large pill/card stacks are forbidden.
- Every tetromino uses one joined `matte machined mineral` base: the existing
  135-degree two-stop field remains within about 8% lightness difference and
  orthogonally adjacent same-material cells bridge the board-well gap. The connected
  component therefore owns one uninterrupted outer silhouette rather than four
  detached plates. Different materials retain their narrow well-colored separation so
  dense残局 remain readable.
- Every shared unit boundary remains visibly divided by one engraved two-tone seam.
  The material-edge groove is 0.85–1.35 px at 58–76% alpha; a 0.45–0.8 px lower/right
  lip uses `innerEdge` at 22–34% alpha. Seams cover the complete shared edge exactly
  once, never open through to the board well, and never become four complete cell
  outlines.
- Spacing establishes the hierarchy: separate material components retain a board-well
  channel at least 1.6 times the perceived width of an internal engraved seam. The
  external channel is therefore read before the finer internal division. Active and
  Next pieces use their exact canonical four-cell component; authored Puzzle source
  pieces already remain separate same-material components by contract.
- Depth uses one consistent top-left light direction at two scales. The joined outer
  perimeter uses a 1–1.6 px light top/left and dark bottom/right bevel. Each unit face
  adds an inset 1–2.25 px light top/left and dark bottom/right chamfer over the joined
  base, so cells are readable as shallow raised facets within one piece. There is no
  white specular bar, thick lower lip, emboss texture, glow, blur, glass, detached
  shadow, universal black stroke, or plastic/candy gloss.
- Active and Next pieces group their exact four canonical cells. Active replaces the
  locked outer contour with one higher-contrast signal contour; it never adds a second
  perimeter. Locked-board grouping joins only orthogonally adjacent cells with the
  same material. Authored Puzzle setup guarantees those initial same-material
  components are exact source tetrominoes; later line clears may naturally split a
  contour and same-material contacts may naturally merge it without changing Core.
- Ghost uses zero fill and one complete 1 px signal outline around the whole active
  tetromino perimeter at about 45% alpha. Its shared cell boundaries remain as one
  lower-alpha guide per seam, but they do not close into four independent boxes. The
  lock response remains an 80–100 ms low-alpha face change and never draws a second
  outer border.
- Board, Next, canonical silhouettes, active cells, and locked cells use the same
  exact material mapping and cohesive component principle. Board and Next share the
  same Pixi group primitive. The silhouette keeps at most one path per piece type,
  substantially closes the old per-cell gaps, and uses only a hairline seam so the
  tetromino geometry reads before the individual grid units.
- The coordinated mineral mapping below deliberately differs from the standard
  commercial piece-color assignment. Garnet, sea-pine, ochre, storm blue, moss,
  rock violet, and lake blue share one restrained value/chroma envelope; no one piece
  becomes a fluorescent or candy accent.

| Piece | Fill start | Fill end | Edge | Inner edge |
| --- | --- | --- | --- | --- |
| I | `#C85A72` | `#B14F65` | `#713443` | `#E69AAA` |
| O | `#47AAA1` | `#3C918A` | `#245B57` | `#91D4CF` |
| T | `#C58E4A` | `#AD783D` | `#694824` | `#E8BD83` |
| S | `#647BC0` | `#576DAE` | `#354675` | `#A9B7E3` |
| Z | `#83AA57` | `#6F914A` | `#425A2B` | `#BCD79A` |
| J | `#9A65B1` | `#87579E` | `#553663` | `#CFA9DC` |
| L | `#4D91AD` | `#407D99` | `#295567` | `#95C8D9` |
- Every fill endpoint has at least 3:1 non-text contrast against the `#0B1726` board
  well; the measured range is 3.34:1–6.74:1.
  Active/locked distinction cannot depend
  on glow or color alone.
- Board and Next reuse the exact drawing primitive. Page entrance is 180 ms over at
  most 4 px; line clear is one local 120–160 ms tonal sweep. No ornamental animation
  loops, and reduced motion removes positional and sweep transitions immediately.

## Information architecture

### Mode home

- The webpage opens on a dedicated mode home with no gameplay board.
- The mode home and Puzzle library do not mount a runtime or canvas. Entering a run
  creates one runtime/canvas; returning home destroys both before showing the home.
- A compact `Tetris` header and one `选择模式` heading lead directly to `经典`, Survival,
  and Puzzle. There is no poetic or marketing hero.
- The three entrances share one continuous 1+2 mode surface: Classic occupies the
  complete first row, with Survival and Puzzle as two independent complete buttons in the
  second row. One-pixel dividers and selected-state tone establish grouping; they are
  not three floating cards or a settings list.
- Every mode entrance keeps its complete action label and rounded arrow control inside
  the shared surface at all required viewports. In particular, 844 × 390 DPR3 must
  satisfy `scrollWidth <= clientWidth` for each mode button and action cluster; the
  right edge may not be hidden by the surface's clipping boundary.
- The standalone selected-mode preview pane and its explanatory copy are removed. A
  small original four-cell signal may live inside a mode entrance, uses the same
  matte-plate language, and never becomes a logo or looping hero.
- Visible home copy is frozen to `Tetris`, one `选择模式`, the three Chinese mode
  names, and these terse factual lines: Classic `分数 · 消行 · 连消`, Survival
  `每 5 行 · 基岩上升`, and Puzzle `15 关残局 · 清空棋盘`, plus `开始` / `选关`.
  `当前选择`, `三种玩法`, `随时开始，也可随时退出。`, `键盘与触控均可操作`,
  full-sentence rule explanations, decorative numbering, and redundant brand labels
  are removed from the visible home.
- Mode selection is not a small rail beside the board.

### Puzzle library

- Every level entry is enabled and shows only its ordinal, name, and optional
  completion status.
- It does not show numeric difficulty or lock state.
- The library is one continuous surface with fifteen complete enabled entries and one
  selected-level detail/start region. Desktop and 844 × 390 use a 3 × 5 matrix plus
  the existing right-side detail. At 360/390 widths the level matrix uses two columns
  and the selected detail stays in normal flow outside the level items. Library-page
  scrolling is allowed on narrow portrait; gameplay page scrolling is not. No layout
  is a pile of floating cards, pagination, or a difficulty/unlock ladder.
- If a level silhouette is shown, it is read-only derived from the existing canonical
  initial board as one SVG with at most one bounded path per piece type. It is not a
  DOM gameplay grid and must not duplicate or modify Puzzle definitions.
- No sticky or fixed selection panel may cover a level row. Visible library copy is
  only `Tetris`, `解谜`, back, ordinals, level names/completion, one selected-board
  silhouette, `目标  清空棋盘`, and `开始`.
- Remove the repeated row-level `清空棋盘`, the library explanation paragraph,
  `当前选择`, visible `起始棋盘`, `连续七袋方块 · 不限定唯一解法`, and the separate
  `方块` / `规则` definition rows. Full accessible labels may still describe controls
  and state without duplicating that prose visually.
- Starting a level must keep the visible selection, canonical `puzzleId`, level seed,
  active piece, and Next preview aligned.

### Game screen

- Top actions provide mode-home exit, current mode, and pause.
- Desktop uses one coherent game surface: the board is the dominant element and one
  flat 200–240 px information dock contains Next, statistics, and compact keyboard
  controls. It does not return to detached side cards.
- Mobile uses a compact information band above the board and a five-action deck below.
- The five actions belong to one integrated control deck with shared edges and clear
  pressed/focus state, not five floating pills or tiles.
- The visible focus ring maps to the board frame rather than outlining the full-page
  Pixi canvas. The canvas may still cover the complete arena so it can render both the
  board and Next against DOM geometry anchors.
- Pixi owns both the dark Next well and its exact canonical tetromino. The DOM
  `next-slot` is a transparent geometry anchor only; an opaque compact information
  band must sit below that canvas layer so it cannot mask the preview on mobile.
- Pause, exit confirmation, success, and failure use accessible light action sheets
  with buttons at least 44 × 44 CSS px.
- Survival shows score, lines, and bedrock height. Puzzle shows level name, cleared lines,
  placed pieces, the board-empty goal, and one Next item. It never shows a finite
  remaining-piece value or a suggested solution.
- Statistic borders are role-based, never inferred from generic odd/even item rules.
  On the desktop Puzzle dock, the level and objective span both columns and the
  placed/cleared pair shares the middle row. Every internal separator is continuous;
  a half-width dangling line, stray vertical segment, or empty fake quadrant is a
  rendering defect. Compact grids may rearrange the same values only when their
  complete row/column boundaries remain visually coherent. Every statistic article
  exposes an explicit semantic role, and all grid spans/dividers select those roles;
  `nth-child`, `nth-of-type`, `odd`, and `even` are forbidden for statistic geometry.
- Remove visible `本局数据`, long `.mode-rule` explanations, and explanatory pause or
  exit paragraphs. Result copy is limited to `棋盘已清空` plus `X 方块 · Y 消行`,
  `堆叠到顶`, or `生存结束` plus the necessary statistics. Mode/level name, back,
  pause, score/statistics, objective, Next, keyboard map, and the five touch labels
  remain visible.

## Responsive and accessibility contract

- All visible buttons are at least 44 × 44 CSS px; primary mobile controls target
  48 px or larger.
- Canvas focus has a visible 3 px high-contrast focus ring.
- Dialog-like sheets expose a readable title, correct role/label, intentional initial
  focus, Escape/cancel behavior, and focus restoration.
- Mode and state are never communicated by color alone.
- `prefers-reduced-motion` is honored initially and when the media query changes.
  Runtime changes use `GameRuntime.setReducedMotion` and do not rebuild or replace the
  current canonical game state.
- Required viewports: 1440 × 900, 2048 × 1152, 390 × 844 DPR3, 844 × 390 DPR3, and
  360 × 800.
- Mobile visible body copy and touch labels are at least 12 px, statistic labels at
  least 14 px, and statistic values at least 18 px.
- No horizontal overflow, clipped essential text, overlapping modules, or accidental
  gameplay page scroll.
- At 360 × 800, Puzzle statistics show the complete visible goal `清空棋盘`; it may not
  be ellipsized, clipped, or made to fit by shrinking the value below 18 px. A narrow
  override may redistribute the two statistic columns while preserving their shared
  surface and the 390 × 844 / 844 × 390 layouts.
- Generated JSON and checksum evidence uses explicit LF bytes before hashing so every
  entry in `SHA256SUMS.txt` matches the corresponding raw Git blob on Windows and
  non-Windows checkouts.

## Implementation ownership and sequence

1. Coordinator freezes this contract and exact path boundaries.
2. Puzzle Slice J replaces all fifteen boards with frozen legal zero-clear setup
   histories, regenerates thirty routes/references, and changes no frontend path.
3. If the signed references invalidate an internal browser-QA replay, Slice J-R may
   replace only that replay's frozen placement fixture and its direct test. This is a
   QA-fixture migration: it does not change Puzzle rules, runtime timing, or product
   behavior, and the fixture remains public-command-only.
4. Independent read-only Core/runtime QA verifies the exact Slice J candidate range.
5. Frontend Slice K owns the `暮海矿物` theme, matte renderer, reduced visible copy,
   and related presentation tests. It changes no Core definition or reference.
6. Coordinator runs one combined final typecheck, full suite, build, and browser pass
   after the last product change.
7. Independent read-only functional and visual QA verify the exact combined candidate
   before evidence, changelog integration, or push.

Historical T3/T4 evidence stays unchanged. New reference and browser evidence lives
only under `docs/workstreams/tetris-t5-*` and `docs/qa/evidence/tetris-t5`.

## Acceptance gates

- `npm.cmd run typecheck`;
- complete Vitest suite;
- production build;
- deterministic Survival replay proving the fifth cleared line raises one permanent
  bedrock row, later thresholds accumulate, bedrock never clears, and overflow ends
  the run;
- all fifteen Puzzle levels, two distinct successful public-command routes per level,
  restart/hash determinism, normal automatic gravity, grounded locking, continuous
  seven-bag replenishment, consecutive multi-piece play, and exact regeneration from
  legal zero-clear setup histories;
- each setup replay uses public commands from an empty canonical board, derives every
  landing row by hard drop, preserves each source owner as four canonical cells, and
  proves initial cell type/color equals source tetromino type with no random per-cell
  recoloring;
- first-84-piece seven-bag integrity for every level seed with no queue exhaustion or
  budget terminal;
- UI-driven evidence selects modes and levels through visible controls;
- plain-text `Tetris` is the only visible brand; `青流方阵`, `AQUA ROUTE`, blueprint
  coordinates, technical column labels, grids, ticks, scanlines, clipped corners,
  route decoration, stepped bands, ceramic/jelly cells, and toy visuals are absent;
- all three mode entries are visible without scroll at 1440 × 900 and 390 × 844;
- the home is one coherent 1+2 mode surface and the `phase seam` is its only
  ornamental motion;
- the mobile Puzzle selector has no overlay covering any level content;
- coordinated deep mineral matte minos, clearly divided raised unit facets, zero-fill
  whole-silhouette Ghost with internal guides, and Next share one drawing primitive;
  rejected detached tiles, bright plastic, blurred aura, double outer outline,
  toy/candy, cut-corner, ceramic, highlight-bar, thick-lip, and bracket-ghost styles
  are absent;
- the page uses the exact `雾昼矿物` solid tokens, no backdrop blur, ambient color
  blobs, gradient CTA, glow shadow, or page gradient outside the single phase seam;
- visible home/library/game copy matches the frozen minimal lists above. Repeated
  gameplay explanations and the banned strings `当前选择`, `三种玩法`,
  `随时开始，也可随时退出。`, `键盘与触控均可操作`, `本局数据`, and the long
  library/rule descriptions are absent;
- player-facing copy contains no legacy `路线`; use `解法`, `本局`, or `对局` only when
  that meaning is actually needed;
- computed mobile body, statistic, and touch-label sizes are recorded by browser
  evidence rather than inferred only from CSS declarations;
- the complete 360 × 800 Puzzle goal text `清空棋盘` is visibly present and its rendered value
  has `scrollWidth <= clientWidth` without lowering the 18 px statistic-value floor;
- at least one Puzzle scenario after three consecutive locks, with visible/canonical
  level, active piece, placed-piece count, and Next preview aligned;
- mode-home → game → mode-home → game proof with no canvas/ticker/listener leaks;
- direct regression proof that nested mutation of every DEV QA state snapshot leaves
  canonical runtime state unchanged;
- one gameplay canvas, zero gameplay DOM cells, zero console/page errors;
- keyboard, touch, pause/resume, restart, explicit exit, failure, success, and reduced
  motion verified at required viewports.

A nonblank screenshot, internal QA state injection, mock terminal state, copied level
layout, or copied frontend treatment is not acceptance evidence.
