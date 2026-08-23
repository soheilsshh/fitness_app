import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../data/ai_nutrition_models.dart';
import '../data/ai_nutrition_repository.dart';
import 'daily_plan_controller.dart' show kDailyGoalOptions, kRegenerateReasons;

class WeeklyPlanState {
  const WeeklyPlanState({
    this.goal = '',
    this.loading = false,
    this.confirming = false,
    this.confirmed = false,
    this.selectedDay = 0,
    this.regeneratingDay,
    this.regeneratingMeal,
    this.error,
    this.plan,
    this.targets,
  });

  final String goal;
  final bool loading;
  final bool confirming;
  final bool confirmed;
  final int selectedDay;
  final int? regeneratingDay;
  final int? regeneratingMeal;
  final String? error;
  final NutritionWeekPlan? plan;
  final NutritionTargets? targets;

  WeeklyPlanState copyWith({
    String? goal,
    bool? loading,
    bool? confirming,
    bool? confirmed,
    int? selectedDay,
    int? regeneratingDay,
    int? regeneratingMeal,
    bool clearRegenerating = false,
    String? error,
    bool clearError = false,
    NutritionWeekPlan? plan,
    NutritionTargets? targets,
  }) {
    return WeeklyPlanState(
      goal: goal ?? this.goal,
      loading: loading ?? this.loading,
      confirming: confirming ?? this.confirming,
      confirmed: confirmed ?? this.confirmed,
      selectedDay: selectedDay ?? this.selectedDay,
      regeneratingDay: clearRegenerating ? null : (regeneratingDay ?? this.regeneratingDay),
      regeneratingMeal: clearRegenerating ? null : (regeneratingMeal ?? this.regeneratingMeal),
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

/// Drives the "📅 برنامه هفتگی" flow: goal → 7-day AI plan → per-day tabs →
/// per-meal regenerate → confirm/save. Mirrors web `WeeklyPlanClient.jsx`.
class WeeklyPlanController extends Notifier<WeeklyPlanState> {
  @override
  WeeklyPlanState build() => const WeeklyPlanState();

  void setGoal(String goal) => state = state.copyWith(goal: goal);
  void selectDay(int index) => state = state.copyWith(selectedDay: index);

  Future<void> generate() async {
    if (state.goal.isEmpty) return;
    state = state.copyWith(loading: true, clearError: true);
    try {
      final result = await ref
          .read(aiNutritionRepositoryProvider)
          .generateWeeklyPlan(goal: state.goal, save: false);
      state = state.copyWith(
        loading: false,
        plan: result.plan,
        targets: result.targets,
        selectedDay: 0,
        confirmed: false,
      );
    } on ApiException catch (e) {
      state = state.copyWith(loading: false, error: e.message);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'ساخت برنامه هفتگی ناموفق بود');
    }
  }

  Future<void> regenerateMeal(int dayIndex, int mealIndex, String reason) async {
    final plan = state.plan;
    if (plan == null) return;
    final meal = plan.days[dayIndex].meals[mealIndex];
    final targetCalories = meal.calories.round();

    state = state.copyWith(
      regeneratingDay: dayIndex,
      regeneratingMeal: mealIndex,
      clearError: true,
    );
    try {
      final newMeal = await ref.read(aiNutritionRepositoryProvider).regenerateMeal(
            goal: state.goalLabel,
            mealName: meal.name,
            targetCalories: targetCalories,
            reason: reason,
          );
      final newDay = plan.days[dayIndex].replaceMeal(mealIndex, newMeal);
      state = state.copyWith(
        plan: plan.replaceDay(dayIndex, newDay),
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
          .generateWeeklyPlan(goal: state.goal, save: true, plan: plan);
      state = state.copyWith(confirming: false, confirmed: true);
    } on ApiException catch (e) {
      state = state.copyWith(confirming: false, error: e.message);
    } catch (_) {
      state = state.copyWith(confirming: false, error: 'ذخیره برنامه ناموفق بود');
    }
  }
}

final weeklyPlanControllerProvider =
    NotifierProvider<WeeklyPlanController, WeeklyPlanState>(WeeklyPlanController.new);
