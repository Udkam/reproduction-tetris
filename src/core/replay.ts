import type { PublicCommand, SimulationCommand } from "./commands";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchCommand, dispatchPublicCommand } from "./reducer";
import type { CommandResult, SimulationState } from "./types";

export interface ReplayResult {
  readonly acceptedCount: number;
  readonly finalHash: string;
  readonly finalState: SimulationState;
}

export interface PublicReplayResult {
  readonly acceptedCount: number;
  readonly finalHash: string;
  readonly finalState: SimulationState;
  readonly results: readonly CommandResult[];
}

export function replayCommands(
  initialState: SimulationState,
  commands: readonly SimulationCommand[],
): ReplayResult {
  let session = createSimulationSession(initialState);
  let acceptedCount = 0;

  for (const command of commands) {
    const result = dispatchCommand(session, command);
    if (result.accepted) {
      acceptedCount += 1;
    }
    session = result.session;
  }

  return {
    acceptedCount,
    finalHash: hashState(session.present),
    finalState: session.present,
  };
}

/** Replays the stable I1 public surface and retains its deterministic result trace. */
export function replayPublicCommands(
  initialState: SimulationState,
  commands: readonly PublicCommand[],
): PublicReplayResult {
  let session = createSimulationSession(initialState);
  let acceptedCount = 0;
  const results: CommandResult[] = [];

  for (const command of commands) {
    const envelope = dispatchPublicCommand(session, command);
    results.push(envelope.result);
    if (envelope.result.kind === "accepted") {
      acceptedCount += 1;
    }
    session = envelope.session;
  }

  return {
    acceptedCount,
    finalHash: hashState(session.present),
    finalState: session.present,
    results,
  };
}
