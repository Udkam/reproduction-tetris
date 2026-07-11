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

export function getContainerComponent(state: SimulationState, entityId: EntityId): ContainerComponent | undefined {
  return state.components.containers[entityId];
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
