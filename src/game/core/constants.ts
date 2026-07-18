import type { GameMode } from './types';

export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const BUFFER_HEIGHT = 20;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + BUFFER_HEIGHT;
export const VISIBLE_START_ROW = BUFFER_HEIGHT;

export const LOCK_DELAY_TICKS = 18;
export const MAX_LOCK_RESETS = 15;
export const ENTRY_DELAY_TICKS = 3;
export const LINE_CLEAR_DELAY_TICKS = 12;

export const NEXT_QUEUE_SIZE = 5;

export const STANDARD_GRAVITY_TICKS = 48;
export const SURVIVAL_LINES_PER_BEDROCK = 5;

/** @deprecated T6 Survival has no speed tier. Retained until the frontend binding migrates. */
export function raceSpeedTier(pieceCount: number, lines: number): number {
  void pieceCount;
  void lines;
  return 0;
}

export function gravityForMode(mode: GameMode, level: number, pieceCount: number, lines: number): number {
  void mode;
  void level;
  void pieceCount;
  void lines;
  return STANDARD_GRAVITY_TICKS;
}

export const LINE_CLEAR_BASE_SCORE = [0, 40, 100, 300, 1200] as const;
