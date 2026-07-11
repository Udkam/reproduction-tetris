import type { Direction, EntityId } from "./types";

export interface StepCommand {
  readonly type: "step";
  readonly direction: Direction;
}

export interface MoveCommand {
  readonly type: "move";
  readonly direction: Direction;
  readonly actorId?: EntityId;
}

export interface EnterCommand {
  readonly type: "enter";
  readonly containerId: EntityId;
  readonly actorId?: EntityId;
}

export interface ExitCommand {
  readonly type: "exit";
  readonly containerId: EntityId;
  readonly actorId?: EntityId;
}

export interface ResetCommand {
  readonly type: "reset";
}

export interface UndoCommand {
  readonly type: "undo";
}

export interface RedoCommand {
  readonly type: "redo";
}

/** Frozen runtime-facing command surface for I1 and later C1. */
export type PublicCommand = StepCommand | UndoCommand | RedoCommand | ResetCommand;

/** @deprecated I1-only compatibility for unchanged legacy consumers. */
export type StateChangingCommand = MoveCommand | EnterCommand | ExitCommand | ResetCommand;
/** @deprecated I1-only compatibility for unchanged legacy consumers. */
export type SimulationCommand = StateChangingCommand | UndoCommand | RedoCommand;

export function Step(direction: Direction): StepCommand {
  return { type: "step", direction };
}

/** @deprecated I1-only compatibility. Runtime consumers migrate to Step in the frontend half. */
export function Move(direction: Direction, actorId?: EntityId): MoveCommand {
  return { type: "move", direction, actorId };
}

/** @deprecated I1-only compatibility. Directionless recursive entry is not a PublicCommand. */
export function Enter(containerId: EntityId, actorId?: EntityId): EnterCommand {
  return { type: "enter", containerId, actorId };
}

/** @deprecated I1-only compatibility. Directionless recursive exit is not a PublicCommand. */
export function Exit(containerId: EntityId, actorId?: EntityId): ExitCommand {
  return { type: "exit", containerId, actorId };
}

export function Reset(): ResetCommand {
  return { type: "reset" };
}

export function Undo(): UndoCommand {
  return { type: "undo" };
}

export function Redo(): RedoCommand {
  return { type: "redo" };
}

export function isPublicCommand(value: unknown): value is PublicCommand {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return false;
  }

  const command = value as { readonly type?: unknown; readonly direction?: unknown };
  if (command.type === "undo" || command.type === "redo" || command.type === "reset") {
    return true;
  }

  return command.type === "step" && isDirection(command.direction);
}

function isDirection(value: unknown): value is Direction {
  return value === "up" || value === "right" || value === "down" || value === "left";
}
