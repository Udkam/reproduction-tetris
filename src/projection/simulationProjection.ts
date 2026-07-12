import type { SimulationState } from "../core/types";
import { projectWorldOccurrence } from "./worldProjection";
import type { WorldProjection } from "./types";

export function createProjectionFromSimulationState(state: SimulationState, maxDepth = 2): WorldProjection {
  return projectWorldOccurrence(
    state,
    { rootWorldId: state.rootWorldId, containerPath: [] },
    0,
    maxDepth,
  );
}
