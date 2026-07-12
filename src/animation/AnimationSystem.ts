import { clamp01, easeInOutCubic, easeOutBack, easeOutCubic } from "./easing";
import type { AnimationPlan, EntityMotion } from "./transitions";
import { entityOccurrenceKey } from "../projection/types";

export interface AnimationFrameState {
  readonly progress: number;
  readonly running: boolean;
  readonly complete: boolean;
  readonly entityProgress: Readonly<Record<string, number>>;
  readonly blockedImpact: number;
}

/**
 * Maps controller-owned normalized progress to per-occurrence visual values.
 * It intentionally owns no clock, readiness state, or completion lifecycle.
 */
export class AnimationSystem {
  frame(plan: AnimationPlan, progress: number, running: boolean): AnimationFrameState {
    const normalized = clamp01(progress);
    const entityProgress = Object.fromEntries(
      plan.entityMotions.map((motion) => [entityOccurrenceKey(motion.occurrence), getMotionProgress(motion, normalized)]),
    );

    return {
      progress: normalized,
      running,
      complete: !running && normalized === 1,
      entityProgress,
      blockedImpact: getBlockedImpact(normalized, plan),
    };
  }

  empty(): AnimationFrameState {
    return {
      progress: 0,
      running: false,
      complete: false,
      entityProgress: {},
      blockedImpact: 0,
    };
  }
}

function getMotionProgress(motion: EntityMotion, progress: number) {
  if (motion.kind === "push") {
    const anticipated = clamp01((progress - 0.08) / 0.82);
    return clamp01(easeOutBack(anticipated));
  }

  return easeInOutCubic(progress);
}

function getBlockedImpact(progress: number, plan: AnimationPlan) {
  if (plan.blockedImpacts.length === 0) {
    return 0;
  }

  if (progress === 0 || progress === 1) return 0;

  return Math.sin(easeOutCubic(progress) * Math.PI);
}
