import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../data/ai_nutrition_models.dart';
import '../data/ai_nutrition_repository.dart';

// Mirrors backend enum ai.GoalCut / ai.GoalBulk / ai.GoalMaintain — the
// literal value POST /me/nutrition/generate requires.
const kDailyGoalOptions = [
  (value: 'cut', label: 'کاهش وزن'),
  (value: 'bulk', label: 'عضله‌سازی'),
  (value: 'maintain', label: 'حفظ وزن'),
];

const kRegenerateReasons = [
  'مواد اولیه ندارم',
  'دوست ندارم',
  'کالری زیاد است',
  'پروتئین بیشتری می‌خواهم',
  'غذای دیگری پیشنهاد بده',
];

class DailyPlanState {
  const DailyPlanState({
    this.goal = '',
    this.loading = false,
    this.confirming = false,
    this.confirmed = false,
    this.regeneratingMealIndex,
    this.error,
    this.plan,
    this.targets,
  });

  final String goal;
  final bool loading;
  final bool confirming;
  final bool confirmed;
  final int? regeneratingMealIndex;
  final String? error;
  final NutritionPlan? plan;
  final NutritionTargets? targets;

  DailyPlanState copyWith({
    String? goal,
    bool? loading,
    bool? confirming,
    bool? confirmed,
    int? regeneratingMealIndex,
    bool clearRegenerating = false,
    String? error,
    bool clearError = false,
    NutritionPlan? plan,
    NutritionTargets? targets,
  }) {
    return DailyPlanState(
      goal: goal ?? this.goal,
      loading: loading ?? this.loading,
      confirming: confirming ?? this.confirming,
      confirmed: confirmed ?? this.confirmed,
      regeneratingMealIndex:
          clearRegenerating ? null : (regeneratingMealIndex ?? this.regeneratingMealIndex),
      error: clearError ? null : (error ?? this.error),
      plan: plan ?? this.plan,
      targets: targets ?? this.targets,
    );
  }

  String get goalLabel =>
      kDailyGoalOptions.where((g) => g.value == goal).map((g) => g.label).firstOrElse('');
}

extension _FirstOrElse<T> on Iterable<T> {
  T firstOrElse(T fallback) => isEmpty ? fallback : first;
}

/// Drives the "☀️ برنامه روزانه" flow: goal → full-day AI plan → per-meal
/// regenerate → confirm/save. Mirrors web `DailyPlanClient.jsx`.
class DailyPlanController extends Notifier<DailyPlanState> {
  @override
  DailyPlanState build() => const DailyPlanState();

  void setGoal(String goal) => state = state.copyWith(goal: goal);

  Future<void> generate() async {
    if (state.goal.isEmpty) return;
    state = state.copyWith(loading: true, clearError: true);
    try {
      final result = await ref
          .read(aiNutritionRepositoryProvider)
          .generateDailyPlan(goal: state.goal, save: false);
      state = state.copyWith(
        loading: false,
        plan: result.plan,
        targets: result.targets,
        confirmed: false,
      );
    } on ApiException catch (e) {
      state = state.copyWith(loading: false, error: e.message);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'ساخت برنامه ناموفق بود');
    }
  }

  Future<void> regenerateMeal(int index, String reason) async {
    final plan = state.plan;
    if (plan == null) return;
    final meal = plan.meals[index];
    final targetCalories = meal.calories.round();

    state = state.copyWith(regeneratingMealIndex: index, clearError: true);
    try {
      final newMeal = await ref.read(aiNutritionRepositoryProvider).regenerateMeal(
            goal: state.goalLabel,
            mealName: meal.name,
            targetCalories: targetCalories,
            reason: reason,
          );
      state = state.copyWith(
        plan: plan.replaceMeal(index, newMeal),
        clearRegenerating: true,
        confirmed: false,
      );
    } on ApiException catch (e) {
      state = state.copyWith(clearRegenerating: true, error: e.message);
    } catch (_) {
      state = state.copyWith(clearRegenerating: true, error: 'تغییر وعده ناموفق بود');
    }
  }

  Future<void> confirmPlan() async {
    final plan = state.plan;
    if (plan == null) return;
    state = state.copyWith(confirming: true, clearError: true);
    try {
      await ref
          .read(aiNutritionRepositoryProvider)
          .generateDailyPlan(goal: state.goal, save: true, plan: plan);
      state = state.copyWith(confirming: false, confirmed: true);
    } on ApiException catch (e) {
      state = state.copyWith(confirming: false, error: e.message);
    } catch (_) {
      state = state.copyWith(confirming: false, error: 'ذخیره برنامه ناموفق بود');
    }
  }
}

final dailyPlanControllerProvider =
    NotifierProvider<DailyPlanController, DailyPlanState>(DailyPlanController.new);
