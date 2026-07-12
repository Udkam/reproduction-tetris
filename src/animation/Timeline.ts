import { clamp01, easeInOutCubic } from "./easing";

/** Pure normalized-progress view retained for V1 compatibility; it owns no clock. */
export interface TimelineSnapshot {
  readonly rawProgress: number;
  readonly easedProgress: number;
  readonly complete: boolean;
}

export function timelineSnapshot(progress: number): TimelineSnapshot {
  const rawProgress = clamp01(progress);
  return {
    rawProgress,
    easedProgress: easeInOutCubic(rawProgress),
    complete: rawProgress === 1,
  };
}
