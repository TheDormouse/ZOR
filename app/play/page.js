"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ZONES, ZONE_KEYS, generateWordSequence } from "@/lib/zones";
import { hasPlayedToday, saveSession } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const GAME_DURATION = 300; // 5 minutes in seconds
const WORD_INTERVAL = 1000; // 1 word per second
const BUBBLE_LIFETIME = 8000; // 8 seconds to fall
const INACTIVITY_TIMEOUT = 60_000; // 60 seconds of no interaction → cancel

const SUPABASE_URL = "https://uwuszitxbahafyjjsssl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dXN6aXR4YmFoYWZ5ampzc3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjkyNTQsImV4cCI6MjA4NTY0NTI1NH0.OBENH_0cC7MJOqwd5X0MkXQr21ZDiJOGvP0qrQGsAtw";

// Fire-and-forget sync via REST + keepalive (survives page unload)
function beaconUpdate(id, body) {
  if (!id) return;
  fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

export default function PlayPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState("ready"); // ready | playing | finished
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeBubbles, setActiveBubbles] = useState([]);
  const [collected, setCollected] = useState([]);
  const [zoneCounts, setZoneCounts] = useState({ blue: 0, green: 0, yellow: 0, red: 0 });
  const [sessionId, setSessionId] = useState(null);

  const wordSequence = useRef([]);
  const wordIndex = useRef(0);
  const bubbleId = useRef(0);
  const timerRef = useRef(null);
  const spawnerRef = useRef(null);
  const gameAreaRef = useRef(null);
  const sessionIdRef = useRef(null);
  const gameStateRef = useRef("ready");
  const inactivityTimer = useRef(null);
  const hiddenSinceRef = useRef(null);

  // Keep refs in sync so event handlers always see current values
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Redirect if already played
  useEffect(() => {
    if (typeof window !== "undefined" && hasPlayedToday()) {
      router.replace("/");
    }
  }, [router]);

  // Create Supabase session on mount
  useEffect(() => {
    async function createSession() {
      const { data, error } = await supabase
        .from("sessions")
        .insert({ status: "in_progress", selected_words: [], zone_counts: {} })
        .select("id")
        .single();
      if (data) {
        setSessionId(data.id);
      }
    }
    createSession();
  }, []);

  // Generate word sequence
  useEffect(() => {
    wordSequence.current = generateWordSequence();
  }, []);

  // ── Cancellation: beforeunload (tab close / navigate away) ──
  useEffect(() => {
    function handleBeforeUnload() {
      if (gameStateRef.current === "finished") return;
      beaconUpdate(sessionIdRef.current, {
        status: "cancelled",
        selected_words: collectedRef.current,
        zone_counts: zoneCountsRef.current,
      });
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ── Cancellation: visibilitychange (tab hidden for too long) ──
  useEffect(() => {
    function handleVisibility() {
      if (gameStateRef.current === "finished") return;

      if (document.hidden) {
        hiddenSinceRef.current = Date.now();
      } else if (hiddenSinceRef.current) {
        const away = Date.now() - hiddenSinceRef.current;
        hiddenSinceRef.current = null;
        if (away > INACTIVITY_TIMEOUT) {
          cancelAndRedirect();
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── Cancellation: inactivity (no clicks/taps for 60 s while playing) ──
  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    if (gameStateRef.current !== "playing") return;
    inactivityTimer.current = setTimeout(() => {
      if (gameStateRef.current === "playing") cancelAndRedirect();
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      resetInactivityTimer();
      window.addEventListener("pointerdown", resetInactivityTimer);
      return () => {
        clearTimeout(inactivityTimer.current);
        window.removeEventListener("pointerdown", resetInactivityTimer);
      };
    }
  }, [gameState, resetInactivityTimer]);

  // Shared cancel helper
  const cancelAndRedirect = useCallback(async () => {
    if (gameStateRef.current === "finished") return;
    setGameState("finished");
    clearInterval(timerRef.current);
    clearInterval(spawnerRef.current);
    clearTimeout(syncTimer.current);
    if (sessionIdRef.current) {
      await supabase
        .from("sessions")
        .update({
          status: "cancelled",
          selected_words: collectedRef.current,
          zone_counts: zoneCountsRef.current,
        })
        .eq("id", sessionIdRef.current);
    }
    router.replace("/");
  }, [router]);

  // ── Cancellation: unmount without finishing ──
  useEffect(() => {
    return () => {
      if (gameStateRef.current !== "finished") {
        beaconUpdate(sessionIdRef.current, {
          status: "cancelled",
          selected_words: collectedRef.current,
          zone_counts: zoneCountsRef.current,
        });
      }
    };
  }, []);

  const startGame = useCallback(() => {
    setGameState("playing");
    wordIndex.current = 0;

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start spawning bubbles
    spawnBubble();
    spawnerRef.current = setInterval(spawnBubble, WORD_INTERVAL);
  }, []);

  // Distribute bubbles across lanes to reduce overlap
  const lastLane = useRef(-1);
  const spawnBubble = useCallback(() => {
    if (wordIndex.current >= wordSequence.current.length) return;

    const { word, zone } = wordSequence.current[wordIndex.current];
    wordIndex.current++;

    const id = bubbleId.current++;
    // Pick a lane that's far from the last one
    let lane;
    let attempts = 0;
    do {
      lane = Math.random() * 75 + 5; // 5-80%
      attempts++;
    } while (Math.abs(lane - lastLane.current) < 20 && attempts < 5);
    lastLane.current = lane;

    const swayDuration = 2.5 + Math.random() * 2; // 2.5-4.5s, varied per bubble

    setActiveBubbles((prev) => [
      ...prev,
      { id, word, zone, lane, swayDuration, createdAt: Date.now() },
    ]);

    // Remove bubble after its lifetime
    setTimeout(() => {
      setActiveBubbles((prev) => prev.filter((b) => b.id !== id));
    }, BUBBLE_LIFETIME);
  }, []);

  const endGame = useCallback(() => {
    setGameState("finished");
    clearInterval(timerRef.current);
    clearInterval(spawnerRef.current);
  }, []);

  // Save results when game finishes
  useEffect(() => {
    if (gameState !== "finished") return;

    async function saveResults() {
      if (sessionId) {
        await supabase
          .from("sessions")
          .update({
            status: "completed",
            selected_words: collected,
            zone_counts: zoneCounts,
            completed_at: new Date().toISOString(),
          })
          .eq("id", sessionId);
      }
      saveSession(sessionId, collected, zoneCounts);

      // Wait a moment then redirect
      setTimeout(() => router.push("/results"), 2000);
    }
    saveResults();
  }, [gameState, sessionId, collected, zoneCounts, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(spawnerRef.current);
      clearTimeout(syncTimer.current);
    };
  }, []);

  // ── Debounced sync: push collected words to Supabase shortly after each click ──
  const syncTimer = useRef(null);
  const collectedRef = useRef([]);
  const zoneCountsRef = useRef({ blue: 0, green: 0, yellow: 0, red: 0 });

  useEffect(() => { collectedRef.current = collected; }, [collected]);
  useEffect(() => { zoneCountsRef.current = zoneCounts; }, [zoneCounts]);

  const scheduleSyncToDb = useCallback(() => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      if (!sessionIdRef.current) return;
      supabase
        .from("sessions")
        .update({
          selected_words: collectedRef.current,
          zone_counts: zoneCountsRef.current,
        })
        .eq("id", sessionIdRef.current)
        .then(() => {});
    }, 2000); // 2-second debounce — batches rapid clicks
  }, []);

  const collectWord = useCallback((bubble) => {
    // Mark as collected for animation
    setActiveBubbles((prev) =>
      prev.map((b) =>
        b.id === bubble.id ? { ...b, collected: true } : b
      )
    );

    const item = { word: bubble.word, zone: bubble.zone };
    setCollected((prev) => [...prev, item]);
    setZoneCounts((prev) => ({
      ...prev,
      [bubble.zone]: (prev[bubble.zone] || 0) + 1,
    }));

    // Sync to database (debounced)
    scheduleSyncToDb();

    // Remove after animation
    setTimeout(() => {
      setActiveBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    }, 400);
  }, [scheduleSyncToDb]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const totalCollected = collected.length;
  const progressPercent = ((GAME_DURATION - timeLeft) / GAME_DURATION) * 100;

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative">
      {/* Header bar */}
      <div className="relative z-20 px-4 py-3 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Timer */}
          <div className="flex items-center gap-3">
            <div className="text-3xl font-mono font-light tabular-nums">
              {formatTime(timeLeft)}
            </div>
            {gameState === "playing" && (
              <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/50 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>

          {/* Collected count */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold">{totalCollected}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                Collected
              </div>
            </div>

            {/* Mini zone indicators */}
            <div className="hidden sm:flex gap-2">
              {ZONE_KEYS.map((zone) => (
                <div
                  key={zone}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ backgroundColor: ZONES[zone].color + "15" }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ZONES[zone].color }}
                  />
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: ZONES[zone].color }}
                  >
                    {zoneCounts[zone]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div ref={gameAreaRef} className="flex-1 relative overflow-hidden">
        {/* Ready screen */}
        {gameState === "ready" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <h2 className="text-3xl font-light mb-3">
                How are you feeling?
              </h2>
              <p className="text-white/50 mb-2 max-w-md mx-auto">
                Emotion words will float down the screen. Tap the ones that
                resonate with how you feel right now.
              </p>
              <p className="text-white/30 text-sm mb-8">
                5 minutes &middot; 300 words &middot; Pick as many or as few as
                you like
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="px-12 py-4 bg-white text-slate-900 rounded-2xl text-xl font-medium shadow-lg shadow-white/10 hover:bg-white/90 transition-colors"
              >
                Begin
              </motion.button>
            </motion.div>
          </div>
        )}

        {/* Finished screen */}
        {gameState === "finished" && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <h2 className="text-4xl font-light mb-4">Time's Up</h2>
              <p className="text-white/50 text-lg mb-2">
                You collected{" "}
                <span className="text-white font-medium">{totalCollected}</span>{" "}
                words
              </p>
              <div className="flex justify-center gap-3 mt-4 mb-6">
                {ZONE_KEYS.map((zone) => (
                  <div
                    key={zone}
                    className="px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: ZONES[zone].color + "20",
                      border: `1px solid ${ZONES[zone].color}40`,
                    }}
                  >
                    <span
                      className="text-lg font-semibold"
                      style={{ color: ZONES[zone].color }}
                    >
                      {zoneCounts[zone]}
                    </span>
                    <span className="text-white/40 text-sm ml-1.5">
                      {ZONES[zone].label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-white/30 text-sm animate-pulse">
                Saving results...
              </p>
            </motion.div>
          </div>
        )}

        {/* Floating bubbles */}
        {activeBubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={bubble.collected ? "bubble-collected" : "bubble-fall"}
            style={{
              left: `${bubble.lane}%`,
              "--duration": `${BUBBLE_LIFETIME}ms`,
              zIndex: 5,
            }}
          >
            <div
              className="bubble-sway"
              style={{ "--sway-duration": `${bubble.swayDuration}s` }}
            >
              <button
                onClick={() => !bubble.collected && collectWord(bubble)}
                className="bubble px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap select-none active:scale-95"
                style={{
                  backgroundColor: ZONES[bubble.zone].color + "25",
                  color: ZONES[bubble.zone].color,
                  border: `1.5px solid ${ZONES[bubble.zone].color}50`,
                  backdropFilter: "blur(8px)",
                }}
              >
                {bubble.word}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
