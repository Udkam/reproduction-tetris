# Game Rules

Status: Stage 4 rule specification before gameplay-kernel implementation.

## Research Notes

Context7 was requested for current PixiJS, TypeScript, and Vitest documents,
but no Context7 MCP tool was available in this session. Primary documentation
fallbacks reviewed:

- PixiJS v8 Container and scene-object docs: containers group children and own
  transforms; leaf render objects should be wrapped in containers when nesting
  is needed.
- PixiJS v8 render loop/ticker docs: ticker callbacks run before transform and
  rendering; Stage 4 keeps gameplay state out of ticker/render state.
- PixiJS performance docs: many masks and excessive object recreation can be
  expensive; Stage 4 should preserve the existing renderer and avoid extra
  mask-heavy rendering changes.
- Vitest writing-tests docs: `.test.ts` files with `describe`, `it`, and
  `expect` are the right fit for deterministic core coverage.
- Official Patrick's Parabox press notes and screenshots: the gameplay target
  is boxes containing boxes, pushing boxes into/out of one another, sparse UI,
  parent/child worlds visible together, and crisp movement with readable scale
  changes.

Public GitHub references were reviewed only for design vocabulary. They are not
implementation sources. The useful lesson is that ordinary Sokoban resolvers
often treat pushing as a single-box operation, while this project must support
multi-target push chains and recursive containment as canonical graph state.

## Movement

All player actions enter the core as `Command` values. The reducer is the only
state mutation boundary.

Normal movement:

- The actor defaults to `SimulationState.playerId`.
- A move computes the adjacent position in the active world.
- If the target is empty and inside the world, the actor moves one cell.
- A successful move emits a `move` transition event.

Blocked movement:

- A target outside the world bounds is blocked.
- A target containing a solid non-pushable object is blocked.
- A blocked action does not change state and does not create a history record.
- A blocked action emits a `blocked` event so future rendering can show impact
  feedback without storing animation state in core.

Pushing:

- A push starts when the target cell contains at least one pushable solid.
- The movement resolver walks forward through contiguous occupied cells in the
  movement direction.
- Every pushable solid in that contiguous line is a push target.
- The push succeeds only if the first open cell after the chain is inside the
  same world and not occupied by an unpushable solid.
- The chain moves from the far end back toward the actor, then the actor moves
  into the first pushed entity's previous cell.
- A successful push emits a `push` event listing every pushed entity with its
  previous and next position, followed by the actor `move` event.

Multiple push targets:

- Multiple pushable boxes in a line may move together.
- Mixed chains are invalid when any entity in the line is solid but not
  pushable.
- Goals do not block movement.

## Recursive Movement

Entering containers:

- `Enter(containerId)` is legal only when the actor and container are in the
  active world.
- The container must have a `ContainerComponent` referencing an existing inner
  world.
- Enter changes `activeWorldId` to the inner world and appends the container id
  to `focusPath`.
- The actor position moves into the container's configured entrance.
- The action emits `enterWorld`.

Exiting containers:

- `Exit(containerId)` is legal only when `containerId` is the last item in
  `focusPath`.
- The actor must currently be in that container's inner world.
- Exit moves the actor to the adjacent parent-world cell indicated by the
  container entrance facing, changes `activeWorldId` to the parent world, and
  removes the last focus path entry. The actor must not overlap the solid
  container entity.
- The action emits `exitWorld`.

Moving container entities:

- Containers are entities and may be pushable.
- Pushing or moving a container changes only the container entity position in
  its parent world.
- `ContainerComponent.innerWorldId` remains a graph reference; the inner world
  is never cloned into the moved entity.
- Moving a container that is in `focusPath` is legal as long as the focus path
  still resolves to the same child world.

World parent relationship updates:

- Stage 4 stores parent relationships implicitly through container entity
  positions and `ContainerComponent.innerWorldId`.
- Moving a container updates the parent-space position of the world aperture.
- Future push-in/push-out can update graph references, but Stage 4 only
  validates containment references and focus-path resolution.

## Collision

Solid objects:

- Entities with `SolidComponent` occupy a blocking cell.
- A solid entity can move only if it is also pushable and is part of a valid
  push chain.

Pushable objects:

- Entities with `PushableComponent` can be moved by another entity's push.
- Pushability alone does not imply rendering; rendering still uses
  `VisualComponent`.

Container objects:

- Recursive containers are solid.
- Recursive containers may be pushable.
- A container can be entered only through `Enter`, not by ordinary movement.

Invalid states:

- Every positioned entity must reference an existing world and be inside world
  bounds.
- Every container must reference an existing inner world.
- Unsupported recursive cycles are rejected unless a future cycle policy
  explicitly allows them.
- The `focusPath` must resolve from root world to `activeWorldId`.

## Win Condition

Goal matching:

- Each goal is a positioned entity with `GoalComponent`.
- A goal is satisfied when another entity occupies the same world/cell.
- If the goal specifies `acceptsVisualKind`, the occupying entity's visual kind
  must match.
- Goals themselves do not block movement.

Multi-world goals:

- All goals across all worlds must be satisfied.
- Hidden or nested goals still count because the core is canonical, not tied to
  current camera focus.

## Determinism

Command input:

- Commands are plain serializable values.
- Keyboard, pointer, replay, tests, and future accessibility paths must all use
  the same command API.

State transition:

- The reducer returns a new `SimulationState` and never mutates the previous
  state object.
- Core state contains no PixiJS object, camera, animation, DOM, CSS, viewport,
  or timing data.
- Transition events describe what changed; they are not animation state.

History:

- Every successful state-changing command records previous and next state
  hashes.
- Undo restores the previous canonical state including entity positions,
  container positions, container relationships, focus path, and active world.
- Redo restores the next canonical state and must reproduce the same hash.
- Failed commands do not enter history.
