"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { ZONES, ZONE_KEYS } from "@/lib/zones";
import { mergeTheme, BUBBLE_SHAPES, BUBBLE_SHAPE_KEYS, BUBBLE_FONT_SIZES, BUBBLE_FONT_STYLES, GAME_DURATION_OPTIONS, THEME_PRESETS } from "@/lib/themes";
import { MUSIC_PRESETS } from "@/lib/themes/presets";
import { PRESET_WORD_PACKS } from "@/lib/word-packs";
import WordPackBrowser from "@/components/WordPackBrowser";
import WordPackEditor from "@/components/WordPackEditor";

const TABS = ["Word Packs", "Visuals", "Music", "Game"];

export default function CustomizePage({ params }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Theme state
  const [theme, setTheme] = useState({});
  const [wordPackId, setWordPackId] = useState(null);

  // Editor state
  const [editingPack, setEditingPack] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchClassroom() {
      const { data } = await supabase
        .from("classrooms")
        .select("*")
        .eq("id", classroomId)
        .single();

      if (!data || data.user_id !== user.id) {
        router.replace("/dashboard");
        return;
      }
      setClassroom(data);
      setTheme(data.theme || {});
      setWordPackId(data.word_pack_id);
      setLoading(false);
    }
    fetchClassroom();
  }, [authLoading, user, classroomId, router]);

  const saveSettings = useCallback(
    async (newTheme, newWordPackId) => {
      setSaving(true);
      await supabase
        .from("classrooms")
        .update({
          theme: newTheme,
          word_pack_id: newWordPackId,
        })
        .eq("id", classroomId);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [classroomId]
  );

  function updateTheme(partial) {
    const updated = { ...theme, ...partial };
    setTheme(updated);
    saveSettings(updated, wordPackId);
  }

  function updateBubble(partial) {
    const updated = { ...theme, bubble: { ...(theme.bubble || {}), ...partial } };
    setTheme(updated);
    saveSettings(updated, wordPackId);
  }

  function updateGame(partial) {
    const updated = { ...theme, game: { ...(theme.game || {}), ...partial } };
    setTheme(updated);
    saveSettings(updated, wordPackId);
  }

  function updateZoneColor(zone, color) {
    const updated = {
      ...theme,
      zoneColors: { ...(theme.zoneColors || {}), [zone]: color },
    };
    setTheme(updated);
    saveSettings(updated, wordPackId);
  }

  function handleWordPackSelect(selection) {
    if (selection.type === "preset") {
      // Store preset ID in theme so the play page knows which preset to use
      const updatedTheme = { ...theme, wordPackPreset: selection.id };
      setTheme(updatedTheme);
      setWordPackId(null);
      saveSettings(updatedTheme, null);
    } else {
      // Custom DB pack — clear the preset marker
      const updatedTheme = { ...theme, wordPackPreset: null };
      setTheme(updatedTheme);
      setWordPackId(selection.id);
      saveSettings(updatedTheme, selection.id);
    }
  }

  function handlePresetTheme(preset) {
    setTheme((prev) => {
      const updated = {
        ...prev,
        background: preset.background,
        zoneColors: preset.zoneColors,
        bubble: {
          ...prev.bubble,
          shape: preset.bubble.shape,
        },
      };
      saveSettings(updated, wordPackId);
      return updated;
    });
  }

  async function handleUploadMedia(file, type) {
    if (!user || !file) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${classroomId}-${type}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("classroom-media")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("classroom-media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleBgImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadMedia(file, "bg");
    if (url) updateTheme({ backgroundImage: url });
  }

  async function handleBubbleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadMedia(file, "bubble");
    if (url) updateBubble({ imageUrl: url, shape: "circle" });
  }

  async function handleMusicUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadMedia(file, "music");
    if (url) updateTheme({ music: { url } });
  }

  const merged = mergeTheme(theme);

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <button
              onClick={() => router.push(`/dashboard/${classroomId}`)}
              className="text-white/40 hover:text-white/70 transition-colors mb-3 text-sm flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8L10 4" />
              </svg>
              Back to {classroom.name}
            </button>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-light"
            >
              Customize
            </motion.h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/how-it-works")}
              className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
            >
              How it works
            </button>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-green-400"
              >
                Saved
              </motion.span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-8">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === i
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="wordpacks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {showEditor ? (
                <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm">
                  <WordPackEditor
                    pack={editingPack}
                    onSave={(pack) => {
                      setShowEditor(false);
                      setEditingPack(null);
                      handleWordPackSelect({ type: "custom", id: pack.id });
                    }}
                    onCancel={() => {
                      setShowEditor(false);
                      setEditingPack(null);
                    }}
                  />
                </div>
              ) : (
                <WordPackBrowser
                  selectedPackId={wordPackId || theme.wordPackPreset || "default"}
                  onSelect={handleWordPackSelect}
                  onEdit={(pack) => {
                    setEditingPack(pack);
                    setShowEditor(true);
                  }}
                  onCreateNew={() => {
                    setEditingPack(null);
                    setShowEditor(true);
                  }}
                />
              )}
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="visuals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Theme Presets */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Theme Presets
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetTheme(preset)}
                      className={`rounded-xl p-3 border transition-all text-center ${
                        merged.id === preset.id || theme.background?.gradient?.[0] === preset.background.gradient[0]
                          ? "border-white/30 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div
                        className="w-full h-10 rounded-lg mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${preset.background.gradient[0]}, ${preset.background.gradient[1]})`,
                        }}
                      />
                      <span className="text-xs text-white/60">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Bubble Preview */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Preview
                </h3>
                <div className="rounded-2xl p-8 bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center gap-6"
                  style={
                    merged.backgroundImage
                      ? {
                          backgroundImage: `url(${merged.backgroundImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {
                          background: `linear-gradient(135deg, ${merged.background.gradient[0]}, ${merged.background.gradient[1]})`,
                        }
                  }
                >
                  {ZONE_KEYS.map((zone) => {
                    const color = merged.zoneColors[zone];
                    const shape = BUBBLE_SHAPES[merged.bubble.shape] || BUBBLE_SHAPES.circle;
                    const fontDef = BUBBLE_FONT_STYLES.find((f) => f.id === (merged.bubble.fontStyle || "semibold")) || BUBBLE_FONT_STYLES[1];
                    const sampleWords = { blue: "Calm", green: "Happy", yellow: "Excited", red: "Angry" };
                    const hasClip = !merged.bubble.imageUrl && shape.clipPath !== "none";
                    return (
                      <div key={zone} className="relative w-[5.5rem] h-[5.5rem]">
                        {/* Shape background layer (clipped) */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundColor: merged.bubble.imageUrl ? "transparent" : color + "25",
                            border: merged.bubble.imageUrl ? "none" : `1.5px solid ${color}50`,
                            backdropFilter: merged.bubble.imageUrl ? "none" : "blur(8px)",
                            clipPath: hasClip ? shape.clipPath : undefined,
                            borderRadius: !merged.bubble.imageUrl ? shape.borderRadius : undefined,
                            backgroundImage: merged.bubble.imageUrl ? `url(${merged.bubble.imageUrl})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            boxShadow: "0 0 12px rgba(255, 255, 255, 0.08)",
                          }}
                        />
                        {/* Text layer (not clipped) */}
                        {merged.bubble.showText !== false && (
                          <div
                            className="absolute inset-0 flex items-center justify-center text-center leading-tight p-2"
                            style={{
                              fontSize: merged.bubble.fontSize || "11px",
                              fontWeight: fontDef.weight,
                              fontStyle: fontDef.style,
                              textTransform: fontDef.transform || "none",
                              color: color,
                            }}
                          >
                            {sampleWords[zone]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bubble Shape */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Bubble Shape
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {BUBBLE_SHAPE_KEYS.map((key) => {
                    const shape = BUBBLE_SHAPES[key];
                    const isActive = merged.bubble.shape === key && !merged.bubble.imageUrl;
                    return (
                      <button
                        key={key}
                        onClick={() => updateBubble({ shape: key, imageUrl: null })}
                        className={`rounded-xl p-4 border transition-all flex flex-col items-center gap-2 ${
                          isActive
                            ? "border-white/30 bg-white/10"
                            : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                        }`}
                      >
                        <div
                          className="w-10 h-10"
                          style={{
                            backgroundColor: ZONES.green.color + "40",
                            border: `2px solid ${ZONES.green.color}`,
                            clipPath: shape.clipPath !== "none" ? shape.clipPath : undefined,
                            borderRadius: shape.borderRadius,
                          }}
                        />
                        <span className="text-xs text-white/50">{shape.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bubble image upload */}
                <div className="mt-4 flex items-center gap-4">
                  <label className="text-sm text-white/40 cursor-pointer hover:text-white/70 transition-colors px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5">
                    Upload Bubble Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBubbleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {merged.bubble.imageUrl && (
                    <>
                      <img
                        src={merged.bubble.imageUrl}
                        alt="Bubble"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={merged.bubble.showText}
                          onChange={(e) => updateBubble({ showText: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm text-white/50">Show word text</span>
                      </label>
                      <button
                        onClick={() => updateBubble({ imageUrl: null })}
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bubble Text Style */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Bubble Text Size
                </h3>
                <div className="flex gap-2">
                  {BUBBLE_FONT_SIZES.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => updateBubble({ fontSize: size.id })}
                      className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                        (merged.bubble.fontSize || "11px") === size.id
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-white/5 text-white/40 hover:bg-white/[0.07]"
                      }`}
                    >
                      <span style={{ fontSize: size.id }}>{size.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Bubble Text Style
                </h3>
                <div className="flex flex-wrap gap-2">
                  {BUBBLE_FONT_STYLES.map((fs) => (
                    <button
                      key={fs.id}
                      onClick={() => updateBubble({ fontStyle: fs.id })}
                      className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                        (merged.bubble.fontStyle || "semibold") === fs.id
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-white/5 text-white/40 hover:bg-white/[0.07]"
                      }`}
                    >
                      <span style={{
                        fontWeight: fs.weight,
                        fontStyle: fs.style,
                        textTransform: fs.transform || "none",
                      }}>
                        {fs.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Image */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Background Image
                </h3>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-white/40 cursor-pointer hover:text-white/70 transition-colors px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5">
                    Upload Background
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBgImageUpload}
                      className="hidden"
                    />
                  </label>
                  {merged.backgroundImage && (
                    <>
                      <div
                        className="w-20 h-12 rounded-lg bg-cover bg-center border border-white/10"
                        style={{ backgroundImage: `url(${merged.backgroundImage})` }}
                      />
                      <button
                        onClick={() => updateTheme({ backgroundImage: null })}
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Zone Colors */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Zone Colors
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ZONE_KEYS.map((zone) => (
                    <div key={zone} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={merged.zoneColors[zone]}
                        onChange={(e) => updateZoneColor(zone, e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/10"
                      />
                      <span className="text-sm text-white/50">{ZONES[zone].label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="music"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Preset Tracks */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Preset Tracks
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {MUSIC_PRESETS.map((preset) => {
                    const isActive =
                      (merged.music?.preset === preset.id) ||
                      (!merged.music && preset.id === "silence");
                    return (
                      <button
                        key={preset.id}
                        onClick={() =>
                          updateTheme({
                            music: preset.file ? { preset: preset.id } : null,
                          })
                        }
                        className={`rounded-xl p-4 border text-left transition-all ${
                          isActive
                            ? "border-white/30 bg-white/10"
                            : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            {preset.file ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/40">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{preset.name}</div>
                          </div>
                          {isActive && (
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                              Active
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Custom */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Upload Custom Track
                </h3>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-white/40 cursor-pointer hover:text-white/70 transition-colors px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5">
                    Choose Audio File
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleMusicUpload}
                      className="hidden"
                    />
                  </label>
                  {merged.music?.url && (
                    <>
                      <span className="text-xs text-white/40 truncate max-w-[200px]">
                        Custom track active
                      </span>
                      <button
                        onClick={() => updateTheme({ music: null })}
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-white/25 mt-2">
                  Supports MP3, WAV, OGG. Max 10MB.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Infinite Mode */}
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Game Mode
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateGame({ infinite: false })}
                    className={`rounded-xl p-5 border transition-all text-left ${
                      !merged.game.infinite
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="font-medium">Timed</span>
                    </div>
                    <p className="text-xs text-white/40">
                      Game ends when the timer runs out.
                    </p>
                  </button>
                  <button
                    onClick={() => updateGame({ infinite: true })}
                    className={`rounded-xl p-5 border transition-all text-left ${
                      merged.game.infinite
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60">
                        <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-5.095-8-10.19-8-5.096 0-5.096 8 0 8 5.095 0 5.095-8 10.19-8z" />
                      </svg>
                      <span className="font-medium">Infinite</span>
                    </div>
                    <p className="text-xs text-white/40">
                      Game runs until the player ends it. Words loop continuously.
                    </p>
                  </button>
                </div>
              </div>

              {/* Duration (only when timed) */}
              {!merged.game.infinite && (
                <div>
                  <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                    Duration
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {GAME_DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => updateGame({ duration: opt.id })}
                        className={`px-5 py-2.5 rounded-xl border text-sm transition-all ${
                          (merged.game.duration || 300) === opt.id
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-white/10 bg-white/5 text-white/40 hover:bg-white/[0.07]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-white/60">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <p className="text-sm">
                    {merged.game.infinite
                      ? "Players can end the game at any time by tapping the \"Done\" button. Words will loop back around once all have been shown."
                      : `The game will last ${Math.floor((merged.game.duration || 300) / 60)} minute${(merged.game.duration || 300) >= 120 ? "s" : ""}. Players can also end early by tapping the "Done" button.`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
