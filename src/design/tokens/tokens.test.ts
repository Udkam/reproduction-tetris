// @ts-expect-error Vitest runs this test in Node while the product tsconfig intentionally omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ANIMATION } from './animation';
import { COLOR_NUMBERS, COLOR_TOKENS, hexToColorNumber } from './colors';
import { COMPONENT_METRICS, RADIUS } from './radius';
import { CARD_PADDING, SPACING } from './spacing';
import { TYPOGRAPHY } from './typography';

const tokenStyles = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');

describe('TetraMorph Design System v1.0', () => {
  it('freezes the requested palette and renderer bridge', () => {
    expect(COLOR_TOKENS).toMatchObject({
      background: '#DCE7F1',
      surface: '#F8FAFC',
      surfaceSecondary: '#EDF3F7',
      border: '#C4D4DF',
      textPrimary: '#102A43',
      textSecondary: '#52677F',
      textSecondarySoft: '#627D98',
      board: '#071522',
      classic: '#31978D',
      survival: '#5878C4',
      mutation: '#C77A35',
      puzzle: '#8A63B3',
    });
    expect(COLOR_NUMBERS.board).toBe(0x071522);
    expect(hexToColorNumber(COLOR_TOKENS.classic)).toBe(0x31978d);
  });

  it('freezes role-specific typography', () => {
    expect(TYPOGRAPHY.fontFamily.brand).toContain('Playwrite NZ Basic');
    expect(TYPOGRAPHY.fontFamily.ui).toContain('Space Grotesk');
    expect(TYPOGRAPHY.fontFamily.ui).toContain('Noto Sans SC');
    expect(TYPOGRAPHY.fontFamily.mono).toContain('JetBrains Mono');
    expect(TYPOGRAPHY.weight.brand).toBe(400);
    expect(TYPOGRAPHY.scale).toEqual({
      display: { size: 28, weight: 700, lineHeight: 1.1 },
      heading: { size: 24, weight: 700, lineHeight: 1.16 },
      cardTitle: { size: 14, weight: 600, lineHeight: 1.3 },
      value: { size: 24, weight: 700, lineHeight: 1.08 },
      body: { size: 14, weight: 500, lineHeight: 1.5 },
      caption: { size: 12, weight: 500, lineHeight: 1.4 },
    });
  });

  it('freezes the 4px rhythm, card hierarchy, and accessible button geometry', () => {
    expect(SPACING).toEqual({ 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 });
    expect(CARD_PADDING).toBe(16);
    expect(RADIUS).toEqual({ cardLevel1: 16, cardLevel2: 10, cardLevel3: 6, button: 8, iconButton: 8 });
    expect(COMPONENT_METRICS).toEqual({
      primaryButtonHeight: 40,
      iconButtonSize: 36,
      cardLevel1BorderWidth: 1,
      secondaryButtonBorderWidth: 1,
    });
  });

  it('declares the requested timing without adding a new animation', () => {
    expect(ANIMATION).toEqual({
      easing: { standard: 'ease-out' },
      duration: { hover: 120, press: 80, modal: 220, page: 300 },
    });
  });

  it('bridges the public semantic CSS variables without changing layout rules', () => {
    const cssTokens = {
      '--page': COLOR_TOKENS.background,
      '--surface': COLOR_TOKENS.surface,
      '--raised': COLOR_TOKENS.surfaceSecondary,
      '--line': COLOR_TOKENS.border,
      '--ink': COLOR_TOKENS.textPrimary,
      '--muted': COLOR_TOKENS.textSecondary,
      '--muted-soft': COLOR_TOKENS.textSecondarySoft,
      '--well': COLOR_TOKENS.board,
      '--classic': COLOR_TOKENS.classic,
      '--race': COLOR_TOKENS.survival,
      '--sprint': COLOR_TOKENS.mutation,
      '--puzzle': COLOR_TOKENS.puzzle,
    } as const;

    for (const [token, value] of Object.entries(cssTokens)) {
      expect(tokenStyles).toContain(`${token}: ${value};`);
    }
    expect(tokenStyles).toContain('--font-body: "Space Grotesk", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;');
    expect(tokenStyles).toContain('--font-mono: "JetBrains Mono", "Noto Sans Mono CJK SC", "Cascadia Mono", monospace;');
    expect(tokenStyles).toMatch(/\.mode-home-wordmark,[\s\S]*font-weight:\s*400;/);
    expect(tokenStyles).not.toMatch(/(^|\n)\s*(display|grid-template|flex|position|width|height):/);
  });
});
