export type WorldId = string;
export type EntityId = string;
export type Direction = "up" | "down" | "left" | "right";
export type CorePaletteId = "void-lab" | "inner-mint";
export type VisualKind = "player" | "box" | "recursive-container" | "goal";

export interface GridSize {
  readonly width: number;
  readonly height: number;
}

export interface GridPosition {
  readonly worldId: WorldId;
  readonly x: number;
  readonly y: number;
}

export interface WorldNode {
  readonly id: WorldId;
  readonly size: GridSize;
  readonly paletteId: CorePaletteId;
}

export interface Entity {
  readonly id: EntityId;
}

export interface PositionComponent extends GridPosition {}

export interface ContainerEntrance {
  readonly x: number;
  readonly y: number;
  readonly facing?: Direction;
}

export interface ContainerComponent {
  readonly innerWorldId: WorldId;
  readonly entrances: Partial<Record<Direction, ContainerEntrance>>;
  readonly allowsRecursiveCycle: boolean;
}

export interface SolidComponent {
  readonly blocksMovement: true;
}

export interface PushableComponent {
  readonly pushable: true;
}

export interface PlayerComponent {
  readonly controlled: true;
}

export interface GoalComponent {
  readonly acceptsVisualKind?: VisualKind;
}

export interface VisualComponent {
  readonly kind: VisualKind;
  readonly width: number;
  readonly height: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
}

export interface ComponentStore {
  readonly positions: Readonly<Record<EntityId, PositionComponent>>;
  readonly containers: Readonly<Record<EntityId, ContainerComponent>>;
  readonly solids: Readonly<Record<EntityId, SolidComponent>>;
  readonly pushables: Readonly<Record<EntityId, PushableComponent>>;
  readonly players: Readonly<Record<EntityId, PlayerComponent>>;
  readonly goals: Readonly<Record<EntityId, GoalComponent>>;
  readonly visuals: Readonly<Record<EntityId, VisualComponent>>;
}

export interface SimulationState {
  readonly version: 1;
  readonly rootWorldId: WorldId;
  readonly activeWorldId: WorldId;
  readonly playerId: EntityId;
  readonly focusPath: readonly EntityId[];
  readonly worlds: Readonly<Record<WorldId, WorldNode>>;
  readonly entities: Readonly<Record<EntityId, Entity>>;
  readonly components: ComponentStore;
}

export type TransitionEvent =
  | {
      readonly type: "move";
      readonly entityId: EntityId;
      readonly from: GridPosition;
      readonly to: GridPosition;
    }
  | {
      readonly type: "push";
      readonly actorId: EntityId;
      readonly direction: Direction;
      readonly pushed: readonly {
        readonly entityId: EntityId;
        readonly from: GridPosition;
        readonly to: GridPosition;
      }[];
    }
  | {
      readonly type: "blocked";
      readonly actorId: EntityId;
      readonly direction?: Direction;
      readonly attemptedPosition?: GridPosition;
      readonly reason: string;
    }
  | {
      readonly type: "enterWorld";
      readonly actorId: EntityId;
      readonly containerId: EntityId;
      readonly fromWorldId: WorldId;
      readonly toWorldId: WorldId;
    }
  | {
      readonly type: "exitWorld";
      readonly actorId: EntityId;
      readonly containerId: EntityId;
      readonly fromWorldId: WorldId;
      readonly toWorldId: WorldId;
    }
  | {
      readonly type: "reset";
    };
