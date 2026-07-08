import { getContainerComponent, getPosition } from "./components";
import type {
  ContainerComponent,
  Entity,
  EntityId,
  GridPosition,
  SimulationState,
  WorldId,
  WorldNode,
} from "./types";

const DIRECTION_ORDER = ["up", "right", "down", "left"] as const;

export function createSimulationState(state: SimulationState): SimulationState {
  const cloned = cloneSimulationState(state);
  assertValidSimulationState(cloned);
  return cloned;
}

export function cloneSimulationState(state: SimulationState): SimulationState {
  return {
    version: state.version,
    rootWorldId: state.rootWorldId,
    activeWorldId: state.activeWorldId,
    playerId: state.playerId,
    focusPath: [...state.focusPath],
    worlds: Object.fromEntries(Object.entries(state.worlds).map(([id, world]) => [id, { ...world, size: { ...world.size } }])),
    entities: Object.fromEntries(Object.entries(state.entities).map(([id, entity]) => [id, { ...entity }])),
    components: {
      positions: Object.fromEntries(
        Object.entries(state.components.positions).map(([id, position]) => [id, { ...position }]),
      ),
      containers: Object.fromEntries(
        Object.entries(state.components.containers).map(([id, container]) => [
          id,
          {
            ...container,
            entrances: Object.fromEntries(
              Object.entries(container.entrances).map(([direction, entrance]) => [direction, { ...entrance }]),
            ),
          },
        ]),
      ),
      solids: Object.fromEntries(Object.entries(state.components.solids).map(([id, solid]) => [id, { ...solid }])),
      pushables: Object.fromEntries(
        Object.entries(state.components.pushables).map(([id, pushable]) => [id, { ...pushable }]),
      ),
      players: Object.fromEntries(Object.entries(state.components.players).map(([id, player]) => [id, { ...player }])),
      goals: Object.fromEntries(Object.entries(state.components.goals).map(([id, goal]) => [id, { ...goal }])),
      visuals: Object.fromEntries(Object.entries(state.components.visuals).map(([id, visual]) => [id, { ...visual }])),
    },
  };
}

export function assertValidSimulationState(state: SimulationState) {
  if (state.version !== 1) {
    throw new Error(`Unsupported simulation state version "${state.version}".`);
  }

  if (!state.worlds[state.rootWorldId]) {
    throw new Error(`Root world "${state.rootWorldId}" does not exist.`);
  }

  if (!state.worlds[state.activeWorldId]) {
    throw new Error(`Active world "${state.activeWorldId}" does not exist.`);
  }

  if (!state.entities[state.playerId]) {
    throw new Error(`Player entity "${state.playerId}" does not exist.`);
  }

  if (!state.components.players[state.playerId]) {
    throw new Error(`Player entity "${state.playerId}" has no player component.`);
  }

  assertComponentEntityReferences(state);
  assertPositionReferences(state);
  assertSolidOccupancy(state);
  assertContainerReferences(state);
  assertFocusPath(state);
}

export function getWorld(state: SimulationState, worldId: WorldId): WorldNode | undefined {
  return state.worlds[worldId];
}

export function requireWorld(state: SimulationState, worldId: WorldId): WorldNode {
  const world = getWorld(state, worldId);
  if (!world) {
    throw new Error(`World "${worldId}" does not exist.`);
  }

  return world;
}

export function getEntity(state: SimulationState, entityId: EntityId): Entity | undefined {
  return state.entities[entityId];
}

export function requireEntity(state: SimulationState, entityId: EntityId): Entity {
  const entity = getEntity(state, entityId);
  if (!entity) {
    throw new Error(`Entity "${entityId}" does not exist.`);
  }

  return entity;
}

export function getEntitiesInWorld(state: SimulationState, worldId: WorldId): readonly Entity[] {
  return Object.values(state.entities)
    .filter((entity) => state.components.positions[entity.id]?.worldId === worldId)
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function getWorldParentContainers(
  state: SimulationState,
  worldId: WorldId,
): readonly { readonly entityId: EntityId; readonly parentWorldId: WorldId }[] {
  return Object.entries(state.components.containers)
    .flatMap(([entityId, container]) => {
      if (container.innerWorldId !== worldId) {
        return [];
      }

      const position = getPosition(state, entityId);
      return position ? [{ entityId, parentWorldId: position.worldId }] : [];
    })
    .sort((left, right) => left.entityId.localeCompare(right.entityId));
}

export function findEntityAt(
  state: SimulationState,
  position: GridPosition,
  excludedEntityId?: EntityId,
): Entity | undefined {
  return getEntitiesInWorld(state, position.worldId).find((entity) => {
    if (entity.id === excludedEntityId) {
      return false;
    }

    const entityPosition = getPosition(state, entity.id);
    return entityPosition?.x === position.x && entityPosition.y === position.y;
  });
}

export function isPositionInsideWorld(state: SimulationState, position: GridPosition): boolean {
  const world = getWorld(state, position.worldId);
  return Boolean(
    world &&
      Number.isInteger(position.x) &&
      Number.isInteger(position.y) &&
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < world.size.width &&
      position.y < world.size.height,
  );
}

export function chooseContainerEntrance(container: ContainerComponent): { readonly x: number; readonly y: number } {
  for (const direction of DIRECTION_ORDER) {
    const entrance = container.entrances[direction];
    if (entrance) {
      return { x: entrance.x, y: entrance.y };
    }
  }

  return { x: 0, y: 0 };
}

export function createStage3BSimulationState(): SimulationState {
  return createSimulationState({
    version: 1,
    rootWorldId: "world-a",
    activeWorldId: "world-a",
    playerId: "player-a",
    focusPath: [],
    worlds: {
      "world-a": {
        id: "world-a",
        paletteId: "void-lab",
        size: { width: 10, height: 8 },
      },
      "world-c": {
        id: "world-c",
        paletteId: "inner-mint",
        size: { width: 8, height: 6 },
      },
    },
    entities: {
      "player-a": { id: "player-a" },
      "box-a": { id: "box-a" },
      "container-b": { id: "container-b" },
      "goal-a": { id: "goal-a" },
      "goal-c": { id: "goal-c" },
      "box-c": { id: "box-c" },
    },
    components: {
      positions: {
        "player-a": { worldId: "world-a", x: 2, y: 2 },
        "box-a": { worldId: "world-a", x: 6, y: 2 },
        "container-b": { worldId: "world-a", x: 5, y: 4 },
        "goal-a": { worldId: "world-a", x: 1, y: 5 },
        "goal-c": { worldId: "world-c", x: 1, y: 1 },
        "box-c": { worldId: "world-c", x: 5, y: 3 },
      },
      containers: {
        "container-b": {
          innerWorldId: "world-c",
          entrances: {
            down: { x: 2, y: 2, facing: "down" },
          },
          allowsRecursiveCycle: false,
        },
      },
      solids: {
        "player-a": { blocksMovement: true },
        "box-a": { blocksMovement: true },
        "container-b": { blocksMovement: true },
        "box-c": { blocksMovement: true },
      },
      pushables: {
        "box-a": { pushable: true },
        "container-b": { pushable: true },
        "box-c": { pushable: true },
      },
      players: {
        "player-a": { controlled: true },
      },
      goals: {
        "goal-a": { acceptsVisualKind: "box" },
        "goal-c": { acceptsVisualKind: "box" },
      },
      visuals: {
        "player-a": { kind: "player", width: 1.25, height: 1.25, offsetX: 0.1, offsetY: 0.1 },
        "box-a": { kind: "box", width: 1.25, height: 1.25, offsetX: -0.25, offsetY: 0.1 },
        "container-b": { kind: "recursive-container", width: 1.75, height: 1.75, offsetX: 0.35, offsetY: 0.35 },
        "goal-a": { kind: "goal", width: 1.25, height: 1.25, offsetX: 0.1, offsetY: 0.25 },
        "goal-c": { kind: "goal", width: 1.3, height: 1.3 },
        "box-c": { kind: "box", width: 1.35, height: 1.35, offsetX: -0.35, offsetY: 0.2 },
      },
    },
  });
}

function assertComponentEntityReferences(state: SimulationState) {
  for (const [componentName, components] of Object.entries(state.components)) {
    for (const entityId of Object.keys(components)) {
      if (!state.entities[entityId]) {
        throw new Error(`Component "${componentName}" references unknown entity "${entityId}".`);
      }
    }
  }
}

function assertPositionReferences(state: SimulationState) {
  for (const [entityId, position] of Object.entries(state.components.positions)) {
    if (!isPositionInsideWorld(state, position)) {
      throw new Error(`Entity "${entityId}" has invalid position in world "${position.worldId}".`);
    }
  }
}

function assertSolidOccupancy(state: SimulationState) {
  const occupied = new Map<string, EntityId>();

  for (const entityId of Object.keys(state.components.solids)) {
    const position = getPosition(state, entityId);
    if (!position) {
      continue;
    }

    const key = `${position.worldId}:${position.x}:${position.y}`;
    const existingEntityId = occupied.get(key);

    if (existingEntityId) {
      throw new Error(
        `Impossible position: solid entities "${existingEntityId}" and "${entityId}" overlap at "${key}".`,
      );
    }

    occupied.set(key, entityId);
  }
}

function assertContainerReferences(state: SimulationState) {
  const edges = getContainmentEdges(state);

  for (const [entityId, container] of Object.entries(state.components.containers)) {
    if (!state.worlds[container.innerWorldId]) {
      throw new Error(`Container "${entityId}" references unknown inner world "${container.innerWorldId}".`);
    }

    const ownerWorldId = getPosition(state, entityId)?.worldId;
    if (!ownerWorldId) {
      throw new Error(`Container "${entityId}" has no owner world position.`);
    }

    if (!container.allowsRecursiveCycle && hasWorldPath(edges, container.innerWorldId, ownerWorldId)) {
      throw new Error(`Container "${entityId}" creates an unsupported recursive cycle.`);
    }
  }
}

function assertFocusPath(state: SimulationState) {
  let currentWorldId = state.rootWorldId;

  for (const containerId of state.focusPath) {
    const position = getPosition(state, containerId);
    const container = getContainerComponent(state, containerId);

    if (!position || !container || position.worldId !== currentWorldId) {
      throw new Error(`Focus path references invalid container "${containerId}".`);
    }

    currentWorldId = container.innerWorldId;
  }

  if (currentWorldId !== state.activeWorldId) {
    throw new Error(`Focus path resolves to "${currentWorldId}", not active world "${state.activeWorldId}".`);
  }
}

function getContainmentEdges(state: SimulationState): ReadonlyMap<WorldId, readonly WorldId[]> {
  const edgeEntries = new Map<WorldId, WorldId[]>();

  for (const [entityId, container] of Object.entries(state.components.containers)) {
    const ownerWorldId = getPosition(state, entityId)?.worldId;
    if (!ownerWorldId) {
      continue;
    }

    const targets = edgeEntries.get(ownerWorldId) ?? [];
    targets.push(container.innerWorldId);
    edgeEntries.set(ownerWorldId, targets);
  }

  return edgeEntries;
}

function hasWorldPath(edges: ReadonlyMap<WorldId, readonly WorldId[]>, fromWorldId: WorldId, toWorldId: WorldId) {
  const visited = new Set<WorldId>();
  const stack = [fromWorldId];

  while (stack.length > 0) {
    const currentWorldId = stack.pop();
    if (!currentWorldId || visited.has(currentWorldId)) {
      continue;
    }

    if (currentWorldId === toWorldId) {
      return true;
    }

    visited.add(currentWorldId);
    stack.push(...(edges.get(currentWorldId) ?? []));
  }

  return false;
}
