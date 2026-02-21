"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ZONES, ZONE_KEYS } from "@/lib/zones";

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5 },
});

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white/70 transition-colors mb-8 text-sm flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8L10 4" />
          </svg>
          Back
        </button>

        <motion.h1
          {...fadeIn(0)}
          className="text-4xl font-light tracking-tight mb-3"
        >
          How It Works
        </motion.h1>
        <motion.p
          {...fadeIn(0.1)}
          className="text-white/40 text-lg mb-12"
        >
          Everything you need to know about the Zones check-in experience.
        </motion.p>

        {/* The Four Zones */}
        <motion.section {...fadeIn(0.15)} className="mb-12">
          <h2 className="text-xl font-medium mb-4">The Four Zones</h2>
          <p className="text-white/50 mb-6">
            The Zones of Regulation framework organizes emotions into four color-coded categories.
            Each zone represents a range of emotional states:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ZONE_KEYS.map((zone) => (
              <div
                key={zone}
                className="rounded-2xl p-5 border backdrop-blur-sm"
                style={{
                  borderColor: ZONES[zone].color + "40",
                  backgroundColor: ZONES[zone].color + "08",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: ZONES[zone].color }}
                  />
                  <h3
                    className="font-medium text-lg"
                    style={{ color: ZONES[zone].color }}
                  >
                    {ZONES[zone].name}
                  </h3>
                </div>
                <p className="text-white/40 text-sm">
                  {zone === "blue" && "Low energy and down states — sadness, tiredness, boredom, feeling disconnected or withdrawn."}
                  {zone === "green" && "Calm, regulated, and ready states — happiness, focus, contentment, feeling safe and grounded."}
                  {zone === "yellow" && "Heightened and elevated states — anxiety, excitement, frustration, feeling restless or overwhelmed."}
                  {zone === "red" && "Extreme and intense states — anger, terror, rage, feeling out of control or explosive."}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* How Words Are Distributed */}
        <motion.section {...fadeIn(0.2)} className="mb-12">
          <h2 className="text-xl font-medium mb-4">How Words Are Distributed</h2>
          <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium mb-1">All words are unique</h4>
                <p className="text-white/40 text-sm">
                  No word appears more than once during a session. Each emotion word is distinct and carefully chosen for its zone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium mb-1">Evenly split among zones</h4>
                <p className="text-white/40 text-sm">
                  Words are divided equally across the four zones. With the default pack,
                  that&apos;s 75 words per zone &times; 4 zones = 300 words total. Custom word
                  packs must maintain this even split (20&ndash;100 words per zone).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium mb-1">Presented in balanced rounds</h4>
                <p className="text-white/40 text-sm">
                  Words are presented in &quot;rounds&quot; of four — one word from each zone per round.
                  This ensures you always see an equal representation from all emotional states.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How Randomization Works */}
        <motion.section {...fadeIn(0.25)} className="mb-12">
          <h2 className="text-xl font-medium mb-4">How Randomization Works</h2>
          <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium mb-1">Words are shuffled independently</h4>
                <p className="text-white/40 text-sm">
                  Each zone&apos;s word list is shuffled separately using a randomized algorithm
                  (Fisher-Yates shuffle), so the order of words within each zone is completely random.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium mb-1">Zone order is randomized per round</h4>
                <p className="text-white/40 text-sm">
                  Within each round, the order in which zones appear is also randomized.
                  One round might show Red, Green, Blue, Yellow — the next might be Green, Red, Yellow, Blue.
                  This prevents any predictable pattern.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium mb-1">Every session is unique</h4>
                <p className="text-white/40 text-sm">
                  The combination of word shuffling and zone-order randomization means no two
                  sessions will ever present words in the same order. Each check-in is a fresh experience.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Round Structure Diagram */}
        <motion.section {...fadeIn(0.3)} className="mb-12">
          <h2 className="text-xl font-medium mb-4">Round Structure</h2>
          <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((round) => (
                <div key={round} className="flex items-center gap-3">
                  <span className="text-white/30 text-sm w-16 shrink-0">
                    Round {round}
                  </span>
                  <div className="flex gap-2 flex-1">
                    {(() => {
                      const orders = [
                        ["red", "green", "blue", "yellow"],
                        ["green", "yellow", "red", "blue"],
                        ["blue", "red", "yellow", "green"],
                      ];
                      return orders[round - 1].map((zone, i) => (
                        <div
                          key={i}
                          className="flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: ZONES[zone].color + "20",
                            color: ZONES[zone].color,
                            border: `1px solid ${ZONES[zone].color}30`,
                          }}
                        >
                          {ZONES[zone].label}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-sm w-16 shrink-0">...</span>
                <div className="flex-1 text-center text-white/20 text-sm py-2">
                  Continues for 75 rounds (300 words at 1 per second = 5 minutes)
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Customization Note */}
        <motion.section {...fadeIn(0.35)} className="mb-12">
          <h2 className="text-xl font-medium mb-4">Customization</h2>
          <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-white/50 mb-3">
              Classroom owners can fully customize the check-in experience:
            </p>
            <ul className="space-y-2 text-white/40 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-white/20 mt-0.5">&bull;</span>
                <span><strong className="text-white/60">Word Packs</strong> — Choose from preset packs (Default, Elementary, Teens, Workplace) or create your own with custom words for each zone.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/20 mt-0.5">&bull;</span>
                <span><strong className="text-white/60">Visual Themes</strong> — Change bubble shapes (circle, star, heart, hexagon, and more), upload custom bubble images, set background images, and override zone colors.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/20 mt-0.5">&bull;</span>
                <span><strong className="text-white/60">Background Music</strong> — Select from preset ambient tracks or upload your own audio to play during the check-in.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/20 mt-0.5">&bull;</span>
                <span><strong className="text-white/60">Sharing</strong> — Word packs can be made public for other educators to discover and use.</span>
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div {...fadeIn(0.4)} className="text-center pb-8">
          <button
            onClick={() => router.back()}
            className="px-8 py-3 rounded-xl border border-white/15 text-white/50 hover:bg-white/5 transition-all text-sm"
          >
            Got it, take me back
          </button>
        </motion.div>
      </div>
    </div>
  );
}
