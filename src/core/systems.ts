import { Step, type PublicCommand } from "./commands";
import { createSimulationSession, type SimulationSession } from "./history";
import { dispatchPublicCommand, type PublicDispatchEnvelope } from "./reducer";
import type { SimulationState } from "./types";
import { createStage3BSimulationState } from "./worldGraph";

export interface PublicSimulationSystems {
  readonly dispatch: (session: SimulationSession, command: PublicCommand) => PublicDispatchEnvelope;
}

export function createPublicSimulationSystems(): PublicSimulationSystems {
  return { dispatch: dispatchPublicCommand };
}

export function createStage4PlayableCoreSession(): SimulationSession {
  let session = createSimulationSession(createStage3BSimulationState());
  for (const command of [Step("right"), Step("right"), Step("right"), Step("right")]) {
    const result = dispatchPublicCommand(session, command);
    if (result.result.kind !== "accepted") break;
    session = result.session;
  }
  return session;
}

export function createStage4PlayableCoreState(): SimulationState {
  return createStage4PlayableCoreSession().present;
}
