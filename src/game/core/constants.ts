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
export const PUZZLE_VOLATILE_PIECE_TICKS = 10 * 60;
export const INITIAL_SURVIVAL_BEDROCK_ROWS = 5;
export const SURVIVAL_LINES_PER_BEDROCK = 3;
export const TICKS_PER_SECOND = 60;
export const SURVIVAL_INITIAL_INTERVAL_SECONDS = 15;
export const SURVIVAL_INTERVAL_STEP_SECONDS = 1;
export const SURVIVAL_MIN_INTERVAL_SECONDS = 8;

export const PROGRESSIVE_GRAVITY_TICKS = [48, 43, 38, 33, 28, 23, 18, 13, 10, 8, 6, 5, 4, 3] as const;

export function speedTierForLines(lines: number): number {
  return Math.min(PROGRESSIVE_GRAVITY_TICKS.length - 1, Math.max(0, Math.floor(lines / 10)));
}

export function survivalSpeedTierForLines(lines: number): number {
  return Math.min(PROGRESSIVE_GRAVITY_TICKS.length - 1, Math.max(0, Math.floor(lines / SURVIVAL_LINES_PER_BEDROCK)));
}

export function survivalIntervalSeconds(lines: number): number {
  return Math.max(
    SURVIVAL_MIN_INTERVAL_SECONDS,
    SURVIVAL_INITIAL_INTERVAL_SECONDS - SURVIVAL_INTERVAL_STEP_SECONDS * Math.floor(Math.max(0, lines) / SURVIVAL_LINES_PER_BEDROCK),
  );
}

export function survivalIntervalTicks(lines: number): number {
  return survivalIntervalSeconds(lines) * TICKS_PER_SECOND;
}

/** @deprecated Use speedTierForLines. Retained until the frontend binding migrates. */
export function raceSpeedTier(pieceCount: number, lines: number): number {
  void pieceCount;
  return survivalSpeedTierForLines(lines);
}

export function gravityForMode(mode: GameMode, level: number, pieceCount: number, lines: number): number {
  void level;
  void pieceCount;
  if (mode === 'puzzle') return STANDARD_GRAVITY_TICKS;
  if (mode === 'race') return PROGRESSIVE_GRAVITY_TICKS[survivalSpeedTierForLines(lines)]!;
  return PROGRESSIVE_GRAVITY_TICKS[speedTierForLines(lines)]!;
}

export const LINE_CLEAR_BASE_SCORE = [0, 40, 100, 300, 1200] as const;
