"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { ZONES, ZONE_KEYS } from "@/lib/zones";
import { supabase } from "@/lib/supabase";

export default function ResultsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Fetch all sessions and set up real-time subscription
  useEffect(() => {
    async function fetchSessions() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
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

    // Subscribe to real-time changes
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

  // Aggregate zone data from all completed sessions
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const aggregateZoneCounts = ZONE_KEYS.reduce((acc, zone) => {
    acc[zone] = completedSessions.reduce(
      (sum, s) => sum + (s.zone_counts?.[zone] || 0),
      0
    );
    return acc;
  }, {});

  const totalWords = Object.values(aggregateZoneCounts).reduce(
    (a, b) => a + b,
    0
  );

  // Chart data
  const pieData = ZONE_KEYS.map((zone) => ({
    name: ZONES[zone].label,
    value: aggregateZoneCounts[zone],
    color: ZONES[zone].color,
  })).filter((d) => d.value > 0);

  const barData = ZONE_KEYS.map((zone) => ({
    name: ZONES[zone].label,
    count: aggregateZoneCounts[zone],
    fill: ZONES[zone].color,
  }));

  const radarData = ZONE_KEYS.map((zone) => ({
    zone: ZONES[zone].label,
    value: aggregateZoneCounts[zone],
    fullMark: Math.max(...Object.values(aggregateZoneCounts), 1),
  }));

  // Top words across all sessions
  const wordFrequency = {};
  completedSessions.forEach((s) => {
    (s.selected_words || []).forEach((item) => {
      const key = `${item.word}|${item.zone}`;
      wordFrequency[key] = (wordFrequency[key] || 0) + 1;
    });
  });
  const topWords = Object.entries(wordFrequency)
    .map(([key, count]) => {
      const [word, zone] = key.split("|");
      return { word, zone, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const avgWordsPerSession =
    completedSessions.length > 0
      ? Math.round(totalWords / completedSessions.length)
      : 0;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
              Today's aggregate results &middot; Updated in real-time
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

        {/* Live status cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {/* Currently taking */}
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs text-white/40 uppercase tracking-wider">
                Currently Taking
              </span>
            </div>
            <div className="text-3xl font-semibold text-yellow-400">
              {activeCount}
            </div>
          </div>

          {/* Completed */}
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-white/40 uppercase tracking-wider">
                Completed
              </span>
            </div>
            <div className="text-3xl font-semibold text-green-400">
              {completedCount}
            </div>
          </div>

          {/* Total words */}
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
              Total Words Collected
            </div>
            <div className="text-3xl font-semibold">{totalWords}</div>
          </div>

          {/* Avg per session */}
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
              Avg per Person
            </div>
            <div className="text-3xl font-semibold">{avgWordsPerSession}</div>
          </div>
        </motion.div>

        {/* Zone summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {ZONE_KEYS.map((zone) => {
            const count = aggregateZoneCounts[zone];
            const pct =
              totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;
            return (
              <div
                key={zone}
                className="rounded-2xl p-5 border backdrop-blur-sm"
                style={{
                  borderColor: ZONES[zone].color + "40",
                  backgroundColor: ZONES[zone].color + "08",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ZONES[zone].color }}
                  />
                  <span className="text-sm text-white/60">
                    {ZONES[zone].name}
                  </span>
                </div>
                <div
                  className="text-3xl font-semibold"
                  style={{ color: ZONES[zone].color }}
                >
                  {count}
                </div>
                <div className="text-sm text-white/30 mt-1">{pct}% of total</div>
                {/* Mini bar */}
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: ZONES[zone].color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <h3 className="text-lg font-medium mb-4 text-white/70">
              Zone Distribution
            </h3>
            {totalWords > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "rgba(255,255,255,0.6)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-white/30">
                Waiting for data...
              </div>
            )}
          </motion.div>

          {/* Bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <h3 className="text-lg font-medium mb-4 text-white/70">
              Words by Zone
            </h3>
            {totalWords > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-white/30">
                Waiting for data...
              </div>
            )}
          </motion.div>

          {/* Radar chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <h3 className="text-lg font-medium mb-4 text-white/70">
              Zone Radar
            </h3>
            {totalWords > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="zone"
                    tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-white/30">
                Waiting for data...
              </div>
            )}
          </motion.div>

          {/* Top words */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <h3 className="text-lg font-medium mb-4 text-white/70">
              Most Selected Words
            </h3>
            {topWords.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto">
                {topWords.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: ZONES[item.zone]?.color + "20",
                      border: `1px solid ${ZONES[item.zone]?.color}40`,
                    }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: ZONES[item.zone]?.color }}
                    >
                      {item.word}
                    </span>
                    <span className="text-xs text-white/40">×{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-white/30">
                Waiting for data...
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
