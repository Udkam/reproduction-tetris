# Stage 3B Core Notes

Status: Stage 3B recursive simulation core implemented for review.

## Core Data Model

The canonical state lives in `SimulationState`:

- `worlds`: logical world nodes keyed by `WorldId`.
- `entities`: canonical entity records keyed by `EntityId`.
- `components`: position, container, solid, pushable, player, goal, and visual
  components keyed by entity id.
- `rootWorldId`, `activeWorldId`, `focusPath`, and `playerId`: the current
  recursive focus and player identity.

The state does not store PixiJS objects, DOM nodes, camera transforms,
animation timelines, viewport sizes, CSS values, or pixels.

Container relationships are graph references:

```text
container entity
  -> ContainerComponent.innerWorldId
  -> WorldNode
```

Unsupported recursive cycles are rejected during state creation unless a future
stage explicitly enables a cycle policy.

## Command Flow

All state changes enter through command objects and the reducer:

```text
Command
  -> dispatchCommand
  -> movement or recursive transition resolver
  -> immutable next SimulationState
  -> hashState(previous) and hashState(next)
  -> HistoryRecord
  -> projection adapter
  -> existing Pixi renderer
```

Implemented command constructors:

- `Move(direction)`
- `Enter(containerId)`
- `Exit(containerId)`
- `Reset()`
- `Undo()`
- `Redo()`

Stage 3B only implements simple valid-position movement and enter/exit
relationships. It does not implement complete Sokoban push chains, puzzle
levels, or UI.

## Projection Handoff

`src/projection/simulationProjection.ts` converts a canonical
`SimulationState` snapshot into the existing `WorldProjection` shape. This is
the only bridge needed for the current renderer proof.

Runtime now renders `createStage3BSimulationProjection()`, so
`docs/screenshots/stage3b-core-no-ui.png` proves the Pixi renderer can consume a
simulation snapshot without React gameplay nodes.

## Test Coverage Summary

`src/core/core.test.ts` covers:

- world graph creation;
- entity lookup;
- container references;
- enter transition state change;
- exit transition state change;
- unknown recursive reference rejection;
- unsupported recursive cycle rejection;
- deterministic state hashing.

`src/projection/simulationProjection.test.ts` covers:

- simulation snapshot projection for the existing renderer.

Verification commands:

```text
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test
```
