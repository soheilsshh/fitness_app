const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function jsDayToKey(jsDay) {
  return DAY_KEYS[jsDay] || "sat";
}

export function dateToDayKey(date) {
  return jsDayToKey(date.getDay());
}

export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateISO(value) {
  const [y, m, d] = String(value || "")
    .split("-")
    .map((part) => Number(part));
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

export function formatDateFaLong(date) {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateFaShort(date) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Map a coach/meal picker item to POST /user/food-logs body. */
export function mealToFoodLogPayload(meal, logDate) {
  const payload = {
    logDate,
    foodName: meal.title,
    quantity: meal.detail || "",
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fat: meal.fat || 0,
  };
  if (meal.foodId) {
    payload.foodId = meal.foodId;
    payload.multiplier = meal.multiplier || 1;
  }
  return payload;
}

export function extractNutritionTargets(program, dayKey) {
  const nutrition = program?.planByDay?.[dayKey]?.nutrition;
  if (!nutrition) return { caloriesTarget: 0, proteinTarget: "" };
  return {
    caloriesTarget: Number(nutrition.caloriesTarget) || 0,
    proteinTarget: nutrition.proteinTarget || "",
  };
}
