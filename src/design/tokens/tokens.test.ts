// @ts-expect-error Vitest runs this test in Node while the product tsconfig intentionally omits Node globals.
import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ANIMATION } from './animation';
import { COLOR_NUMBERS, COLOR_TOKENS, hexToColorNumber } from './colors';
import { COMPONENT_METRICS, RADIUS } from './radius';
import { CARD_PADDING, SPACING } from './spacing';
import { TYPOGRAPHY } from './typography';

const tokenStyles = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../../main.tsx', import.meta.url), 'utf8');
const bootSource = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8');
const packageSource = readFileSync(new URL('../../../package.json', import.meta.url), 'utf8');
const fontNotices = readFileSync(new URL('../../../THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8');

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
    expect(TYPOGRAPHY.fontFamily.chineseUi).toContain('TetraMorph UI Sans');
    expect(TYPOGRAPHY.fontFamily.chineseDisplay).toContain('Smiley Sans');
    expect(TYPOGRAPHY.fontFamily.englishUi).toContain('Barlow Semi Condensed');
    expect(TYPOGRAPHY.fontFamily.data).toContain('Fira Code Variable');
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
    expect(tokenStyles).toContain('--font-ui-zh: "TetraMorph UI Sans"');
    expect(tokenStyles).toContain('--font-display-zh: "Smiley Sans"');
    expect(tokenStyles).toContain('--font-ui-en: "Barlow Semi Condensed"');
    expect(tokenStyles).toContain('--font-data: "Fira Code Variable"');
    expect(tokenStyles).toContain('url("../assets/fonts/TetraMorphUISans-subset.otf")');
    expect(tokenStyles).toContain('url("../assets/fonts/SmileySans-Oblique.woff2")');
    expect(tokenStyles).not.toMatch(/url\(["']?https?:/);
    expect(mainSource).toContain("import '@fontsource/barlow-semi-condensed/latin-400.css';");
    expect(mainSource).toContain("import '@fontsource/barlow-semi-condensed/latin-800.css';");
    expect(mainSource).toContain("import '@fontsource-variable/fira-code/index.css';");
    expect(bootSource).toContain('"Barlow Semi Condensed"');
    expect(`${tokenStyles}\n${mainSource}\n${bootSource}\n${packageSource}`).not.toMatch(/Space Grotesk|Geist Mono|Sora Variable|IBM Plex Mono|@fontsource-variable\/space-grotesk|@fontsource-variable\/geist-mono|@fontsource-variable\/sora|@fontsource\/ibm-plex-mono/);
    expect(tokenStyles).toMatch(/\.mode-chooser--workbench \.mode-home-wordmark,[\s\S]*font-weight:\s*400;/);
    expect(tokenStyles).not.toMatch(/(^|\n)\s*(display|grid-template|flex|position|width|height):/);
  });

  it('packages the selected Chinese families locally with redistribution notices', () => {
    expect(statSync(new URL('../../assets/fonts/TetraMorphUISans-subset.otf', import.meta.url)).size)
      .toBeGreaterThan(400_000);
    expect(statSync(new URL('../../assets/fonts/SmileySans-Oblique.woff2', import.meta.url)).size)
      .toBeGreaterThan(1_000_000);
    expect(fontNotices).toContain('TetraMorph UI Sans');
    expect(fontNotices).toContain('Smiley Sans');
    expect(fontNotices).toContain('Barlow Semi Condensed');
    expect(fontNotices).toContain('Fira Code Variable');
    expect(fontNotices).toContain('reserves the WenYuan family names');
    expect(statSync(new URL('../../../licenses/fonts/BarlowSemiCondensed-OFL.txt', import.meta.url)).size)
      .toBeGreaterThan(4_000);
    expect(statSync(new URL('../../../licenses/fonts/FiraCode-OFL.txt', import.meta.url)).size)
      .toBeGreaterThan(4_000);
  });
});
