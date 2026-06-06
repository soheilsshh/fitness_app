export const DAY_KEYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

export const DAY_LABELS = {
  sat: "شنبه",
  sun: "یکشنبه",
  mon: "دوشنبه",
  tue: "سه‌شنبه",
  wed: "چهارشنبه",
  thu: "پنجشنبه",
  fri: "جمعه",
};

export function emptyPlanByDay() {
  const planByDay = {};
  for (const key of DAY_KEYS) {
    planByDay[key] = {
      workout: { title: "", steps: [] },
      nutrition: { caloriesTarget: 0, proteinTarget: "", meals: [] },
    };
  }
  return planByDay;
}
