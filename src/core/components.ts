import type {
  ContainerComponent,
  EntityId,
  GridPosition,
  PlayerComponent,
  PositionComponent,
  SimulationState,
  VisualComponent,
} from "./types";

export function getPosition(state: SimulationState, entityId: EntityId): PositionComponent | undefined {
  return state.components.positions[entityId];
}

export function requirePosition(state: SimulationState, entityId: EntityId): PositionComponent {
  const position = getPosition(state, entityId);
  if (!position) {
    throw new Error(`Entity "${entityId}" has no position component.`);
  }

  return position;
}

export function getContainerComponent(state: SimulationState, entityId: EntityId): ContainerComponent | undefined {
  return state.components.containers[entityId];
}

export function requireContainerComponent(state: SimulationState, entityId: EntityId): ContainerComponent {
  const container = getContainerComponent(state, entityId);
  if (!container) {
    throw new Error(`Entity "${entityId}" is not a recursive container.`);
  }

  return container;
}

export function getPlayerComponent(state: SimulationState, entityId: EntityId): PlayerComponent | undefined {
  return state.components.players[entityId];
}

export function getVisualComponent(state: SimulationState, entityId: EntityId): VisualComponent | undefined {
  return state.components.visuals[entityId];
}

export function setEntityPosition(
  state: SimulationState,
  entityId: EntityId,
  position: GridPosition,
): SimulationState {
  return {
    ...state,
    components: {
      ...state.components,
      positions: {
        ...state.components.positions,
        [entityId]: position,
      },
    },
  };
}
