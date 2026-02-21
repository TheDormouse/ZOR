"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  StatusCards,
  ZoneCards,
  Charts,
  useSessionStats,
} from "@/components/ResultsCharts";

export default function ResultsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    async function fetchSessions() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("sessions")
        .select("*")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (data) {
        setSessions(data);
        updateCounts(data);
      }
      setLoading(false);
    }

    fetchSessions();

    const channel = supabase
      .channel("sessions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessions((prev) => {
              const updated = [payload.new, ...prev];
              updateCounts(updated);
              return updated;
            });
          } else if (payload.eventType === "UPDATE") {
            setSessions((prev) => {
              const updated = prev.map((s) =>
                s.id === payload.new.id ? payload.new : s
              );
              updateCounts(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function updateCounts(data) {
    setActiveCount(data.filter((s) => s.status === "in_progress").length);
    setCompletedCount(data.filter((s) => s.status === "completed").length);
  }

  const { aggregateZoneCounts, totalWords, pieData, barData, radarData, topWords, avgWordsPerSession } =
    useSessionStats(sessions);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-light"
            >
              Room Vibe Check
            </motion.h1>
            <p className="text-white/40 mt-1">
              Today&apos;s aggregate results &middot; Updated in real-time
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="px-6 py-2.5 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-all"
          >
            Back Home
          </motion.button>
        </div>

        <StatusCards
          activeCount={activeCount}
          completedCount={completedCount}
          totalWords={totalWords}
          avgWordsPerSession={avgWordsPerSession}
        />
        <ZoneCards aggregateZoneCounts={aggregateZoneCounts} totalWords={totalWords} />
        <Charts
          pieData={pieData}
          barData={barData}
          radarData={radarData}
          topWords={topWords}
          totalWords={totalWords}
        />
      </div>
    </div>
  );
}
