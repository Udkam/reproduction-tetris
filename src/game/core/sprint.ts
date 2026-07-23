import { createBoard } from './board';
import { BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import type { Board } from './types';

/**
 * The temporary 异变坍缩 item keeps material identities while letting each occupied
 * column settle on its own. It remains independent from ordinary line-clear gravity.
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
