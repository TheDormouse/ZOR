"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ZONES, ZONE_KEYS } from "@/lib/zones";
import { getTodaySession, hasPlayedToday } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [played, setPlayed] = useState(false);
  const [todaySession, setTodaySession] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const alreadyPlayed = hasPlayedToday();
    setPlayed(alreadyPlayed);
    if (alreadyPlayed) {
      setTodaySession(getTodaySession());
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {ZONE_KEYS.map((zone, i) => (
          <motion.div
            key={zone}
            className="absolute rounded-full opacity-10 blur-3xl"
            style={{
              background: ZONES[zone].color,
              width: "300px",
              height: "300px",
            }}
            animate={{
              x: [0, 50, -30, 0],
              y: [0, -40, 30, 0],
            }}
            transition={{
              duration: 12 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            initial={{
              left: `${15 + i * 22}%`,
              top: `${20 + (i % 2) * 40}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-2xl"
      >
        {/* Logo / Title */}
        <div className="mb-2">
          <div className="flex justify-center gap-3 mb-6">
            {ZONE_KEYS.map((zone, i) => (
              <motion.div
                key={zone}
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: ZONES[zone].color }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
          <h1 className="text-5xl font-light tracking-tight mb-3">
            Zones of Regulation
          </h1>
          <p className="text-white/50 text-lg font-light">
            A mindful check-in for how you're feeling right now
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={!played ? { scale: 1.05 } : {}}
            whileTap={!played ? { scale: 0.97 } : {}}
            onClick={() => !played && router.push("/play")}
            disabled={played}
            className={`px-10 py-4 rounded-2xl text-lg font-medium transition-all duration-300 ${
              played
                ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                : "bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10"
            }`}
          >
            {played ? "Already Played Today" : "Play"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/results")}
            className="px-10 py-4 rounded-2xl text-lg font-medium border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 transition-all duration-300"
          >
            View All Results
          </motion.button>
        </div>

        {/* Today's results preview if already played */}
        <AnimatePresence>
          {played && todaySession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-12"
            >
              <p className="text-white/40 text-sm uppercase tracking-widest mb-6">
                Your selections today
              </p>

              {/* Zone breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {ZONE_KEYS.map((zone) => {
                  const count = todaySession.zoneCounts?.[zone] || 0;
                  return (
                    <div
                      key={zone}
                      className="rounded-xl p-4 border"
                      style={{
                        borderColor: ZONES[zone].color + "40",
                        backgroundColor: ZONES[zone].color + "10",
                      }}
                    >
                      <div
                        className="text-2xl font-semibold"
                        style={{ color: ZONES[zone].color }}
                      >
                        {count}
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {ZONES[zone].label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected words */}
              <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto">
                {todaySession.selectedWords?.map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: ZONES[item.zone]?.color + "20",
                      color: ZONES[item.zone]?.color,
                      border: `1px solid ${ZONES[item.zone]?.color}40`,
                    }}
                  >
                    {item.word}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
