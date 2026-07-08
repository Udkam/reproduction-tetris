import type { SimulationCommand } from "./commands";
import { commitStateChange, redoSession, resetSession, type SimulationSession, undoSession } from "./history";
import { resolveMovement } from "./movementResolver";
import { enterContainer, exitContainer } from "./recursiveMovement";
import type { TransitionEvent } from "./types";

export interface CommandDispatchResult {
  readonly accepted: boolean;
  readonly session: SimulationSession;
  readonly events: readonly TransitionEvent[];
  readonly reason?: string;
}

export function dispatchCommand(session: SimulationSession, command: SimulationCommand): CommandDispatchResult {
  if (command.type === "undo") {
    const nextSession = undoSession(session);
    return {
      accepted: nextSession !== session,
      session: nextSession,
      events: [],
      reason: nextSession === session ? "history-empty" : undefined,
    };
  }

  if (command.type === "redo") {
    const nextSession = redoSession(session);
    return {
      accepted: nextSession !== session,
      session: nextSession,
      events: [],
      reason: nextSession === session ? "future-empty" : undefined,
    };
  }

  if (command.type === "reset") {
    const nextSession = resetSession(session, command);
    return {
      accepted: nextSession !== session,
      session: nextSession,
      events: [{ type: "reset" }],
      reason: nextSession === session ? "already-at-initial-state" : undefined,
    };
  }

  const resolution =
    command.type === "move"
      ? resolveMovement(session.present, command)
      : command.type === "enter"
        ? enterContainer(session.present, command)
        : exitContainer(session.present, command);

  if (!resolution.accepted) {
    return {
      accepted: false,
      session,
      events: resolution.events,
      reason: resolution.reason,
    };
  }

  return {
    accepted: true,
    session: commitStateChange(session, command, resolution.state, resolution.events),
    events: resolution.events,
  };
}
