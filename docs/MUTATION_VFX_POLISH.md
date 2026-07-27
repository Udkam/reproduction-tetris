# T14 — Mutation VFX Polish Design Report

**Status:** accepted rendering foundation; compact Mutation Card readability refinement active.

## 1. Design review / baseline

On 2026-07-25, a real deterministic local Mutation replay captured every special
carrier and every activation state on the current source. The functional baseline is
sound: all four carriers occur, all four effects trigger, the rail timers update, one
canvas is present, no DOM cells are created, there is no viewport overflow, and the
browser reports no errors. The review also found that the current visuals are too
subtle and too similar at a glance: thin lines, sparse points, and a short flash do not
give Bomb an ordered explosion or Freeze/Collapse a sustained world-state identity.

The correction is **not** a new gameplay system. Existing deterministic Core events and
timers remain the only input to rendering and audio, apart from the player-authorized
Mutation-only floor of 6 ticks / 0.1 seconds per cell. A pure Core lookahead exposes the
already-determined immediate carrier material to Next without consuming the RNG or
changing the later spawn result.

## 2. Art direction

**Direction:** Dark Sci-Fi + Premium Arcade + Crystal Technology.

- The game board keeps its existing deep mineral well; Mutation adds an internal
  `#07111F` navy atmosphere with `#10243A` support shadows, never a global CSS overlay.
- Effects are local to the Pixi board and scale with its real cell geometry, so desktop
  and compact play retain the same information hierarchy.
- There are no emoji, stock image, CSS-only board animation, random full-screen
  gradients, or copied trade dress. All particles, frost, energy rings, and score
  markers are original vector geometry drawn by the existing Pixi renderer.
- A special item never replaces the ordinary tetromino's identity. The base piece keeps
  its standard material; the item is a high-contrast attached crystal core, rim,
  surface mark, and local energy treatment. That deliberately permits every I/O/T/S/Z/J/L
  shape to carry every Freeze/Collapse/Bomb/Multiplier attachment, including in Next.

## 3. Token table

| Item | Primary | Highlight / energy | Deep / shadow | Attached recognition cue |
| --- | --- | --- | --- | --- |
| Freeze | `#8DEBFF` | `#D9F7FF` | `#287B99` | glass crystal + frost spokes |
| Collapse | `#9B6CFF` | `#D8B4FE` | `#35145F` | compressed core + vertical pull |
| Bomb | `#FF6B35` | `#FFB347`, `#FFE8A3` | `#5A1A20` | ember ring + three-beat warning |
| Multiplier | `#FFD166` | `#FFF2B2` | `#8D5B10` | star-mineral + score rays / `×2` or `×4` lift |

The shipped fonts remain authoritative: Space Grotesk SemiBold for the mutation title
and labels, JetBrains Mono Bold for timer/numeric data. Inter is not installed, so the
status text uses the shipped Space Grotesk rather than a network fallback.

## 4. Timeline map

| System | Entry | Sustain | Exit / impact |
| --- | --- | --- | --- |
| Freeze | 0–500 ms cubic-out crystallise | 800 ms gentle breath during Core's existing 10 s | 1000 ms cubic-in thaw |
| Collapse | 0–180 ms back-out gravity lock | vertical field and pull trails during 10 s | each real column settle: 120 ms downward impulse |
| Bomb | 0–200 ms warning, 200–400 red pulse | 400–600 white impact | 600–900 shockwave/fragments fade |
| Multiplier | 0–260 ms score-light back-out | contained gold field during 10 s | 520 ms vector `×2` / `×4` lift and coin-star tail |

If one clear activates more than one carrier, each transient is enqueued in FIFO order
and starts only after its predecessor reaches its final timeline frame. Timed Freeze,
Collapse, and Multiplier atmospheres still coexist from authoritative Core state; only
the short, attention-owning foreground burst is serialised.

`src/animation/mutationTimeline.ts` is the sole owner of visual phase progress. It
supports sequence, parallel, delay, cubic-out, cubic-in, and back-out tracks. Game
time is still driven by Core tick state; the timeline only shapes rendering.

## 5. Rendering architecture and performance

- **One canvas:** reuse the existing board, piece, and effect `Graphics` layers.
- **Particles:** a fixed, reusable logical pool of 120 slots; no per-frame Pixi object
  creation, no allocations proportional to frame count, and no more than 300 visual
  particles even in a Bomb burst.
- **Effects:** at most two effect planes are active at once (ambient + transient),
  and at most two reusable Pixi filters may be enabled on the board at a time. Freeze
  owns a low-amplitude `NoiseFilter` frost grain plus vector frost edges; Collapse owns
  a generated-map `DisplacementFilter` with its documented `.015` relative strength
  and `.8` motion rate plus vector energy lines. The filters are renderer-local,
  pooled for the renderer lifetime, and disabled rather than recreated between
  activations. No downloaded asset, second canvas, or external texture is introduced.
- **Reduced motion:** no moving particles, shake, or pulsing. The final material,
  border, and card state remain visible long enough to be understood.
- **Collapse metadata:** column settlement uses indexed destination coordinates rather
  than string-key maps, retaining its exact board/carrier placement while reducing
  transient allocation pressure on a lock.
- **Budget:** renderer benchmark target is mean frame work below 16.67 ms under the
  Mutation stress state. Browser validation also checks one canvas, no DOM cell grid,
  no overflow, and zero console/page errors.

## 6. Audio plan

There is deliberately no music. Each item keeps original local WebAudio rather than
downloaded media: a glass crack/brief cold breath for Freeze, compressed low gravity
thud for Collapse, three warning ticks plus a rounded impact for Bomb, and a bright
golden harmonic for Multiplier. Profiles are data in the Mutation token module. A new
activation stops a prior Mutation voice, preserving the existing no-overlap rule.

## 6.1 Compact Mutation Card refinement

The accepted board treatment is mechanically complete. The remaining rail correction is
strictly presentational and does not reopen item selection, duration, scoring, queue,
or Core state.

- Keep one compact, dark deep-space readout in the established rail position rather
  than adding another panel or explanatory copy. Its glass surface is a contained
  `#07111F`/`#10243A` console with a 12 px backdrop blur and a restrained white-glass
  inner layer; it must not become a page-wide gradient or a second visual hierarchy.
- Remove the decorative `///` marker from the visible UI. The title, item name,
  timer, and progress line carry all necessary information. Inactive rows remain
  legible but quiet; active rows receive only their item’s cyan, violet, or gold
  material accent.
- Use Space Grotesk SemiBold at 14 px for the card title and 12 px for item names;
  JetBrains Mono Bold at 18 px for active time. The existing ARIA labels retain the
  full state for assistive technology without requiring visible explanatory prose.
- The card may make one brief UI-only 0.8 → 1 / opacity 0 → 1 entrance on mount.
  This is not board animation, does not restart on timer updates, and is fully
  disabled under `prefers-reduced-motion`.
- This supplementary checkpoint is CSS-only (`src/styles/mutation-vfx.css`) so it
  deliberately avoids the player’s currently uncommitted page-composition files.

## 7. Implementation slices and evidence

1. Tokens and timeline primitives with direct unit tests.
2. Carrier materials, ambient fields, pooled particle renderer, and staged Bomb effect.
3. Compact Mutation Card, semantic original audio profiles, a FIFO multi-item transient
   queue, and an item-aware immediate Next preview.
4. Desktop/compact/reduced-motion live evidence, 60-FPS benchmark, full quality gates,
   independent QA, changelog, then push.

**Baseline evidence (ignored local audit):**
`.local/audits/t13.14/mutation-{freeze,collapse,bomb,multiplier}.png` and the matching
`carrier-*` captures, regenerated on the current source on 2026-07-25.
