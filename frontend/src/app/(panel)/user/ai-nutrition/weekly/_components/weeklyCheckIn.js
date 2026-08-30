export const INDIFFERENT = "فرقی نمی‌کنه";
export const AVOID_NONE = "غذای خاصی ندارم";
export const TRAINING_ALL = "همه روزها";
export const TRAINING_NONE = "بدون تمرین";
export const SPECIAL_NONE = "شرایط خاصی ندارم";

export const WEEKLY_GOAL_OPTIONS = [
  "کاهش وزن",
  "افزایش وزن",
  "عضله‌سازی",
  "حفظ وزن",
  "سلامت",
];

export const MEAL_COUNT_OPTIONS = ["۳", "۴", "۵", "۶", "متغیر"];

export const TRAINING_DAY_OPTIONS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  TRAINING_ALL,
  TRAINING_NONE,
];

export const TRAINING_INTENSITY_OPTIONS = ["سبک", "متوسط", "سنگین", "متغیر"];

export const LIKED_FOOD_OPTIONS = [
  "ایرانی",
  "فرنگی",
  "سنتی",
  "فست‌فود",
  "غذاهای ساده",
  INDIFFERENT,
];

export const AVOID_OPTIONS = [
  AVOID_NONE,
  "غذاهای چرب",
  "غذاهای شیرین",
  "فست‌فود",
  "لبنیات",
  "غذای دریایی",
  "گوشت قرمز",
  INDIFFERENT,
];

export const AVAILABLE_OPTIONS = [
  "پروتئین",
  "کربوهیدرات",
  "سبزیجات",
  "لبنیات",
  "حبوبات",
  "میوه",
  INDIFFERENT,
];

export const BUDGET_OPTIONS = ["اقتصادی", "متوسط", "آزاد", INDIFFERENT];

export const EATING_PLACE_OPTIONS = ["خانه", "محل کار", "دانشگاه", "بیرون", "ترکیبی"];

export const PREP_TIME_OPTIONS = [
  "کمتر از ۱۵ دقیقه",
  "۱۵–۳۰ دقیقه",
  "۳۰–۶۰ دقیقه",
  "بیشتر از ۶۰ دقیقه",
  "متغیر",
];

export const REPEAT_OPTIONS = ["تنوع زیاد", "کمی تکرار", "غذاهای ثابت و ساده", INDIFFERENT];

export const STYLE_OPTIONS = [
  {
    value: "دقیق و منظم",
    hint: "کالری و وعده‌ها قابل پیش‌بینی و منظم",
  },
  {
    value: "متنوع",
    hint: "غذاهای مختلف در طول هفته",
  },
  {
    value: "ساده و سریع",
    hint: "پخت آسان با مواد کم",
  },
  {
    value: "اقتصادی",
    hint: "مواد ارزان و در دسترس",
  },
  {
    value: "تمرکز روی پروتئین",
    hint: "وعده‌های پروتئینی‌تر",
  },
  {
    value: "ترکیبی",
    hint: "تعادل بین نظم، تنوع و سادگی",
  },
];

export const RULES_TOTAL = 12;
export const CHECKIN_TOTAL = 13;

export function emptyWeeklyCheckIn() {
  return {
    weeklyGoal: "",
    mealCount: "",
    trainingDays: [],
    trainingIntensity: "",
    likedFoods: [],
    favoriteFood: "",
    avoid: [],
    avoidExtra: [],
    available: [],
    availableExtra: [],
    budget: "",
    eatingPlace: "",
    prepTime: "",
    repeatPreference: "",
    specialCircumstances: "",
    style: "",
  };
}

export function toggleExclusive(list, value, exclusiveValues) {
  const selected = list.includes(value);
  if (selected) return list.filter((v) => v !== value);
  if (exclusiveValues.includes(value)) return [value];
  return [...list.filter((v) => !exclusiveValues.includes(v)), value];
}

export function addCustomItem(list, raw) {
  const value = String(raw || "").trim();
  if (!value) return list;
  if (list.includes(value)) return list;
  return [...list, value];
}

export function weeklyGoalToPlanGoal(weeklyGoal) {
  switch (weeklyGoal) {
    case "کاهش وزن":
      return "cut";
    case "افزایش وزن":
    case "عضله‌سازی":
      return "bulk";
    default:
      return "maintain";
  }
}

export function rulesAnsweredCount(checkIn) {
  let n = 0;
  if (checkIn.weeklyGoal) n += 1;
  if (checkIn.mealCount) n += 1;
  if (checkIn.trainingDays.length) n += 1;
  if (checkIn.trainingIntensity) n += 1;
  if (checkIn.likedFoods.length || checkIn.favoriteFood.trim()) n += 1;
  if (checkIn.avoid.length || checkIn.avoidExtra.length) n += 1;
  if (checkIn.available.length || checkIn.availableExtra.length) n += 1;
  if (checkIn.budget) n += 1;
  if (checkIn.eatingPlace) n += 1;
  if (checkIn.prepTime) n += 1;
  if (checkIn.repeatPreference) n += 1;
  if (checkIn.specialCircumstances.trim()) n += 1;
  return n;
}

export function checkInAnsweredCount(checkIn) {
  return rulesAnsweredCount(checkIn) + (checkIn.style ? 1 : 0);
}

export function isWeeklyRulesComplete(checkIn) {
  return rulesAnsweredCount(checkIn) === RULES_TOTAL;
}

export function isWeeklyCheckInComplete(checkIn) {
  return checkInAnsweredCount(checkIn) === CHECKIN_TOTAL;
}

export function toWeeklyCheckInPayload(checkIn) {
  return {
    weeklyGoal: checkIn.weeklyGoal,
    mealCount: checkIn.mealCount,
    trainingDays: checkIn.trainingDays,
    trainingIntensity: checkIn.trainingIntensity,
    likedFoods: checkIn.likedFoods,
    favoriteFood: checkIn.favoriteFood.trim(),
    avoid: checkIn.avoid,
    avoidExtra: checkIn.avoidExtra,
    available: checkIn.available,
    availableExtra: checkIn.availableExtra,
    budget: checkIn.budget,
    eatingPlace: checkIn.eatingPlace,
    prepTime: checkIn.prepTime,
    repeatPreference: checkIn.repeatPreference,
    specialCircumstances: checkIn.specialCircumstances.trim(),
    style: checkIn.style,
  };
}
