import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../data/ai_nutrition_models.dart';
import '../data/ai_nutrition_repository.dart';

enum SingleMealStep { input, summary, result }

class SingleMealState {
  const SingleMealState({
    this.step = SingleMealStep.input,
    this.goal = '',
    this.selectedIngredients = const {},
    this.freeText = '',
    this.loading = false,
    this.error,
    this.suggestion,
  });

  final SingleMealStep step;
  final String goal;
  final Set<String> selectedIngredients;
  final String freeText;
  final bool loading;
  final String? error;
  final IngredientSuggestion? suggestion;

  bool get canContinue => selectedIngredients.isNotEmpty || freeText.trim().isNotEmpty;

  SingleMealState copyWith({
    SingleMealStep? step,
    String? goal,
    Set<String>? selectedIngredients,
    String? freeText,
    bool? loading,
    String? error,
    IngredientSuggestion? suggestion,
    bool clearError = false,
  }) {
    return SingleMealState(
      step: step ?? this.step,
      goal: goal ?? this.goal,
      selectedIngredients: selectedIngredients ?? this.selectedIngredients,
      freeText: freeText ?? this.freeText,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      suggestion: suggestion ?? this.suggestion,
    );
  }
}

/// Drives the "تک‌غذا" (single-meal) flow: quick-pick ingredients + free text
/// → summary → AI suggestion. Mirrors the web `SingleMealClient.jsx` flow.
class SingleMealController extends Notifier<SingleMealState> {
  @override
  SingleMealState build() => const SingleMealState();

  void setGoal(String goal) {
    state = state.copyWith(goal: state.goal == goal ? '' : goal);
  }

  void toggleIngredient(String name) {
    final next = Set<String>.from(state.selectedIngredients);
    if (!next.remove(name)) next.add(name);
    state = state.copyWith(selectedIngredients: next);
  }

  void setFreeText(String text) => state = state.copyWith(freeText: text);

  void appendFreeText(String text) {
    final current = state.freeText;
    setFreeText(current.isEmpty ? text : '$current\n$text');
  }

  void goToSummary() {
    if (!state.canContinue) return;
    state = state.copyWith(step: SingleMealStep.summary);
  }

  void backToInput() => state = state.copyWith(step: SingleMealStep.input);

  Future<void> generate() async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final suggestion = await ref.read(aiNutritionRepositoryProvider).suggestFromIngredients(
            ingredients: state.selectedIngredients.join('، '),
            goal: _goalLabel(state.goal),
            preferences: state.freeText.trim(),
          );
      state = state.copyWith(
        loading: false,
        suggestion: suggestion,
        step: SingleMealStep.result,
      );
    } on ApiException catch (e) {
      state = state.copyWith(loading: false, error: e.message);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'تولید پیشنهاد ناموفق بود');
    }
  }

  static String _goalLabel(String value) => switch (value) {
        'weight_loss' => 'کاهش وزن',
        'muscle_gain' => 'عضله‌سازی',
        'maintain' => 'حفظ وزن',
        _ => '',
      };
}

final singleMealControllerProvider =
    NotifierProvider<SingleMealController, SingleMealState>(SingleMealController.new);

const kCommonIngredients = [
  'مرغ',
  'تخم‌مرغ',
  'برنج',
  'سیب‌زمینی',
  'گوشت قرمز',
  'ماهی',
  'ماست',
  'پنیر',
  'نان',
  'عدس',
  'لوبیا',
  'سبزیجات',
];

const kGoalOptions = [
  (value: 'weight_loss', label: 'کاهش وزن'),
  (value: 'muscle_gain', label: 'عضله‌سازی'),
  (value: 'maintain', label: 'حفظ وزن'),
];
