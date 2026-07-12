import type {
  CorePaletteId,
  EntityId,
  EntityOccurrenceAddress,
  VisualKind,
  WorldAddress,
  WorldId,
} from "../core/types";

export type { EntityOccurrenceAddress, WorldAddress } from "../core/types";
export type PaletteId = CorePaletteId;
/** Compatibility name for renderer metrics; values remain the core visual kind. */
export type PrototypeEntityKind = VisualKind;

export interface Size2D {
  readonly width: number;
  readonly height: number;
}

export interface Rect2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ProjectedWorld {
  readonly id: WorldId;
  readonly paletteId: PaletteId;
  readonly size: Size2D;
}

export interface ProjectedEntity {
  readonly id: EntityId;
  readonly kind: VisualKind;
  readonly bounds: Rect2D;
  readonly innerWorldId?: WorldId;
}

export interface EntityProjection {
  readonly occurrence: EntityOccurrenceAddress;
  readonly entity: ProjectedEntity;
  readonly opacity?: number;
  readonly childWorld?: WorldProjection;
}

export interface WorldProjection {
  /** Collision-safe structural identity for one reachable world occurrence. */
  readonly projectionId: string;
  readonly world: ProjectedWorld;
  readonly address: WorldAddress;
  /** Canonical focus address copied from SimulationState.focusPath. */
  readonly activeAddress: WorldAddress;
  readonly depth: number;
  readonly entities: readonly EntityProjection[];
}

export function worldAddressKey(address: WorldAddress): string {
  return JSON.stringify([address.rootWorldId, ...address.containerPath]);
}

export function entityOccurrenceKey(occurrence: EntityOccurrenceAddress): string {
  return JSON.stringify([occurrence.world.rootWorldId, ...occurrence.world.containerPath, occurrence.entityId]);
}

export function sameWorldAddress(left: WorldAddress, right: WorldAddress): boolean {
  return left.rootWorldId === right.rootWorldId &&
    left.containerPath.length === right.containerPath.length &&
    left.containerPath.every((entry, index) => entry === right.containerPath[index]);
}

export function sameEntityOccurrence(left: EntityOccurrenceAddress, right: EntityOccurrenceAddress): boolean {
  return left.entityId === right.entityId && sameWorldAddress(left.world, right.world);
}
