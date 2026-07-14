# Tetris — T2 D4 Production Contract

## Product intent

Tetris is a deterministic falling-block puzzle for desktop and mobile browsers. It
implements the familiar seven four-cell pieces, a 10 × 20 visible matrix, one-piece
preview, increasing gravity, line clears, scoring, and top-out without copying
commercial art, music, fonts, logos, level layouts, or screen trade dress.

T2 removes the player hold/stash rule completely. There is no `Hold`, no `暂存`, no
hold command, no hold state, and no keyboard or touch hold control. The core remains
serializable and renderer-independent; browser storage stays outside the core.

## Frozen mode rules

### 马拉松模式

- There is no fixed finish line. A run ends only on top-out.
- Clearing lines raises the level; level selects the established line-based gravity
  curve.
- Score is the primary result. The player-facing rail shows score, lines, and level.
- The Marathon leaderboard is ordered by score descending, lines descending, locked
  pieces descending, then elapsed fixed ticks ascending.

### 竞速模式

- The target is exactly 20 cleared lines.
- Elapsed time comes only from fixed simulation ticks; it is never derived from wall
  clock time or browser timing.
- Every five locked pieces advances one gravity tier; the fixed curve is
  `42 → 36 → 30 → 25 → 21 → 18 → 15 → 13 → 11 → 9 → 8 → 7 → 6 → 5 → 4 → 3 → 2`
  ticks per cell and the final tier is the cap.
- Reaching 20 lines immediately changes the canonical state to `finished`; no new
  piece may spawn after the finishing clear.
- The player-facing rail shows elapsed time, lines remaining, and speed tier.
- Only completed Race runs may enter the Race completion leaderboard. It is ordered
  by completion ticks ascending, locked pieces ascending, score descending, then
  elapsed time ascending.

### 解谜模式

- Exactly three clean-room authored puzzles are available. Each definition supplies a
  fixed initial board, fixed queue, piece budget, and target-line count.
- Puzzle has no automatic gravity. Movement and clockwise rotation precede hard drop;
  reaching the target immediately produces `finished`, while exhausting the budget
  without reaching it produces `game-over`.
- Puzzle identifier, definition-derived board and queue, budget, target, and progress
  are canonical deterministic state and therefore enter hash and replay coverage.
- Definitions validate fail-closed: an out-of-bounds, duplicate, or illegal cell, an
  empty/illegal queue, or an invalid budget/target cannot start a puzzle.

Mode, locked-piece count, elapsed ticks, Race completion, puzzle definition facts,
and all rule-relevant values participate in deterministic state hash and replay
coverage.

## Visual direction — Offset Drop (D4)

The single approved visual language is **Offset Drop**, adopted from the read-only
design artifact `7fc81433736e3279f7a7075f0d9054ec31d5c67f` (parent
`2aea0a0d4a0a33b88f726c76ae1a30ac9276af3`). The implementation is a local
candidate awaiting independent QA, not a release or acceptance claim.

- Background is warm, ungridded paper. The board is a deep-ink 1:2 well.
- A single cinnabar drop band cuts from the complete `Tetris` title through the
  complete active mode name and into the board top. Important edges use a restrained
  2 px cobalt/cinnabar misregistration.
- Use natural Chinese typography and a compact, centered context-plus-board game
  cluster. Do not use `T.`, jade instrumentation, dot/measurement grids, cards,
  modals, glass, or invented telemetry.
- Brand is always `Tetris`; mode names are always `马拉松模式`、`竞速模式`、`解谜模式`;
  the sole preview is `下一个方块`. Hold/暂存 never appears.

### Ready page

Ready presents three flat typographic mode lines with goal and end condition, an empty
board plus ghost, and one start action. It has no live stats, Next, or leaderboard.
Playing has one Next preview and only the selected mode's three key values:
Marathon 得分/消行/等级; Race 用时/剩余行/速度档; Puzzle 关卡/剩余方块/目标进度.

Pause is confined to the board: a board-only scrim and a paper strip no higher than
18% of the well with `暂停`、`继续`、`重新开始`. The external pause action disappears
while paused; the mode entry remains outside the board. Mode switch freezes and dims
the board but has no board inner text; its three full mode lines, `应用并重新开始`, and
`返回本局` live in the external context.

### Palette

| Token | Value |
| --- | --- |
| Paper | `#F4EBDD` |
| Ink / board well | `#222323` / `#101819` |
| Cinnabar drop | `#D85B3F` |
| Cobalt reply | `#4767A7` |
| Neutral | `#C6B194` |

Piece colors stay original and clean-room authored.

## Layout

### Desktop

- The 74–80 vh board and its context form one compact centered cluster. The desktop
  context rail is 208 px beside the 1:2 Pixi board, with no detached right column.

### Mobile portrait

- Header, complete current mode and sole Next, 240 × 480 board, mode stats, then one
  continuous five-zone touch rail form the portrait sequence.
- Each zone is at least 44 CSS px: ←, →, ↑ 旋转, ↓ 快速下落, ⇣ 直接落底.

### Mobile landscape

- Landscape follows the same compact cluster with board, context, and controls
  reflowed without overflow; the five controls remain touch-safe.

## Motion and responsiveness

Simulation remains discrete and fixed at 60 Hz; Pixi interpolates presentation only.

| Action | Presentation |
| --- | --- |
| Horizontal move | bounded eased follow, about 56 ms |
| Gravity step | continuous follow, about 82 ms |
| Soft drop | immediate command, 3-tick initial delay, then every tick; visual follow about 26 ms |
| Hard drop | brief trail and restrained physical impact |
| Lock | short cell-local outline pulse |
| Line clear | center-out row collapse, no full-screen flash or generic particles |

Entry delay is three fixed ticks. React-facing routine state is coalesced at 100 ms
while Pixi continues rendering every frame, so simulation and presentation do not
stall on component rerenders.

## Local leaderboards

Records are validated fail-closed and capped at eight entries per mode. The persisted
schema identifies its version and result status. Legacy records are either safely
migrated only when all required facts can be established or rejected; incomplete and
failed Race runs never appear in the Race completion leaderboard. Storage never
enters the simulation core.

## T2 D4 candidate acceptance (awaiting independent QA)

- Same seed, mode, and command sequence produce the same final hash.
- No core hold command/state/event/test remains, and the player surface contains no
  `Hold` or `暂存` text.
- Race reaches `finished` at exactly 20 lines without spawning a successor piece.
- All three Puzzle definitions validate, replay deterministically, and cover success,
  budget failure, restart, and mode switch without introducing gravity.
- Leaderboard validation, migration, and separate ordering are deterministic and
  fail-closed.
- The 10 × 20 matrix is complete at 1440 × 900, 390 × 844 DPR3, and 844 × 390 DPR3.
- Canvas count is exactly one and gameplay DOM-cell count is zero.
- Keyboard soft drop and touch soft drop both repeat quickly and stop immediately on
  release.
- D4 ready, playing, paused, mode-switch, Puzzle, leaderboard, and responsive layouts
  have final-candidate browser evidence with zero console errors.
- Restart and unmount do not multiply listeners, ticker callbacks, audio nodes, or
  canvases.
- The candidate evidence set is `docs/qa/evidence/tetris-t2/`: rules/replay proof,
  16 real-runtime PNGs, geometry/canvas assertions, control proof, and recorded
  SHA-256 values. Independent QA remains responsible for the clean final gate and
  acceptance decision.
