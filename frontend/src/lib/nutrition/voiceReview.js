import {
  formatFoodDetail,
  mealFromCatalogFood,
} from "@/app/(panel)/coach/students/_components/nutritionHelpers";
import { gramsForServing, normalizeLogMealType, scaleNutritionByGrams } from "@/lib/nutrition/foodLog";

const GRAM_UNIT = { unit: "گرم", grams_per_unit: 1 };

export function normalizeAvailableUnits(raw) {
  const out = [];
  const seen = new Set();
  for (const row of raw || []) {
    const unit = String(row?.unit || row?.label || "").trim();
    const grams = Number(row?.grams_per_unit ?? row?.gramsPerUnit);
    if (!unit || seen.has(unit) || !Number.isFinite(grams) || grams <= 0) continue;
    seen.add(unit);
    out.push({ unit, grams_per_unit: grams });
  }
  return out;
}

export function catalogUnits(food) {
  const fromServing = (food?.servingUnits || []).map((u) => ({
    unit: u.label,
    grams_per_unit: u.gramsPerUnit,
  }));
  const units = normalizeAvailableUnits(fromServing);
  return units.length ? units : [{ ...GRAM_UNIT }];
}

function numOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function per100FromVoiceItem(item) {
  const kcal = numOrNull(item?.kcal_per_100g);
  if (kcal !== null) {
    return {
      calories: kcal,
      protein: numOrNull(item?.protein_per_100g) ?? 0,
      carbs: numOrNull(item?.carbs_per_100g) ?? 0,
      fat: numOrNull(item?.fat_per_100g) ?? 0,
    };
  }
  const grams = numOrNull(item?.amount_g);
  if (grams && grams > 0) {
    const scale = 100 / grams;
    return {
      calories: (Number(item.calories) || 0) * scale,
      protein: (Number(item.protein_g) || 0) * scale,
      carbs: (Number(item.carbs_g) || 0) * scale,
      fat: (Number(item.fat_g) || 0) * scale,
    };
  }
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function draftFromVoiceItem(item, key) {
  let units = normalizeAvailableUnits(item?.available_units);
  const per100 = per100FromVoiceItem(item);
  if (units.length === 0 && (per100.calories > 0 || item?.kcal_per_100g != null)) {
    units = [{ unit: "گرم", grams_per_unit: 1 }];
  }
  const spokenUnit = String(item?.unit || "").trim();
  const unitOk = Boolean(spokenUnit && units.some((u) => u.unit === spokenUnit));
  const qty = numOrNull(item?.quantity);
  const hasQty = qty !== null && qty > 0;
  return {
    key,
    source: "voice",
    foodName: item.food_name,
    spoken: item.spoken || "",
    mealType: normalizeLogMealType(item.meal_type),
    catalogFoodId: undefined,
    units,
    unit: unitOk ? spokenUnit : "",
    qty: hasQty ? String(qty) : "",
    per100,
    needsQuantity: Boolean(item.needs_quantity) || !hasQty,
    needsConversion: Boolean(item.needs_conversion) || Boolean(spokenUnit && !unitOk),
    spokenUnit,
  };
}

export function draftFromCatalogFood(food, key) {
  const units = catalogUnits(food);
  const def = food.servingUnits?.find((u) => u.isDefault);
  const unit =
    def?.label && units.some((u) => u.unit === def.label)
      ? def.label
      : units[0]?.unit || "";
  return {
    key,
    source: "catalog",
    foodName: food.name,
    spoken: "",
    mealType: "",
    catalogFoodId: food.id,
    catalogFood: food,
    units,
    unit,
    qty: "1",
    per100: {
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
      carbs: Number(food.carbs) || 0,
      fat: Number(food.fat) || 0,
    },
    needsQuantity: false,
    needsConversion: false,
    spokenUnit: "",
  };
}

export function computeDraftServing(draft) {
  const qty = Number(draft.qty);
  const unit = (draft.units || []).find((u) => u.unit === draft.unit);
  if (!Number.isFinite(qty) || qty <= 0 || !unit) {
    return { ok: false, grams: 0, calories: null, protein: null, carbs: null, fat: null };
  }
  const grams = gramsForServing({ gramsPerUnit: unit.grams_per_unit }, qty);
  if (!(grams > 0)) {
    return { ok: false, grams: 0, calories: null, protein: null, carbs: null, fat: null };
  }
  const facts = scaleNutritionByGrams(
    {
      calories: draft.per100?.calories,
      protein: draft.per100?.protein,
      fat: draft.per100?.fat,
      carbs: draft.per100?.carbs,
    },
    grams
  );
  return {
    ok: true,
    grams,
    calories: facts.calories,
    protein: facts.protein,
    carbs: facts.carbs,
    fat: facts.fat,
  };
}

export function draftToMeal(draft) {
  const serving = computeDraftServing(draft);
  if (!serving.ok) return null;
  const detail = formatFoodDetail(Number(draft.qty), draft.unit);
  if (draft.catalogFoodId) {
    const food = draft.catalogFood || {
      id: draft.catalogFoodId,
      name: draft.foodName,
      amount: 100,
      unit: "گرم",
      calories: draft.per100.calories,
      protein: draft.per100.protein,
      carbs: draft.per100.carbs,
      fat: draft.per100.fat,
    };
    return {
      ...mealFromCatalogFood(food, serving.grams),
      detail,
      unit: draft.unit,
      mealType: draft.mealType || undefined,
    };
  }
  return {
    title: draft.foodName,
    detail,
    calories: serving.calories,
    protein: serving.protein,
    carbs: serving.carbs,
    fat: serving.fat,
    mealType: draft.mealType || undefined,
  };
}

const QUESTION_OPTION_FALLBACKS = ["نمی‌دانم", "غذای دیگری بود", "بعداً انتخاب می‌کنم"];

export function padQuestionOptions(raw) {
  const out = [];
  const seen = new Set();
  for (const row of raw || []) {
    const t = String(row || "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length === 3) return out;
  }
  for (const fallback of QUESTION_OPTION_FALLBACKS) {
    if (out.length >= 3) break;
    if (seen.has(fallback)) continue;
    seen.add(fallback);
    out.push(fallback);
  }
  return out;
}

export function normalizeVoiceQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const q of raw) {
    if (typeof q === "string") {
      const text = q.trim();
      if (!text) continue;
      out.push({ text, options: padQuestionOptions([]) });
      continue;
    }
    if (!q || typeof q !== "object") continue;
    const text = String(q.text || q.question || "").trim();
    if (!text) continue;
    const opts = Array.isArray(q.options)
      ? q.options
      : Array.isArray(q.choices)
        ? q.choices
        : [];
    out.push({ text, options: padQuestionOptions(opts) });
  }
  return out;
}

export function hasVoiceReviewSession({ drafts, questions, transcript } = {}) {
  return (
    (Array.isArray(drafts) && drafts.length > 0) ||
    (Array.isArray(questions) && questions.length > 0) ||
    Boolean(String(transcript || "").trim())
  );
}

export function voiceStatusAfterDismiss({ status, drafts, questions, transcript } = {}) {
  if (status === "transcribing") return "transcribing";
  if (hasVoiceReviewSession({ drafts, questions, transcript })) return "review";
  if (status === "recording") return "idle";
  return status === "review" ? "review" : "idle";
}
