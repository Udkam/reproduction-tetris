import type { Direction, EntityId } from "./types";

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

export type StateChangingCommand = MoveCommand | EnterCommand | ExitCommand | ResetCommand;
export type SimulationCommand = StateChangingCommand | UndoCommand | RedoCommand;

export function Move(direction: Direction, actorId?: EntityId): MoveCommand {
  return { type: "move", direction, actorId };
}

export function Enter(containerId: EntityId, actorId?: EntityId): EnterCommand {
  return { type: "enter", containerId, actorId };
}

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
