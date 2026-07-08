import type { Direction, Entity, EntityId, GridPosition, SimulationState } from "./types";
import { getEntitiesInWorld, isPositionInsideWorld } from "./worldGraph";
import { nextPosition } from "./grid";

export interface Occupancy {
  readonly position: GridPosition;
  readonly solids: readonly Entity[];
}

export type PushChainResolution =
  | {
      readonly type: "empty";
      readonly target: GridPosition;
    }
  | {
      readonly type: "blocked";
      readonly attemptedPosition: GridPosition;
      readonly reason: string;
      readonly blockers: readonly Entity[];
    }
  | {
      readonly type: "push";
      readonly chain: readonly {
        readonly entity: Entity;
        readonly from: GridPosition;
        readonly to: GridPosition;
      }[];
    };

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
  return {
    position,
    solids: getSolidOccupantsAt(state, position, excludedEntityId),
  };
}

export function resolvePushChain(
  state: SimulationState,
  target: GridPosition,
  direction: Direction,
  actorId: EntityId,
): PushChainResolution {
  if (!isPositionInsideWorld(state, target)) {
    return {
      type: "blocked",
      attemptedPosition: target,
      reason: "target-out-of-bounds",
      blockers: [],
    };
  }

  const chain: { entity: Entity; from: GridPosition; to: GridPosition }[] = [];
  let cursor = target;

  while (true) {
    const occupancy = getOccupancy(state, cursor, actorId);

    if (occupancy.solids.length === 0) {
      if (chain.length === 0) {
        return { type: "empty", target };
      }

      return { type: "push", chain };
    }

    const unpushable = occupancy.solids.filter((entity) => !state.components.pushables[entity.id]);
    if (unpushable.length > 0) {
      return {
        type: "blocked",
        attemptedPosition: cursor,
        reason: "target-solid-not-pushable",
        blockers: unpushable,
      };
    }

    for (const entity of occupancy.solids) {
      const from = state.components.positions[entity.id];
      const to = nextPosition(from, direction);

      if (!isPositionInsideWorld(state, to)) {
        return {
          type: "blocked",
          attemptedPosition: to,
          reason: "push-chain-out-of-bounds",
          blockers: [entity],
        };
      }

      chain.push({ entity, from, to });
    }

    cursor = nextPosition(cursor, direction);
  }
}
