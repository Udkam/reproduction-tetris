import { describe, expect, it } from "vitest";
import { Step } from "../core/commands";
import type { EntityMovedEvent, SemanticEvent } from "../core/types";
import { createAnimationPlan } from "./transitions";

const transactionId = { initialStateHash: "initial", sequence: 1 } as const;
const root = { rootWorldId: "root", containerPath: [] } as const;
const nested = { rootWorldId: "root", containerPath: ["aperture"] } as const;

describe("semantic animation mapping", () => {
  it("maps a forward push to one aggregate feedback plan and deduplicates the nested box event", () => {
    const pushed = moved("crate", 3, 4, "push", nested);
    const actor = moved("actor", 2, 3, "push", root);
    const events: SemanticEvent[] = [
      pushResolved(pushed, "right", "forward"),
      { ...pushed, eventIndex: 1 },
      actor,
    ];

    const plan = createAnimationPlan(events, Step("right"));
    const boxMotion = requireMotion(plan, "crate");
    const actorMotion = requireMotion(plan, "actor");

    expect(plan.direction).toBe("forward");
    expect(plan.entityMotions.map((motion) => [motion.entityId, motion.kind])).toEqual([
      ["crate", "push"],
      ["actor", "move"],
    ]);
    expect(boxMotion).toMatchObject({
      occurrence: { world: nested, entityId: "crate" },
      fromAddress: { world: nested, x: 3, y: 2 },
      toAddress: { world: nested, x: 4, y: 2 },
      from: { worldId: "root", x: 3, y: 2 },
      to: { worldId: "root", x: 4, y: 2 },
      anticipationMs: expect.any(Number),
      settleMs: expect.any(Number),
      facing: "right",
    });
    expect(actorMotion).toMatchObject({
      occurrence: { world: root, entityId: "actor" },
      fromAddress: { world: root, x: 2, y: 2 },
      toAddress: { world: root, x: 3, y: 2 },
    });
    expect(actorMotion).not.toHaveProperty("anticipationMs");
    expect(actorMotion).not.toHaveProperty("settleMs");
    expect(plan.cameraCues.filter((cue) => cue.kind === "impact")).toEqual([
      expect.objectContaining({ direction: "right" }),
    ]);
    expect(plan.audioCues.map((cue) => cue.kind)).toEqual(["push"]);
  });

  it("preserves reverse push endpoints when the Undo actor event arrives before the aggregate", () => {
    const pushed = moved("crate", 4, 3, "push", nested, "reverse");
    const actor = moved("actor", 3, 2, "push", root, "reverse");
    const events: SemanticEvent[] = [
      actor,
      pushResolved(pushed, "left", "reverse"),
    ];

    const plan = createAnimationPlan(events, Step("left"));
    const actorMotion = requireMotion(plan, "actor");
    const boxMotion = requireMotion(plan, "crate");

    expect(plan.direction).toBe("reverse");
    expect(actorMotion).toMatchObject({
      kind: "move",
      from: { worldId: "root", x: 3, y: 2 },
      to: { worldId: "root", x: 2, y: 2 },
    });
    expect(boxMotion).toMatchObject({
      kind: "push",
      from: { worldId: "root", x: 4, y: 2 },
      to: { worldId: "root", x: 3, y: 2 },
    });
    expect(plan.cameraCues.filter((cue) => cue.kind === "impact")).toEqual([
      expect.objectContaining({ direction: "left" }),
    ]);
    expect(plan.audioCues.map((cue) => cue.kind)).toEqual(["push"]);
  });

  it("uses public Step direction for blocked feedback without inventing an actor", () => {
    const plan = createAnimationPlan([
      {
        type: "command-blocked",
        transactionId: null,
        eventIndex: 0,
        direction: "forward",
        rejection: {
          code: "target-solid-not-pushable",
          reason: { kind: "target" },
          rule: "push",
        },
      },
    ], Step("left"));

    expect(plan.entityMotions).toEqual([]);
    expect(plan.blockedImpacts).toEqual([
      {
        direction: "left",
        durationMs: expect.any(Number),
      },
    ]);
    expect(plan.cameraCues).toContainEqual({
      kind: "impact",
      direction: "left",
      strength: 9,
      durationMs: expect.any(Number),
    });
    expect(plan.audioCues.map((cue) => cue.kind)).toEqual(["blocked"]);
  });

  it("preserves already reversed non-push Undo endpoints", () => {
    const plan = createAnimationPlan([
      moved("actor", 3, 2, "walk", root, "reverse"),
    ]);

    expect(plan.direction).toBe("reverse");
    expect(plan.entityMotions[0]).toMatchObject({
      entityId: "actor",
      from: { worldId: "root", x: 3, y: 2 },
      to: { worldId: "root", x: 2, y: 2 },
    });
  });

  it("maps portal mode directly without rewriting its semantic direction", () => {
    const events: SemanticEvent[] = [
      {
        type: "portal-traversed",
        transactionId,
        eventIndex: 0,
        direction: "forward",
        mode: "enter",
        actorBefore: { world: root, entityId: "actor" },
        actorAfter: { world: nested, entityId: "actor" },
        port: { container: { world: root, entityId: "aperture" }, portId: "north" },
        from: { world: root, x: 4, y: 2 },
        to: { world: nested, x: 1, y: 1 },
      },
      {
        type: "portal-traversed",
        transactionId,
        eventIndex: 1,
        direction: "reverse",
        mode: "exit",
        actorBefore: { world: nested, entityId: "actor" },
        actorAfter: { world: root, entityId: "actor" },
        port: { container: { world: root, entityId: "aperture" }, portId: "north" },
        from: { world: nested, x: 1, y: 1 },
        to: { world: root, x: 4, y: 2 },
      },
    ];

    const plan = createAnimationPlan(events);

    expect(plan.cameraCues.map((cue) => cue.kind)).toEqual(["enter", "exit"]);
    expect(plan.audioCues.map((cue) => cue.kind)).toEqual(["enter", "exit"]);
  });

  it("emits success only for a solved win, never reset", () => {
    const reset = createAnimationPlan([
      { type: "reset", transactionId, eventIndex: 0, direction: "forward" },
    ]);
    const solved = createAnimationPlan([
      { type: "win-changed", transactionId, eventIndex: 0, direction: "forward", solved: true },
    ]);

    expect(reset.audioCues).toEqual([]);
    expect(solved.audioCues).toEqual([{ kind: "success", volume: 0.5 }]);
  });
});

function pushResolved(
  pushed: EntityMovedEvent,
  directionMoved: "left" | "right",
  direction: EntityMovedEvent["direction"],
): SemanticEvent {
  return {
    type: "push-resolved",
    transactionId,
    eventIndex: 0,
    direction,
    actor: { world: root, entityId: "actor" },
    directionMoved,
    moved: [pushed],
  };
}

function moved(
  entityId: string,
  fromX: number,
  toX: number,
  cause: EntityMovedEvent["cause"],
  world: typeof root | typeof nested,
  direction: EntityMovedEvent["direction"] = "forward",
): EntityMovedEvent {
  return {
    type: "entity-moved",
    transactionId,
    eventIndex: 2,
    direction,
    occurrence: { world, entityId },
    from: { world, x: fromX, y: 2 },
    to: { world, x: toX, y: 2 },
    cause,
  };
}

function requireMotion(plan: ReturnType<typeof createAnimationPlan>, entityId: string) {
  const motion = plan.entityMotions.find((candidate) => candidate.entityId === entityId);
  if (!motion) {
    throw new Error(`Expected a motion for ${entityId}.`);
  }
  return motion;
}
