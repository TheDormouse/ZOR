import { DEFAULT_WORD_PACK } from "./default";
import { ELEMENTARY_PACK } from "./presets/elementary";
import { TEENS_PACK } from "./presets/teens";
import { WORKPLACE_PACK } from "./presets/workplace";

export const ZONE_KEYS = ["blue", "green", "yellow", "red"];

export const PRESET_WORD_PACKS = [
  DEFAULT_WORD_PACK,
  ELEMENTARY_PACK,
  TEENS_PACK,
  WORKPLACE_PACK,
];

/**
 * Validate a word pack for correctness:
 * - All 4 zones must exist with words arrays
 * - All zones must have the same number of words
 * - Word count per zone must be 20–100
 * - No duplicate words across all zones
 */
export function validateWordPack(pack) {
  const errors = [];

  if (!pack.zones) {
    return { valid: false, counts: {}, errors: ["Missing zones object"] };
  }

  const counts = {};
  const allWords = [];

  for (const zone of ZONE_KEYS) {
    if (!pack.zones[zone]) {
      errors.push(`Missing zone: ${zone}`);
      counts[zone] = 0;
      continue;
    }
    const words = pack.zones[zone].words || [];
    counts[zone] = words.length;
    allWords.push(...words.map((w) => w.toLowerCase().trim()));
  }

  const countValues = Object.values(counts);
  const allEqual = countValues.every((c) => c === countValues[0]);
  if (!allEqual) {
    errors.push(`Zones have unequal word counts: ${JSON.stringify(counts)}`);
  }

  if (countValues[0] < 20) {
    errors.push(`Each zone needs at least 20 words (found ${countValues[0]})`);
  }
  if (countValues[0] > 100) {
    errors.push(`Each zone can have at most 100 words (found ${countValues[0]})`);
  }

  const seen = new Set();
  const duplicates = [];
  for (const w of allWords) {
    if (seen.has(w)) duplicates.push(w);
    seen.add(w);
  }
  if (duplicates.length > 0) {
    errors.push(`Duplicate words found: ${[...new Set(duplicates)].join(", ")}`);
  }

  return { valid: errors.length === 0, counts, errors };
}

/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate the full word sequence in rounds of 4.
 * Each round contains exactly one word from each zone in randomized order.
 * Words within each zone are shuffled so every play is unique.
 */
export function generateWordSequence(pack = DEFAULT_WORD_PACK) {
  const shuffled = {};
  for (const zone of ZONE_KEYS) {
    shuffled[zone] = shuffle([...pack.zones[zone].words]);
  }

  const wordsPerZone = shuffled[ZONE_KEYS[0]].length;
  const sequence = [];

  for (let round = 0; round < wordsPerZone; round++) {
    const zoneOrder = shuffle([...ZONE_KEYS]);
    for (const zone of zoneOrder) {
      sequence.push({ word: shuffled[zone][round], zone });
    }
  }

  return sequence;
}

export { DEFAULT_WORD_PACK };
