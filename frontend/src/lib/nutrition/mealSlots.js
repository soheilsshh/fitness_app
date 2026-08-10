/** Canonical program meal slots: breakfast, lunch, dinner + up to 3 snacks. */

export const MEAL_SLOTS = [
  { value: "breakfast", label: "صبحانه" },
  { value: "lunch", label: "ناهار" },
  { value: "dinner", label: "شام" },
  { value: "snack1", label: "میان‌وعده ۱" },
  { value: "snack2", label: "میان‌وعده ۲" },
  { value: "snack3", label: "میان‌وعده ۳" },
];

const SLOT_RANK = Object.fromEntries(MEAL_SLOTS.map((s, i) => [s.value, i]));

export function mealSlotLabel(slot) {
  return MEAL_SLOTS.find((s) => s.value === slot)?.label || "سایر";
}

export function sortMealsBySlot(meals) {
  return [...(meals || [])].sort((a, b) => {
    const ra = SLOT_RANK[a.mealSlot] ?? 99;
    const rb = SLOT_RANK[b.mealSlot] ?? 99;
    return ra - rb;
  });
}

export function groupMealsBySlot(meals) {
  const groups = MEAL_SLOTS.map((slot) => ({
    ...slot,
    meals: [],
  }));
  const other = [];
  for (const meal of meals || []) {
    const idx = MEAL_SLOTS.findIndex((s) => s.value === meal.mealSlot);
    if (idx >= 0) groups[idx].meals.push(meal);
    else other.push(meal);
  }
  return { groups, other };
}
