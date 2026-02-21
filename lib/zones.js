/*
 * Zone metadata — colors, labels, and CSS classes.
 * Word banks have been moved to lib/word-packs/.
 * Use generateWordSequence() from lib/word-packs/index.js for gameplay.
 */

export const ZONES = {
  blue: {
    name: "Blue Zone",
    label: "Low Energy",
    color: "#3B82F6",
    hue: "blue",
    bgClass: "bg-blue-500",
    textClass: "text-blue-600",
    lightBg: "bg-blue-50",
    borderClass: "border-blue-400",
  },
  green: {
    name: "Green Zone",
    label: "Calm & Ready",
    color: "#22C55E",
    hue: "green",
    bgClass: "bg-green-500",
    textClass: "text-green-600",
    lightBg: "bg-green-50",
    borderClass: "border-green-400",
  },
  yellow: {
    name: "Yellow Zone",
    label: "Heightened",
    color: "#EAB308",
    hue: "yellow",
    bgClass: "bg-yellow-500",
    textClass: "text-yellow-600",
    lightBg: "bg-yellow-50",
    borderClass: "border-yellow-400",
  },
  red: {
    name: "Red Zone",
    label: "Extreme",
    color: "#EF4444",
    hue: "red",
    bgClass: "bg-red-500",
    textClass: "text-red-600",
    lightBg: "bg-red-50",
    borderClass: "border-red-400",
  },
};

export const ZONE_KEYS = ["blue", "green", "yellow", "red"];

export function getZoneForWord(word) {
  // This now requires a word pack to be passed for accurate lookup
  // Kept for backwards compatibility with results display
  return null;
}
