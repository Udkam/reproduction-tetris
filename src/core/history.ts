import { cloneSimulationState } from "./worldGraph";
import type { SimulationState, Transaction } from "./types";

export interface HistoryRecord {
  readonly transaction: Transaction;
  readonly previousState: SimulationState;
  readonly nextState: SimulationState;
}

export interface HistoryStore {
  readonly past: readonly HistoryRecord[];
  readonly future: readonly HistoryRecord[];
}

export interface SimulationSession {
  readonly initialState: SimulationState;
  readonly present: SimulationState;
  readonly history: HistoryStore;
  /** Dispatch metadata is deliberately outside canonical SimulationState hashing. */
  readonly publicTransactionSequence: number;
}

export function createSimulationSession(initialState: SimulationState): SimulationSession {
  return {
    initialState: cloneSimulationState(initialState),
    present: cloneSimulationState(initialState),
    history: { past: [], future: [] },
    publicTransactionSequence: 0,
  };
}

export function commitTransaction(
  session: SimulationSession,
  nextState: SimulationState,
  transaction: Transaction,
): SimulationSession {
  const record: HistoryRecord = {
    transaction,
    previousState: cloneSimulationState(session.present),
    nextState: cloneSimulationState(nextState),
  };
  return {
    ...session,
    present: cloneSimulationState(nextState),
    history: { past: [...session.history.past, record], future: [] },
    publicTransactionSequence: transaction.id.sequence,
  };
}

export function commitHistoricalTraversal(
  session: SimulationSession,
  nextState: SimulationState,
  transaction: Transaction,
  record: HistoryRecord,
  direction: "undo" | "redo",
): SimulationSession {
  return {
    ...session,
    present: cloneSimulationState(nextState),
    history: direction === "undo"
      ? { past: session.history.past.slice(0, -1), future: [record, ...session.history.future] }
      : { past: [...session.history.past, record], future: session.history.future.slice(1) },
    publicTransactionSequence: transaction.id.sequence,
  };
}
