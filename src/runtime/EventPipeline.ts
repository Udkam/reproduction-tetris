import { createAnimationPlan, type AnimationPlan } from "../animation/transitions";
import type { PublicCommand } from "../core/commands";
import type { SimulationSession } from "../core/history";
import { dispatchPublicCommand } from "../core/reducer";
import type { CommandResult, RejectionCode, SemanticEvent } from "../core/types";
import { createProjectionFromSimulationState } from "../projection/simulationProjection";
import type { WorldProjection } from "../projection/types";

export interface EventPipelineResult {
  readonly accepted: boolean;
  readonly rejectionCode?: RejectionCode;
  readonly session: SimulationSession;
  readonly result: CommandResult;
  readonly events: readonly SemanticEvent[];
  readonly animationPlan: AnimationPlan;
  readonly previousHash: string;
  readonly nextHash: string;
  readonly previousProjection: WorldProjection;
  readonly nextProjection: WorldProjection;
}

export class EventPipeline {
  dispatch(session: SimulationSession, command: PublicCommand): EventPipelineResult {
    const previousState = session.present;
    const envelope = dispatchPublicCommand(session, command);
    const result = envelope.result;
    const events = result.kind === "accepted" ? result.transaction.events : result.events;
    const animationPlan = createAnimationPlan(events, result.command);
    const previousHash = result.kind === "accepted" ? result.transaction.stateHashBefore : result.stateHashBefore;
    const nextHash = result.kind === "accepted" ? result.transaction.stateHashAfter : result.stateHashAfter;

    return {
      accepted: result.kind === "accepted",
      ...(result.kind === "rejected" ? { rejectionCode: result.rejection.code } : {}),
      session: envelope.session,
      result,
      events,
      animationPlan,
      previousHash,
      nextHash,
      previousProjection: createProjectionFromSimulationState(previousState),
      nextProjection: createProjectionFromSimulationState(envelope.session.present),
    };
  }
}
