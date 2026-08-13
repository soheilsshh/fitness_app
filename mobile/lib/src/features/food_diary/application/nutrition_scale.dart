import '../data/food_models.dart';

/// The full per-serving nutrition panel, scaled from a [Food]'s per-100g
/// baseline by grams/100. Mirrors the backend's `scaleFoodByGrams` — this
/// copy exists only so the add-food sheet can preview instantly without a
/// round trip; the server recomputes the same numbers when the log is saved.
class NutritionFacts {
  const NutritionFacts({
    required this.grams,
    required this.calories,
    required this.protein,
    required this.fat,
    required this.carbs,
    this.fiber,
    this.sugar,
    this.sodium,
    this.cholesterol,
    this.calcium,
    this.iron,
    this.magnesium,
    this.potassium,
    this.phosphorus,
    this.transFat,
    this.saturatedFat,
  });

  final double grams;
  final double calories;
  final double protein;
  final double fat;
  final double carbs;
  final double? fiber;
  final double? sugar;
  final double? sodium;
  final double? cholesterol;
  final double? calcium;
  final double? iron;
  final double? magnesium;
  final double? potassium;
  final double? phosphorus;
  final double? transFat;
  final double? saturatedFat;
}

double? _scale(double? perHundredGrams, double factor) {
  if (perHundredGrams == null) return null;
  return perHundredGrams * factor;
}

/// Scales every field of [food] (a per-100g catalog entry) to `grams`.
NutritionFacts scaleByGrams(Food food, double grams) {
  final safeGrams = grams < 0 ? 0.0 : grams;
  final factor = safeGrams / 100;
  return NutritionFacts(
    grams: safeGrams,
    calories: food.calories * factor,
    protein: food.protein * factor,
    fat: food.fat * factor,
    carbs: food.carbs * factor,
    fiber: _scale(food.fiber, factor),
    sugar: _scale(food.sugar, factor),
    sodium: _scale(food.sodium, factor),
    cholesterol: _scale(food.cholesterol, factor),
    calcium: _scale(food.calcium, factor),
    iron: _scale(food.iron, factor),
    magnesium: _scale(food.magnesium, factor),
    potassium: _scale(food.potassium, factor),
    phosphorus: _scale(food.phosphorus, factor),
    transFat: _scale(food.transFat, factor),
    saturatedFat: _scale(food.saturatedFat, factor),
  );
}

/// Resolves how many grams a "qty × serving unit" pick maps to — e.g.
/// 2 × قاشق غذاخوری(15g) = 30g. Used by the serving-unit picker.
double gramsForServing(FoodServingUnit unit, double quantity) {
  final safeQty = quantity < 0 ? 0.0 : quantity;
  return safeQty * unit.gramsPerUnit;
}
