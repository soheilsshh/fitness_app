/// Plain (non-codegen) models for the AI single-meal suggestion — mirrors
/// backend `ai.IngredientSuggestionSchema` / `ai.FoodItem`
/// (backend/internal/service/ai/schemas.go).
class SuggestedFoodItem {
  const SuggestedFoodItem({
    required this.foodName,
    required this.amountG,
    required this.servingLabel,
    required this.calories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });

  factory SuggestedFoodItem.fromJson(Map<String, dynamic> json) {
    return SuggestedFoodItem(
      foodName: json['food_name'] as String? ?? '',
      amountG: (json['amount_g'] as num?)?.toDouble() ?? 0,
      servingLabel: json['serving_label'] as String? ?? '',
      calories: (json['calories'] as num?)?.toInt() ?? 0,
      proteinG: (json['protein_g'] as num?)?.toDouble() ?? 0,
      carbsG: (json['carbs_g'] as num?)?.toDouble() ?? 0,
      fatG: (json['fat_g'] as num?)?.toDouble() ?? 0,
    );
  }

  final String foodName;
  final double amountG;
  final String servingLabel;
  final int calories;
  final double proteinG;
  final double carbsG;
  final double fatG;
}

class IngredientSuggestion {
  const IngredientSuggestion({
    required this.recipeName,
    required this.instructions,
    required this.items,
    required this.totalCalories,
  });

  factory IngredientSuggestion.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List? ?? const [];
    return IngredientSuggestion(
      recipeName: json['recipe_name'] as String? ?? '',
      instructions: json['instructions'] as String? ?? '',
      items: rawItems
          .map((e) => SuggestedFoodItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      totalCalories: (json['total_calories'] as num?)?.toInt() ?? 0,
    );
  }

  final String recipeName;
  final String instructions;
  final List<SuggestedFoodItem> items;
  final int totalCalories;

  double get totalProtein => items.fold(0, (sum, i) => sum + i.proteinG);
  double get totalCarbs => items.fold(0, (sum, i) => sum + i.carbsG);
  double get totalFat => items.fold(0, (sum, i) => sum + i.fatG);
}

/// One meal inside a daily nutrition plan — mirrors backend `ai.MealSchema`.
class NutritionMeal {
  const NutritionMeal({required this.name, required this.items});

  factory NutritionMeal.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List? ?? const [];
    return NutritionMeal(
      name: json['name'] as String? ?? '',
      items: rawItems
          .map((e) => SuggestedFoodItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }

  final String name;
  final List<SuggestedFoodItem> items;

  Map<String, dynamic> toJson() => {
        'name': name,
        'items': items
            .map((i) => {
                  'food_name': i.foodName,
                  'amount_g': i.amountG,
                  'serving_label': i.servingLabel,
                  'calories': i.calories,
                  'protein_g': i.proteinG,
                  'carbs_g': i.carbsG,
                  'fat_g': i.fatG,
                })
            .toList(),
      };

  double get calories => items.fold(0, (sum, i) => sum + i.calories);
  double get protein => items.fold(0, (sum, i) => sum + i.proteinG);
  double get carbs => items.fold(0, (sum, i) => sum + i.carbsG);
  double get fat => items.fold(0, (sum, i) => sum + i.fatG);
}

/// Full daily nutrition plan — mirrors backend `ai.NutritionPlanSchema`.
class NutritionPlan {
  const NutritionPlan({
    required this.goalType,
    required this.totalCalories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.meals,
  });

  factory NutritionPlan.fromJson(Map<String, dynamic> json) {
    final rawMeals = json['meals'] as List? ?? const [];
    return NutritionPlan(
      goalType: json['goal_type'] as String? ?? '',
      totalCalories: (json['total_calories'] as num?)?.toInt() ?? 0,
      proteinG: (json['protein_g'] as num?)?.toInt() ?? 0,
      carbsG: (json['carbs_g'] as num?)?.toInt() ?? 0,
      fatG: (json['fat_g'] as num?)?.toInt() ?? 0,
      meals: rawMeals
          .map((e) => NutritionMeal.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }

  final String goalType;
  final int totalCalories;
  final int proteinG;
  final int carbsG;
  final int fatG;
  final List<NutritionMeal> meals;

  Map<String, dynamic> toJson() => {
        'goal_type': goalType,
        'total_calories': totalCalories,
        'protein_g': proteinG,
        'carbs_g': carbsG,
        'fat_g': fatG,
        'meals': meals.map((m) => m.toJson()).toList(),
      };

  NutritionPlan replaceMeal(int index, NutritionMeal meal) {
    final next = List<NutritionMeal>.from(meals);
    next[index] = meal;
    return NutritionPlan(
      goalType: goalType,
      totalCalories: totalCalories,
      proteinG: proteinG,
      carbsG: carbsG,
      fatG: fatG,
      meals: next,
    );
  }

  double get liveCalories => meals.fold(0, (sum, m) => sum + m.calories);
  double get liveProtein => meals.fold(0, (sum, m) => sum + m.protein);
  double get liveCarbs => meals.fold(0, (sum, m) => sum + m.carbs);
  double get liveFat => meals.fold(0, (sum, m) => sum + m.fat);
}

/// Deterministic BMR/TDEE-based targets returned alongside the plan — mirrors
/// backend `service.NutritionTargets` (backend/internal/service/nutrition_calc.go).
class NutritionTargets {
  const NutritionTargets({
    required this.targetCalories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });

  factory NutritionTargets.fromJson(Map<String, dynamic> json) {
    return NutritionTargets(
      targetCalories: (json['targetCalories'] as num?)?.toInt() ?? 0,
      proteinG: (json['proteinG'] as num?)?.toInt() ?? 0,
      carbsG: (json['carbsG'] as num?)?.toInt() ?? 0,
      fatG: (json['fatG'] as num?)?.toInt() ?? 0,
    );
  }

  final int targetCalories;
  final int proteinG;
  final int carbsG;
  final int fatG;
}

/// One day inside a weekly nutrition plan — mirrors backend
/// `ai.NutritionWeekDaySchema`.
class NutritionWeekDay {
  const NutritionWeekDay({required this.dayName, required this.meals});

  factory NutritionWeekDay.fromJson(Map<String, dynamic> json) {
    final rawMeals = json['meals'] as List? ?? const [];
    return NutritionWeekDay(
      dayName: json['day_name'] as String? ?? '',
      meals: rawMeals
          .map((e) => NutritionMeal.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }

  final String dayName;
  final List<NutritionMeal> meals;

  Map<String, dynamic> toJson() => {
        'day_name': dayName,
        'meals': meals.map((m) => m.toJson()).toList(),
      };

  double get calories => meals.fold(0, (sum, m) => sum + m.calories);
  double get protein => meals.fold(0, (sum, m) => sum + m.protein);
  double get carbs => meals.fold(0, (sum, m) => sum + m.carbs);
  double get fat => meals.fold(0, (sum, m) => sum + m.fat);

  NutritionWeekDay replaceMeal(int index, NutritionMeal meal) {
    final next = List<NutritionMeal>.from(meals);
    next[index] = meal;
    return NutritionWeekDay(dayName: dayName, meals: next);
  }
}

/// Full 7-day nutrition plan — mirrors backend `ai.NutritionWeekSchema`.
class NutritionWeekPlan {
  const NutritionWeekPlan({
    required this.goalType,
    required this.totalCalories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.days,
  });

  factory NutritionWeekPlan.fromJson(Map<String, dynamic> json) {
    final rawDays = json['days'] as List? ?? const [];
    return NutritionWeekPlan(
      goalType: json['goal_type'] as String? ?? '',
      totalCalories: (json['total_calories'] as num?)?.toInt() ?? 0,
      proteinG: (json['protein_g'] as num?)?.toInt() ?? 0,
      carbsG: (json['carbs_g'] as num?)?.toInt() ?? 0,
      fatG: (json['fat_g'] as num?)?.toInt() ?? 0,
      days: rawDays
          .map((e) => NutritionWeekDay.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }

  final String goalType;
  final int totalCalories;
  final int proteinG;
  final int carbsG;
  final int fatG;
  final List<NutritionWeekDay> days;

  Map<String, dynamic> toJson() => {
        'goal_type': goalType,
        'total_calories': totalCalories,
        'protein_g': proteinG,
        'carbs_g': carbsG,
        'fat_g': fatG,
        'days': days.map((d) => d.toJson()).toList(),
      };

  NutritionWeekPlan replaceDay(int dayIndex, NutritionWeekDay day) {
    final next = List<NutritionWeekDay>.from(days);
    next[dayIndex] = day;
    return NutritionWeekPlan(
      goalType: goalType,
      totalCalories: totalCalories,
      proteinG: proteinG,
      carbsG: carbsG,
      fatG: fatG,
      days: next,
    );
  }

  double get liveCalories => days.fold(0, (sum, d) => sum + d.calories);
  double get liveProtein => days.fold(0, (sum, d) => sum + d.protein);
  double get liveCarbs => days.fold(0, (sum, d) => sum + d.carbs);
  double get liveFat => days.fold(0, (sum, d) => sum + d.fat);
}

class NutritionWeekResult {
  const NutritionWeekResult({required this.plan, required this.targets});

  factory NutritionWeekResult.fromJson(Map<String, dynamic> json) {
    return NutritionWeekResult(
      plan: NutritionWeekPlan.fromJson(Map<String, dynamic>.from(json['plan'] as Map)),
      targets:
          NutritionTargets.fromJson(Map<String, dynamic>.from(json['targets'] as Map)),
    );
  }

  final NutritionWeekPlan plan;
  final NutritionTargets targets;
}

class NutritionPlanResult {
  const NutritionPlanResult({required this.plan, required this.targets});

  factory NutritionPlanResult.fromJson(Map<String, dynamic> json) {
    return NutritionPlanResult(
      plan: NutritionPlan.fromJson(Map<String, dynamic>.from(json['plan'] as Map)),
      targets:
          NutritionTargets.fromJson(Map<String, dynamic>.from(json['targets'] as Map)),
    );
  }

  final NutritionPlan plan;
  final NutritionTargets targets;
}
