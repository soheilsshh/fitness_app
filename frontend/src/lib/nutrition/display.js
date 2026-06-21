export function roundMacro(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function sumDayMacros(meals) {
  return (meals || []).reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal?.calories) || 0),
      protein: acc.protein + (Number(meal?.protein) || 0),
      carbs: acc.carbs + (Number(meal?.carbs) || 0),
      fat: acc.fat + (Number(meal?.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** True when at least one macro field is present and > 0. */
export function mealHasMacros(meal) {
  if (!meal) return false;
  return ["calories", "protein", "carbs", "fat"].some((key) => {
    const n = Number(meal[key]);
    return Number.isFinite(n) && n > 0;
  });
}

export function parseProteinTargetGrams(proteinTarget) {
  const raw = String(proteinTarget ?? "").trim();
  if (!raw) return 0;
  const normalized = raw.replace(/[۰-۹]/g, (d) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))
  );
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return parseFloat(match[1]);
}

export function targetProgressPercent(current, target) {
  const t = Number(target);
  const c = Number(current);
  if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(c)) return null;
  return Math.min(100, Math.round((c / t) * 100));
}

export function formatMacro(value, unit = "") {
  const n = roundMacro(value);
  const formatted = n.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
  return unit ? `${formatted} ${unit}` : formatted;
}
