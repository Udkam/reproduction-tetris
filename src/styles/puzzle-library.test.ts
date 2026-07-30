// @vitest-environment node

// @ts-expect-error Vitest reads this source contract in Node while product types omit Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const gallery = readFileSync('src/styles/puzzle-library.css', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

describe('Phase 9 Puzzle gallery authority', () => {
  it('loads one dedicated gallery layer after navigation and before result presentation', () => {
    const importPath = "./styles/puzzle-library.css";
    expect(main.match(new RegExp(importPath.replace('.', '\\.'), 'g'))).toHaveLength(1);
    expect(main.indexOf(importPath)).toBeGreaterThan(main.indexOf("./styles/navigation.css"));
    expect(main.indexOf(importPath)).toBeLessThan(main.indexOf("./styles/result.css"));
  });

  it('renders two semantic 25-level pages around one canonical preview', () => {
    expect(app).toContain('const PUZZLE_PAGE_SIZE = 25');
    expect(app).toContain('role="tablist"');
    expect(app).toContain('role="tabpanel"');
    expect(app).toContain('puzzle-gallery__hero');
    expect(app).toContain('puzzle-gallery__board');
    expect(app).toContain('puzzle-gallery__title');
    expect(app).toContain('puzzle-gallery__start');
    expect(app).not.toContain('PUZZLE_TARGET_ROW_TIERS');
    expect(app).not.toContain('puzzleMatrixColumnCount');
  });

  it('keeps every page in a five-by-five non-scrolling matrix with 44px controls', () => {
    expect(gallery).toMatch(/\.puzzle-gallery__grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(5,\s*minmax\(44px,\s*1fr\)\)/);
    expect(gallery).toMatch(/\.puzzle-gallery__grid\s*\{[\s\S]*grid-template-rows:\s*repeat\(5,\s*minmax\(44px,\s*1fr\)\)/);
    expect(gallery).toMatch(/\.puzzle-gallery__node > button\s*\{[\s\S]*min-width:\s*44px;[\s\S]*min-height:\s*44px;/);
    expect(gallery).not.toMatch(/overflow-(?:x|y):\s*(?:auto|scroll)/);
  });

  it('preserves the portrait and short-landscape budgets and honors reduced motion', () => {
    expect(gallery).toMatch(/@media \(max-width:\s*719px\),\s*\(orientation:\s*portrait\)[\s\S]*\.puzzle-gallery\s*\{[\s\S]*grid-template-rows:/);
    expect(gallery).toMatch(/@media \(min-width:\s*720px\) and \(max-height:\s*520px\)[\s\S]*\.puzzle-gallery__grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(5,/);
    expect(gallery).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none !important/);
  });
});
