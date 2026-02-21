"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  StatusCards,
  ZoneCards,
  Charts,
  useSessionStats,
} from "@/components/ResultsCharts";

export default function ClassroomResultsPage({ params }) {
  const { code } = use(params);
  const router = useRouter();
  const [classroom, setClassroom] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const { data: classroomData } = await supabase
        .from("classrooms")
        .select("*")
        .eq("code", code)
        .single();

      if (!classroomData) {
        setLoading(false);
        return;
      }
      setClassroom(classroomData);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*")
        .eq("classroom_id", classroomData.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (sessionData) {
        setSessions(sessionData);
        updateCounts(sessionData);
      }
      setLoading(false);
    }

    fetchData();
  }, [code]);

  useEffect(() => {
    if (!classroom) return;

    const channel = supabase
      .channel(`classroom-results-${classroom.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `classroom_id=eq.${classroom.id}` },
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
  }, [classroom]);

  function updateCounts(data) {
    setActiveCount(data.filter((s) => s.status === "in_progress").length);
    setCompletedCount(data.filter((s) => s.status === "completed").length);
  }

  const stats = useSessionStats(sessions);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-3">Check-in not found</h1>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2.5 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-all text-sm"
          >
            Go Home
          </button>
        </div>
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
              {classroom.name}
            </motion.h1>
            <p className="text-white/40 mt-1">
              Today&apos;s results &middot; Updated in real-time
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/t/${code}`)}
            className="px-6 py-2.5 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-all"
          >
            Play Again
          </motion.button>
        </div>

        <StatusCards
          activeCount={activeCount}
          completedCount={completedCount}
          totalWords={stats.totalWords}
          avgWordsPerSession={stats.avgWordsPerSession}
        />
        <ZoneCards aggregateZoneCounts={stats.aggregateZoneCounts} totalWords={stats.totalWords} />
        <Charts
          pieData={stats.pieData}
          barData={stats.barData}
          radarData={stats.radarData}
          topWords={stats.topWords}
          totalWords={stats.totalWords}
        />
      </div>
    </div>
  );
}
