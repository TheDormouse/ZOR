"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  StatusCards,
  ZoneCards,
  Charts,
  useSessionStats,
} from "@/components/ResultsCharts";

export default function ClassroomDashboardPage({ params }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchData() {
      const { data: classroomData } = await supabase
        .from("classrooms")
        .select("*")
        .eq("id", classroomId)
        .single();

      if (!classroomData || classroomData.user_id !== user.id) {
        router.replace("/dashboard");
        return;
      }
      setClassroom(classroomData);

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });

      if (sessionData) {
        setSessions(sessionData);
        updateCounts(sessionData);
      }
      setLoading(false);
    }

    fetchData();

    const channel = supabase
      .channel(`classroom-sessions-${classroomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `classroom_id=eq.${classroomId}` },
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
  }, [authLoading, user, classroomId, router]);

  function updateCounts(data) {
    setActiveCount(data.filter((s) => s.status === "in_progress").length);
    setCompletedCount(data.filter((s) => s.status === "completed").length);
  }

  async function toggleActive() {
    if (!classroom) return;
    const newActive = !classroom.active;
    await supabase.from("classrooms").update({ active: newActive }).eq("id", classroom.id);
    setClassroom((prev) => ({ ...prev, active: newActive }));
  }

  async function clearSessions() {
    await supabase.from("sessions").delete().eq("classroom_id", classroomId);
    setSessions([]);
    setActiveCount(0);
    setCompletedCount(0);
    setConfirmDelete(false);
  }

  async function deleteClassroom() {
    await supabase.from("sessions").delete().eq("classroom_id", classroomId);
    await supabase.from("classrooms").delete().eq("id", classroomId);
    router.replace("/dashboard");
  }

  function copyLink() {
    if (!classroom) return;
    navigator.clipboard.writeText(`${window.location.origin}/t/${classroom.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stats = useSessionStats(sessions);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!classroom) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-white/40 hover:text-white/70 transition-colors mb-3 text-sm flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8L10 4" />
              </svg>
              Back to Dashboard
            </button>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-light"
            >
              {classroom.name}
            </motion.h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-white/40 font-mono text-sm bg-white/5 px-2 py-0.5 rounded">
                {classroom.code}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                classroom.active ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/30"
              }`}>
                {classroom.active ? "Active" : "Paused"}
              </span>
              <span className="text-white/30 text-sm">
                Updated in real-time
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyLink}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/60 hover:bg-white/5 transition-all"
            >
              {copied ? "Copied!" : "Copy Invite Link"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/dashboard/${classroomId}/customize`)}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/60 hover:bg-white/5 transition-all"
            >
              Customize
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleActive}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                classroom.active
                  ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                  : "border-green-500/30 text-green-400 hover:bg-green-500/10"
              }`}
            >
              {classroom.active ? "Pause" : "Activate"}
            </motion.button>
          </div>
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

        {/* Management section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
        >
          <h3 className="text-lg font-medium mb-4 text-white/70">Manage</h3>
          <div className="flex gap-3">
            {!confirmDelete ? (
              <>
                <button
                  onClick={() => setConfirmDelete("sessions")}
                  className="px-4 py-2 rounded-xl text-sm border border-red-500/20 text-red-400/70 hover:bg-red-500/10 transition-all"
                >
                  Clear All Sessions
                </button>
                <button
                  onClick={() => setConfirmDelete("classroom")}
                  className="px-4 py-2 rounded-xl text-sm border border-red-500/20 text-red-400/70 hover:bg-red-500/10 transition-all"
                >
                  Delete Classroom
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-red-400">
                  {confirmDelete === "sessions"
                    ? "Delete all sessions for this classroom?"
                    : "Delete this classroom and all its sessions?"}
                </span>
                <button
                  onClick={confirmDelete === "sessions" ? clearSessions : deleteClassroom}
                  className="px-4 py-2 rounded-xl text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl text-sm border border-white/10 text-white/50 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
