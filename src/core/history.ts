import type { StateChangingCommand } from "./commands";
import { hashState } from "./hash";
import type { SimulationState, TransitionEvent } from "./types";
import { cloneSimulationState } from "./worldGraph";

export interface HistoryRecord {
  readonly command: StateChangingCommand;
  readonly previousStateHash: string;
  readonly nextStateHash: string;
  readonly previousState: SimulationState;
  readonly nextState: SimulationState;
  readonly transitionEvents: readonly TransitionEvent[];
  readonly moveNumber: number;
}

export interface HistoryStore {
  readonly past: readonly HistoryRecord[];
  readonly future: readonly HistoryRecord[];
}

export interface SimulationSession {
  readonly initialState: SimulationState;
  readonly present: SimulationState;
  readonly history: HistoryStore;
}

export function createSimulationSession(initialState: SimulationState): SimulationSession {
  return {
    initialState: cloneSimulationState(initialState),
    present: cloneSimulationState(initialState),
    history: {
      past: [],
      future: [],
    },
  };
}

export function commitStateChange(
  session: SimulationSession,
  command: StateChangingCommand,
  nextState: SimulationState,
  transitionEvents: readonly TransitionEvent[],
): SimulationSession {
  const previousStateHash = hashState(session.present);
  const nextStateHash = hashState(nextState);

  if (previousStateHash === nextStateHash) {
    return session;
  }

  const record: HistoryRecord = {
    command,
    previousStateHash,
    nextStateHash,
    previousState: cloneSimulationState(session.present),
    nextState: cloneSimulationState(nextState),
    transitionEvents,
    moveNumber: session.history.past.length + 1,
  };

  return {
    ...session,
    present: cloneSimulationState(nextState),
    history: {
      past: [...session.history.past, record],
      future: [],
    },
  };
}

export function resetSession(session: SimulationSession, command: StateChangingCommand): SimulationSession {
  return commitStateChange(session, command, cloneSimulationState(session.initialState), [{ type: "reset" }]);
}

export function undoSession(session: SimulationSession): SimulationSession {
  const record = session.history.past.at(-1);
  if (!record) {
    return session;
  }

  return {
    ...session,
    present: cloneSimulationState(record.previousState),
    history: {
      past: session.history.past.slice(0, -1),
      future: [record, ...session.history.future],
    },
  };
}

export function redoSession(session: SimulationSession): SimulationSession {
  const record = session.history.future[0];
  if (!record) {
    return session;
  }

  return {
    ...session,
    present: cloneSimulationState(record.nextState),
    history: {
      past: [...session.history.past, record],
      future: session.history.future.slice(1),
    },
  };
}
