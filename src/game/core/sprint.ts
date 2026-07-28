import { createBoard } from './board';
import { BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import type { Board } from './types';

export interface SprintColumnCollapse {
  board: Board;
  /** Source board index → settled row, or -1 when the source cell was empty. */
  settledRowBySource: Int16Array;
}

/**
 * The temporary 异变坍缩 item keeps material identities while letting each occupied
 * column settle on its own. One bottom-up pass produces both the immutable next board
 * and the source-row mapping consumed by carrier metadata, so Core never rescans the
 * same 40 × 10 board for one lock.
 */
export function collapseSprintColumns(board: Board): SprintColumnCollapse {
  const collapsed = createBoard();
  const settledRowBySource = new Int16Array(BOARD_WIDTH * BOARD_HEIGHT);
  settledRowBySource.fill(-1);
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    let destinationY = BOARD_HEIGHT - 1;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y -= 1) {
      const cell = board[y]![x];
      if (cell === null) continue;
      collapsed[destinationY]![x] = cell;
      settledRowBySource[y * BOARD_WIDTH + x] = destinationY;
      destinationY -= 1;
    }
  }
  return { board: collapsed, settledRowBySource };
}
