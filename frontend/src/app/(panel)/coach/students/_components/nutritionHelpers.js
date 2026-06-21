export function mealUid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function roundMacro(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function mealMultiplier(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

export function formatFoodDetail(amount, unit) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return unit || "";
  const rounded = Math.round(n * 100) / 100;
  const display = Number.isInteger(rounded)
    ? rounded.toLocaleString("fa-IR")
    : rounded.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
  return unit ? `${display} ${unit}` : display;
}

export function computeMultiplier(baseAmount, servingAmount) {
  const base = Number(baseAmount);
  const serving = Number(servingAmount);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(serving) || serving <= 0) {
    return 1;
  }
  return roundMacro(serving / base);
}

export function scaleMacros(base, multiplier) {
  const m = mealMultiplier(multiplier);
  return {
    calories: roundMacro((base.calories || 0) * m),
    protein: roundMacro((base.protein || 0) * m),
    carbs: roundMacro((base.carbs || 0) * m),
    fat: roundMacro((base.fat || 0) * m),
  };
}

export function mealFromCatalogFood(food, servingAmount) {
  const baseAmount = Number(food.amount) || 1;
  const serving = Number(servingAmount) > 0 ? Number(servingAmount) : baseAmount;
  const multiplier = computeMultiplier(baseAmount, serving);
  const base = {
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fat: Number(food.fat) || 0,
  };
  const macros = scaleMacros(base, multiplier);

  return {
    uid: mealUid(),
    title: food.name,
    foodId: food.id,
    unit: food.unit || "",
    baseAmount,
    baseCalories: base.calories,
    baseProtein: base.protein,
    baseCarbs: base.carbs,
    baseFat: base.fat,
    servingAmount: serving,
    multiplier,
    detail: formatFoodDetail(serving, food.unit),
    ...macros,
    isManual: false,
  };
}

export function mealFromManualEntry({ title, detail, calories, protein, carbs, fat }) {
  return {
    uid: mealUid(),
    title: title.trim(),
    detail: (detail || "").trim(),
    multiplier: 1,
    calories: roundMacro(calories),
    protein: roundMacro(protein),
    carbs: roundMacro(carbs),
    fat: roundMacro(fat),
    isManual: true,
  };
}

export function mealWithServingAmount(meal, servingAmount) {
  if (!meal.foodId || !meal.baseAmount) return meal;
  const serving = Number(servingAmount);
  if (!Number.isFinite(serving) || serving <= 0) return meal;

  const multiplier = computeMultiplier(meal.baseAmount, serving);
  const macros = scaleMacros(
    {
      calories: meal.baseCalories ?? 0,
      protein: meal.baseProtein ?? 0,
      carbs: meal.baseCarbs ?? 0,
      fat: meal.baseFat ?? 0,
    },
    multiplier
  );

  return {
    ...meal,
    servingAmount: serving,
    multiplier,
    detail: formatFoodDetail(serving, meal.unit),
    ...macros,
  };
}

export function normalizeMealFromApi(meal) {
  const multiplier = mealMultiplier(meal.multiplier);
  const foodId = meal.foodId || meal.food_id;
  const amount = Number(meal.amount);
  const hasFood = foodId > 0;

  const normalized = {
    uid: mealUid(),
    title: meal.title || "",
    detail: meal.detail || "",
    foodId: hasFood ? foodId : undefined,
    multiplier,
    unit: meal.unit || "",
    calories: roundMacro(meal.calories),
    protein: roundMacro(meal.protein),
    carbs: roundMacro(meal.carbs),
    fat: roundMacro(meal.fat),
    isManual: !hasFood,
  };

  if (hasFood && Number.isFinite(amount) && amount > 0) {
    normalized.servingAmount = amount;
    if (multiplier > 0) {
      normalized.baseAmount = roundMacro(amount / multiplier);
      normalized.baseCalories = roundMacro((meal.calories || 0) / multiplier);
      normalized.baseProtein = roundMacro((meal.protein || 0) / multiplier);
      normalized.baseCarbs = roundMacro((meal.carbs || 0) / multiplier);
      normalized.baseFat = roundMacro((meal.fat || 0) / multiplier);
    }
  }

  return normalized;
}

export function mealToApiPayload(meal) {
  const payload = {
    title: meal.title,
    detail: meal.detail || "",
    multiplier: mealMultiplier(meal.multiplier),
    calories: roundMacro(meal.calories),
    protein: roundMacro(meal.protein),
    carbs: roundMacro(meal.carbs),
    fat: roundMacro(meal.fat),
  };
  if (meal.foodId) {
    payload.foodId = meal.foodId;
  }
  return payload;
}

export function sumDayMacros(meals) {
  return (meals || []).reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal.calories) || 0),
      protein: acc.protein + (Number(meal.protein) || 0),
      carbs: acc.carbs + (Number(meal.carbs) || 0),
      fat: acc.fat + (Number(meal.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function normalizeNutritionFromApi(nutrition) {
  if (!nutrition) {
    return { caloriesTarget: 0, proteinTarget: "", meals: [] };
  }
  return {
    caloriesTarget: Number(nutrition.caloriesTarget) || 0,
    proteinTarget: nutrition.proteinTarget || "",
    meals: (nutrition.meals || []).map(normalizeMealFromApi),
  };
}

export function nutritionToApiPayload(nutrition) {
  return {
    caloriesTarget: Number(nutrition?.caloriesTarget) || 0,
    proteinTarget: nutrition?.proteinTarget || "",
    meals: (nutrition?.meals || []).map(mealToApiPayload),
  };
}
