# T14 — Mutation VFX Polish Design Report

**Status:** T14 current-source closure accepted after a second independent read-only
revalidation. The committed dependency lock's clean-install mismatch remains a separate
repository P2 and is not represented as a rendering or gameplay acceptance.

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
- At 599 px and below, Mutation alone reuses the already-reserved 124 px mobile
  information band. The historical blanket rail hide left that band visibly empty.
  The compact state card occupies it as one three-column readout; its ordinary
  statistics and Next remain hidden exactly as before, preventing a vertical layout
  expansion while ensuring an active ten-second state is never invisible.

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

## 8. Current-source closure revalidation — 2026-07-27

This was an evidence-only revalidation checkpoint. It does not alter Core rules, item
durations, selection rates, score rules, or page composition. The corrected
candidate-bound record received a second independent read-only QA acceptance with no
P0/P1 finding; the known dependency-lock P2 remains explicitly outside this slice.

### Delivered surface

The T14 implementation is contained in the following committed product surface:

- `src/design/mutationTokens.ts` and its direct test: crystal-tech palettes, material,
  particle, filter, timing, and original-audio tokens.
- `src/animation/mutationTimeline.ts` and its direct test: deterministic sequence,
  parallel, delay, and easing phases used by all four visual treatments.
- `src/game/core/constants.ts`, `engine.ts`, `mutation.ts`, `rules.test.ts`, and
  `sprint.test.ts`: item attachment state, pure immediate-Next prediction, deterministic
  replay, the 0.1 s Mutation gravity floor, and the independent shape/item contract.
- `src/game/render/TetrisRenderer.ts`, `theme.ts`, and their direct tests: ordinary
  tetromino body plus attached item material, the fixed particle pool, two reusable
  board-local filter planes, FIFO foreground bursts, and item-aware Next rendering.
- `src/game/audio/AudioEngine.ts` and its direct test: original local WebAudio voices
  with the existing no-overlap lifecycle rule; no downloaded or streamed music.
- `src/App.tsx`, `src/game/runtime/GameRuntime.ts`, `src/ui/localization.ts`, and
  `src/styles/mutation-vfx.css`: the semantic Mutation state readout, localization,
  lifecycle wiring, compact layout, and reduced-motion presentation.

The shape and item streams are deliberately separate. The direct deterministic sweep
in `sprint.test.ts` samples the real seven-bag plus carrier stream over seeds 1–4096
and proves every one of the 28 combinations: I/O/T/S/Z/J/L ×
Freeze/Collapse/Bomb/Multiplier. An item is always an attachment to an ordinary
tetromino, never a shape-to-item mapping.

### Fresh automated and browser evidence

- The candidate was rechecked from a clean detached worktree at
  `1fac2208c906ae7132151ccc568d39daeb31210a`; `git status --porcelain` was empty and
  its committed `package-lock.json` SHA-256 was
  `0b46b8fc36f08348a1f383d00562e468d6f4f30cda32cd785bfff2c97b64b559`.
- Focused T14 suite: 5 files / 39 tests passed. `npm.cmd run typecheck` passed; the
  candidate's full suite passed at 24 files / 177 tests; its production build passed
  at 749 transformed modules.
- `npm.cmd ci` cannot currently reproduce the candidate because that committed lock
  file is internally out of sync with `package.json` (the command reports the missing
  `@emnapi` entries). The verification therefore used a temporary, clean-worktree
  `npm.cmd install --package-lock=false --no-audit --no-fund`; it did not modify the
  candidate or borrow the player's uncommitted lock-file changes. This proves the
  source/runtime slice, but clean-install reproducibility remains a separate
  repository dependency-lock repair rather than a T14 rendering claim.
- The candidate-bound legal in-app replay is stored outside Git at
  `C:\\Users\\Alex Chen\\AppData\\Local\\Temp\\tetramorph-t14-candidate-1fac220-clean`.
  Its `report.json` SHA-256 is
  `3360bc1b7bc46a9736219731741f5b9d81e0efec6cf1ca5395fdced57f805865`; its manifest
  SHA-256 is `2de7c2d64853799c343c0b91e12300d4a5fa4c10a7d3792b65304169e4b6a640`.
  The manifest records the candidate SHA, clean tree, package-lock hash, and every
  PNG hash before the temporary audit server was released.
- The replay regenerated wide `mutation-{freeze,collapse,bomb,multiplier}.png`,
  `carrier-{bomb,freeze,collapse,multiplier}.png`, and the 390 px
  `mutation-freeze-compact-reduced.png`. Every capture recorded one canvas, zero DOM
  board cells, no horizontal/vertical overflow, and zero browser/page errors. The
  isolated material samples are Bomb (O), Freeze (T), Collapse (O), and Multiplier
  (J); the 28-combination Core test covers the complete cross-product beyond these
  representative visual frames.
- The compact reduced-motion capture keeps the visible state card in the reserved
  mobile band at 116 px tall with `animation: none`; it exposes active Freeze and
  Collapse time without introducing board animation.
- Manual frame review confirms the ordinary body remains visible beneath the attached
  crystal/core in carrier and Next views; the wide frames show frost, gravity lines,
  a board-bounded Bomb fragment burst, and the gold Multiplier score field. The
  candidate-bound collapse benchmark is 0.551 ms mean, 1.000 ms p95, and 2.900 ms
  maximum across 180 frames, below the 16.67 ms 60-FPS budget. All replays use normal
  deterministic spawn, legal movement, lock, and line-clear routes; no test state is
  injected.

### Revalidation result

The current source satisfies the requested attachment grammar, four distinct
environmental states, bounded renderer resources, original local sound path, and
compact/reduced-motion readability. No product-source gap was found during this
revalidation, and the corrected candidate record was accepted by independent read-only
QA with no P0/P1. The unrelated committed dependency-lock reproducibility issue remains
visible until its owner elects to repair and stage it.
