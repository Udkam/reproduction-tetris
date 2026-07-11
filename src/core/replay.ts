import type { PublicCommand } from "./commands";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchPublicCommand } from "./reducer";
import type { CommandResult, SimulationState } from "./types";

export interface PublicReplayResult {
  readonly acceptedCount: number;
  readonly finalHash: string;
  readonly finalState: SimulationState;
  readonly results: readonly CommandResult[];
}

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
    if (envelope.result.kind === "accepted") acceptedCount += 1;
    session = envelope.session;
  }
  return { acceptedCount, finalHash: hashState(session.present), finalState: session.present, results };
}
