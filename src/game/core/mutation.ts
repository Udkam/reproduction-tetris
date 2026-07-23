import { mapCellsAfterClear } from './board';
import { BOARD_HEIGHT } from './constants';
import type { Board, Cell, MutationCarrier } from './types';

function sameCell(first: Cell, second: Cell): boolean {
  return first.x === second.x && first.y === second.y;
}

/** Returns every carrier touched by an actually removed row, at most once each. */
export function mutationCarriersClearedByRows(
  carriers: readonly MutationCarrier[],
  rows: readonly number[],
): readonly MutationCarrier[] {
  const removed = new Set(rows);
  return carriers.filter((carrier) => carrier.cells.some((cell) => removed.has(cell.y)));
}

/** Keeps untriggered carrier identities aligned with ordinary full-row settling. */
export function mapMutationCarriersAfterClear(
  board: Board,
  rows: readonly number[],
  carriers: readonly MutationCarrier[],
): readonly MutationCarrier[] {
  return Object.freeze(carriers.map((carrier) => ({
    ...carrier,
    cells: Object.freeze(mapCellsAfterClear(board, rows, carrier.cells)),
  })).filter((carrier) => carrier.cells.length > 0));
}

/**
 * Replays the exact independent-column settlement order for carrier metadata. It
 * does not inspect material identity, so it remains valid for any ordinary piece.
 */
export function collapseMutationCarriers(board: Board, carriers: readonly MutationCarrier[]): readonly MutationCarrier[] {
  const destinations = new Map<string, Cell>();
  for (let x = 0; x < board[0]!.length; x += 1) {
    let destinationY = BOARD_HEIGHT - 1;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y -= 1) {
      if (board[y]![x] === null) continue;
      destinations.set(`${x}:${y}`, { x, y: destinationY });
      destinationY -= 1;
    }
  }
  return Object.freeze(carriers.map((carrier) => ({
    ...carrier,
    cells: Object.freeze(carrier.cells.flatMap((cell) => {
      const destination = destinations.get(`${cell.x}:${cell.y}`);
      return destination ? [destination] : [];
    })),
  })).filter((carrier) => carrier.cells.length > 0));
}

/** Assertion helper kept local to protect against accidental duplicated core marks. */
export function carrierContainsCell(carrier: MutationCarrier, cell: Cell): boolean {
  return carrier.cells.some((candidate) => sameCell(candidate, cell));
}
