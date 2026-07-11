import type { PublicCommand } from "../core/commands";
import type {
  CellAddress,
  Direction,
  EntityMovedEvent,
  EntityOccurrenceAddress,
  SemanticEvent,
} from "../core/types";

export type AnimationDirection = "forward" | "reverse";
export type EntityMotionKind = "move" | "push";
export type AudioCueKind = "move" | "push" | "blocked" | "enter" | "exit" | "success";
export type CameraCueKind = "follow" | "impact" | "enter" | "exit";

export interface EntityMotion {
  readonly kind: EntityMotionKind;
  readonly entityId: string;
  /** I1 keeps the occurrence available until V1 replaces entity-ID animation keys. */
  readonly occurrence?: EntityOccurrenceAddress;
  /**
   * Temporary Pixi compatibility positions. V1 must remove these GridPosition
   * projections in favor of the addressed values below; current consumers use
   * only x/y and never reconstruct a world identity from a container path.
   */
  readonly from: GridPositionCompatibility;
  readonly to: GridPositionCompatibility;
  readonly fromAddress?: CellAddress;
  readonly toAddress?: CellAddress;
  readonly durationMs: number;
  readonly anticipationMs?: number;
  readonly settleMs?: number;
  readonly facing?: Direction;
}

export interface BlockedImpact {
  /** No actor occurrence is public on a rejected Step in I1. */
  readonly actorId?: string;
  readonly direction?: Direction;
  readonly durationMs: number;
}

export interface CameraCue {
  readonly kind: CameraCueKind;
  readonly entityId?: string;
  readonly direction?: Direction;
  readonly strength?: number;
  readonly durationMs: number;
}

export interface AudioCue {
  readonly kind: AudioCueKind;
  readonly volume: number;
}

export interface AnimationPlan {
  readonly direction: AnimationDirection;
  readonly durationMs: number;
  readonly entityMotions: readonly EntityMotion[];
  readonly blockedImpacts: readonly BlockedImpact[];
  readonly cameraCues: readonly CameraCue[];
  readonly audioCues: readonly AudioCue[];
}

/**
 * Kept structurally compatible with the current renderer until V1 owns its
 * occurrence-addressed interpolation. The addressed fields on EntityMotion
 * remain the lossless source of identity for the bridge.
 */
export interface GridPositionCompatibility {
  readonly worldId: string;
  readonly x: number;
  readonly y: number;
}

const DURATION = {
  move: 140,
  push: 190,
  blocked: 95,
  enter: 560,
  exit: 500,
} as const;

export function createAnimationPlan(
  events: readonly SemanticEvent[],
  command?: PublicCommand,
): AnimationPlan {
  // Semantic events have already been bound to their playback direction by
  // the public core. In particular, Undo provides reversed event order and
  // swapped endpoints, so preserve that direction but never transform the
  // event array or endpoints a second time.
  const direction = events[0]?.direction ?? "forward";
  const entityMotions: EntityMotion[] = [];
  const blockedImpacts: BlockedImpact[] = [];
  const cameraCues: CameraCue[] = [];
  const audioCues: AudioCue[] = [];

  for (const event of events) {
    if (event.type === "entity-moved") {
      if (isCoveredByPushResolution(event, events)) {
        continue;
      }

      const isAggregatePushActor = isPushResolvedActor(event, events);
      addEntityMotion(entityMotions, event, isAggregatePushActor ? "move" : event.cause === "push" ? "push" : "move");
      if (event.cause === "walk") {
        cameraCues.push({ kind: "follow", entityId: event.occurrence.entityId, durationMs: DURATION.move });
        audioCues.push({ kind: "move", volume: 0.45 });
      }
      continue;
    }

    if (event.type === "push-resolved") {
      for (const moved of event.moved) {
        addEntityMotion(entityMotions, moved, "push", event.directionMoved);
      }
      cameraCues.push({ kind: "impact", direction: event.directionMoved, strength: 7, durationMs: 80 });
      audioCues.push({ kind: "push", volume: 0.56 });
      continue;
    }

    if (event.type === "command-blocked") {
      const blockedDirection = command?.type === "step" ? command.direction : undefined;
      blockedImpacts.push({
        direction: blockedDirection,
        durationMs: DURATION.blocked,
      });
      cameraCues.push({
        kind: "impact",
        direction: blockedDirection,
        strength: 9,
        durationMs: DURATION.blocked,
      });
      audioCues.push({ kind: "blocked", volume: 0.32 });
      continue;
    }

    if (event.type === "portal-traversed") {
      const durationMs = event.mode === "enter" ? DURATION.enter : DURATION.exit;
      cameraCues.push({ kind: event.mode, durationMs });
      audioCues.push({ kind: event.mode, volume: event.mode === "enter" ? 0.5 : 0.48 });
      continue;
    }

    if (event.type === "reset") {
      // Reset is a state replacement, not a solved-state confirmation.
      continue;
    }

    if (event.type === "win-changed" && event.solved) {
      audioCues.push({ kind: "success", volume: 0.5 });
    }
  }

  return {
    direction,
    durationMs: getPlanDuration(entityMotions, blockedImpacts, cameraCues),
    entityMotions,
    blockedImpacts,
    cameraCues,
    audioCues,
  };
}

function addEntityMotion(
  motions: EntityMotion[],
  event: EntityMovedEvent,
  kind: EntityMotionKind,
  facing: Direction | undefined = directionFromAddresses(event.from, event.to),
) {
  motions.push({
    kind,
    entityId: event.occurrence.entityId,
    occurrence: event.occurrence,
    from: toGridPositionCompatibility(event.from),
    to: toGridPositionCompatibility(event.to),
    fromAddress: event.from,
    toAddress: event.to,
    durationMs: kind === "push" ? DURATION.push : DURATION.move,
    ...(kind === "push" ? { anticipationMs: 34, settleMs: 42 } : {}),
    facing,
  });
}

function isCoveredByPushResolution(event: EntityMovedEvent, events: readonly SemanticEvent[]) {
  return event.cause === "push" && events.some((candidate) =>
    candidate.type === "push-resolved" && candidate.moved.some((moved) => sameEntityMotion(moved, event)),
  );
}

function isPushResolvedActor(event: EntityMovedEvent, events: readonly SemanticEvent[]) {
  return event.cause === "push" && events.some((candidate) =>
    candidate.type === "push-resolved" && sameOccurrenceAddress(candidate.actor, event.occurrence),
  );
}

function sameEntityMotion(left: EntityMovedEvent, right: EntityMovedEvent) {
  return sameOccurrenceAddress(left.occurrence, right.occurrence) &&
    sameCellAddress(left.from, right.from) &&
    sameCellAddress(left.to, right.to);
}

function sameOccurrenceAddress(left: EntityOccurrenceAddress, right: EntityOccurrenceAddress) {
  return left.entityId === right.entityId && sameWorldAddress(left.world, right.world);
}

function sameCellAddress(left: CellAddress, right: CellAddress) {
  return left.x === right.x && left.y === right.y && sameWorldAddress(left.world, right.world);
}

function sameWorldAddress(
  left: EntityOccurrenceAddress["world"],
  right: EntityOccurrenceAddress["world"],
) {
  return left.rootWorldId === right.rootWorldId &&
    left.containerPath.length === right.containerPath.length &&
    left.containerPath.every((entry, index) => entry === right.containerPath[index]);
}

function toGridPositionCompatibility(address: CellAddress): GridPositionCompatibility {
  return {
    worldId: address.world.rootWorldId,
    x: address.x,
    y: address.y,
  };
}

function getPlanDuration(
  motions: readonly EntityMotion[],
  impacts: readonly BlockedImpact[],
  cameraCues: readonly CameraCue[],
) {
  return Math.max(
    DURATION.move,
    ...motions.map((motion) => motion.durationMs),
    ...impacts.map((impact) => impact.durationMs),
    ...cameraCues.map((cue) => cue.durationMs),
  );
}

function directionFromAddresses(from: CellAddress, to: CellAddress): Direction | undefined {
  if (to.x > from.x) {
    return "right";
  }
  if (to.x < from.x) {
    return "left";
  }
  if (to.y > from.y) {
    return "down";
  }
  if (to.y < from.y) {
    return "up";
  }
  return undefined;
}
