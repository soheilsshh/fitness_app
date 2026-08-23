import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'ai_nutrition_models.dart';

/// Talks to the backend "تک‌غذا" (single-meal) endpoint — reuses the same
/// `/me/nutrition/suggest-from-ingredients` contract the web wizard's
/// ingredient-suggestion card already calls
/// (backend/internal/controllers/ai_generate_controller.go:SuggestFromIngredients).
class AiNutritionRepository {
  AiNutritionRepository(this._dio);
  final Dio _dio;

  /// Generates a full daily plan. `save: false` previews without persisting;
  /// pass `plan` (a previously-previewed plan, possibly with a meal swapped
  /// in via [regenerateMeal]) with `save: true` to persist it as-is without
  /// re-calling the AI — mirrors the web `DailyPlanClient.jsx` confirm flow.
  Future<NutritionPlanResult> generateDailyPlan({
    required String goal,
    bool save = false,
    NutritionPlan? plan,
  }) async {
    try {
      final res = await _dio.post(
        ApiPaths.meNutritionGenerate,
        data: {
          if (goal.isNotEmpty) 'goal': goal,
          'save': save,
          if (plan != null) 'plan': plan.toJson(),
        },
      );
      return NutritionPlanResult.fromJson(
        Map<String, dynamic>.from(res.data as Map),
      );
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  /// Generates a full 7-day plan. Same save/preview contract as
  /// [generateDailyPlan] — `save: false` previews, pass back `plan` with
  /// `save: true` to persist without re-calling the AI.
  Future<NutritionWeekResult> generateWeeklyPlan({
    required String goal,
    bool save = false,
    NutritionWeekPlan? plan,
  }) async {
    try {
      final res = await _dio.post(
        ApiPaths.meNutritionGenerateWeek,
        data: {
          if (goal.isNotEmpty) 'goal': goal,
          'save': save,
          if (plan != null) 'plan': plan.toJson(),
        },
      );
      return NutritionWeekResult.fromJson(
        Map<String, dynamic>.from(res.data as Map),
      );
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  /// Regenerates a single meal ("تغییر این وعده") without touching the rest
  /// of the plan.
  Future<NutritionMeal> regenerateMeal({
    required String goal,
    required String mealName,
    required int targetCalories,
    required String reason,
  }) async {
    try {
      final res = await _dio.post(
        ApiPaths.meNutritionRegenerateMeal,
        data: {
          if (goal.isNotEmpty) 'goal': goal,
          'mealName': mealName,
          if (targetCalories > 0) 'targetCalories': targetCalories,
          'reason': reason,
        },
      );
      return NutritionMeal.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<IngredientSuggestion> suggestFromIngredients({
    required String ingredients,
    String goal = '',
    String preferences = '',
    int calorieMin = 0,
    int calorieMax = 0,
  }) async {
    try {
      final res = await _dio.post(
        ApiPaths.meNutritionSuggestFromIngredients,
        data: {
          'ingredients': ingredients,
          if (goal.isNotEmpty) 'goal': goal,
          if (preferences.isNotEmpty) 'preferences': preferences,
          if (calorieMin > 0) 'calorieMin': calorieMin,
          if (calorieMax > 0) 'calorieMax': calorieMax,
        },
      );
      return IngredientSuggestion.fromJson(
        Map<String, dynamic>.from(res.data as Map),
      );
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final aiNutritionRepositoryProvider = Provider<AiNutritionRepository>((ref) {
  return AiNutritionRepository(ref.watch(dioProvider));
});
