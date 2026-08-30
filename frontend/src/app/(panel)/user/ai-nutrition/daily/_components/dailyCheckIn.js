export const INDIFFERENT = "فرقی نمی‌کنه";
export const AVOID_NONE = "غذای خاصی ندارم";

export const MEAL_COUNT_OPTIONS = ["۳ وعده", "۴ وعده", "۵ وعده", INDIFFERENT];

export const PROTEIN_OPTIONS = ["مرغ", "گوشت قرمز", "ماهی", "تخم‌مرغ", "تن ماهی", INDIFFERENT];
export const CARB_OPTIONS = ["برنج", "نان", "سیب‌زمینی", "ماکارونی", "جو دوسر", INDIFFERENT];
export const PRODUCE_OPTIONS = ["گوجه", "خیار", "کاهو", "سبزیجات", "میوه", INDIFFERENT];

export const CRAVING_OPTIONS = [
  "غذای ایرانی",
  "فست‌فود",
  "غذای سبک",
  "شیرینی / دسر",
  "غذای پروتئینی",
  INDIFFERENT,
];

export const TRAINING_OPTIONS = ["استراحت", "تمرین سبک", "تمرین متوسط", "تمرین سنگین", INDIFFERENT];

export const PREP_TIME_OPTIONS = [
  "کمتر از ۱۵ دقیقه",
  "۱۵ تا ۳۰ دقیقه",
  "۳۰ تا ۶۰ دقیقه",
  "بیشتر از ۶۰ دقیقه",
  INDIFFERENT,
];

export const AVOID_OPTIONS = [
  AVOID_NONE,
  "غذاهای چرب",
  "غذاهای شیرین",
  "فست‌فود",
  "لبنیات",
  INDIFFERENT,
];

export const STYLE_OPTIONS = [
  "ساده و سریع",
  "متنوع و جذاب",
  "اقتصادی",
  "پروتئین بیشتر",
  "سبک و کم‌کالری",
  INDIFFERENT,
];

export function emptyCheckIn() {
  return {
    mealCount: "",
    protein: [],
    carbs: [],
    produce: [],
    availableExtra: [],
    craving: [],
    cravingCustom: "",
    training: "",
    prepTime: "",
    avoid: [],
    avoidExtra: [],
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

export function checkInAnsweredCount(checkIn) {
  let n = 0;
  if (checkIn.mealCount) n += 1;
  if (checkIn.protein.length && checkIn.carbs.length && checkIn.produce.length) n += 1;
  if (checkIn.craving.length || checkIn.cravingCustom.trim()) n += 1;
  if (checkIn.training) n += 1;
  if (checkIn.prepTime) n += 1;
  if (checkIn.avoid.length || checkIn.avoidExtra.length) n += 1;
  if (checkIn.style) n += 1;
  return n;
}

export function isCheckInComplete(checkIn) {
  return checkInAnsweredCount(checkIn) === 7;
}

export function toCheckInPayload(checkIn) {
  return {
    mealCount: checkIn.mealCount,
    protein: checkIn.protein,
    carbs: checkIn.carbs,
    produce: checkIn.produce,
    availableExtra: checkIn.availableExtra,
    craving: checkIn.craving,
    cravingCustom: checkIn.cravingCustom.trim(),
    training: checkIn.training,
    prepTime: checkIn.prepTime,
    avoid: checkIn.avoid,
    avoidExtra: checkIn.avoidExtra,
    style: checkIn.style,
  };
}
