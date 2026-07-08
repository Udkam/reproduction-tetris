import type { Direction, GridPosition } from "./types";

export function nextPosition(position: GridPosition, direction: Direction): GridPosition {
  if (direction === "up") {
    return { ...position, y: position.y - 1 };
  }

  if (direction === "down") {
    return { ...position, y: position.y + 1 };
  }

  if (direction === "left") {
    return { ...position, x: position.x - 1 };
  }

  return { ...position, x: position.x + 1 };
}
