# Frontend and Visual-Fidelity Redesign Contract

Status: audit/design proposal only. This document authorizes no production-code
change. The coordinator thread `019f4deb-7e83-7583-8cd5-8e6f075bc331` must
approve each implementation slice, and independent QA must review the resulting
commit by SHA.

Coordinator decision consumed: `715b039`. Stage 6 remains rejected for
release. P0 lockfile reproducibility is still open, and the only authorized P0
candidate belongs to the gameplay workstream. Frontend, level, and all other
product implementation remain frozen until QA accepts P0 and the coordinator
issues a new bounded approval.

## Decision

Keep the current PixiJS/canvas, canonical-state, cell-space projection, masked
recursive-child, and procedural-art foundations. Partially reboot how those
foundations are composed, materialized, animated, addressed, and tested.

The Stage 6 static scene demonstrates alignment, not visual credibility. Its
central slab is technically clear but does not yet create the dense spatial
hierarchy, intentionally cropped parent context, or uninterrupted recursive
motion visible in the approved reference study. The in-app-browser audit also
showed broken intermediate frames: during a 70 ms move and a 300 ms enter,
the world frame disappeared and the viewport contained a gray field with only
the animated entity or aperture.

The work remains a clean-room technical study. Ship only original procedural
geometry, palettes, layouts, names, sound, and copy; do not save, embed, trace,
or distribute the official references used for comparison.

## Coordination Alignment

This proposal has consumed the following authoritative revisions without
rebasing this worktree:

- Coordinator decision `715b039`, including accepted QA governance at
  integrated-main revision `c781c31` and the P0-only authorization.
- Independent QA baseline `7a99506db46b54131b89473b67a86b5d5675577d`.
- Gameplay rules proposal `175ca5e3b251c0485f9603925b0cfda221c11aa1`.
- Level-design handoff range
  `42f9ca197905e3363551c25e91faa8a6ed25527e..fa4d0ef1906098a332e515ba96cede5f600ac4f7`.

Therefore, any later frontend candidate must use an addressed projection
occurrence key rather than a canonical entity ID, own one combined command
lock across entity/camera/portal work, and contain no `container-b` branch.
The level workstream's four tutorial staging needs are useful visual envelopes,
not an approved schema or content commitment: they remain provisional until
rules, serialization, and QA gates are accepted.

## Evidence and Reference Matrix

| Source / scene | Strong visual signals | Current Stage 6 comparison | Contract result |
| --- | --- | --- | --- |
| Official press screenshot 1, blue/magenta context mode | Active blue room, large cropped parent worlds at edges, hard dark outlines, readable nested window, sparse but high-contrast entities | Current camera symmetrically floats one isolated 10x8 slab; it has no parent crop and only one small green aperture | Reboot composition and recursive-window staging; preserve high-contrast flat-color treatment |
| Official press screenshot 2, detached-void mode | A light slab floats in black void, square particles are subordinate, frame and entities retain large readable silhouettes | Current void particles and centered slab prove the mode, but the cool gray material is much less decisive and the void is used by default rather than as a camera choice | Preserve void particles and canvas backdrop; redesign material tokens and make void a deliberate camera mode |
| Official press screenshot 8, object-scale context mode | A close camera shows large cropped world frames around a small active interior; the recursive relation remains legible without UI chrome | Current single-cell recursive container reads as a small green device/window rather than a spatial threshold | Reboot aperture proportions, child-world presentation, and camera address targeting |
| `DESIGN_REFERENCE.md` | Orthographic slabs, recessed interiors, authored palette families, masked previews, minimal UI, crisp non-floaty motion | Stage 6 meets canvas-first and uses procedural slabs, but has only two palette IDs, soft rounded/dashboard-like material, and unverified mobile/mid-transition behavior | Preserve architecture; redesign visual language and verification system |
| Live Stage 6 browser audit at 1280x720, DPR 1.25 | One canvas, no gameplay DOM, no console warning/error; player, box, goal, and aperture are visible | Resting frame is nonblank but too centered and sparse; movement and entry middle frames lose stable context | Treat static alignment as retained evidence only; block polish acceptance until transition continuity is repaired |

Official reference URLs are listed in `DESIGN_REFERENCE.md`. The audit downloaded
only temporary files outside the repository for visual inspection; no official
artwork is part of this proposal or its future implementation.

## Preserve Versus Reboot

| System | Preserve | Partial reboot required |
| --- | --- | --- |
| Render composition | Full-viewport PixiJS canvas and orthographic camera | Replace always-centered whole-root framing with two explicit composition modes: detached void and cropped parent context |
| World material | Procedural `Graphics`, clipped interiors, shared renderer metrics, shadow/rim vocabulary | Replace the cool gray rounded-tray default with a sharper slab grammar: area-token shell, dark outline, recessed floor, bevel planes, controlled corner radius, and palette-specific contrast |
| Recursive aperture | Masked child projections; child scale is renderer-owned and independent of simulation cells | Render each aperture as a genuine world window with readable wall/floor/entity silhouettes, a consistent rim, and a projection-instance identity; no fixed `container-b` path |
| Entities | Color-coded procedural player, box, goal, and container primitives | Simplify the player to a square with two eyes and a restrained facing cue; improve box/goal silhouette hierarchy; remove decorative details that read as app icons or UI widgets |
| Camera | Camera remains renderer-owned and never writes core state | Target a resolved projection address, preserve parent context through the full enter/exit arc, and choose composition from scene metadata rather than fixed root geometry |
| Motion | Command events drive animation outside core state; reverse/undo remains a first-class motion | Replace separate 500-560 ms event and 980 ms camera timelines with one command-lock-owned visual transition; no blank/missing world frame at any sampled phase |
| Responsive/mobile | Canvas host fills the viewport; React remains host-only | Add actual viewport testing, safe-area composition, DPR cap, touch-equivalent command input, and reduced-motion behavior; no mobile result may be inferred from desktop resize CSS |
| Performance | Bounded projection depth, masks, and procedural primitives | Stop clearing/recreating whole render layers on every animated tick; retain/diff static world geometry and measure frame-time, allocation, and depth budgets |

## Visual System Contract

### 1. Composition and camera

The renderer supports two intentional resting compositions. A level or scene
may select one by visual-staging metadata; the core remains unaware of pixels.

1. **Detached void**: one active slab occupies roughly 60-86% of its limiting
   viewport dimension. Black/near-black void and sparse square particles retain
   at least one side of negative space. Use when the puzzle needs a clear first
   read or a world has no useful parent context.
2. **Cropped parent context**: the active projection occupies roughly 42-78%
   of the viewport and at least one parent world crosses an edge. Parent slabs
   must be visibly cropped, never shrunk into dashboard cards. Use during
   recursive depth, entry/exit, or object-scale comparison.

Every camera target is a projection-instance address, not a canonical entity
ID. The address must survive replay, undo, and repeated canonical worlds in a
bounded recursive projection. A resting camera must be deterministic for a
given projection address, viewport, composition mode, and reduced-motion flag.

### 2. World material

Each area palette is a token set with `void`, `shell`, `outline`, `topBevel`,
`sideBevel`, `recess`, `floor`, `goal`, `player`, `box`, `container`, and
`shadow` values. The scene may use saturated blue, warm, green, purple, or
neutral families, but not a generic low-saturation application palette.

Worlds remain flat orthographic slabs:

- a thin dark outer outline establishes separation before a color bevel;
- shell, top/right/bottom planes, and recessed interior use distinct values;
- the interior is masked, darker than the shell, and contains walls/goal/entity
  geometry rather than a broad unstructured gray field;
- radius is structural and scale-aware, never a card-like cosmetic default;
- parent and child worlds keep the same material grammar at different scales;
- particles are sparse square depth cues, not visual noise.

Shared cell/world metrics remain the only geometry authority. Do not return to
scattered primitive pixels or resize child worlds independently to fill each
aperture. If the depth scale needs tuning, tune one documented, global
depth-scale policy and verify that the smallest permitted preview preserves a
frame, floor color, and one entity silhouette.

### 3. Recursive aperture

A recursive container is a world-bearing object, not a crate with a thumbnail.
At readable scale it contains an inset rim, a masked child slab, an identifiable
floor/interior, and child content. At smaller scales it degrades in a fixed
order: decorative detail, then goals/walls, but never the aperture boundary or
area-color distinction. It must never show a blank window while its child
projection is present.

The render API needs the resolved `ProjectionAddress`/instance ID for the
container and child. This is a joint interface dependency with the gameplay
workstream: canonical entity IDs are insufficient when an entity appears by
multiple recursive paths.

### 4. Entity readability

- **Player:** high-contrast square body, two eye dots, and a subtle directional
  cue visible at normal scale. No text, badges, or exaggerated app-icon face.
- **Pushable box:** opaque square with one consistent side/shadow vocabulary;
  it remains distinct from the player by color and silhouette at 48 CSS px.
- **Goal:** thin floor socket, not a floating card or outlined UI control.
- **Recursive container:** the strongest frame/rim hierarchy of the entities,
  because it carries the spatial rule.
- **Walls:** world geometry, not a grid overlay. They must create deliberate
  negative-space corridors when level data becomes available.

### 5. Motion and interaction feedback

All visual components of one command share one authoritative lifecycle. A
command is locked from accepted dispatch until entity motion, camera movement,
recursive aperture effect, and associated render projection reach a
commit-safe end state.

Initial timing targets, to tune only through captured evidence:

| Action | Target | Required read |
| --- | ---: | --- |
| Step | 120-140 ms | Short, spatially stable slide; no camera jump |
| Push | 160-190 ms | Brief anticipation, confident slide, small settle |
| Blocked | 70-95 ms | Directional nudge; no state/history mutation |
| Enter / exit | 600-700 ms | Continuous scale movement with parent context still visible near the midpoint |
| Undo / redo | Same path in reverse | Restores the equivalent composition and never starts from a stale camera state |

No `draw()` sample may clear the world while a transition is active. Reduced
motion uses the same event path and final camera state, but snaps or shortens
the visual transition without changing commands or state hashes.

### 6. Responsive and accessibility contract

- The canvas occupies `100dvh`/available safe area and maintains an intentional
  composition in both 1440x900 desktop and 390x844 DPR 3 mobile portrait.
- Mobile may crop context differently, but must keep player, target interaction,
  and a recursive aperture above the minimum readable size; it must not shrink
  the entire desktop scene into illegible content.
- Cap renderer resolution at a documented device-pixel-ratio ceiling rather
  than blindly using unlimited `window.devicePixelRatio`.
- Pointer/touch gestures or controls emit the same commands as keyboard input;
  no separate gameplay rule path is permitted.
- The canvas keeps a truthful accessible name, has a focus contract, and
  reduced-motion media preference is tested. Any optional HUD remains visually
  subordinate to the playfield.

## Screenshot and Measurement Plan

No official image belongs in the repository. Future captures are original local
output, tied to the exact candidate SHA and command trace.

| Capture ID | Viewport | State / command timing | Required visual assertion |
| --- | --- | --- | --- |
| `rest-void` | 1440x900 DPR 1 | Deterministic initial scene | Detached world reads against void; one canvas; no gameplay DOM |
| `rest-context` | 1440x900 DPR 1 | Deterministic context-mode scene | At least one cropped parent and one active child relation are legible |
| `move-50` | 1440x900 DPR 1 | 50% of a single move | Entire world frame remains rendered; no camera teleport |
| `enter-00`, `enter-50`, `enter-100` | 1440x900 DPR 1 | Start, midpoint, settle of one valid enter | Parent context, aperture, and destination remain visually continuous |
| `exit-50` | 1440x900 DPR 1 | Midpoint of reverse path | Equivalent context in reverse; no blank or stale frame |
| `mobile-rest`, `mobile-enter-50` | 390x844 DPR 3 | Same deterministic initial/enter trace | Actual viewport dimensions recorded; entities and aperture remain legible |
| `reduced-motion-enter` | 1440x900 DPR 1 | Same trace with preference enabled | Same final core hash and camera target; reduced visual duration |

Every capture records candidate SHA, browser/runtime, exact viewport and DPR,
command trace, deterministic capture time, canvas count, gameplay-DOM count,
console error/warning count, screenshot pixel dimensions, nonblank/color
metrics, visible projection-instance addresses, and a short reference-mode
review. The current in-app browser did not apply its 390x844 override (two
attempts still reported 1280x720); that is a tooling limitation, not mobile
evidence. The approved implementation must use a capture surface that verifies
the requested viewport before accepting mobile output.

## Performance Budget

The following budget applies to the agreed visual demo scene with a bounded
recursive depth and the capture states above:

| Measure | Desktop 1440x900 DPR 1 | Mobile 390x844 DPR 3 | Gate |
| --- | ---: | ---: | --- |
| p95 frame time during 30 enter/exit cycles | <= 16.7 ms | <= 16.7 ms, or explicit coordinator-approved alternative | Required before acceptance |
| Canvas count | 1 | 1 | Required |
| Gameplay DOM node count | 0 | 0 | Required |
| Console errors/warnings | 0 unexpected | 0 unexpected | Required |
| Recursive render depth | Explicit bounded policy | Same policy | Required |
| Static-world allocation | No whole-layer `Graphics`/`Container` rebuild each animated tick | Same | Required |
| Heap behavior | No monotonic growth over 30 cycles | No monotonic growth over 30 cycles | Required |

The present code violates the allocation intent during animation: `PixiApp.draw`
removes and recreates background, recursive, effect, and overlay children on
animated ticks. Cache or retain static world geometry; update transforms and
the changed occurrences only. Measure before choosing texture caching or other
optimizations.

## Dependency-Ordered Implementation Slices

| Slice | Scope | Dependencies | Acceptance criteria |
| --- | --- | --- | --- |
| P0 — reproducible baseline | Repair the committed lockfile and prove clean toolchain | Gameplay workstream only, under coordinator P0-only authorization; QA P0 | `npm ci`, typecheck, test, and build pass in a clean worktree; no visual claim yet |
| V1 — projection identity and visual transition ownership | Generic interaction target, projection-instance address, one full command lock, stable middle frames | Approved gameplay stability interface; QA P1 | No `container-b` condition; repeated input cannot overtake transition; enter/move/exit middle-frame captures keep every visible world frame |
| V2 — camera/composition and material grammar | Two composition modes, area palette token contract, slab/wall/goal/entity procedural pass | V1 address/camera target API | Original desktop captures satisfy `rest-void` and `rest-context`; no DOM gameplay or copied assets |
| V3 — recursive aperture and retained render graph | Readable child degradation policy, instance-aware aperture render, static geometry retention/diffing | V1/V2 and bounded projection policy | Nested window stays legible at approved depth; allocations/frame-time meet first budget report |
| V4 — responsive, reduced-motion, capture automation | Actual mobile viewport capture, DPR cap, input/accessibility behavior, repeatable screenshot tooling | V1-V3; QA capture rubric | All planned captures have exact dimensions and metrics; mobile/reduced-motion commands preserve core hashes |

The coordinator should not approve V2 as a cosmetic-only patch before V1. The
live audit shows that material work would be evaluated through broken transition
frames and a fixed-container camera route. V1 is the smallest viable visual
stability slice after P0, QA acceptance, and a new explicit coordinator
authorization; this table is sequencing guidance, not present authorization.

## Cross-Workstream Dependencies

- Gameplay Rules and Engine (`019f4e82-7cb8-73c1-b4a1-d333273b359f`) has
  published its generic interaction-target, entrance-validity, acyclic-policy,
  transition-event, and path-aware-projection proposal at `175ca5e`; frontend
  work depends on the later QA-accepted contract, not on this unapproved audit.
- Level Design (`019f4e80-145c-7b53-b675-44b03aa4f625`) consumes camera mode,
  palette family, and legibility constraints once the generic schema contract
  exists. Its four tutorial staging needs remain provisional; this proposal
  freezes neither level fields nor layouts.
- Independent QA (`019f4e80-1462-7b32-8146-19ded692836c`) owns acceptance.
  Its `7a99506` rubric makes clean `npm ci`, generic addressing, full
  transition lock, repeatable desktop/mobile/mid-frame captures, and
  performance/accessibility evidence mandatory.

## Audit Acceptance Criteria

This audit/proposal is complete when it is committed with this workstream log
only, reported to the coordinator by thread ID, and queued for independent QA
review. It does not approve implementation, change `docs/logs/CHANGELOG.md`,
or alter source code, assets, levels, or remote branches.
