import type { MoveCommand } from "./commands";
import { requirePosition, setEntityPosition } from "./components";
import { resolvePushChain } from "./collision";
import { nextPosition } from "./grid";
import type { SimulationState, TransitionEvent } from "./types";

export interface MovementResolution {
  readonly accepted: boolean;
  readonly state: SimulationState;
  readonly events: readonly TransitionEvent[];
  readonly reason?: string;
}

export function resolveMovement(state: SimulationState, command: MoveCommand): MovementResolution {
  const actorId = command.actorId ?? state.playerId;
  const from = requirePosition(state, actorId);
  const target = nextPosition(from, command.direction);
  const chainResolution = resolvePushChain(state, target, command.direction, actorId);

  if (chainResolution.type === "blocked") {
    return {
      accepted: false,
      state,
      events: [
        {
          type: "blocked",
          actorId,
          direction: command.direction,
          attemptedPosition: chainResolution.attemptedPosition,
          reason: chainResolution.reason,
        },
      ],
      reason: chainResolution.reason,
    };
  }

  if (chainResolution.type === "empty") {
    return {
      accepted: true,
      state: setEntityPosition(state, actorId, target),
      events: [{ type: "move", entityId: actorId, from, to: target }],
    };
  }

  let nextState = state;
  for (const pushedEntity of [...chainResolution.chain].reverse()) {
    nextState = setEntityPosition(nextState, pushedEntity.entity.id, pushedEntity.to);
  }

  nextState = setEntityPosition(nextState, actorId, target);

  return {
    accepted: true,
    state: nextState,
    events: [
      {
        type: "push",
        actorId,
        direction: command.direction,
        pushed: chainResolution.chain.map((entry) => ({
          entityId: entry.entity.id,
          from: entry.from,
          to: entry.to,
        })),
      },
      { type: "move", entityId: actorId, from, to: target },
    ],
  };
}
