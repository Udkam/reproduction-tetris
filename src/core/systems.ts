import { Move, type PublicCommand, type SimulationCommand } from "./commands";
import { createSimulationSession, type SimulationSession } from "./history";
import { dispatchCommand, dispatchPublicCommand, type CommandDispatchResult, type PublicDispatchEnvelope } from "./reducer";
import type { SimulationState } from "./types";
import { createStage3BSimulationState } from "./worldGraph";

export interface SimulationSystems {
  readonly dispatch: (session: SimulationSession, command: SimulationCommand) => CommandDispatchResult;
}

export interface PublicSimulationSystems {
  readonly dispatch: (session: SimulationSession, command: PublicCommand) => PublicDispatchEnvelope;
}

export function createSimulationSystems(): SimulationSystems {
  return {
    dispatch: dispatchCommand,
  };
}

export function createPublicSimulationSystems(): PublicSimulationSystems {
  return {
    dispatch: dispatchPublicCommand,
  };
}

export function createStage4PlayableCoreSession(): SimulationSession {
  let session = createSimulationSession(createStage3BSimulationState());

  for (const command of [Move("right"), Move("right"), Move("right"), Move("right")]) {
    const result = dispatchCommand(session, command);
    if (!result.accepted) {
      throw new Error(`Stage 4 playable core setup command was rejected: ${result.reason ?? command.type}`);
    }
    session = result.session;
  }

  return session;
}

export function createStage4PlayableCoreState(): SimulationState {
  return createStage4PlayableCoreSession().present;
}
