export const SESSION_MINUTES = {
  lt_30: 25,
  m_30_45: 40,
  m_45_60: 52,
  m_60_90: 75,
  gt_90: 95,
};

export const GOAL_OPTIONS = [
  { value: "fat_loss", label: "چربی‌سوزی" },
  { value: "muscle", label: "عضله‌سازی" },
  { value: "recomp", label: "کاهش وزن + حفظ عضله" },
  { value: "strength", label: "افزایش قدرت" },
  { value: "shape", label: "فرم‌دهی بدن" },
  { value: "fitness", label: "تناسب اندام" },
];

export const DAYS_OPTIONS = [
  { value: "2", label: "۲ روز" },
  { value: "3", label: "۳ روز" },
  { value: "4", label: "۴ روز" },
  { value: "5", label: "۵ روز" },
  { value: "6", label: "۶ روز" },
];

export const DURATION_OPTIONS = [
  { value: "lt_30", label: "کمتر از ۳۰ دقیقه" },
  { value: "m_30_45", label: "۳۰–۴۵ دقیقه" },
  { value: "m_45_60", label: "۴۵–۶۰ دقیقه" },
  { value: "m_60_90", label: "۶۰–۹۰ دقیقه" },
  { value: "gt_90", label: "بیشتر از ۹۰ دقیقه" },
];

export const LEVEL_OPTIONS = [
  { value: "beginner", label: "مبتدی" },
  { value: "some", label: "کمی تجربه دارم" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "پیشرفته" },
];

export const HISTORY_OPTIONS = [
  { value: "starting", label: "تازه شروع می‌کنم" },
  { value: "lt_3m", label: "کمتر از ۳ ماه" },
  { value: "m_3_6", label: "۳–۶ ماه" },
  { value: "m_6_12", label: "۶–۱۲ ماه" },
  { value: "gt_1y", label: "بیشتر از یک سال" },
];

export const LOCATION_OPTIONS = [
  { value: "gym", label: "باشگاه" },
  { value: "home", label: "خانه" },
  { value: "outdoor", label: "فضای باز" },
  { value: "mixed", label: "ترکیبی" },
];

export const EQUIPMENT_OPTIONS = [
  { value: "full_gym", label: "تجهیزات کامل باشگاه" },
  { value: "dumbbell", label: "دمبل" },
  { value: "band", label: "کش" },
  { value: "barbell", label: "هالتر" },
  { value: "limited_machines", label: "دستگاه‌های محدود" },
  { value: "bodyweight", label: "وزن بدن فقط" },
];

export const LIMITATION_NONE = "none";
export const LIMITATION_OTHER = "other";

export const LIMITATION_OPTIONS = [
  { value: LIMITATION_NONE, label: "خیر" },
  { value: "knee", label: "زانو" },
  { value: "back", label: "کمر" },
  { value: "shoulder", label: "شانه" },
  { value: "wrist", label: "مچ دست" },
  { value: "ankle", label: "مچ پا" },
  { value: LIMITATION_OTHER, label: "مورد دیگری دارم" },
];

export const DISLIKE_EXERCISE_OPTIONS = [
  { value: "squat", label: "اسکوات" },
  { value: "deadlift", label: "ددلیفت" },
  { value: "bench", label: "پرس سینه" },
  { value: "pullup", label: "بارفیکس" },
  { value: "lunge", label: "لانج" },
  { value: "ohp", label: "پرس سرشانه" },
  { value: "leg_curl", label: "پشت پا" },
  { value: "plank", label: "پلانک" },
];

export const STYLE_OPTIONS = [
  { value: "weights", label: "وزنه و دستگاه" },
  { value: "bodyweight", label: "تمرین با وزن بدن" },
  { value: "hiit", label: "HIIT" },
  { value: "cardio", label: "هوازی" },
  { value: "mixed", label: "ترکیبی" },
];

export const CARDIO_OPTIONS = [
  { value: "none", label: "اصلاً" },
  { value: "low", label: "کم" },
  { value: "medium", label: "متوسط" },
  { value: "high", label: "زیاد" },
  { value: "focus", label: "تمرکز اصلی روی هوازی" },
];

export const BODY_OPTIONS = [
  { value: "full", label: "کل بدن" },
  { value: "upper", label: "بالاتنه" },
  { value: "lower", label: "پایین‌تنه" },
  { value: "core", label: "شکم و Core" },
  { value: "arms", label: "بازو و شانه" },
  { value: "back", label: "پشت" },
  { value: "glutes", label: "باسن" },
];

export const SLIDES = [
  { id: "goal", title: "هدف اصلی", question: "مهم‌ترین هدفت از تمرین چیه؟", mode: "single", options: GOAL_OPTIONS },
  { id: "days", title: "تعداد جلسات", question: "واقع‌بینانه چند روز در هفته می‌تونی تمرین کنی؟", mode: "single", options: DAYS_OPTIONS },
  { id: "duration", title: "زمان تمرین", question: "برای هر جلسه معمولاً چقدر وقت داری؟", mode: "single", options: DURATION_OPTIONS },
  { id: "level", title: "سطح تمرین", question: "سطح تمرینی خودت رو چطور ارزیابی می‌کنی؟", mode: "single", options: LEVEL_OPTIONS },
  { id: "history", title: "سابقه", question: "چقدر منظم تمرین کردی؟", mode: "single", options: HISTORY_OPTIONS },
  { id: "location", title: "محل تمرین", question: "معمولاً کجا تمرین می‌کنی؟", mode: "single", options: LOCATION_OPTIONS },
  { id: "equipment", title: "تجهیزات", question: "چه تجهیزاتی در دسترست هست؟", mode: "multi", options: EQUIPMENT_OPTIONS },
  {
    id: "limitations",
    title: "محدودیت حرکتی",
    question: "حرکت یا ناحیه‌ای هست که نمی‌تونی راحت تمرینش بدی؟",
    mode: "limitations",
    options: LIMITATION_OPTIONS,
  },
  {
    id: "disliked",
    title: "حرکات نامطلوب",
    question: "حرکتی هست که ترجیح بدی توی برنامه نباشه؟",
    mode: "disliked",
  },
  { id: "style", title: "سبک تمرین", question: "کدوم مدل تمرین رو بیشتر دوست داری؟", mode: "single", options: STYLE_OPTIONS },
  { id: "cardio", title: "هوازی", question: "چقدر دوست داری هوازی داخل برنامه‌ات باشه؟", mode: "single", options: CARDIO_OPTIONS },
  { id: "body", title: "اولویت بدن", question: "دوست داری بیشتر روی کدوم قسمت‌های بدنت کار کنیم؟", mode: "multi", options: BODY_OPTIONS },
];

export const SLIDE_COUNT = SLIDES.length;

export function emptyAnswers() {
  return {
    goal: "",
    daysPerWeek: "",
    sessionDuration: "",
    experienceLevel: "",
    trainingHistory: "",
    location: "",
    equipment: [],
    limitations: [],
    limitationNote: "",
    dislikedMode: "",
    dislikedExercises: [],
    dislikedNote: "",
    style: "",
    cardio: "",
    bodyPriority: [],
    voiceNotes: {},
  };
}

export function toggleExclusive(list, value, exclusive = []) {
  if (exclusive.includes(value)) {
    return list.includes(value) ? [] : [value];
  }
  const next = list.filter((v) => !exclusive.includes(v));
  return next.includes(value) ? next.filter((v) => v !== value) : [...next, value];
}

export function labelsFor(options, values) {
  const list = Array.isArray(values) ? values : values ? [values] : [];
  return list.map((v) => options.find((o) => o.value === v)?.label || v).filter(Boolean);
}

export function isSlideComplete(slide, answers) {
  switch (slide.id) {
    case "goal":
      return Boolean(answers.goal);
    case "days":
      return Boolean(answers.daysPerWeek);
    case "duration":
      return Boolean(answers.sessionDuration);
    case "level":
      return Boolean(answers.experienceLevel);
    case "history":
      return Boolean(answers.trainingHistory);
    case "location":
      return Boolean(answers.location);
    case "equipment":
      return answers.equipment.length > 0;
    case "limitations":
      if (!answers.limitations.length) return false;
      if (answers.limitations.includes(LIMITATION_OTHER)) {
        return Boolean(String(answers.limitationNote || "").trim() || String(answers.voiceNotes?.limitations || "").trim());
      }
      return true;
    case "disliked":
      if (answers.dislikedMode === "none") return true;
      if (answers.dislikedMode === "list") return answers.dislikedExercises.length > 0;
      if (answers.dislikedMode === "custom") {
        return Boolean(String(answers.dislikedNote || "").trim() || String(answers.voiceNotes?.disliked || "").trim());
      }
      return false;
    case "style":
      return Boolean(answers.style);
    case "cardio":
      return Boolean(answers.cardio);
    case "body":
      return answers.bodyPriority.length > 0;
    default:
      return false;
  }
}

export function toGeneratePayload(answers) {
  const limitationLabels = labelsFor(LIMITATION_OPTIONS, answers.limitations).filter((l) => l !== "خیر");
  const disliked =
    answers.dislikedMode === "none"
      ? []
      : answers.dislikedMode === "list"
        ? labelsFor(DISLIKE_EXERCISE_OPTIONS, answers.dislikedExercises)
        : [];
  const voiceBits = Object.values(answers.voiceNotes || {}).map((t) => String(t || "").trim()).filter(Boolean);
  return {
    goal: labelsFor(GOAL_OPTIONS, answers.goal)[0] || "",
    daysPerWeek: Number(answers.daysPerWeek) || 0,
    sessionMinutes: SESSION_MINUTES[answers.sessionDuration] || 0,
    experienceLevel: labelsFor(LEVEL_OPTIONS, answers.experienceLevel)[0] || "",
    trainingHistory: labelsFor(HISTORY_OPTIONS, answers.trainingHistory)[0] || "",
    trainingLocation: labelsFor(LOCATION_OPTIONS, answers.location)[0] || "",
    equipment: labelsFor(EQUIPMENT_OPTIONS, answers.equipment),
    physicalLimitations: limitationLabels,
    limitationNote: String(answers.limitationNote || "").trim(),
    dislikedExercises: disliked,
    dislikedNote: String(answers.dislikedNote || "").trim(),
    preferredStyle: labelsFor(STYLE_OPTIONS, answers.style)[0] || "",
    cardioPreference: labelsFor(CARDIO_OPTIONS, answers.cardio)[0] || "",
    bodyPartPriority: labelsFor(BODY_OPTIONS, answers.bodyPriority),
    voiceNotes: voiceBits.join("\n"),
  };
}

export function nutritionGoalFromWizard(goal) {
  if (goal === "fat_loss" || goal === "recomp") return "cut";
  if (goal === "muscle" || goal === "strength") return "bulk";
  return "maintain";
}
