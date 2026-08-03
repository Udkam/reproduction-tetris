import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVELS } from '../puzzleProgress';
import {
  DEFAULT_APP_NAVIGATION,
  appPathFor,
  navigationForMode,
  parseAppPath,
} from './appRoute';

describe('appRoute', () => {
  const firstPuzzleId = CAMPAIGN_LEVELS[0]!.id;

  it('maps public inner-page paths to stable application state', () => {
    expect(parseAppPath('/')).toEqual(DEFAULT_APP_NAVIGATION);
    expect(parseAppPath('/puzzles/')).toMatchObject({ screen: 'puzzle-library', mode: 'puzzle' });
    expect(parseAppPath('/play/classic')).toMatchObject({ screen: 'game', mode: 'marathon' });
    expect(parseAppPath('/play/survival')).toMatchObject({ screen: 'game', mode: 'race' });
    expect(parseAppPath('/play/mutation')).toMatchObject({ screen: 'game', mode: 'sprint' });
    expect(parseAppPath(`/play/puzzle/${firstPuzzleId}`)).toEqual({
      screen: 'game',
      mode: 'puzzle',
      selectedPuzzleId: firstPuzzleId,
    });
  });

  it('rejects malformed and unknown deep links instead of starting arbitrary state', () => {
    expect(parseAppPath('/play/puzzle/not-a-level')).toBeNull();
    expect(parseAppPath('/play/unknown')).toBeNull();
    expect(parseAppPath('/something-else')).toBeNull();
  });

  it('serialises every application destination to a real route', () => {
    expect(appPathFor(DEFAULT_APP_NAVIGATION)).toBe('/');
    expect(appPathFor(navigationForMode('marathon', firstPuzzleId))).toBe('/play/classic');
    expect(appPathFor(navigationForMode('race', firstPuzzleId))).toBe('/play/survival');
    expect(appPathFor(navigationForMode('sprint', firstPuzzleId))).toBe('/play/mutation');
    expect(appPathFor(navigationForMode('puzzle', firstPuzzleId))).toBe('/puzzles');
    expect(appPathFor({ screen: 'game', mode: 'puzzle', selectedPuzzleId: firstPuzzleId }))
      .toBe(`/play/puzzle/${firstPuzzleId}`);
  });
});
