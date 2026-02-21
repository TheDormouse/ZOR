"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ZONES, ZONE_KEYS } from "@/lib/zones";
import { supabase } from "@/lib/supabase";

export default function InvitePage({ params }) {
  const { code } = use(params);
  const router = useRouter();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchClassroom() {
      const { data, error: err } = await supabase
        .from("classrooms")
        .select("*")
        .eq("code", code)
        .single();

      if (err || !data) {
        setError("This check-in link doesn't exist.");
      } else if (!data.active) {
        setError("This check-in is no longer active.");
      } else {
        setClassroom(data);
      }
      setLoading(false);
    }
    fetchClassroom();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-5xl mb-4 opacity-30">:(</div>
          <h1 className="text-2xl font-light mb-3">{error}</h1>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-2.5 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-all text-sm"
          >
            Go Home
          </button>
        </motion.div>
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
        className="text-center z-10 max-w-lg"
      >
        <div className="flex justify-center gap-3 mb-6">
          {ZONE_KEYS.map((zone, i) => (
            <motion.div
              key={zone}
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: ZONES[zone].color }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>

        <h1 className="text-4xl font-light tracking-tight mb-3">
          {classroom.name}
        </h1>
        <p className="text-white/50 text-lg font-light mb-2">
          Zones of Regulation Check-in
        </p>
        <p className="text-white/30 text-sm mb-10">
          5 minutes &middot; Tap the words that match how you feel
        </p>

        <div className="flex flex-col items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/play?tag=${code}`)}
            className="px-12 py-4 bg-white text-slate-900 rounded-2xl text-xl font-medium shadow-lg shadow-white/10 hover:bg-white/90 transition-colors"
          >
            Start Check-in
          </motion.button>

          <button
            onClick={() => router.push("/how-it-works")}
            className="text-white/30 hover:text-white/60 transition-colors text-sm underline underline-offset-4"
          >
            How does it work?
          </button>
        </div>
      </motion.div>
    </div>
  );
}
