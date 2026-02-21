# Theming Guidelines

## Theme Object Shape

Each theme is a plain JavaScript object with the following structure:

```js
{
  id: "default",                     // Unique identifier
  name: "Default",                   // Display name
  background: {
    gradient: ["#0f172a", "#1e293b"] // 2-stop CSS gradient (fallback when no image)
  },
  zoneColors: {                      // Override zone colors (null = use defaults)
    blue: "#3B82F6",
    green: "#22C55E",
    yellow: "#EAB308",
    red: "#EF4444"
  },
  bubble: {
    shape: "circle",                 // One of: circle, square, rounded-square, star, heart, hexagon
    imageUrl: null,                  // URL to a bubble image (replaces shape when set)
    showText: true                   // Whether to overlay the word text on the bubble
  },
  backgroundImage: null,             // URL to a full-screen background image
  music: null                        // { preset: "calm-piano" } or { url: "https://..." }
}
```

## Merging

Classroom themes are stored as partial overrides in the `theme` JSONB column.
At runtime, the stored theme is deep-merged over the default theme using `mergeTheme()`.
Only the fields that differ from defaults need to be stored.

## Bubble Shapes

Shapes are rendered via CSS `clip-path`. Available shapes and their clip-path values
are defined in `index.js` as `BUBBLE_SHAPES`. When `bubble.imageUrl` is set, the
shape is ignored and the bubble renders as the image instead.

## Zone Colors

If `zoneColors` is partially specified, missing zones fall back to default colors.
Colors must be valid hex values (#RRGGBB).

## Background

- `backgroundImage` takes priority over `background.gradient`
- The image is rendered as a fixed full-screen cover behind the play area
- `background.gradient` is the fallback and should always be set

## Music

- `music.preset` references a built-in track ID from `presets.js`
- `music.url` references a user-uploaded file in Supabase Storage
- Only one should be set. If both are present, `url` takes priority.
