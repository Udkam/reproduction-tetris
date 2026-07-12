import { getContainerComponent, getPosition, getVisualComponent } from "../core/components";
import type { SimulationState, WorldAddress } from "../core/types";
import { getEntitiesInWorld, resolveWorldAddress } from "../core/worldGraph";
import { worldAddressKey, type EntityProjection, type WorldProjection } from "./types";

export function projectWorldOccurrence(
  state: SimulationState,
  address: WorldAddress,
  depth: number,
  maxDepth: number,
  activeAddress: WorldAddress = { rootWorldId: state.rootWorldId, containerPath: [...state.focusPath] },
): WorldProjection {
  if (address.rootWorldId !== state.rootWorldId) {
    throw new Error("Projection root address does not match simulation state.");
  }

  const worldId = resolveWorldAddress(state, address.containerPath);
  const world = worldId ? state.worlds[worldId] : undefined;
  if (!world || !worldId) {
    throw new Error("Projection address does not resolve to a world.");
  }

  const entities: EntityProjection[] = getEntitiesInWorld(state, worldId).flatMap((entity) => {
    const position = getPosition(state, entity.id);
    const visual = getVisualComponent(state, entity.id);
    if (!position || !visual) {
      return [];
    }

    const container = getContainerComponent(state, entity.id);
    const occurrence = { world: address, entityId: entity.id } as const;
    const projected = {
      occurrence,
      entity: {
        id: entity.id,
        kind: visual.kind,
        bounds: { x: position.x, y: position.y, width: 1, height: 1 },
        ...(container ? { innerWorldId: container.innerWorldId } : {}),
      },
    } satisfies EntityProjection;

    // maxDepth bounds presentation only; every visible occurrence keeps its
    // complete root-plus-containerPath identity.
    if (!container || depth >= maxDepth) {
      return [projected];
    }

    return [{
      ...projected,
      childWorld: projectWorldOccurrence(
        state,
        { rootWorldId: address.rootWorldId, containerPath: [...address.containerPath, entity.id] },
        depth + 1,
        maxDepth,
        activeAddress,
      ),
    }];
  });

  return {
    projectionId: worldAddressKey(address),
    world: { id: world.id, paletteId: world.paletteId, size: world.size },
    address,
    activeAddress,
    depth,
    entities,
  };
}
