export const VISUAL_THEME_STORAGE_KEY = 'tetramorph:visual-theme:v1';

export const VISUAL_THEMES = ['mineral-mist', 'deep-tide', 'sunstone'] as const;

export type VisualThemeId = (typeof VISUAL_THEMES)[number];

export const DEFAULT_VISUAL_THEME: VisualThemeId = 'deep-tide';

export type CanvasThemePalette = Readonly<{
  well: number;
  edge: number;
  mutationEdge: number;
}>;

export const CANVAS_THEME_PALETTES: Readonly<Record<VisualThemeId, CanvasThemePalette>> = Object.freeze({
  'mineral-mist': Object.freeze({ well: 0x071522, edge: 0x9fb4c4, mutationEdge: 0x8f71b8 }),
  'deep-tide': Object.freeze({ well: 0x04111d, edge: 0x5f8190, mutationEdge: 0x9278ba }),
  sunstone: Object.freeze({ well: 0x191510, edge: 0xa88964, mutationEdge: 0x8a6b9a }),
});

export function parseVisualTheme(value: unknown): VisualThemeId {
  return typeof value === 'string' && VISUAL_THEMES.includes(value as VisualThemeId)
    ? value as VisualThemeId
    : DEFAULT_VISUAL_THEME;
}

export function canvasThemePalette(theme: VisualThemeId): CanvasThemePalette {
  return CANVAS_THEME_PALETTES[theme];
}
