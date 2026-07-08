import type { MoveCommand } from "./commands";
import { requirePosition, setEntityPosition } from "./components";
import type { GridPosition, SimulationState, TransitionEvent } from "./types";
import { findEntityAt, isPositionInsideWorld } from "./worldGraph";

export interface MovementResolution {
  readonly accepted: boolean;
  readonly state: SimulationState;
  readonly events: readonly TransitionEvent[];
  readonly reason?: string;
}

export function moveActor(state: SimulationState, command: MoveCommand): MovementResolution {
  const actorId = command.actorId ?? state.playerId;
  const from = requirePosition(state, actorId);
  const to = nextPosition(from, command.direction);

  if (!isPositionInsideWorld(state, to)) {
    return {
      accepted: false,
      state,
      events: [],
      reason: "target-out-of-bounds",
    };
  }

  const blocker = findEntityAt(state, to, actorId);
  if (blocker && state.components.solids[blocker.id]) {
    return {
      accepted: false,
      state,
      events: [],
      reason: "blocked-pushing-not-implemented",
    };
  }

  return {
    accepted: true,
    state: setEntityPosition(state, actorId, to),
    events: [{ type: "move", entityId: actorId, from, to }],
  };
}

export function nextPosition(position: GridPosition, direction: MoveCommand["direction"]): GridPosition {
  if (direction === "up") {
    return { ...position, y: position.y - 1 };
  }

  if (direction === "down") {
    return { ...position, y: position.y + 1 };
  }

  if (direction === "left") {
    return { ...position, x: position.x - 1 };
  }

  return { ...position, x: position.x + 1 };
}
