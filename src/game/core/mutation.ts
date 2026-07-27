import { mapCellsAfterClear } from './board';
import { BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import type { Board, Cell, MutationCarrier } from './types';

function sameCell(first: Cell, second: Cell): boolean {
  return first.x === second.x && first.y === second.y;
}

/**
 * Trigger resolution happens after the board has settled, so keep a private copy of
 * the pre-clear carrier. In particular, an all-cell clear must not erase the item
 * before the activation queue reads it.
 */
function snapshotCarrier(carrier: MutationCarrier): MutationCarrier {
  return Object.freeze({
    id: carrier.id,
    item: carrier.item,
    cells: Object.freeze(carrier.cells.map((cell) => Object.freeze({ ...cell }))),
  });
}

/** Returns every carrier touched by an actually removed row, at most once each. */
export function mutationCarriersClearedByRows(
  carriers: readonly MutationCarrier[],
  rows: readonly number[],
): readonly MutationCarrier[] {
  const removed = new Set(rows);
  return Object.freeze(carriers
    .filter((carrier) => carrier.cells.some((cell) => removed.has(cell.y)))
    .map(snapshotCarrier));
}

/** Removes triggered identities wholesale so their remaining sibling cells cannot fire again. */
export function withoutMutationCarriers(
  carriers: readonly MutationCarrier[],
  removed: readonly MutationCarrier[],
): readonly MutationCarrier[] {
  if (removed.length === 0) return carriers;
  const ids = new Set(removed.map((carrier) => carrier.id));
  return Object.freeze(carriers.filter((carrier) => !ids.has(carrier.id)));
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
  if (carriers.length === 0) return carriers;
  // Source cell index → settled row. This avoids a string-key Map on every
  // Collapse lock while retaining the exact bottom-up per-column placement order.
  const settledRowBySource = new Int16Array(BOARD_WIDTH * BOARD_HEIGHT);
  settledRowBySource.fill(-1);
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    let destinationY = BOARD_HEIGHT - 1;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y -= 1) {
      if (board[y]![x] === null) continue;
      settledRowBySource[y * BOARD_WIDTH + x] = destinationY;
      destinationY -= 1;
    }
  }
  return Object.freeze(carriers.map((carrier) => {
    const cells: Cell[] = [];
    for (const cell of carrier.cells) {
      const destinationY = settledRowBySource[cell.y * BOARD_WIDTH + cell.x] ?? -1;
      if (destinationY >= 0) cells.push({ x: cell.x, y: destinationY });
    }
    return { ...carrier, cells: Object.freeze(cells) };
  }).filter((carrier) => carrier.cells.length > 0));
}

/** Assertion helper kept local to protect against accidental duplicated core marks. */
export function carrierContainsCell(carrier: MutationCarrier, cell: Cell): boolean {
  return carrier.cells.some((candidate) => sameCell(candidate, cell));
}
