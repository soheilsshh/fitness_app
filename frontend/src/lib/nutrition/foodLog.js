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
  try {
    const parts = new Intl.DateTimeFormat("fa-IR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    // مثال: چهارشنبه، ۳۱ تیر ۱۴۰۵
    return `${get("weekday")}، ${get("day")} ${get("month")} ${get("year")}`.trim();
  } catch {
    return new Intl.DateTimeFormat("fa-IR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }
}

export function formatDateFaShort(date) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Map a coach/meal picker item to POST /user/food-logs body. */
export function mealToFoodLogPayload(meal, logDate, mealType = "") {
  const payload = {
    logDate,
    foodName: meal.title,
    quantity: meal.detail || "",
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fat: meal.fat || 0,
  };
  if (mealType) payload.mealType = mealType;
  if (meal.mealType) payload.mealType = meal.mealType;
  if (meal.foodId) {
    payload.foodId = meal.foodId;
    payload.multiplier = meal.multiplier || 1;
  }
  return payload;
}

export const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "صبحانه" },
  { value: "lunch", label: "نهار" },
  { value: "dinner", label: "شام" },
  { value: "snack", label: "میان‌وعده" },
];

export function mealTypeLabel(value) {
  return MEAL_TYPE_OPTIONS.find((o) => o.value === value)?.label || "سایر";
}

/** All 15 fields from a per-100g Food, scaled to `grams`. Mirrors the Go
 * `scaleFoodByGrams` / Dart `scaleByGrams` — kept in sync by hand since each
 * runtime needs its own copy for an instant local preview. */
export function scaleNutritionByGrams(food, grams) {
  const g = Number.isFinite(grams) && grams > 0 ? grams : 0;
  const factor = g / 100;
  const scaleNullable = (v) => (v === null || v === undefined ? null : Number(v) * factor);
  return {
    grams: g,
    calories: roundMacro((Number(food.calories) || 0) * factor),
    protein: roundMacro((Number(food.protein) || 0) * factor),
    fat: roundMacro((Number(food.fat) || 0) * factor),
    carbs: roundMacro((Number(food.carbs) || 0) * factor),
    fiber: scaleNullable(food.fiber),
    sugar: scaleNullable(food.sugar),
    sodium: scaleNullable(food.sodium),
    cholesterol: scaleNullable(food.cholesterol),
    calcium: scaleNullable(food.calcium),
    iron: scaleNullable(food.iron),
    magnesium: scaleNullable(food.magnesium),
    potassium: scaleNullable(food.potassium),
    phosphorus: scaleNullable(food.phosphorus),
    transFat: scaleNullable(food.transFat),
    saturatedFat: scaleNullable(food.saturatedFat),
  };
}

/** grams = qty × the serving unit's gram weight — e.g. 2 × قاشق(15g) = 30g. */
export function gramsForServing(servingUnit, quantity) {
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  return qty * (Number(servingUnit?.gramsPerUnit) || 0);
}

export function extractNutritionTargets(program, dayKey) {
  const nutrition = program?.planByDay?.[dayKey]?.nutrition;
  if (!nutrition) return { caloriesTarget: 0, proteinTarget: "" };
  return {
    caloriesTarget: Number(nutrition.caloriesTarget) || 0,
    proteinTarget: nutrition.proteinTarget || "",
  };
}
