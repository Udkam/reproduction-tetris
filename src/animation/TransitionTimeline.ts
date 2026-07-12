import { clamp01, easeInOutCubic } from "./easing";

/** Pure transition interpolation view; VisualTransactionController owns time. */
export interface TransitionSnapshot {
  readonly rawProgress: number;
  readonly easedProgress: number;
  readonly complete: boolean;
}

export function transitionSnapshot(progress: number): TransitionSnapshot {
  const rawProgress = clamp01(progress);
  return {
    rawProgress,
    easedProgress: easeInOutCubic(rawProgress),
    complete: rawProgress === 1,
  };
}
