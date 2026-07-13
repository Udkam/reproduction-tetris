export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const BUFFER_HEIGHT = 20;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + BUFFER_HEIGHT;
export const VISIBLE_START_ROW = BUFFER_HEIGHT;

export const LOCK_DELAY_TICKS = 30;
export const MAX_LOCK_RESETS = 15;
export const ENTRY_DELAY_TICKS = 6;
export const LINE_CLEAR_DELAY_TICKS = 12;

export const NEXT_QUEUE_SIZE = 5;

export const GRAVITY_TICKS = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
  5, 5, 5,
  4, 4, 4,
  3, 3, 3,
] as const;

export function gravityForLevel(level: number): number {
  if (level < GRAVITY_TICKS.length) {
    return GRAVITY_TICKS[Math.max(0, level)] ?? 48;
  }
  if (level <= 28) return 2;
  return 1;
}

export const LINE_CLEAR_BASE_SCORE = [0, 40, 100, 300, 1200] as const;
