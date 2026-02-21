"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ZONES, ZONE_KEYS } from "@/lib/zones";
import { PRESET_WORD_PACKS } from "@/lib/word-packs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

function PackCard({ pack, isSelected, onSelect, onEdit, editable }) {
  const wordCount = pack.zones
    ? ZONE_KEYS.reduce((sum, z) => sum + (pack.zones[z]?.words?.length || 0), 0)
    : ZONE_KEYS.reduce((sum, z) => sum + (pack.words?.[z]?.words?.length || 0), 0);

  const zones = pack.zones || pack.words;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`rounded-2xl p-4 border backdrop-blur-sm transition-all cursor-pointer ${
        isSelected
          ? "border-white/30 bg-white/10"
          : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
      }`}
      onClick={() => onSelect(pack)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{pack.name}</h4>
          {pack.description && (
            <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{pack.description}</p>
          )}
        </div>
        {isSelected && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 shrink-0">
            Active
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-white/30">
        <span>{wordCount} words</span>
        <div className="flex gap-1">
          {ZONE_KEYS.map((zone) => (
            <div
              key={zone}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ZONES[zone].color }}
            />
          ))}
        </div>
      </div>

      {editable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(pack);
          }}
          className="mt-2 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Edit
        </button>
      )}
    </motion.div>
  );
}

export default function WordPackBrowser({ selectedPackId, onSelect, onEdit, onCreateNew }) {
  const { user } = useAuth();
  const [myPacks, setMyPacks] = useState([]);
  const [communityPacks, setCommunityPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPacks() {
      if (user) {
        const { data: mine } = await supabase
          .from("word_packs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (mine) setMyPacks(mine);
      }

      const { data: community } = await supabase
        .from("word_packs")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (community) {
        setCommunityPacks(
          community.filter((p) => p.user_id !== user?.id)
        );
      }

      setLoading(false);
    }
    fetchPacks();
  }, [user]);

  function normalizeDbPack(dbPack) {
    return {
      ...dbPack,
      zones: dbPack.words,
    };
  }

  function handleSelect(pack) {
    onSelect(pack);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Preset Packs */}
      <div>
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
          Preset Packs
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRESET_WORD_PACKS.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              isSelected={selectedPackId === pack.id || (!selectedPackId && pack.id === "default")}
              onSelect={() => handleSelect({ type: "preset", id: pack.id })}
              onEdit={() => {}}
              editable={false}
            />
          ))}
        </div>
      </div>

      {/* My Packs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
            My Packs
          </h3>
          <button
            onClick={onCreateNew}
            className="text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5"
          >
            + New Pack
          </button>
        </div>
        {myPacks.length === 0 ? (
          <p className="text-sm text-white/25 py-4 text-center">
            You haven&apos;t created any word packs yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {myPacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={normalizeDbPack(pack)}
                isSelected={selectedPackId === pack.id}
                onSelect={() => handleSelect({ type: "custom", id: pack.id })}
                onEdit={() => onEdit(normalizeDbPack(pack))}
                editable
              />
            ))}
          </div>
        )}
      </div>

      {/* Community Packs */}
      {communityPacks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
            Community Packs
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {communityPacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={normalizeDbPack(pack)}
                isSelected={selectedPackId === pack.id}
                onSelect={() => handleSelect({ type: "custom", id: pack.id })}
                onEdit={() => {}}
                editable={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
