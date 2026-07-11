# Recursive Gameplay Rules and Engine Audit

Status: proposal only. This document specifies a clean-room, evidence-backed
target for an original recursive-puzzle study; it does not authorize product
code or reproduce Patrick's Parabox implementation, content, assets, UI copy,
or level layouts.

## Scope and evidence

Baseline audited: `3b23df3` (`main` / `origin/main`), Stage 6 renderer
fidelity alignment. The core is a useful deterministic prototype, but it is
not yet a safe or complete recursive rules engine.

Primary sources consulted on 2026-07-11:

| Source | Evidence used | Constraint for this study |
| --- | --- | --- |
| [Official Steam store page](https://store.steampowered.com/app/1260520/Patricks_Parabox/) | The official description explicitly names recursive boxes, pushing boxes into and out of each other, and self-containing boxes. | Preserve those as research goals, not copied behaviour or content. |
| [Official custom-level documentation](https://www.patricksparabox.com/custom-levels/) | The editor documents a serializable `attempt_order`, explicit enter/exit tooling, reference blocks, optional infinite enter/exit fields, and log-based diagnosis for loading failures. | Treat priority, links, cycle policy, and validation as explicit data/contracts rather than hidden renderer or input behaviour. Do not adopt the file format, identifiers, or game code. |

The public sources establish the mechanic family, not a complete implementation
specification. All details below are original-engine decisions that favor
determinism, testability, and staged delivery.

## Baseline audit

| Area | Evidence | Finding | Risk |
| --- | --- | --- | --- |
| Normal movement | `src/core/movementResolver.ts`, `collision.ts` | Same-world empty moves and finite push chains work, but `Move(actorId)` accepts any positioned entity and does not require the actor to be in `activeWorldId`. | High: inactive worlds or non-player entities can be mutated through public command data. |
| Interaction priority | `commands.ts`, `movementResolver.ts`, `recursiveTransitions.ts` | Movement and enter/exit are unrelated commands; there is no data-defined way to decide whether contact means push, enter, or another interaction. | High: the prototype cannot express rule priority or teach it consistently. |
| Enter | `recursiveTransitions.ts` | `Enter` accepts any container in the active world, regardless of adjacency; missing entrances default to `(0,0)`; invalid or occupied entrance cells reach `assertValidSimulationState` and can throw. | Critical: input can teleport and malformed/occupied data can crash instead of returning a rejected result. |
| Exit | `recursiveTransitions.ts` | `Exit` verifies the last focus container and a free adjacent parent cell, but it can be requested from any location in the inner world and derives its facing from the first present entrance. | High: port semantics are incomplete and direction selection is not a stable contract. |
| Push-in / push-out | `collision.ts`, `movementResolver.ts`, `recursiveTransitions.ts` | No resolver transfers an entity across a container boundary. Moving a container only moves it within its current world. | Critical feature gap against the stated recursive-mechanic research target. |
| Parent updates | `worldGraph.ts` | Parent relationships are correctly derived from container position and `innerWorldId`; `getWorldParentContainers` is intentionally plural. | Medium: do not add a mutable single parent pointer; transfers must update location atomically and recompute edges. |
| Cycles and self-containment | `worldGraph.ts`, `worldProjection.ts` | Per-container `allowsRecursiveCycle` can admit cycles, and render recursion is only depth-limited. A position is keyed by `worldId` alone, so the same logical world at two recursive addresses cannot distinguish an actor occurrence. | Critical: current state cannot safely model self-containment or addressed cyclic play. |
| Active focus | `SimulationState.focusPath`, `simulationProjection.ts` | Focus-path validation exists, but projection always starts at root and does not expose active route metadata. | High: runtime/camera cannot target arbitrary nested active focus. |
| History and replay | `history.ts`, `replay.ts`, `EventPipeline.ts` | Immutable snapshots and stable hashes are sound for the small prototype. Undo/redo events are reconstructed only by the runtime pipeline; direct reducer consumers receive no inverse/replay event trace. | Medium: replay proof is too weak for recursive transfers and visual synchronization. |
| Projection/event handoff | `TransitionEvent`, `simulationProjection.ts`, `PixiApp.ts` | Events contain entity IDs and world IDs but no projection address. Renderer interpolation maps occurrences by entity ID, so repeated projections overwrite each other. | Critical before aliases/cycles/deeper recursion. |
| Runtime integration | `GameRuntime.ts`, `PixiApp.ts` | `E` always targets `container-b`; transition geometry is only created for root `container-b`; input unlocks when the 500–560 ms animation plan ends while `RecursiveTransitionRenderer` runs a separate 980 ms timeline. | Critical: deeper containers cannot work, and queued input can run during a still-active camera transition. |
| Invalid data | `createSimulationState`, component helpers | State validation catches several graph and overlap errors but does not require positive dimensions or a positioned player, and command helpers can throw for unknown/malformed IDs. | High: imported level data has no structured validation boundary. |
| Win semantics | `win.ts`, `transitions.ts` | All declared goals must be occupied by a matching visual kind, including nested ones. Occupancy chooses the first entity at a cell and no solved transition is emitted; the only `success` audio cue is attached to reset. | High: completion is ambiguous in edge cases and not connected to history or runtime feedback. |

## Revised rules contract

### 1. State, location, and focus

- A world is a serializable finite grid with strictly positive integer width and
  height. Its geometry never contains renderer state.
- A container is an entity with an `innerWorldId` and one or more validated,
  directional ports. A port states both its inner landing cell and the outward
  crossing direction. The container's parent-world location remains the outer
  anchor; no mutable `parentWorldId` is stored on the child world.
- Every runtime location has a `WorldAddress`: root ID plus the ordered
  container-edge path used to reach that occurrence. `worldId` alone remains a
  canonical graph identity, not an occurrence identity.
- The active focus is an exact `WorldAddress`, with its world ID derivable from
  the path. It changes only after an accepted portal transaction. Camera and
  projection consume it read-only.
- Initial gameplay scope is acyclic. A level declares `cycleMode: "forbid"`.
  Self-containment and other cycles remain rejected until address-aware actor
  locations, cycle-safe transfers, and the bounded-cycle test suite below are
  approved together. Remove the current per-container boolean rather than
  treating it as sufficient proof of cycle support.

### 2. Commands and deterministic priority

- External gameplay input is `Step(direction)`, `Undo`, `Redo`, and `Reset`.
  Explicit `Enter(containerId)` / `Exit(containerId)` may remain temporary test
  adapters during migration, but must not be keyboard-facing game controls.
- `Step` first validates the active controlled actor and the active address.
  A direct move into an empty in-bounds cell succeeds immediately.
- Otherwise the engine evaluates only applicable interactions in a serializable
  level `interactionOrder`. The initial supported names are `push`, `enter`,
  and `exit`; the list has unique known names and all listed mechanics must be
  enabled by that level. This is an original data contract inspired only by the
  official evidence that priority is explicit level data.
- Each candidate returns `not-applicable`, `accepted(transaction)`, or terminal
  `blocked(reason)`. The first accepted or terminal blocked candidate wins;
  later candidates never observe a partial state. The chosen rule name is part
  of the result and replay trace.
- A regular push is finite and same-address: every pushed solid must be
  pushable and the final landing cell must be valid and free. Chain changes are
  applied from the far end atomically. A chain never silently crosses a port.
- Enter is applicable only when the directional step targets that container's
  validated outer anchor and the chosen port has a valid, free inner landing
  cell. Exit is applicable only when the actor steps outward through the active
  address's declared inner port. No command may teleport to an arbitrary
  container or leave from an arbitrary inner cell.

### 3. Push-in, push-out, and parent updates

- These are explicit transfer transactions, not special renderer effects.
  `push-in` transfers one movable entity through a selected receiving
  container's port into its inner world; `push-out` transfers one movable
  entity through a selected exit port into the parent world. The mover's inner
  world reference, if any, travels with the entity.
- A transfer checks source address, destination address, valid destination
  cell, collision policy, focus validity, and cycle policy before mutation. If
  a parent-side push chain is allowed by the level rule, its complete outcome
  is included in the same transaction; otherwise a full destination blocks the
  transfer. There is no partial migration.
- A world-bearing container changes graph parent solely by changing its
  location. The edge relation is recomputed from its new location plus
  `innerWorldId`; derived parent queries may return multiple aliases and must
  never be collapsed to one stored parent.

### 4. Total dispatch, history, and win state

- Untrusted level data and user commands receive typed results, never raw
  `require*`/assertion exceptions. Programmer assertions remain allowed only
  behind validated construction paths.
- Successful transactions are atomic and append one history record containing
  command, chosen rule, before/after hashes, before/after focus addresses,
  semantic events, and win transition. Rejected commands retain the exact
  prior state and history, but may emit one transient `blocked` event.
- Undo derives a reversed trace from the stored record; redo reuses the stored
  forward trace. Replay reports each command's accepted/rejected disposition,
  rule, state hash, and final win state rather than only an accepted count.
- A level has an explicit nonempty required-goal set. Win is a pure predicate:
  every required goal has exactly one qualifying occupant under the declared
  goal predicate, independent of camera focus. A `winChanged` event fires only
  on false-to-true or true-to-false crossings; reset is not a success cue.

### 5. Events, projection, and runtime ownership

- Semantic events contain source and destination `EntityAddress`/`WorldAddress`
  values, not only canonical entity IDs. They describe move, push, transfer,
  focus change, blocked result, and win change without camera pixels or timing.
- Projection returns a bounded tree whose nodes and entity occurrences carry
  stable address keys. Interpolation, hit lookup, and camera targeting key by
  address, so a canonical entity visible through multiple routes cannot alias.
- Renderer derives camera geometry from the event's addressed route. It has no
  knowledge of `container-b` or any other level ID.
- Runtime owns a single visual-completion gate. Queued commands remain locked
  until both entity animation and addressed camera/portal transition complete
  or cancel coherently; a separate camera timeline cannot outlive command lock.

## Invariant and test matrix

| Domain | Required cases | Gate |
| --- | --- | --- |
| Construction | positive dimensions; unique IDs; all referenced entities/worlds/ports exist; positioned active player; valid port cells; no illegal overlap; nonempty goals | loader returns typed diagnostics, no exception escaping import boundary |
| Normal step | empty cell; wall; non-player/inactive actor command; direct move versus each ordered interaction | one result, unchanged state on rejection, chosen rule recorded |
| Priority | each permutation supported by a fixture; duplicate/unknown/disabled priority member; applicable candidate blocked | deterministic winner and no fallback after terminal block |
| Push chains | one, multiple, wall, nonpushable member, edge, container in chain, no cross-port partial change | far-to-near atomic moves and exact event order |
| Enter/exit | every directional port; nonadjacent request; absent/invalid/occupied landing; wrong focus; occupied parent landing | safe blocked result, no teleport, no history write |
| Transfers | push-in/out success; occupied source/destination; parent-side chain; container carrying an inner world; rejected cycle | source, graph, focus, and destination change together or not at all |
| Parent graph | moving/transfering a world-bearing container; aliases; focus after parent change | derived parent query remains correct; no stored parent pointer |
| Cycles | load-time forbidden self/two-world cycle; later bounded self and repeated-address fixtures | initial release rejects all; later release proves distinct addresses and finite projection budget |
| Focus/projection | depth 1, depth 2, sibling aliases, addressed camera lookup, active route after enter/exit | no `container-b` special case and no entity-ID interpolation collision |
| History/replay | each accepted rule; rejected command; undo/redo focus and transfer; reset; deterministic trace hashes | replay final hash and per-step trace equal direct dispatch |
| Win | zero goal rejected; wrong occupant; multiple occupants; nested required goal; solve/undo/redo/reset crossings | pure predicate and precisely one `winChanged` transition per crossing |
| Runtime | command during move, block, enter, exit; camera longer/shorter than entity motion; cancellation/destroy | queue cannot dispatch until all visual work settles; no stuck lock |
| Boundaries | core import scan; projection address tests; browser canvas smoke only after implementation | core stays platform-free; renderer only reads projections/events |

## Minimal stability-fix sequence

No slice begins until the coordinator approves it and QA reviews the resulting
commit. Order is deliberate: do not add puzzle content or broad recursion
before the prototype is safe to command and observe.

1. **Reproducible baseline.** Repair the out-of-sync lockfile in a dedicated,
   reviewable change, then require `npm.cmd ci`, typecheck, tests, and build.
   The current baseline cannot clean-install because it lacks
   `@emnapi/core@1.11.1` and `@emnapi/runtime@1.11.1` in the lockfile.
2. **Total command and visual-lock patch.** Make malformed/illegal enter, exit,
   actor, port, and landing cases return structured blocked results; assert the
   active actor/address; remove hard-coded `container-b` command selection;
   make runtime completion wait for every camera and entity timeline. Preserve
   current acyclic move/push behaviour; do not add push-in/out yet.
3. **Addressed event/projection patch.** Add focus-aware projection requests,
   address keys, and route-bearing events; replace entity-ID-only animation
   mapping and root-only transition geometry. Verify at least two nested,
   non-hard-coded containers in original test fixtures.
4. **Acyclic recursive interaction patch.** Introduce validated port data,
   `Step` priority, atomic push-in/out, parent recomputation, win crossings,
   and trace-rich replay. Keep `cycleMode: "forbid"`.
5. **Cycle design gate, then implementation.** Before enabling self-containment,
   approve an address-aware mutable-location model, cycle budget, and a full
   regression suite. This is a separate feature slice, not a boolean toggle.

## Acceptance criteria for coordinator approval

- The approved first implementation slice is limited to one numbered sequence
  item above and names its tests before code changes begin.
- No production slice uses original-game source, assets, layout data, text, or
  level format.
- `Enter`/`Exit` cannot throw from malformed user/level inputs, cannot target
  arbitrary containers, and cannot create a history entry when rejected.
- No runtime or renderer source references `container-b`; all transition and
  projection lookup is address-based.
- A command queued during a 980 ms portal camera transition cannot dispatch at
  the current 500–560 ms animation-plan boundary.
- The cyclic mechanic is explicitly rejected until its independent design gate
  passes; no release represents the current `worldId`-only position model as
  self-containment support.
- Independent QA receives the worker SHA, verifies the matrix cells applicable
  to the slice, and reports accept/reject to coordinator thread
  `019f4deb-7e83-7583-8cd5-8e6f075bc331`.

## Dependencies and non-goals

- Level design thread `019f4e80-145c-7b53-b675-44b03aa4f625` must keep level
  schema and campaigns provisional until the acyclic interaction contract is
  approved.
- Frontend thread `019f4e80-145a-7520-81e1-41a45b2bec13` owns visual design;
  this contract requires addressed camera/projection hooks but does not dictate
  visual material or assets.
- QA thread `019f4e80-1462-7b32-8146-19ded692836c` independently decides
  whether a worker change satisfies its evidence gate.
- This proposal does not implement level serialization, a campaign, UI, assets,
  or production engine code.
