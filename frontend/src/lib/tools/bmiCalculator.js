export const BMI_CATEGORIES = [
  {
    id: "underweight",
    label: "کم‌وزن",
    min: 0,
    max: 18.5,
    color: "sky",
    hint: "BMI کمتر از ۱۸.۵ — ممکن است نیاز به افزایش وزن سالم باشد.",
  },
  {
    id: "normal",
    label: "نرمال",
    min: 18.5,
    max: 25,
    color: "emerald",
    hint: "BMI بین ۱۸.۵ تا ۲۴.۹ — محدوده سالم برای بزرگسالان.",
  },
  {
    id: "overweight",
    label: "اضافه‌وزن",
    min: 25,
    max: 30,
    color: "amber",
    hint: "BMI بین ۲۵ تا ۲۹.۹ — احتمال افزایش ریسک‌های سلامتی.",
  },
  {
    id: "obese",
    label: "چاقی",
    min: 30,
    max: Infinity,
    color: "rose",
    hint: "BMI ۳۰ و بالاتر — توصیه به مشورت با پزشک یا متخصص تغذیه.",
  },
];

/** WHO adult BMI scale bounds for the visual bar */
export const BMI_SCALE_MIN = 15;
export const BMI_SCALE_MAX = 40;

export function calculateBMI(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h || h <= 0) return null;
  const heightM = h / 100;
  return w / (heightM * heightM);
}

export function getBmiCategory(bmi) {
  if (bmi == null || Number.isNaN(bmi)) return null;
  return BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) || null;
}

export function getBmiScalePosition(bmi) {
  if (bmi == null || Number.isNaN(bmi)) return null;
  const clamped = Math.min(Math.max(bmi, BMI_SCALE_MIN), BMI_SCALE_MAX);
  return ((clamped - BMI_SCALE_MIN) / (BMI_SCALE_MAX - BMI_SCALE_MIN)) * 100;
}

export function calculateBmiResult(weightKg, heightCm) {
  const raw = calculateBMI(weightKg, heightCm);
  if (raw == null) return null;
  const bmi = Math.round(raw * 10) / 10;
  const category = getBmiCategory(bmi);
  return {
    bmi,
    category,
    scalePosition: getBmiScalePosition(bmi),
  };
}
