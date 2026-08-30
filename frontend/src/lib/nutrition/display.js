export function roundMacro(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function sumDayMacros(meals) {
  return (meals || []).reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal?.calories) || 0),
      protein: acc.protein + (Number(meal?.protein) || 0),
      carbs: acc.carbs + (Number(meal?.carbs) || 0),
      fat: acc.fat + (Number(meal?.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** True when at least one macro field is present and > 0. */
export function mealHasMacros(meal) {
  if (!meal) return false;
  return ["calories", "protein", "carbs", "fat"].some((key) => {
    const n = Number(meal[key]);
    return Number.isFinite(n) && n > 0;
  });
}

export function parseProteinTargetGrams(proteinTarget) {
  const raw = String(proteinTarget ?? "").trim();
  if (!raw) return 0;
  const normalized = raw.replace(/[۰-۹]/g, (d) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))
  );
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return parseFloat(match[1]);
}

export function rawTargetPercent(current, target) {
  const t = Number(target);
  const c = Number(current);
  if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(c)) return null;
  return Math.round((c / t) * 100);
}

export function targetProgressPercent(current, target) {
  const pct = rawTargetPercent(current, target);
  if (pct == null) return null;
  return Math.min(100, pct);
}

export function formatMacro(value, unit = "") {
  const n = roundMacro(value);
  const formatted = n.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
  if (!unit) return formatted;
  const unitFa =
    unit === "kcal" || unit === "کالری" || unit === "کیلوکالری"
      ? "کیلوکالری"
      : unit === "g" || unit === "گرم"
        ? "گرم"
        : unit;
  return `${formatted} ${unitFa}`;
}

/** Remaining kcal after protein is split 60/40 carbs/fat when the coach has no carb/fat target. */
export function deriveMacroGramTargets(caloriesTarget, proteinTargetG) {
  const kcal = Math.max(0, Number(caloriesTarget) || 0);
  let proteinG = Math.max(0, Number(proteinTargetG) || 0);
  if (kcal <= 0) {
    return { calories: 0, proteinG, carbsG: 0, fatG: 0 };
  }
  if (proteinG <= 0) {
    proteinG = Math.round((kcal * 0.25) / 4);
  }
  const remain = Math.max(0, kcal - proteinG * 4);
  return {
    calories: kcal,
    proteinG,
    carbsG: Math.round((remain * 0.6) / 4),
    fatG: Math.round((remain * 0.4) / 9),
  };
}

export function macroToKcal(grams, kind) {
  const g = Math.max(0, Number(grams) || 0);
  return kind === "fat" ? g * 9 : g * 4;
}

export function dailyNutritionInsight({ calories, protein, targets }) {
  const intake = Number(calories) || 0;
  if (intake <= 0) {
    return {
      headline: "هنوز وعده‌ای برای امروز ثبت نشده.",
      detail: "با ثبت غذا، تحلیل کالری و درشت‌مغذی‌ها همین‌جا ساخته می‌شود.",
    };
  }
  const proteinPct = rawTargetPercent(protein, targets?.proteinG);
  const caloriePct = rawTargetPercent(intake, targets?.calories);
  if (proteinPct != null && proteinPct < 75) {
    return {
      headline: "تعادل امروز قابل قبوله، پروتئین کمی کم است.",
      detail: "برای فردا، مصرف پروتئین رو کمی بیشتر کن.",
    };
  }
  if (caloriePct != null && caloriePct > 110) {
    return {
      headline: "کالری امروز از هدف روزانه بالاتر رفته.",
      detail: "وعده‌های بعدی را سبک‌تر انتخاب کن تا به هدف نزدیک بمانی.",
    };
  }
  return {
    headline: "عالیه! تعادل مواد مغذی امروز خوبه.",
    detail: "برای فردا، مصرف پروتئین رو کمی بیشتر کن.",
  };
}
