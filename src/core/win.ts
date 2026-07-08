import type { SimulationState } from "./types";
import { findEntityAt } from "./worldGraph";

export function isWinSatisfied(state: SimulationState): boolean {
  const goalEntries = Object.entries(state.components.goals);
  if (goalEntries.length === 0) {
    return false;
  }

  return goalEntries.every(([goalEntityId, goal]) => {
    const goalPosition = state.components.positions[goalEntityId];
    if (!goalPosition) {
      return false;
    }

    const occupyingEntity = findEntityAt(state, goalPosition, goalEntityId);
    if (!occupyingEntity) {
      return false;
    }

    const visual = state.components.visuals[occupyingEntity.id];
    return goal.acceptsVisualKind ? visual?.kind === goal.acceptsVisualKind : true;
  });
}
