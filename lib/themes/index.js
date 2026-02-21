import { THEME_PRESETS } from "./presets";

export const DEFAULT_THEME = {
  id: "default",
  name: "Default",
  background: { gradient: ["#0f172a", "#1e293b"] },
  zoneColors: {
    blue: "#3B82F6",
    green: "#22C55E",
    yellow: "#EAB308",
    red: "#EF4444",
  },
  bubble: { shape: "circle", imageUrl: null, showText: true, fontSize: "11px", fontStyle: "semibold" },
  backgroundImage: null,
  music: null,
  game: { duration: 300, infinite: false },
};

export const GAME_DURATION_OPTIONS = [
  { id: 60, label: "1 min" },
  { id: 120, label: "2 min" },
  { id: 180, label: "3 min" },
  { id: 300, label: "5 min" },
  { id: 600, label: "10 min" },
];

export const BUBBLE_SHAPES = {
  circle: {
    label: "Circle",
    clipPath: "circle(50% at 50% 50%)",
    borderRadius: "50%",
  },
  square: {
    label: "Square",
    clipPath: "none",
    borderRadius: "0",
  },
  "rounded-square": {
    label: "Rounded Square",
    clipPath: "none",
    borderRadius: "18%",
  },
  star: {
    label: "Star",
    clipPath:
      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    borderRadius: "0",
  },
  heart: {
    label: "Heart",
    clipPath:
      "path('M 50 90 C 25 65, 0 40, 15 20 C 30 0, 50 10, 50 30 C 50 10, 70 0, 85 20 C 100 40, 75 65, 50 90 Z')",
    borderRadius: "0",
  },
  hexagon: {
    label: "Hexagon",
    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    borderRadius: "0",
  },
};

export const BUBBLE_SHAPE_KEYS = Object.keys(BUBBLE_SHAPES);

export const BUBBLE_FONT_SIZES = [
  { id: "9px", label: "XS" },
  { id: "11px", label: "S" },
  { id: "13px", label: "M" },
  { id: "15px", label: "L" },
  { id: "18px", label: "XL" },
];

export const BUBBLE_FONT_STYLES = [
  { id: "normal", label: "Normal", weight: "400", style: "normal" },
  { id: "semibold", label: "Semi Bold", weight: "600", style: "normal" },
  { id: "bold", label: "Bold", weight: "700", style: "normal" },
  { id: "italic", label: "Italic", weight: "400", style: "italic" },
  { id: "bold-italic", label: "Bold Italic", weight: "700", style: "italic" },
  { id: "uppercase", label: "Uppercase", weight: "600", style: "normal", transform: "uppercase" },
];

/**
 * Deep-merge a partial classroom theme over the default theme.
 * Only overrides fields that are explicitly set.
 */
export function mergeTheme(partial = {}) {
  const base = structuredClone(DEFAULT_THEME);

  if (partial.background) {
    base.background = { ...base.background, ...partial.background };
  }
  if (partial.zoneColors) {
    base.zoneColors = { ...base.zoneColors, ...partial.zoneColors };
  }
  if (partial.bubble) {
    base.bubble = { ...base.bubble, ...partial.bubble };
  }
  if (partial.backgroundImage !== undefined) {
    base.backgroundImage = partial.backgroundImage;
  }
  if (partial.music !== undefined) {
    base.music = partial.music;
  }
  if (partial.game) {
    base.game = { ...base.game, ...partial.game };
  }
  if (partial.id) base.id = partial.id;
  if (partial.name) base.name = partial.name;

  return base;
}

export { THEME_PRESETS };
