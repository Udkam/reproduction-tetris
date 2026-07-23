import { createBoard } from './board';
import { BOARD_HEIGHT, BOARD_WIDTH, SPRINT_DURATION_TICKS } from './constants';
import type { Board } from './types';

/**
 * Collapse mode keeps material identities but lets each occupied column settle on its
 * own after a clear. It is deliberately independent from ordinary line-clear gravity,
 * and receives only the all-ordinary Sprint board.
 */
export function collapseSprintColumns(board: Board): Board {
  const collapsed = createBoard();
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    let destinationY = BOARD_HEIGHT - 1;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y -= 1) {
      const cell = board[y]![x];
      if (cell === null) continue;
      collapsed[destinationY]![x] = cell;
      destinationY -= 1;
    }
  }
  return collapsed;
}

export function sprintRemainingTicks(elapsedTicks: number): number {
  return Math.max(0, SPRINT_DURATION_TICKS - Math.max(0, elapsedTicks));
}
