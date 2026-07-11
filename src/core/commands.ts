import type { Direction } from "./types";

export interface StepCommand {
  readonly type: "step";
  readonly direction: Direction;
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

export type PublicCommand = StepCommand | UndoCommand | RedoCommand | ResetCommand;

export function Step(direction: Direction): StepCommand {
  return { type: "step", direction };
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
