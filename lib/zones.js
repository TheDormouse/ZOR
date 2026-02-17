/*
 * Zones of Regulation - Emotion Word Banks
 * 75 words per zone × 4 zones = 300 words total
 * At 1 word per second, this provides exactly 5 minutes of gameplay.
 *
 * Blue Zone  – Low energy / down states
 * Green Zone – Calm / regulated / ready states
 * Yellow Zone – Heightened / elevated states
 * Red Zone   – Extreme / intense states
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
    words: [
      "Sad", "Tired", "Bored", "Sick", "Exhausted",
      "Down", "Lonely", "Drained", "Sleepy", "Withdrawn",
      "Hopeless", "Empty", "Gloomy", "Sluggish", "Disconnected",
      "Unmotivated", "Flat", "Melancholy", "Numb", "Weary",
      "Defeated", "Low", "Lethargic", "Depressed", "Discouraged",
      "Heavy", "Apathetic", "Listless", "Fatigued", "Miserable",
      "Homesick", "Hurt", "Grief", "Sorrow", "Disheartened",
      "Mopey", "Blah", "Sulky", "Tearful", "Blue",
      "Unwell", "Drowsy", "Slow", "Passive", "Weak",
      "Fragile", "Vulnerable", "Depleted", "Spent", "Burned Out",
      "Unfocused", "Foggy", "Hazy", "Distant", "Checked Out",
      "Shut Down", "Frozen", "Lost", "Aimless", "Indifferent",
      "Uninspired", "Dull", "Monotone", "Somber", "Wistful",
      "Resigned", "Helpless", "Powerless", "Disengaged", "Hollow",
      "Quiet", "Still", "Subdued", "Muted", "Dim",
    ],
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
    words: [
      "Happy", "Calm", "Focused", "Content", "Ready",
      "Grateful", "Relaxed", "Peaceful", "Balanced", "Cheerful",
      "Comfortable", "Confident", "Optimistic", "Pleased", "Satisfied",
      "Steady", "Centered", "Patient", "Kind", "Friendly",
      "Thoughtful", "Mindful", "Present", "Grounded", "Secure",
      "Safe", "Motivated", "Engaged", "Interested", "Curious",
      "Hopeful", "Joyful", "Loving", "Caring", "Compassionate",
      "Generous", "Playful", "Amused", "Delighted", "Warm",
      "Cozy", "Gentle", "Tender", "Serene", "Tranquil",
      "Mellow", "Easygoing", "Cooperative", "Helpful", "Accepting",
      "Brave", "Proud", "Accomplished", "Capable", "Strong",
      "Determined", "Energized", "Refreshed", "Alive", "Vibrant",
      "Connected", "Appreciated", "Valued", "Respected", "Understood",
      "Supported", "Included", "Welcome", "Belonging", "Thankful",
      "Attentive", "Creative", "Inspired", "Flexible", "Open",
    ],
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
    words: [
      "Frustrated", "Anxious", "Excited", "Nervous", "Silly",
      "Worried", "Fidgety", "Restless", "Hyper", "Overwhelmed",
      "Embarrassed", "Confused", "Surprised", "Shocked", "Startled",
      "Impatient", "Irritated", "Annoyed", "Tense", "Stressed",
      "Uneasy", "Apprehensive", "Jittery", "Edgy", "Antsy",
      "Distracted", "Scattered", "Flustered", "Unsettled", "Agitated",
      "Pressured", "Rushed", "Hurried", "Frantic", "Hectic",
      "Wiggly", "Giggly", "Goofy", "Wild", "Wired",
      "Jealous", "Envious", "Suspicious", "Doubtful", "Uncertain",
      "Insecure", "Self-Conscious", "Awkward", "Uncomfortable", "Cranky",
      "Grumpy", "Moody", "Sensitive", "Reactive", "On Edge",
      "Wound Up", "Keyed Up", "Amped", "Buzzed", "Revved Up",
      "Overstimulated", "Sensory Overload", "Wary", "Guarded", "Defensive",
      "Stubborn", "Resistant", "Defiant", "Argumentative", "Confrontational",
      "Whiny", "Dramatic", "Intense", "Excitable", "Impulsive",
    ],
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
    words: [
      "Angry", "Furious", "Terrified", "Enraged", "Explosive",
      "Panicked", "Out of Control", "Devastated", "Aggressive", "Hostile",
      "Violent", "Raging", "Seething", "Livid", "Irate",
      "Incensed", "Infuriated", "Wrathful", "Vengeful", "Hateful",
      "Hysterical", "Screaming", "Crying Uncontrollably", "Sobbing", "Wailing",
      "Petrified", "Paralyzed", "Horrified", "Terrorized", "Traumatized",
      "Meltdown", "Tantrum", "Rampage", "Chaos", "Frenzy",
      "Shattered", "Crushed", "Destroyed", "Broken", "Wrecked",
      "Elated", "Euphoric", "Manic", "Ecstatic", "Delirious",
      "Combative", "Threatening", "Intimidating", "Menacing", "Bullying",
      "Unhinged", "Snapped", "Lost It", "Blinded by Rage", "Seeing Red",
      "Desperate", "Frenzied", "Crazed", "Berserk", "Savage",
      "Overwhelmed Completely", "Shutdown", "Dissociated", "Spiraling", "Imploding",
      "Exploding", "Erupting", "Boiling Over", "White Hot", "Volcanic",
      "Inconsolable", "Uncontrollable", "Consumed", "Possessed", "Ablaze",
    ],
  },
};

export const ZONE_KEYS = ["blue", "green", "yellow", "red"];

export function getZoneForWord(word) {
  for (const zone of ZONE_KEYS) {
    if (ZONES[zone].words.includes(word)) {
      return zone;
    }
  }
  return null;
}

/**
 * Generates the full 300-word sequence in rounds of 4.
 * Each round contains exactly one word from each zone,
 * in a randomized order — e.g. [R,G,B,Y], [G,R,Y,B], …
 * Words within each zone are also shuffled so every play is unique.
 * 75 rounds × 4 zones = 300 words = 5 minutes at 1 word/sec.
 */
export function generateWordSequence() {
  // Shuffle each zone's word list independently
  const shuffled = {};
  for (const zone of ZONE_KEYS) {
    const words = [...ZONES[zone].words];
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    shuffled[zone] = words;
  }

  const sequence = [];
  const wordsPerZone = ZONES[ZONE_KEYS[0]].words.length; // 75

  for (let round = 0; round < wordsPerZone; round++) {
    // Shuffle zone order for this round
    const zoneOrder = [...ZONE_KEYS];
    for (let i = zoneOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [zoneOrder[i], zoneOrder[j]] = [zoneOrder[j], zoneOrder[i]];
    }

    for (const zone of zoneOrder) {
      sequence.push({ word: shuffled[zone][round], zone });
    }
  }

  return sequence;
}
