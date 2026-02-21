"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

function generateCode() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [sessionCounts, setSessionCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  const fetchClassrooms = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("classrooms")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setClassrooms(data);
      const counts = {};
      for (const cr of data) {
        const { count } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("classroom_id", cr.id)
          .eq("status", "completed");
        counts[cr.id] = count || 0;
      }
      setSessionCounts(counts);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchClassrooms();
  }, [authLoading, user, fetchClassrooms]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("classrooms")
      .insert({ user_id: user.id, name: newName.trim(), code: generateCode() })
      .select()
      .single();

    if (error && error.code === "23505") {
      const { data: retry } = await supabase
        .from("classrooms")
        .insert({ user_id: user.id, name: newName.trim(), code: generateCode() })
        .select()
        .single();
      if (retry) {
        setClassrooms((prev) => [retry, ...prev]);
        setSessionCounts((prev) => ({ ...prev, [retry.id]: 0 }));
      }
    } else if (data) {
      setClassrooms((prev) => [data, ...prev]);
      setSessionCounts((prev) => ({ ...prev, [data.id]: 0 }));
    }

    setNewName("");
    setShowCreate(false);
    setCreating(false);
  }

  async function toggleActive(classroom) {
    const newActive = !classroom.active;
    await supabase.from("classrooms").update({ active: newActive }).eq("id", classroom.id);
    setClassrooms((prev) => prev.map((c) => (c.id === classroom.id ? { ...c, active: newActive } : c)));
  }

  function copyLink(classroom) {
    const url = `${window.location.origin}/t/${classroom.code}`;
    navigator.clipboard.writeText(url);
    setCopied(classroom.id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-light"
            >
              Dashboard
            </motion.h1>
            <p className="text-white/40 mt-1">
              {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/")}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-white/50 hover:bg-white/5 transition-all text-sm"
            >
              Home
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-white/50 hover:bg-white/5 transition-all text-sm"
            >
              Sign Out
            </motion.button>
          </div>
        </div>

        {/* Create classroom section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <AnimatePresence mode="wait">
            {showCreate ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreate}
                className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <h3 className="text-lg font-medium mb-4">Create a New Classroom</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Classroom name (e.g., 3rd Period - Morning Check-in)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    autoFocus
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={creating}
                    className="px-6 py-3 rounded-xl bg-white text-slate-900 font-medium hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    {creating ? "..." : "Create"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-3 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.button
                key="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreate(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-white/15 text-white/50 hover:border-white/30 hover:text-white/70 hover:bg-white/5 transition-all text-sm font-medium"
              >
                + Create New Classroom
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Classrooms list */}
        <div className="space-y-4">
          {classrooms.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <p className="text-lg mb-2">No classrooms yet</p>
              <p className="text-sm">Create your first classroom to start sharing check-in links</p>
            </div>
          )}
          {classrooms.map((classroom, i) => (
            <motion.div
              key={classroom.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`rounded-2xl p-5 border backdrop-blur-sm transition-all ${
                classroom.active
                  ? "bg-white/5 border-white/10"
                  : "bg-white/[0.02] border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-medium truncate">{classroom.name}</h3>
                    {!classroom.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                        Paused
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/40">
                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded">
                      {classroom.code}
                    </span>
                    <span>{sessionCounts[classroom.id] || 0} completed sessions</span>
                    <span>
                      {new Date(classroom.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyLink(classroom)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                  >
                    {copied === classroom.id ? "Copied!" : "Copy Link"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleActive(classroom)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      classroom.active
                        ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        : "border-white/10 text-white/40 hover:bg-white/5"
                    }`}
                  >
                    {classroom.active ? "Active" : "Paused"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/dashboard/${classroom.id}/customize`)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                  >
                    Customize
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/dashboard/${classroom.id}`)}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/15 transition-all"
                  >
                    View Results
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
