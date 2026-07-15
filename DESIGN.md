# Tetris — T5 Aqua Blueprint Production Contract

## Status and authority

The user's 2026-07-16 direction opens T5 and supersedes every conflicting T3/T4
product rule:

- the T4 Mineral Shelf presentation is rejected and must be replaced, not patched;
- Race is endless accelerating play, not a 20-line target;
- Puzzle levels are all available, are not gated by displayed difficulty, and must be
  materially longer and less obvious;
- the reported one-piece Puzzle stall is a release blocker.

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
- React owns screen composition and lifecycle. PixiJS owns the board, pieces, preview,
  effects, and frame rendering.
- Gameplay uses one Pixi canvas and no DOM cell grid.
- Core state stays serializable and independent from React, PixiJS, DOM, audio,
  storage, browser timing, and viewport geometry.
- There is no Hold mechanic.
- Keyboard and touch expose left, right, clockwise rotation, soft drop, hard drop,
  pause/resume, restart, and an explicit route back to the mode home.
- Restart, mode exit, and unmount must not multiply listeners, tickers, audio nodes, or
  canvases.

## T5 mode rules

### Marathon

- Open-ended familiar play.
- Scoring, line count, level progression, and deterministic gravity remain.
- The run ends only on top-out or explicit player exit.

### Race

Race is normal open-ended play with an additional deterministic acceleration curve.

- There is no line target and no successful terminal state.
- Clearing 20 lines, or any other line count, must never set `status = "finished"`.
- Scoring, seven-bag generation, clearing, and top-out match normal play.
- Speed tier is `floor(pieceCount / 5) + floor(lines / 4)`, clamped to the bounded
  production gravity curve.
- Player-facing statistics are score, cleared lines, and current speed tier.
- The run ends only on top-out or explicit player exit to the mode home.
- Race leaderboard rows, if retained, are top-out endurance results rather than
  completion-time results.
- All copy and tests referring to “20 行”, “剩余行”, “完成目标”, or Race completion are
  removed or migrated.

### Puzzle library

Puzzle is a library of authored board-clearing challenges, not an unlock ladder.

- All six T5 levels are selectable from first launch. No level row is disabled or
  hidden behind prior completion.
- Numeric difficulty is not shown and does not control ordering or availability.
  Completion persistence is informational only.
- The goal remains canonical board empty after ordinary line resolution, including
  the hidden buffer.
- Every level has an empty hidden buffer, a non-empty authored 20 × 10 visible board,
  one finite fixed queue, and a piece budget exactly equal to queue length.
- Every production queue contains 10–16 pieces, at least four piece types, and no run
  longer than two identical pieces.
- Every accepted reference solution uses the full budget, at least four effective
  rotations, at least five landing columns, at least one non-clearing setup lock, and
  more than one separated line-resolution phase.
- The initial stack covers at least six rows and uses at least four distinct non-empty
  row shapes. Repeated floor templates, vertical-I-only wells, and one-obvious-drop
  openings are forbidden.
- Puzzle has no automatic gravity. A piece moved to the floor by soft drop must still
  lock after the shared lock delay and continue the queue.
- A public hard drop locks immediately. A no-clear lock spawns the next authored piece
  through the deterministic entry path; a clear uses the shared clear delay and then
  spawns exactly the next authored piece.
- The engine checks hidden occupancy/invalid state, canonical-board-empty success,
  exhausted budget/queue, then exact authored spawn.
- References initialize with `createInitialState(seed, "puzzle", level.id)` and use
  public `dispatch` only. No verifier may construct or mutate canonical state.

## T5 visual direction — 青流蓝图 / Aqua Blueprint

T5 is a full visual replacement. The signature gesture is a 45-degree clipped corner
paired with fine blueprint ticks and one offset cyan route line. Warm paper, ochre
shelf feet, mineral shadows, inset rectangles, and the current block material language
are removed.

### Palette

| Role | Token |
| --- | --- |
| Page | `#F4FCFD` |
| Main surface | `#FFFFFF` |
| Cyan surface | `#DFF7F8` |
| Blue surface | `#E8F1FF` |
| Board well | `#EAF8FC` |
| Grid / edge | `#BCDDE6` / `#8FC9D5` |
| Primary / secondary text | `#102F3B` / `#486775` |
| Cyan / blue action | `#0B7385` / `#2F65AE` |
| Focus | `#005FCC` |
| Success / failure | `#176B54` / `#A33A55` |

Light colors are surfaces, not text colors. Essential text, borders, focus, and state
labels must meet WCAG AA contrast.

### Piece language

- Every mino is a single cool-color plane with a shared deep-cyan outline and one
  consistent clipped corner or small radius.
- Remove detached shadows, inner square panels, mineral insets, and highlight bars.
- The seven pieces use distinguishable cyan, sky, blue, indigo, violet, mint, and
  blue-grey values while retaining the shared outline.
- Active cells use a stronger outline; locked cells use the standard outline.
- Ghost cells use corner brackets only, not translucent filled blocks.
- Board and Next reuse the same cell drawing primitive.
- Line clear uses local contraction/fade. Reduced motion switches immediately without
  trail, pulse, or positional interpolation.

## Information architecture

### Mode home

- The app opens on a dedicated mode home with no gameplay board.
- Marathon, Race, and Puzzle are three separate, fully clickable entries with complete
  Chinese names, concise factual rules, and an explicit enter action.
- Race copy is `速度持续提升｜无终点｜主动退出或堆叠到顶结束`.
- Mode selection is not a small rail beside the board.

### Puzzle library

- Every level entry is enabled and shows name, board-clearing goal, available-piece
  count, and optional completion status.
- It does not show numeric difficulty or lock state.
- Starting a level must keep the visible selection, canonical `puzzleId`, queue index,
  active piece, and remaining count aligned.

### Game screen

- Top actions provide mode-home exit, current mode, and pause.
- Desktop uses a clear information / board / Next-status composition.
- Mobile uses a compact information band above the board and a five-action deck below.
- Pause, exit confirmation, success, and failure use accessible light action sheets
  with buttons at least 44 × 44 CSS px.
- Race shows score, lines, and speed tier. Puzzle shows level name, remaining pieces,
  goal, and one Next item.

## Responsive and accessibility contract

- All visible buttons are at least 44 × 44 CSS px; primary mobile controls target
  48 px or larger.
- Canvas focus has a visible 3 px high-contrast focus ring.
- Dialog-like sheets expose a readable title, correct role/label, intentional initial
  focus, Escape/cancel behavior, and focus restoration.
- Mode and state are never communicated by color alone.
- `prefers-reduced-motion` is honored initially and when the media query changes.
- Required viewports: 1440 × 900, 2048 × 1152, 390 × 844 DPR3, 844 × 390 DPR3, and
  360 × 800.
- No horizontal overflow, clipped essential text, overlapping modules, or accidental
  gameplay page scroll.

## Implementation ownership and sequence

1. Coordinator freezes this contract and exact path boundaries.
2. T5 Core owns Race/Puzzle rules, authored data, deterministic T5 fixtures, runtime QA
   migration, leaderboard semantics, and focused tests. It does not edit frontend.
3. Independent read-only core QA verifies the candidate SHA.
4. T5 Frontend owns mode home, Puzzle library, game composition, completion display,
   Aqua Blueprint CSS, Pixi rendering, and presentation tests.
5. Coordinator runs one combined final typecheck, full suite, build, and browser pass
   after the last product change.
6. Independent read-only final QA verifies the exact combined candidate before
   changelog integration and push.

Historical T3/T4 evidence stays unchanged. New reference and browser evidence lives
only under `docs/workstreams/tetris-t5-*` and `docs/qa/evidence/tetris-t5`.

## Acceptance gates

- `npm.cmd run typecheck`;
- complete Vitest suite;
- production build;
- deterministic Race replay proving lines never finish the run and acceleration is
  monotonic through its safe cap;
- all six Puzzle references, exact budget consumption, restart/hash determinism,
  soft-drop floor locking, and consecutive multi-piece play;
- negative routes for at least three authored decision points must fail by budget;
- UI-driven evidence selects modes and levels through visible controls;
- at least one Puzzle scenario after three consecutive locks, with visible/canonical
  level, active piece, queue index, and remaining count aligned;
- mode-home → game → mode-home → game proof with no canvas/ticker/listener leaks;
- one gameplay canvas, zero gameplay DOM cells, zero console/page errors;
- keyboard, touch, pause/resume, restart, explicit exit, failure, success, and reduced
  motion verified at required viewports.

A nonblank screenshot, internal QA state injection, or mock terminal state is not
acceptance evidence.
