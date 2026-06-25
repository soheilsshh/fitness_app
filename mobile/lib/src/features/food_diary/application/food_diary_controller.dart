import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/utils/jalali.dart';
import '../data/food_models.dart';
import '../data/food_repository.dart';

part 'food_diary_controller.g.dart';

/// Currently selected diary day (defaults to today).
@riverpod
class SelectedDiaryDate extends _$SelectedDiaryDate {
  @override
  DateTime build() => JalaliDates.todayDate();

  void set(DateTime date) => state = DateTime(date.year, date.month, date.day);
  void shift(int days) => set(state.add(Duration(days: days)));
}

/// The day's logs + totals for the selected date.
@riverpod
Future<DailyFoodLog> dailyDiary(Ref ref) {
  final date = ref.watch(selectedDiaryDateProvider);
  return ref.watch(foodRepositoryProvider).logsByDate(JalaliDates.isoDate(date));
}

/// Catalog search for the food picker.
@riverpod
Future<List<Food>> foodSearch(Ref ref, String query) {
  return ref.watch(foodRepositoryProvider).searchFoods(query: query);
}

/// Mutations: add (catalog or manual) and delete, then refresh the day.
@riverpod
class FoodDiaryActions extends _$FoodDiaryActions {
  @override
  void build() {}

  Future<void> addFromFood(Food food, double multiplier) async {
    final date = ref.read(selectedDiaryDateProvider);
    await ref.read(foodRepositoryProvider).createLog(
          logDate: JalaliDates.isoDate(date),
          foodId: food.id,
          foodName: food.name,
          quantity: '${food.amount * multiplier} ${food.unit}',
          multiplier: multiplier,
        );
    ref.invalidate(dailyDiaryProvider);
  }

  Future<void> addManual(String name, String quantity) async {
    final date = ref.read(selectedDiaryDateProvider);
    await ref.read(foodRepositoryProvider).createLog(
          logDate: JalaliDates.isoDate(date),
          foodName: name,
          quantity: quantity,
        );
    ref.invalidate(dailyDiaryProvider);
  }

  Future<void> delete(int id) async {
    await ref.read(foodRepositoryProvider).deleteLog(id);
    ref.invalidate(dailyDiaryProvider);
  }
}
