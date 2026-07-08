import type { EnterCommand, ExitCommand } from "./commands";
import { requireContainerComponent, requirePosition, setEntityPosition } from "./components";
import type { SimulationState, TransitionEvent } from "./types";
import { assertValidSimulationState, chooseContainerEntrance } from "./worldGraph";

export interface RecursiveTransitionResolution {
  readonly accepted: boolean;
  readonly state: SimulationState;
  readonly events: readonly TransitionEvent[];
  readonly reason?: string;
}

export function enterContainer(state: SimulationState, command: EnterCommand): RecursiveTransitionResolution {
  const actorId = command.actorId ?? state.playerId;
  const actorPosition = requirePosition(state, actorId);
  const containerPosition = requirePosition(state, command.containerId);
  const container = requireContainerComponent(state, command.containerId);

  if (actorPosition.worldId !== containerPosition.worldId || actorPosition.worldId !== state.activeWorldId) {
    return {
      accepted: false,
      state,
      events: [],
      reason: "container-not-in-active-world",
    };
  }

  const entrance = chooseContainerEntrance(container);
  const nextState = setEntityPosition(
    {
      ...state,
      activeWorldId: container.innerWorldId,
      focusPath: [...state.focusPath, command.containerId],
    },
    actorId,
    {
      worldId: container.innerWorldId,
      x: entrance.x,
      y: entrance.y,
    },
  );

  assertValidSimulationState(nextState);

  return {
    accepted: true,
    state: nextState,
    events: [
      {
        type: "enter",
        actorId,
        containerId: command.containerId,
        fromWorldId: actorPosition.worldId,
        toWorldId: container.innerWorldId,
      },
    ],
  };
}

export function exitContainer(state: SimulationState, command: ExitCommand): RecursiveTransitionResolution {
  const actorId = command.actorId ?? state.playerId;
  const actorPosition = requirePosition(state, actorId);
  const lastContainerId = state.focusPath.at(-1);

  if (lastContainerId !== command.containerId) {
    return {
      accepted: false,
      state,
      events: [],
      reason: "container-is-not-active-parent",
    };
  }

  const containerPosition = requirePosition(state, command.containerId);
  const container = requireContainerComponent(state, command.containerId);

  if (container.innerWorldId !== actorPosition.worldId || container.innerWorldId !== state.activeWorldId) {
    return {
      accepted: false,
      state,
      events: [],
      reason: "actor-is-not-inside-container-world",
    };
  }

  const nextState = setEntityPosition(
    {
      ...state,
      activeWorldId: containerPosition.worldId,
      focusPath: state.focusPath.slice(0, -1),
    },
    actorId,
    {
      worldId: containerPosition.worldId,
      x: containerPosition.x,
      y: containerPosition.y,
    },
  );

  assertValidSimulationState(nextState);

  return {
    accepted: true,
    state: nextState,
    events: [
      {
        type: "exit",
        actorId,
        containerId: command.containerId,
        fromWorldId: actorPosition.worldId,
        toWorldId: containerPosition.worldId,
      },
    ],
  };
}
