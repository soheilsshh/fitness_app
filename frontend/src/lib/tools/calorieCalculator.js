/** Mifflin–St Jeor BMR (kcal/day) */
export function calculateBMR({ age, gender, weightKg, heightCm }) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  const a = Number(age);
  if (!w || !h || !a || a < 1) return null;

  const base = 10 * w + 6.25 * h - 5 * a;
  return gender === "female" ? base - 161 : base + 5;
}

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "کم‌تحرک", multiplier: 1.2, hint: "کار نشسته، ورزش تقریباً ندارید" },
  { id: "light", label: "فعالیت سبک", multiplier: 1.375, hint: "ورزش سبک ۱–۳ روز در هفته" },
  { id: "moderate", label: "متوسط", multiplier: 1.55, hint: "ورزش متوسط ۳–۵ روز در هفته" },
  { id: "active", label: "پرتحرک", multiplier: 1.725, hint: "ورزش سنگین ۶–۷ روز در هفته" },
  { id: "very_active", label: "بسیار پرتحرک", multiplier: 1.9, hint: "کار فیزیکی سنگین یا تمرین دو بار در روز" },
];

export const CALORIE_GOALS = [
  { id: "lose", label: "کاهش وزن", adjustment: -500 },
  { id: "maintain", label: "نگهداری وزن", adjustment: 0 },
  { id: "gain", label: "افزایش وزن", adjustment: 400 },
];

export function calculateTDEE(bmr, activityId) {
  if (bmr == null) return null;
  const level = ACTIVITY_LEVELS.find((l) => l.id === activityId);
  if (!level) return null;
  return bmr * level.multiplier;
}

export function calculateRecommendedCalories(tdee, goalId) {
  if (tdee == null) return null;
  const goal = CALORIE_GOALS.find((g) => g.id === goalId);
  if (!goal) return null;
  return Math.max(Math.round(tdee + goal.adjustment), 1200);
}

export function calculateCaloriePlan(input) {
  const bmr = calculateBMR(input);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const recommended = calculateRecommendedCalories(tdee, input.goal);

  return {
    bmr: bmr != null ? Math.round(bmr) : null,
    tdee: tdee != null ? Math.round(tdee) : null,
    recommended,
  };
}
