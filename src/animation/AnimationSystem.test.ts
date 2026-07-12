import { describe, expect, it } from "vitest";
import { entityOccurrenceKey } from "../projection/types";
import { AnimationSystem } from "./AnimationSystem";
import type { AnimationPlan } from "./transitions";

const occurrence = { world: { rootWorldId: "root", containerPath: ["nest"] }, entityId: "player" } as const;

describe("AnimationSystem", () => {
  it("samples controller-owned normalized progress without keeping a clock", () => {
    const system = new AnimationSystem();
    const plan = motionPlan();
    const first = system.frame(plan, 0, true);
    const middle = system.frame(plan, 0.5, true);
    const done = system.frame(plan, 1, false);

    expect(first.entityProgress[entityOccurrenceKey(occurrence)]).toBe(0);
    expect(middle.entityProgress[entityOccurrenceKey(occurrence)]).toBeGreaterThan(0);
    expect(middle.entityProgress[entityOccurrenceKey(occurrence)]).toBeLessThan(1);
    expect(done).toMatchObject({ progress: 1, running: false, complete: true });
    expect(done.entityProgress[entityOccurrenceKey(occurrence)]).toBe(1);
  });

  it("keeps blocked feedback a pure sample and clamps malformed input", () => {
    const frame = new AnimationSystem().frame({ ...motionPlan(), entityMotions: [], blockedImpacts: [{ direction: "up", durationMs: 90 }] }, 3, false);
    expect(frame.progress).toBe(1);
    expect(frame.blockedImpact).toBe(0);
  });
});

function motionPlan(): AnimationPlan {
  return {
    direction: "forward",
    durationMs: 120,
    entityMotions: [{ kind: "move", occurrence, from: { world: occurrence.world, x: 2, y: 2 }, to: { world: occurrence.world, x: 3, y: 2 }, durationMs: 120 }],
    blockedImpacts: [],
    cameraCues: [],
    portalTransitions: [],
    audioCues: [],
  };
}
