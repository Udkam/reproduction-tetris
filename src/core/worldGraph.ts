import { getContainerComponent, getPosition } from "./components";
import { validateInitialSimulationState, type SimulationLoadResult } from "./validation";
import type { Entity, EntityId, GridPosition, SimulationState, WorldId, WorldNode } from "./types";

export function createSimulationState(state: SimulationState): SimulationState {
  return cloneSimulationState(state);
}

export function loadSimulationState(input: unknown): SimulationLoadResult {
  const preflight = validateInitialSimulationState(input);
  if (preflight.kind === "invalid") return { kind: "rejected", diagnostics: preflight.diagnostics };
  try {
    const cloned = cloneSimulationState(input as SimulationState);
    const validation = validateInitialSimulationState(cloned);
    return validation.kind === "valid" ? { kind: "accepted", state: cloned } : { kind: "rejected", diagnostics: validation.diagnostics };
  } catch {
    return { kind: "rejected", diagnostics: [{ code: "invalid-level-data", message: "state clone failed structural validation" }] };
  }
}

export function cloneSimulationState(state: SimulationState): SimulationState {
  return {
    version: state.version,
    rootWorldId: state.rootWorldId,
    activeWorldId: state.activeWorldId,
    playerId: state.playerId,
    focusPath: [...state.focusPath],
    ruleSet: {
      version: state.ruleSet.version,
      cycleMode: state.ruleSet.cycleMode,
      ruleEnablement: { ...state.ruleSet.ruleEnablement },
      interactionPriority: [...state.ruleSet.interactionPriority],
    },
    portTables: [...state.portTables].sort((left, right) => compareIdentifiers(left.containerId, right.containerId)).map((table) => ({
      containerId: table.containerId,
      ports: [...table.ports].sort((left, right) => compareIdentifiers(left.id, right.id)).map((port) => ({
        id: port.id,
        outerApproach: port.outerApproach,
        innerLanding: { ...port.innerLanding },
        innerExit: port.innerExit,
      })),
    })),
    worlds: Object.fromEntries(Object.entries(state.worlds).map(([id, world]) => [id, { ...world, size: { ...world.size } }])),
    entities: Object.fromEntries(Object.entries(state.entities).map(([id, entity]) => [id, { ...entity }])),
    components: {
      positions: Object.fromEntries(Object.entries(state.components.positions).map(([id, position]) => [id, { ...position }])),
      containers: Object.fromEntries(Object.entries(state.components.containers).map(([id, container]) => [id, { ...container }])),
      solids: Object.fromEntries(Object.entries(state.components.solids).map(([id, solid]) => [id, { ...solid }])),
      pushables: Object.fromEntries(Object.entries(state.components.pushables).map(([id, pushable]) => [id, { ...pushable }])),
      players: Object.fromEntries(Object.entries(state.components.players).map(([id, player]) => [id, { ...player }])),
      goals: Object.fromEntries(Object.entries(state.components.goals).map(([id, goal]) => [id, { ...goal }])),
      visuals: Object.fromEntries(Object.entries(state.components.visuals).map(([id, visual]) => [id, { ...visual }])),
    },
  };
}

export function getWorld(state: SimulationState, worldId: WorldId): WorldNode | undefined {
  return state.worlds[worldId];
}

export function getEntity(state: SimulationState, entityId: EntityId): Entity | undefined {
  return state.entities[entityId];
}

export function getEntitiesInWorld(state: SimulationState, worldId: WorldId): readonly Entity[] {
  return Object.values(state.entities)
    .filter((entity) => state.components.positions[entity.id]?.worldId === worldId)
    .sort((left, right) => compareIdentifiers(left.id, right.id));
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
    .sort((left, right) => compareIdentifiers(left.entityId, right.entityId));
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

export function createStage3BSimulationState(): SimulationState {
  const fixture: SimulationState = {
    version: 1,
    rootWorldId: "world-a",
    activeWorldId: "world-a",
    playerId: "player-a",
    focusPath: [],
    ruleSet: {
      version: 1,
      cycleMode: "forbid",
      ruleEnablement: { push: "enabled", enter: "enabled", exit: "enabled" },
      interactionPriority: ["enter", "push", "exit"],
    },
    portTables: [
      {
        containerId: "container-b",
        ports: [{ id: "port-b-south", outerApproach: "down", innerLanding: { x: 2, y: 2 }, innerExit: "up" }],
      },
    ],
    worlds: {
      "world-a": { id: "world-a", paletteId: "void-lab", size: { width: 10, height: 8 } },
      "world-c": { id: "world-c", paletteId: "inner-mint", size: { width: 8, height: 6 } },
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
      containers: { "container-b": { innerWorldId: "world-c" } },
      solids: {
        "player-a": { blocksMovement: true },
        "box-a": { blocksMovement: true },
        "container-b": { blocksMovement: true },
        "box-c": { blocksMovement: true },
      },
      pushables: { "box-a": { pushable: true }, "container-b": { pushable: true }, "box-c": { pushable: true } },
      players: { "player-a": { controlled: true } },
      goals: { "goal-a": { acceptsVisualKind: "box" }, "goal-c": { acceptsVisualKind: "box" } },
      visuals: {
        "player-a": { kind: "player", width: 1.25, height: 1.25, offsetX: 0.1, offsetY: 0.1 },
        "box-a": { kind: "box", width: 1.25, height: 1.25, offsetX: -0.25, offsetY: 0.1 },
        "container-b": { kind: "recursive-container", width: 1.75, height: 1.75, offsetX: 0.35, offsetY: 0.35 },
        "goal-a": { kind: "goal", width: 1.25, height: 1.25, offsetX: 0.1, offsetY: 0.25 },
        "goal-c": { kind: "goal", width: 1.3, height: 1.3 },
        "box-c": { kind: "box", width: 1.35, height: 1.35, offsetX: -0.35, offsetY: 0.2 },
      },
    },
  };

  const loaded = loadSimulationState(fixture);
  return loaded.kind === "accepted" ? loaded.state : createInternalFallbackState();
}

export function resolveWorldAddress(state: SimulationState, address: readonly EntityId[]): WorldId | undefined {
  let worldId = state.rootWorldId;
  for (const containerId of address) {
    const position = getPosition(state, containerId);
    const container = getContainerComponent(state, containerId);
    if (!position || !container || position.worldId !== worldId) {
      return undefined;
    }
    worldId = container.innerWorldId;
  }
  return worldId;
}

function compareIdentifiers(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function createInternalFallbackState(): SimulationState {
  return {
    version: 1,
    rootWorldId: "fallback-world",
    activeWorldId: "fallback-world",
    playerId: "fallback-player",
    focusPath: [],
    ruleSet: { version: 1, cycleMode: "forbid", ruleEnablement: { push: "disabled", enter: "disabled", exit: "disabled" }, interactionPriority: [] },
    portTables: [],
    worlds: { "fallback-world": { id: "fallback-world", paletteId: "void-lab", size: { width: 3, height: 3 } } },
    entities: { "fallback-player": { id: "fallback-player" } },
    components: {
      positions: { "fallback-player": { worldId: "fallback-world", x: 1, y: 1 } },
      containers: {}, solids: { "fallback-player": { blocksMovement: true } }, pushables: {}, players: { "fallback-player": { controlled: true } }, goals: {}, visuals: {},
    },
  };
}
