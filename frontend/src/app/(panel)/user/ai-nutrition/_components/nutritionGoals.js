// Mirrors backend enum ai.GoalCut / ai.GoalBulk / ai.GoalMaintain
// (backend/internal/service/ai/schemas.go) — /me/nutrition/generate requires
// exactly one of these three literal values.
export const DAILY_GOAL_OPTIONS = [
  { value: "cut", label: "کاهش وزن" },
  { value: "bulk", label: "عضله‌سازی" },
  { value: "maintain", label: "حفظ وزن" },
];

// Preset reasons for "تغییر این وعده" — combined with optional free text and
// sent as the `reason` field to POST /me/nutrition/regenerate-meal.
export const REGENERATE_REASONS = [
  "مواد اولیه ندارم",
  "دوست ندارم",
  "کالری زیاد است",
  "پروتئین بیشتری می‌خواهم",
  "غذای دیگری پیشنهاد بده",
];

export function mealTotals(items = []) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein_g || 0),
      carbs: acc.carbs + (item.carbs_g || 0),
      fat: acc.fat + (item.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
