import type { EnterCommand, ExitCommand } from "./commands";
import { requireContainerComponent, requirePosition, setEntityPosition } from "./components";
import { getSolidOccupantsAt } from "./collision";
import { nextPosition } from "./grid";
import type { SimulationState, TransitionEvent } from "./types";
import { assertValidSimulationState, chooseContainerEntrance, isPositionInsideWorld } from "./worldGraph";

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
        type: "enterWorld",
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
  const exitDirection = Object.values(container.entrances).find(Boolean)?.facing ?? "down";
  const exitPosition = nextPosition(containerPosition, exitDirection);

  if (container.innerWorldId !== actorPosition.worldId || container.innerWorldId !== state.activeWorldId) {
    return {
      accepted: false,
      state,
      events: [],
      reason: "actor-is-not-inside-container-world",
    };
  }

  if (!isPositionInsideWorld(state, exitPosition)) {
    return {
      accepted: false,
      state,
      events: [
        {
          type: "blocked",
          actorId,
          direction: exitDirection,
          attemptedPosition: exitPosition,
          reason: "exit-out-of-bounds",
        },
      ],
      reason: "exit-out-of-bounds",
    };
  }

  const blockers = getSolidOccupantsAt(state, exitPosition, actorId);
  if (blockers.length > 0) {
    return {
      accepted: false,
      state,
      events: [
        {
          type: "blocked",
          actorId,
          direction: exitDirection,
          attemptedPosition: exitPosition,
          reason: "exit-blocked",
        },
      ],
      reason: "exit-blocked",
    };
  }

  const nextState = setEntityPosition(
    {
      ...state,
      activeWorldId: containerPosition.worldId,
      focusPath: state.focusPath.slice(0, -1),
    },
    actorId,
    exitPosition,
  );

  assertValidSimulationState(nextState);

  return {
    accepted: true,
    state: nextState,
    events: [
      {
        type: "exitWorld",
        actorId,
        containerId: command.containerId,
        fromWorldId: actorPosition.worldId,
        toWorldId: containerPosition.worldId,
      },
    ],
  };
}
