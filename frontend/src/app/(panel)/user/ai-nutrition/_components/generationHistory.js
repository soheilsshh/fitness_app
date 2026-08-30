export const HISTORY_LIMIT = 12;

export const HISTORY_KEYS = {
  daily: "fitino.ai-nutrition.history.daily",
  weekly: "fitino.ai-nutrition.history.weekly",
  single: "fitino.ai-nutrition.history.single",
};

export function cloneJSON(value) {
  return JSON.parse(JSON.stringify(value));
}

export function newHistoryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadHistory(key) {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistHistory(key, list) {
  try {
    sessionStorage.setItem(key, JSON.stringify(list));
  } catch {
    // quota / private mode — keep in-memory only
  }
}

export function pushHistory(list, entry) {
  const next = [entry, ...(list || []).filter((item) => item.id !== entry.id)];
  return next.slice(0, HISTORY_LIMIT);
}

export function recordHistory(prev, entry, storageKey) {
  const next = pushHistory(prev, entry);
  persistHistory(storageKey, next);
  return next;
}

export function formatHistoryTime(at) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function dailyHistorySummary(plan, targets) {
  const meals = plan?.meals || [];
  const kcal = meals.reduce((sum, meal) => {
    return sum + (meal.items || []).reduce((s, item) => s + (item.calories || 0), 0);
  }, 0);
  const target = targets?.targetCalories ? ` · هدف ${targets.targetCalories}` : "";
  return `${meals.length} وعده · ${Math.round(kcal)} kcal${target}`;
}

export function weeklyHistorySummary(plan, targets) {
  const days = plan?.days || [];
  const kcal = days.reduce((sum, day) => {
    return (
      sum +
      (day.meals || []).reduce(
        (s, meal) => s + (meal.items || []).reduce((acc, item) => acc + (item.calories || 0), 0),
        0
      )
    );
  }, 0);
  const target = targets?.targetCalories ? ` · هدف روزانه ${targets.targetCalories}` : "";
  return `${days.length} روز · ${Math.round(kcal)} kcal${target}`;
}

export function singleHistorySummary(suggestion) {
  const name = suggestion?.recipe_name || "پیشنهاد غذا";
  const kcal = suggestion?.total_calories ? ` · ${suggestion.total_calories} kcal` : "";
  return `${name}${kcal}`;
}
