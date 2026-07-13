# Tetris — Design Contract

## Product intent

Tetris is a deterministic falling-block puzzle for desktop and mobile browsers. It implements the familiar seven four-cell pieces, a 10 × 20 visible matrix, hold, one-piece preview, increasing gravity, line clears, scoring, and top-out without copying commercial art, music, fonts, logos, level layouts, or screen trade dress.

The product has two rule modes:

- **马拉松**：gravity follows line-based levels.
- **竞速**：every five locked pieces advances one speed tier. The fixed gravity curve is `42 → 36 → 30 → 25 → 21 → 18 → 15 → 13 → 11 → 9 → 8 → 7 → 6 → 5 → 4 → 3 → 2` ticks per cell and caps at two ticks.

Mode and locked-piece count are canonical simulation state, are included in hashing, and replay deterministically. Browser storage is presentation-shell state only.

## Visual direction

The board is the sole protagonist: one deep graphite physical well placed on a light measured sheet.

- Background: fresh paper, a 32 px dot field, and a 96 px measurement grid.
- Signature: an asymmetric `T` and jade square imprint; no ornamental product slogan.
- Board: deep graphite well, thin jade measurement rail, quiet cell grid, one cell metric.
- Blocks: pressed mineral modules with a physical offset shadow and thin highlight.
- Surrounding UI: one narrow data rail, one-piece `Hold`, one-piece `Next`, and two compact header actions.
- Motion is causal only. There is no glow, ambient particle field, glass card stack, fake telemetry, settings dashboard, or seed display.

### Palette

| Token | Value |
| --- | --- |
| Paper | `#F1F9F8` |
| Paper highlight | `#F8FCFB` |
| Graphite / board well | `#0E1E23` / `#071013` |
| Structural edge | `#CADCDB` |
| Muted text | `#6C7E82` |
| Jade signal | `#12AE9D` |
| Warm response | `#E26944` |

Piece colors are original mineral tones: coral, seafoam, amber, periwinkle, green, violet, and rose.

## Interface content

- The game name is exactly `Tetris`; all other player-facing text is natural Chinese.
- Visible session data is limited to score, lines, level, speed, and mode.
- `Hold` and `Next` show exactly one piece each, with `Next` below `Hold`.
- Audio is the only persistent preference exposed by the page.
- Reduced motion follows `prefers-reduced-motion` automatically and has no manual toggle or storage key.
- There is no pattern/high-contrast preference.
- Pause is both a clearly labelled header action and a high-recognition `已暂停` state inside the board area.
- Ready and game-over views include a flat, bounded local leaderboard rather than cards.

## Layout

### Desktop

- Two-column layout: a narrow data/keyboard rail and the Pixi board stage.
- The board stays the largest and darkest object and preserves a strict 1:2 ratio.
- Empty space is intentional; no right-hand settings column exists.

### Mobile portrait

- Score, level, lines, and speed form one compact rail.
- The complete board remains visible above six touch-safe controls.
- Each touch control is at least 44 CSS px high and respects safe-area insets.

### Mobile landscape

- Board sits left and the six controls sit right.
- Pause remains visible in the header.
- The document has no horizontal overflow.

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

Entry delay is three fixed ticks. React-facing routine state is coalesced at 100 ms while Pixi continues rendering every frame, so simulation and presentation do not stall on component rerenders.

## Local leaderboard

Completed runs record score, lines, locked-piece count, mode, and ISO completion time. Records are validated fail-closed, sorted deterministically by score/lines/pieces/time/mode, and capped at eight entries. Storage never enters the simulation core.

## Acceptance

- Same seed, mode, and command sequence produce the same final hash.
- The 10 × 20 matrix is complete at 1440 × 900, 390 × 844 DPR3, and 844 × 390 DPR3.
- Canvas count is exactly one and gameplay DOM-cell count is zero.
- Keyboard soft drop and touch soft drop both repeat quickly and stop immediately on release.
- Race selection and the first counted lock are browser-verified.
- Game over writes exactly one valid local leaderboard record.
- System reduced-motion mode retains complete interaction without a manual preference.
- Desktop and mobile contexts produce zero console errors.
- Restart and unmount do not multiply listeners, ticker callbacks, audio nodes, or canvases.
