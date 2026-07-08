# Stage 4 Playable Core QA

Status: Stage 4 recursive gameplay kernel implemented for review.

## Scope

Stage 4 adds the gameplay-kernel foundation while preserving the renderer
architecture:

- command-driven movement;
- collision and push-chain validation;
- recursive enter/exit events;
- moving pushable recursive containers as canonical entities;
- deterministic undo/redo through state hashes;
- simulation snapshot projection into the existing Pixi renderer.

It does not add level packs, a level editor, menus, UI polish, or large content.

## Visual Screenshot

Screenshot:

- `docs/screenshots/stage4-playable-core.png`

Purpose:

- Proves the existing Pixi renderer consumes a Stage 4 `SimulationState` after
  command dispatch.
- Shows player, pushed box, recursive container, nested world preview, and goal
  in one PixiJS canvas.

Compared with `docs/screenshots/stage3b-core-no-ui.png`:

- The player and box positions now reflect an executed command sequence, not
  the untouched initial snapshot.
- The recursive container still projects its child world through the existing
  masked preview.
- React DOM remains host-only; no gameplay cells/entities are rendered as DOM.

Compared with `DESIGN_REFERENCE.md`:

- Closer: the scene still matches the canvas-first, sparse-UI, recursive
  window composition target.
- Closer: pushed object state is visible in the same physical slab view as the
  recursive container.
- Different: movement is not animated yet; core emits transition events for a
  later renderer/game-feel stage.
- Different: visual fidelity still lacks final Parabox-level depth cues,
  object micro-animation, and refined push-in/push-out camera feel.

## Browser QA

Browser automation:

- Loaded `http://127.0.0.1:5173/`.
- Waited for `canvas[data-testid="pixi-canvas"]`.
- Captured `docs/screenshots/stage4-playable-core.png`.
- Dispatched `KeyboardEvent("keydown", { key: "e" })` as a transition smoke
  interaction.

Results:

- `canvasCount: 1`
- `gameplayNodeCount: 0`
- Console problem events: `0`
- Pixel sample: `1000x900`, `SampledUniqueColors: 37`, `NonBlank: true`,
  `DarkSampleRatio: 0.366`, `SaturatedSampleRatio: 0.363`

## Performance QA

Unnecessary Pixi object recreation:

- Stage 4 does not add new renderer object churn.
- Current `PixiApp.draw()` still rebuilds display children on explicit render or
  resize, not every frame.
- The ticker updates only active recursive transitions unless a viewport resize
  requires redraw.

Projection stability:

- `createStage4PlayableCoreProjection()` is derived from deterministic command
  dispatch over `SimulationState`.
- Projection tests assert the pushed player/box positions and recursive child
  world handoff.

Memory leaks and cleanup:

- `PixiApp.destroy()` removes the ticker callback and destroys the Pixi
  application.
- `InteractionPrototype.destroy()` removes the `keydown` listener.
- The local dev server was stopped after QA.

Known future performance work:

- Static world geometry may later use `cacheAsTexture()` when renderer mutation
  frequency is lower.
- Mask counts are unchanged in Stage 4; deeper recursive projection will need a
  bounded depth policy and profiling before increasing visible recursion.

## Test Coverage Summary

Vitest coverage includes:

- normal movement;
- blocked movement with no history change;
- single box push;
- multiple box push chain;
- enter container;
- exit container;
- moving a container that contains a world;
- parent relationship preservation;
- undo/redo hash equality;
- unknown recursive reference rejection;
- unsupported recursive cycle rejection;
- impossible out-of-bounds and overlapping solid positions;
- deterministic hash equality;
- multi-world goal completion;
- projection handoff from Stage 4 simulation state.

Verification commands:

```text
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```
