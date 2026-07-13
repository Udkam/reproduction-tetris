# Signal Foundry — Design Contract

## Product intent

Signal Foundry is a polished, original falling-block puzzle game for desktop and mobile browsers. It preserves the strategic clarity of classic Tetris-style play—seven four-cell pieces, a 10 × 20 visible matrix, increasing gravity, line clears, scoring, and top-out—without copying protected branding, music, assets, or commercial screen layouts.

The first release is one complete Marathon mode. It must feel finished rather than like an engine demo.

## Aesthetic direction

The world is a precision signal instrument built from smoked glass, cold metal, and illuminated mineral cells.

- Background: deep navy-black, faint technical grid, restrained aurora haze.
- Board: recessed glass well with a crisp structural rim and low-contrast cell grid.
- Signature gesture: an energy rail surrounding the board. Locking and clearing sends a short pulse into the score readout.
- Blocks: translucent mineral modules with an inner light core, one-pixel highlight, stable gaps, and no real-time blur filter per cell.
- Tone: controlled, tactile, modern, and calm under pressure. Avoid generic neon overload.

### Palette

| Token | Value |
| --- | --- |
| Background | `#070A12` |
| Board well | `#0B101C` |
| Panel | `#131B2D` |
| Structural edge | `#2B3752` |
| Primary text | `#F4F7FF` |
| Muted text | `#93A1BC` |
| Signal accent | `#C6FF5E` |
| Danger | `#FF5B73` |

Piece colors are original to this project: coral, seafoam, amber, periwinkle, acid green, violet, and rose. Color is never the only identifier; high-contrast mode adds per-piece surface patterns.

## Layout

### Desktop

- Three-column instrument layout: statistics, board, queue/hold/status.
- Board height is clamped to the viewport and always keeps a strict 1:2 visible ratio.
- Side panels remain subordinate to the board and use compact numeric typography.

### Mobile portrait

- Score, level, and lines form a compact top rail.
- Hold and next previews sit beside or directly above the complete board.
- Touch controls remain at least 48 × 48 CSS pixels and respect safe-area insets.
- The 10 × 20 matrix must never be cropped.

### Mobile landscape

- Board sits left; statistics, queue, and controls use the right region.
- No horizontal page scroll.

## Motion

Simulation remains discrete; rendering interpolates presentation only.

| Action | Target duration | Presentation |
| --- | ---: | --- |
| Horizontal move | 60 ms | direct eased slide |
| Rotation | 100 ms | quarter-turn sweep without overshoot |
| Hard drop | 120 ms | trailing echoes and restrained impact |
| Lock | 70 ms | inner-core pulse |
| Line clear | 260 ms | center-out signal collapse |
| Four-line clear | 320 ms | stronger rail pulse, no full-screen flash |
| Level up | 360 ms | rail and HUD response |
| Game over | 650 ms | rows dim from top to bottom |

Reduced-motion mode removes trails, rotation arcs, shake, and scaling. State changes remain immediately legible with short opacity cues.

## Audio

Audio is synthesized at runtime after a user gesture. No melody or sound from an existing Tetris product is used.

- move: dry glass tick
- rotate: short two-tone click
- hold: bidirectional suction cue
- lock: ceramic impact
- hard drop: low-frequency thump
- one to four lines: progressively wider original chord
- game over: descending filtered noise texture

Audio can be disabled. Repeated movement cues are rate-limited.

## Input

Keyboard defaults:

- left/right or A/D: move
- down or S: soft drop
- Space: hard drop
- Z/Q: rotate counter-clockwise
- X/W/up: rotate clockwise
- C/Shift: hold
- Escape/P: pause
- R: restart from paused/game-over state

Default repeat behavior follows the fixed 60 Hz simulation clock: DAS 10 ticks (about 167 ms), ARR 2 ticks (about 33 ms), and soft-drop repeat 2 ticks (about 33 ms). Touch controls expose move, rotate, soft drop, hard drop, hold, and pause without relying on hover.

## Acceptance

- The core rules are deterministic under a seed and command sequence.
- The full 10 × 20 matrix is visible at 1440 × 900 and 390 × 844.
- Settled cells, active piece, ghost, particles, and previews derive from one cell metric and one transform pipeline.
- Cell alignment error is at most 0.25 CSS px in structured browser evidence.
- Canvas count is exactly one; gameplay cells are not React DOM nodes.
- Desktop and mobile interaction complete without console errors.
- Restart/unmount does not multiply ticker listeners, event handlers, audio nodes, or canvases.
