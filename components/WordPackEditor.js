"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ZONES, ZONE_KEYS } from "@/lib/zones";
import { validateWordPack } from "@/lib/word-packs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function WordPackEditor({ pack, onSave, onCancel }) {
  const { user } = useAuth();
  const isEdit = !!pack?.id && !pack.id.match(/^(default|elementary|teens|workplace)$/);

  const [name, setName] = useState(pack?.name || "");
  const [description, setDescription] = useState(pack?.description || "");
  const [isPublic, setIsPublic] = useState(pack?.is_public || false);
  const [saving, setSaving] = useState(false);

  const [zoneWords, setZoneWords] = useState(() => {
    const initial = {};
    for (const zone of ZONE_KEYS) {
      initial[zone] = {
        label: pack?.zones?.[zone]?.label || ZONES[zone].label,
        text: (pack?.zones?.[zone]?.words || []).join("\n"),
      };
    }
    return initial;
  });

  const currentPack = useMemo(() => {
    const zones = {};
    for (const zone of ZONE_KEYS) {
      const words = zoneWords[zone].text
        .split("\n")
        .map((w) => w.trim())
        .filter(Boolean);
      zones[zone] = { label: zoneWords[zone].label, words };
    }
    return { zones };
  }, [zoneWords]);

  const validation = useMemo(() => validateWordPack(currentPack), [currentPack]);

  function updateZoneText(zone, text) {
    setZoneWords((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], text },
    }));
  }

  async function handleSave() {
    if (!validation.valid || !name.trim() || !user) return;
    setSaving(true);

    const wordsPayload = {};
    for (const zone of ZONE_KEYS) {
      wordsPayload[zone] = {
        label: zoneWords[zone].label,
        words: zoneWords[zone].text.split("\n").map((w) => w.trim()).filter(Boolean),
      };
    }

    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from("word_packs")
          .update({
            name: name.trim(),
            description: description.trim(),
            is_public: isPublic,
            words: wordsPayload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pack.id)
          .select()
          .single();
        if (!error && data) onSave?.(data);
      } else {
        const { data, error } = await supabase
          .from("word_packs")
          .insert({
            user_id: user.id,
            name: name.trim(),
            description: description.trim(),
            is_public: isPublic,
            words: wordsPayload,
          })
          .select()
          .single();
        if (!error && data) onSave?.(data);
      }
    } catch (e) {
      console.error("Save failed:", e);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">
          {isEdit ? "Edit Word Pack" : "Create Word Pack"}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Name & Description */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-white/50 mb-1.5">Pack Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Custom Pack"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1.5">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this word pack..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
      </div>

      {/* Zone textareas */}
      <div className="grid gap-4 sm:grid-cols-2">
        {ZONE_KEYS.map((zone) => {
          const count = validation.counts[zone] || 0;
          const isUnequal =
            validation.counts &&
            Object.values(validation.counts).some((c) => c !== count) &&
            count > 0;

          return (
            <div key={zone}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ZONES[zone].color }}
                  />
                  <label className="text-sm font-medium" style={{ color: ZONES[zone].color }}>
                    {ZONES[zone].label}
                  </label>
                </div>
                <span
                  className={`text-xs font-mono ${
                    isUnequal ? "text-red-400" : "text-white/30"
                  }`}
                >
                  {count} words
                </span>
              </div>
              <textarea
                value={zoneWords[zone].text}
                onChange={(e) => updateZoneText(zone, e.target.value)}
                rows={8}
                placeholder="One word per line..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors resize-none"
                style={{ borderColor: isUnequal ? "#ef444460" : undefined }}
              />
            </div>
          );
        })}
      </div>

      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm font-medium text-red-400 mb-1">Validation Issues</p>
          <ul className="text-sm text-red-300/80 space-y-0.5">
            {validation.errors.map((err, i) => (
              <li key={i}>&bull; {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <div
            onClick={() => setIsPublic(!isPublic)}
            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
              isPublic ? "bg-green-500/60" : "bg-white/10"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-sm text-white/50">Share publicly</span>
        </label>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={!validation.valid || !name.trim() || saving}
          className="px-8 py-2.5 rounded-xl bg-white text-slate-900 font-medium hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : isEdit ? "Update Pack" : "Create Pack"}
        </motion.button>
      </div>
    </div>
  );
}
