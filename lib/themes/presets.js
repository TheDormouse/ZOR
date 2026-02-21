export const THEME_PRESETS = [
  {
    id: "default",
    name: "Default",
    background: { gradient: ["#0f172a", "#1e293b"] },
    zoneColors: {
      blue: "#3B82F6",
      green: "#22C55E",
      yellow: "#EAB308",
      red: "#EF4444",
    },
    bubble: { shape: "circle" },
  },
  {
    id: "ocean",
    name: "Ocean",
    background: { gradient: ["#0c1222", "#1a3a5c"] },
    zoneColors: {
      blue: "#60A5FA",
      green: "#34D399",
      yellow: "#FBBF24",
      red: "#F87171",
    },
    bubble: { shape: "circle" },
  },
  {
    id: "forest",
    name: "Forest",
    background: { gradient: ["#0d1f0d", "#1a3a1a"] },
    zoneColors: {
      blue: "#93C5FD",
      green: "#4ADE80",
      yellow: "#FDE047",
      red: "#FCA5A5",
    },
    bubble: { shape: "hexagon" },
  },
  {
    id: "sunset",
    name: "Sunset",
    background: { gradient: ["#1a0a2e", "#3d1a56"] },
    zoneColors: {
      blue: "#818CF8",
      green: "#6EE7B7",
      yellow: "#FCD34D",
      red: "#FDA4AF",
    },
    bubble: { shape: "rounded-square" },
  },
  {
    id: "cosmic",
    name: "Cosmic",
    background: { gradient: ["#030014", "#150030"] },
    zoneColors: {
      blue: "#A78BFA",
      green: "#67E8F9",
      yellow: "#FDE68A",
      red: "#FB923C",
    },
    bubble: { shape: "star" },
  },
];

export const MUSIC_PRESETS = [
  { id: "meditation", name: "Meditation", file: "/audio/meditation.mp3" },
  { id: "relaxation-ambient", name: "Relaxation Ambient", file: "/audio/relaxation-ambient.mp3" },
  { id: "space-ambient", name: "Space Ambient", file: "/audio/space-ambient.mp3" },
  { id: "silence", name: "Silence (No Music)", file: null },
];
