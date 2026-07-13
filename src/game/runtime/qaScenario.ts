import { createBoard, createInitialState, setCell, type GameState } from '../core';

export function createFourLineClearScenario(seed = 0x51a1f00d): GameState {
  let board = createBoard();
  for (let y = 36; y <= 39; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      board = setCell(board, x, y, (x + y) % 2 === 0 ? 'J' : 'L');
    }
  }
  return {
    ...createInitialState(seed),
    board,
    active: { type: 'I', rotation: 1, x: 7, y: 19 },
    status: 'playing',
    phase: 'active',
    score: 0,
    lines: 0,
    level: 0,
    gravityTicks: 0,
    lockTicks: 0,
    lockResets: 0,
  };
}
