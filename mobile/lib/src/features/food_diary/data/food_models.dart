import 'package:freezed_annotation/freezed_annotation.dart';

part 'food_models.freezed.dart';
part 'food_models.g.dart';

/// Catalog item from `GET /user/foods` (CoachFoodItem).
@freezed
abstract class Food with _$Food {
  const factory Food({
    required int id,
    @Default('') String name,
    @Default('') String unit,
    @Default(0) double amount,
    @Default(0) double calories,
    @Default(0) double fat,
    @Default(0) double protein,
    @Default(0) double carbs,
  }) = _Food;

  factory Food.fromJson(Map<String, dynamic> json) => _$FoodFromJson(json);
}

@freezed
abstract class FoodListResponse with _$FoodListResponse {
  const factory FoodListResponse({
    @Default(<Food>[]) List<Food> items,
    @Default(0) int total,
  }) = _FoodListResponse;

  factory FoodListResponse.fromJson(Map<String, dynamic> json) =>
      _$FoodListResponseFromJson(json);
}

/// A logged entry (DailyFoodLogDTO).
@freezed
abstract class FoodLog with _$FoodLog {
  const factory FoodLog({
    required int id,
    @Default('') String logDate,
    int? foodId,
    @Default('') String foodName,
    @Default('') String quantity,
    @Default(0) double calories,
    @Default(0) double protein,
    @Default(0) double carbs,
    @Default(0) double fat,
  }) = _FoodLog;

  factory FoodLog.fromJson(Map<String, dynamic> json) =>
      _$FoodLogFromJson(json);
}

@freezed
abstract class MacroTotals with _$MacroTotals {
  const factory MacroTotals({
    @Default(0) double calories,
    @Default(0) double protein,
    @Default(0) double carbs,
    @Default(0) double fat,
  }) = _MacroTotals;

  factory MacroTotals.fromJson(Map<String, dynamic> json) =>
      _$MacroTotalsFromJson(json);
}

/// `GET /user/food-logs?date=` response.
@freezed
abstract class DailyFoodLog with _$DailyFoodLog {
  const factory DailyFoodLog({
    @Default('') String date,
    @Default(<FoodLog>[]) List<FoodLog> items,
    @Default(MacroTotals()) MacroTotals totals,
  }) = _DailyFoodLog;

  factory DailyFoodLog.fromJson(Map<String, dynamic> json) =>
      _$DailyFoodLogFromJson(json);
}
