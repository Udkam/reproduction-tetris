// @vitest-environment node

// @ts-expect-error Vitest reads this source contract in Node while product types omit Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const result = readFileSync('src/styles/result.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

describe('Phase 9 run-result authority', () => {
  it('loads one dedicated result layer after shared HUD and navigation styles', () => {
    const importPath = "./styles/result.css";
    expect(main.match(new RegExp(importPath.replace('.', '\\.'), 'g'))).toHaveLength(1);
    expect(main.indexOf(importPath)).toBeGreaterThan(main.indexOf("./styles/hud.css"));
    expect(main.indexOf(importPath)).toBeGreaterThan(main.indexOf("./styles/navigation.css"));
  });

  it('uses mode accents for metrics, current-run rows, and the primary action', () => {
    expect(result).toContain('T16 Phase 9 result authority');
    expect(result).toMatch(/\.action-sheet--run-result-race\s*\{\s*--result-accent:\s*var\(--race\)/);
    expect(result).toMatch(/\.action-sheet--run-result-sprint\s*\{\s*--result-accent:\s*var\(--sprint\)/);
    expect(result).toMatch(/li\[data-current-record="true"\][\s\S]*box-shadow:\s*inset 3px 0 0 var\(--result-accent\)/);
    expect(result).toMatch(/\.action-sheet--run-result > \.action-sheet__actions > \.primary-action\s*\{[\s\S]*background:\s*var\(--result-accent\)/);
  });

  it('keeps two meaningful metric cards, compact landscape, and reduced motion', () => {
    expect(result).toMatch(/\.run-result__metrics\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,/);
    expect(result).toMatch(/@media \(min-width:\s*700px\) and \(max-height:\s*520px\)/);
    expect(result).toMatch(/@media \(min-width:\s*700px\) and \(max-height:\s*520px\)[\s\S]*grid-template-areas:\s*"summary leaderboard"\s*"primary secondary"/);
    expect(result).toMatch(/@media \(min-width:\s*700px\) and \(max-height:\s*520px\)[\s\S]*\.action-sheet--run-result \.result-leaderboard--result\s*\{[\s\S]*grid-area:\s*leaderboard;/);
    expect(result).toMatch(/@media \(min-width:\s*700px\) and \(max-height:\s*520px\)[\s\S]*overflow:\s*hidden;/);
    expect(result).toMatch(/@media \(max-width:\s*560px\)/);
    expect(result).toMatch(/\.app\[data-reduced-motion="true"\] \.action-sheet--run-result[\s\S]*animation:\s*none !important/);
  });
});
