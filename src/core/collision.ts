import { nextPosition } from "./grid";
import { getEntitiesInWorld, isPositionInsideWorld } from "./worldGraph";
import type { Direction, Entity, EntityId, GridPosition, SimulationState } from "./types";

export interface Occupancy {
  readonly position: GridPosition;
  readonly solids: readonly Entity[];
}

export type PushChainResolution =
  | { readonly kind: "not-applicable" }
  | { readonly kind: "blocked"; readonly code: "target-out-of-bounds" | "target-solid-not-pushable" | "push-chain-out-of-bounds"; readonly attemptedPosition: GridPosition }
  | { readonly kind: "accepted"; readonly chain: readonly { readonly entity: Entity; readonly from: GridPosition; readonly to: GridPosition }[] };

export function getSolidOccupantsAt(
  state: SimulationState,
  position: GridPosition,
  excludedEntityId?: EntityId,
): readonly Entity[] {
  return getEntitiesInWorld(state, position.worldId).filter((entity) => {
    if (entity.id === excludedEntityId || !state.components.solids[entity.id]) {
      return false;
    }
    const entityPosition = state.components.positions[entity.id];
    return entityPosition?.x === position.x && entityPosition.y === position.y;
  });
}

export function getOccupancy(
  state: SimulationState,
  position: GridPosition,
  excludedEntityId?: EntityId,
): Occupancy {
  return { position, solids: getSolidOccupantsAt(state, position, excludedEntityId) };
}

export function resolvePushChain(
  state: SimulationState,
  target: GridPosition,
  direction: Direction,
  actorId: EntityId,
): PushChainResolution {
  if (!isPositionInsideWorld(state, target)) {
    return { kind: "not-applicable" };
  }
  const chain: { entity: Entity; from: GridPosition; to: GridPosition }[] = [];
  let cursor = target;
  const initialSolids = getSolidOccupantsAt(state, cursor, actorId);
  if (initialSolids.length === 0) {
    return { kind: "not-applicable" };
  }
  while (true) {
    const solids = getSolidOccupantsAt(state, cursor, actorId);
    if (solids.length === 0) {
      return { kind: "accepted", chain };
    }
    if (solids.some((entity) => !state.components.pushables[entity.id])) {
      return { kind: "blocked", code: "target-solid-not-pushable", attemptedPosition: cursor };
    }
    for (const entity of solids) {
      const from = state.components.positions[entity.id];
      if (!from) {
        return { kind: "blocked", code: "target-solid-not-pushable", attemptedPosition: cursor };
      }
      const to = nextPosition(from, direction);
      if (!isPositionInsideWorld(state, to)) {
        return { kind: "blocked", code: "push-chain-out-of-bounds", attemptedPosition: to };
      }
      chain.push({ entity, from, to });
    }
    cursor = nextPosition(cursor, direction);
  }
}
