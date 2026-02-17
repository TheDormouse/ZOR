const STORAGE_KEY = "zones_of_regulation";

export function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export function getTodaySession() {
  if (typeof window === "undefined") return null;
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const today = getTodayKey();
    if (data.date === today && data.completed) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(sessionId, selectedWords, zoneCounts) {
  if (typeof window === "undefined") return;
  const data = {
    date: getTodayKey(),
    completed: true,
    sessionId,
    selectedWords,
    zoneCounts,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Also set a cookie for extra redundancy
  document.cookie = `zones_played=${getTodayKey()}; path=/; max-age=86400; SameSite=Lax`;
}

export function hasPlayedToday() {
  if (typeof window === "undefined") return false;
  // Check localStorage
  const session = getTodaySession();
  if (session) return true;
  // Check cookie
  const cookies = document.cookie.split(";").map((c) => c.trim());
  const played = cookies.find((c) => c.startsWith("zones_played="));
  if (played) {
    const date = played.split("=")[1];
    return date === getTodayKey();
  }
  return false;
}
