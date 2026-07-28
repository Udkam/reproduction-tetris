/** TetraMorph Design System v1.0 — type faces, weights, and roles. */
export const TYPOGRAPHY = {
  fontFamily: {
    brand: '"Playwrite NZ Basic", "Space Grotesk", "Noto Sans SC", sans-serif',
    ui: '"Space Grotesk", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Noto Sans Mono CJK SC", "Cascadia Mono", monospace',
  },
  weight: {
    /** Playwrite NZ Basic ships 100–400; 400 is its real maximum weight. */
    brand: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  scale: {
    display: { size: 28, weight: 700, lineHeight: 1.1 },
    heading: { size: 24, weight: 700, lineHeight: 1.16 },
    cardTitle: { size: 14, weight: 600, lineHeight: 1.3 },
    value: { size: 24, weight: 700, lineHeight: 1.08 },
    body: { size: 14, weight: 500, lineHeight: 1.5 },
    caption: { size: 12, weight: 500, lineHeight: 1.4 },
  },
} as const;
