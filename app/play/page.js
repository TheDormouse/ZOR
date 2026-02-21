"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ZONES, ZONE_KEYS } from "@/lib/zones";
import { generateWordSequence, DEFAULT_WORD_PACK, PRESET_WORD_PACKS } from "@/lib/word-packs";
import { mergeTheme, BUBBLE_SHAPES, BUBBLE_FONT_STYLES } from "@/lib/themes";
import { MUSIC_PRESETS } from "@/lib/themes/presets";
import { hasPlayedToday, saveSession } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const DEFAULT_GAME_DURATION = 300;
const WORD_INTERVAL = 2000;
const BUBBLE_LIFETIME = 12000;
const INACTIVITY_TIMEOUT = 60_000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <PlayGame />
    </Suspense>
  );
}

function PlayGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classroomCode = searchParams.get("tag");
  const classroomCodeRef = useRef(classroomCode);

  const [gameState, setGameState] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_GAME_DURATION);
  const [activeBubbles, setActiveBubbles] = useState([]);
  const [collected, setCollected] = useState([]);
  const [zoneCounts, setZoneCounts] = useState({ blue: 0, green: 0, yellow: 0, red: 0 });
  const [sessionId, setSessionId] = useState(null);
  const [classroomId, setClassroomId] = useState(null);

  // Theme & word pack state
  const [activeTheme, setActiveTheme] = useState(() => mergeTheme());
  const [wordPack, setWordPack] = useState(DEFAULT_WORD_PACK);
  const [settingsLoaded, setSettingsLoaded] = useState(!classroomCode);

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
  const audioRef = useRef(null);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Redirect if already played (anonymous flow only)
  useEffect(() => {
    if (!classroomCode && typeof window !== "undefined" && hasPlayedToday()) {
      router.replace("/");
    }
  }, [router, classroomCode]);

  // Load classroom settings + create session
  useEffect(() => {
    async function init() {
      let resolvedClassroomId = null;

      if (classroomCodeRef.current) {
        const { data: classroomData } = await supabase
          .from("classrooms")
          .select("id, theme, word_pack_id")
          .eq("code", classroomCodeRef.current)
          .single();

        if (classroomData) {
          resolvedClassroomId = classroomData.id;
          setClassroomId(resolvedClassroomId);

          // Apply theme
          if (classroomData.theme && Object.keys(classroomData.theme).length > 0) {
            setActiveTheme(mergeTheme(classroomData.theme));
          }

          // Load word pack: custom DB pack takes priority, then preset, then default
          if (classroomData.word_pack_id) {
            const { data: packData } = await supabase
              .from("word_packs")
              .select("*")
              .eq("id", classroomData.word_pack_id)
              .single();
            if (packData) {
              setWordPack({ ...packData, zones: packData.words });
            }
          } else if (classroomData.theme?.wordPackPreset) {
            const preset = PRESET_WORD_PACKS.find(
              (p) => p.id === classroomData.theme.wordPackPreset
            );
            if (preset) setWordPack(preset);
          }
        }
        setSettingsLoaded(true);
      }

      const insertPayload = { status: "in_progress", selected_words: [], zone_counts: {} };
      if (resolvedClassroomId) insertPayload.classroom_id = resolvedClassroomId;

      const { data } = await supabase
        .from("sessions")
        .insert(insertPayload)
        .select("id")
        .single();
      if (data) {
        setSessionId(data.id);
      }
    }
    init();
  }, []);

  // Generate word sequence once settings are loaded
  useEffect(() => {
    if (!settingsLoaded) return;
    wordSequence.current = generateWordSequence(wordPack);
  }, [settingsLoaded, wordPack]);

  const isInfinite = activeTheme.game?.infinite === true;
  const gameDuration = activeTheme.game?.duration || DEFAULT_GAME_DURATION;
  const totalWords = wordPack.zones
    ? ZONE_KEYS.reduce((sum, z) => sum + (wordPack.zones[z]?.words?.length || 0), 0)
    : 300;

  // Cancellation: beforeunload
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

  // Cancellation: visibilitychange
  useEffect(() => {
    function handleVisibility() {
      if (gameStateRef.current === "finished") return;
      if (document.hidden) {
        hiddenSinceRef.current = Date.now();
      } else if (hiddenSinceRef.current) {
        const away = Date.now() - hiddenSinceRef.current;
        hiddenSinceRef.current = null;
        if (away > INACTIVITY_TIMEOUT) cancelAndRedirect();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Cancellation: inactivity
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

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const cancelAndRedirect = useCallback(async () => {
    if (gameStateRef.current === "finished") return;
    setGameState("finished");
    clearInterval(timerRef.current);
    clearInterval(spawnerRef.current);
    clearTimeout(syncTimer.current);
    stopMusic();
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
    router.replace(classroomCodeRef.current ? `/t/${classroomCodeRef.current}` : "/");
  }, [router, stopMusic]);

  // Cancellation: unmount without finishing
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

  function startMusic() {
    const music = activeTheme.music;
    if (!music) return;

    let src = null;
    if (music.url) {
      src = music.url;
    } else if (music.preset) {
      const preset = MUSIC_PRESETS.find((p) => p.id === music.preset);
      if (preset?.file) src = preset.file;
    }

    if (src) {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.15;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  }

  const startGame = useCallback(() => {
    setGameState("playing");
    wordIndex.current = 0;
    startMusic();

    if (isInfinite) {
      setTimeLeft(0);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev + 1);
      }, 1000);
    } else {
      setTimeLeft(gameDuration);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    spawnBubble();
    spawnerRef.current = setInterval(spawnBubble, WORD_INTERVAL);
  }, [activeTheme, isInfinite, gameDuration]);

  const lastLane = useRef(-1);
  const spawnBubble = useCallback(() => {
    if (wordSequence.current.length === 0) return;
    if (wordIndex.current >= wordSequence.current.length) {
      if (!isInfinite) return;
      wordIndex.current = 0;
    }

    const { word, zone } = wordSequence.current[wordIndex.current];
    wordIndex.current++;

    const id = bubbleId.current++;
    let lane;
    let attempts = 0;
    do {
      lane = Math.random() * 75 + 5;
      attempts++;
    } while (Math.abs(lane - lastLane.current) < 20 && attempts < 5);
    lastLane.current = lane;

    const swayDuration = 2.5 + Math.random() * 2;

    setActiveBubbles((prev) => [
      ...prev,
      { id, word, zone, lane, swayDuration, createdAt: Date.now() },
    ]);

    setTimeout(() => {
      setActiveBubbles((prev) => prev.filter((b) => b.id !== id));
    }, BUBBLE_LIFETIME);
  }, [isInfinite]);

  const endGame = useCallback(() => {
    setGameState("finished");
    clearInterval(timerRef.current);
    clearInterval(spawnerRef.current);
    stopMusic();
  }, [stopMusic]);

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

      if (!classroomCodeRef.current) {
        saveSession(sessionId, collected, zoneCounts);
      }

      const dest = classroomCodeRef.current
        ? `/t/${classroomCodeRef.current}/results`
        : "/results";
      setTimeout(() => router.push(dest), 2000);
    }
    saveResults();
  }, [gameState, sessionId, collected, zoneCounts, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(spawnerRef.current);
      clearTimeout(syncTimer.current);
      stopMusic();
    };
  }, [stopMusic]);

  // Debounced sync
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
    }, 2000);
  }, []);

  const collectWord = useCallback((bubble) => {
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

    scheduleSyncToDb();

    setTimeout(() => {
      setActiveBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    }, 400);
  }, [scheduleSyncToDb]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Resolve zone colors from theme
  function zoneColor(zone) {
    return activeTheme.zoneColors?.[zone] || ZONES[zone].color;
  }

  const totalCollected = collected.length;
  const progressPercent = isInfinite ? 0 : ((gameDuration - timeLeft) / gameDuration) * 100;

  // Bubble shape helpers
  const bubbleShape = BUBBLE_SHAPES[activeTheme.bubble?.shape] || BUBBLE_SHAPES.circle;
  const bubbleImageUrl = activeTheme.bubble?.imageUrl;
  const showBubbleText = activeTheme.bubble?.showText !== false;
  const bubbleFontSize = activeTheme.bubble?.fontSize || "11px";
  const bubbleFontDef = BUBBLE_FONT_STYLES.find((f) => f.id === (activeTheme.bubble?.fontStyle || "semibold")) || BUBBLE_FONT_STYLES[1];

  // Background
  const bgStyle = activeTheme.backgroundImage
    ? {
        backgroundImage: `url(${activeTheme.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : {
        background: `linear-gradient(135deg, ${activeTheme.background.gradient[0]}, ${activeTheme.background.gradient[1]})`,
      };

  if (!settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative" style={bgStyle}>
      {/* Header bar */}
      <div className="relative z-20 px-4 py-3 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-mono font-light tabular-nums">
              {formatTime(timeLeft)}
            </div>
            {gameState === "playing" && !isInfinite && (
              <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/50 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
            {gameState === "playing" && isInfinite && (
              <span className="text-xs text-white/30 uppercase tracking-wider">elapsed</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {gameState === "playing" && (
              <button
                onClick={endGame}
                className="px-4 py-1.5 rounded-xl text-sm font-medium bg-white/10 border border-white/20 text-white/70 hover:bg-white/15 hover:text-white transition-all"
              >
                Done
              </button>
            )}
            <div className="text-center">
              <div className="text-2xl font-semibold">{totalCollected}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                Collected
              </div>
            </div>

            <div className="hidden sm:flex gap-2">
              {ZONE_KEYS.map((zone) => (
                <div
                  key={zone}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ backgroundColor: zoneColor(zone) + "15" }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: zoneColor(zone) }}
                  />
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: zoneColor(zone) }}
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
                {isInfinite ? "No time limit" : `${Math.floor(gameDuration / 60)} minute${gameDuration >= 120 ? "s" : ""}`}
                {" "}&middot; {totalWords} words &middot; Pick as many or as few as you like
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
              <h2 className="text-4xl font-light mb-4">{isInfinite ? "All Done" : "Time\u2019s Up"}</h2>
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
                      backgroundColor: zoneColor(zone) + "20",
                      border: `1px solid ${zoneColor(zone)}40`,
                    }}
                  >
                    <span
                      className="text-lg font-semibold"
                      style={{ color: zoneColor(zone) }}
                    >
                      {zoneCounts[zone]}
                    </span>
                    <span className="text-white/40 text-sm ml-1.5">
                      {wordPack.zones?.[zone]?.label || ZONES[zone].label}
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
        {activeBubbles.map((bubble) => {
          const hasClip = !bubbleImageUrl && bubbleShape.clipPath !== "none";
          return (
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
                  className="bubble w-[5.5rem] h-[5.5rem] select-none active:scale-95 relative"
                >
                  {/* Shape background (clipped) */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: bubbleImageUrl ? "transparent" : zoneColor(bubble.zone) + "25",
                      border: bubbleImageUrl ? "none" : `1.5px solid ${zoneColor(bubble.zone)}50`,
                      backdropFilter: bubbleImageUrl ? "none" : "blur(8px)",
                      clipPath: hasClip ? bubbleShape.clipPath : undefined,
                      borderRadius: !bubbleImageUrl ? bubbleShape.borderRadius : undefined,
                      backgroundImage: bubbleImageUrl ? `url(${bubbleImageUrl})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  {/* Text overlay (not clipped) */}
                  {showBubbleText && (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-center leading-tight p-2"
                      style={{
                        fontSize: bubbleFontSize,
                        fontWeight: bubbleFontDef.weight,
                        fontStyle: bubbleFontDef.style,
                        textTransform: bubbleFontDef.transform || "none",
                        color: zoneColor(bubble.zone),
                      }}
                    >
                      {bubble.word}
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
