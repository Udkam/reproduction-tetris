import type { GameMode, PuzzleId } from '../game/core';
import { CAMPAIGN_LEVELS } from '../puzzleProgress';

export type AppScreen = 'home' | 'puzzle-library' | 'game';

export interface AppNavigationState {
  screen: AppScreen;
  mode: GameMode;
  selectedPuzzleId: PuzzleId;
}

const FIRST_PUZZLE_ID = CAMPAIGN_LEVELS[0]!.id;
const PUZZLE_IDS = new Set<PuzzleId>(CAMPAIGN_LEVELS.map((level) => level.id));

export const DEFAULT_APP_NAVIGATION: AppNavigationState = Object.freeze({
  screen: 'home',
  mode: 'marathon',
  selectedPuzzleId: FIRST_PUZZLE_ID,
});

function cleanPath(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '');
}

function state(screen: AppScreen, mode: GameMode, selectedPuzzleId = FIRST_PUZZLE_ID): AppNavigationState {
  return { screen, mode, selectedPuzzleId };
}

export function parseAppPath(pathname: string): AppNavigationState | null {
  const path = cleanPath(pathname || '/');
  if (path === '/') return state('home', 'marathon');
  if (path === '/puzzles') return state('puzzle-library', 'puzzle');
  if (path === '/play/classic') return state('game', 'marathon');
  if (path === '/play/survival') return state('game', 'race');
  if (path === '/play/mutation') return state('game', 'sprint');

  const puzzleMatch = /^\/play\/puzzle\/([^/]+)$/.exec(path);
  if (!puzzleMatch) return null;
  try {
    const puzzleId = decodeURIComponent(puzzleMatch[1]!) as PuzzleId;
    return PUZZLE_IDS.has(puzzleId) ? state('game', 'puzzle', puzzleId) : null;
  } catch {
    return null;
  }
}

export function appPathFor(navigation: AppNavigationState): string {
  if (navigation.screen === 'home') return '/';
  if (navigation.screen === 'puzzle-library') return '/puzzles';
  if (navigation.mode === 'marathon') return '/play/classic';
  if (navigation.mode === 'race') return '/play/survival';
  if (navigation.mode === 'sprint') return '/play/mutation';
  return `/play/puzzle/${encodeURIComponent(navigation.selectedPuzzleId)}`;
}

export function navigationForMode(
  mode: GameMode,
  selectedPuzzleId: PuzzleId,
): AppNavigationState {
  return mode === 'puzzle'
    ? state('puzzle-library', mode, selectedPuzzleId)
    : state('game', mode, selectedPuzzleId);
}
