import 'package:freezed_annotation/freezed_annotation.dart';

part 'food_models.freezed.dart';
part 'food_models.g.dart';

/// A named way to enter an amount of a food — "قاشق غذاخوری", "لیوان", "گرم" —
/// each with its own gram weight, so the add-food sheet can offer a
/// spoon/gram/cup picker instead of a single raw-number multiplier.
///
/// Hand-written (not freezed): kept simple and dependency-free so it doesn't
/// need a `build_runner` codegen pass to stay in sync.
class FoodServingUnit {
  const FoodServingUnit({
    this.label = '',
    this.gramsPerUnit = 0,
    this.isDefault = false,
  });

  final String label;
  final double gramsPerUnit;
  final bool isDefault;

  factory FoodServingUnit.fromJson(Map<String, dynamic> json) {
    return FoodServingUnit(
      label: json['label'] as String? ?? '',
      gramsPerUnit: (json['gramsPerUnit'] as num?)?.toDouble() ?? 0,
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'label': label,
        'gramsPerUnit': gramsPerUnit,
        'isDefault': isDefault,
      };
}

/// Catalog item from `GET /user/foods` (CoachFoodItem).
///
/// `calories`/`fat`/`protein`/`carbs` (and the nullable extended fields below)
/// are per-100g — see `nutrition_scale.dart` for turning grams into an actual
/// serving. Extended fields are null until the food has been enriched from a
/// matched USDA record — null means "not available yet", never a guess.
///
/// Hand-written (not freezed) for the same reason as [FoodServingUnit].
class Food {
  const Food({
    required this.id,
    this.name = '',
    this.unit = '',
    this.amount = 0,
    this.calories = 0,
    this.fat = 0,
    this.protein = 0,
    this.carbs = 0,
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
    this.servingUnits = const <FoodServingUnit>[],
  });

  final int id;
  final String name;
  final String unit;
  final double amount;
  final double calories;
  final double fat;
  final double protein;
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
  final List<FoodServingUnit> servingUnits;

  /// The unit to preselect in the serving picker: the food's own default if
  /// it has serving units, else a fall-back plain-gram entry.
  FoodServingUnit get defaultServingUnit {
    if (servingUnits.isEmpty) {
      return const FoodServingUnit(label: 'گرم', gramsPerUnit: 1, isDefault: true);
    }
    return servingUnits.firstWhere(
      (u) => u.isDefault,
      orElse: () => servingUnits.first,
    );
  }

  factory Food.fromJson(Map<String, dynamic> json) {
    return Food(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      unit: json['unit'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      calories: (json['calories'] as num?)?.toDouble() ?? 0,
      fat: (json['fat'] as num?)?.toDouble() ?? 0,
      protein: (json['protein'] as num?)?.toDouble() ?? 0,
      carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
      fiber: (json['fiber'] as num?)?.toDouble(),
      sugar: (json['sugar'] as num?)?.toDouble(),
      sodium: (json['sodium'] as num?)?.toDouble(),
      cholesterol: (json['cholesterol'] as num?)?.toDouble(),
      calcium: (json['calcium'] as num?)?.toDouble(),
      iron: (json['iron'] as num?)?.toDouble(),
      magnesium: (json['magnesium'] as num?)?.toDouble(),
      potassium: (json['potassium'] as num?)?.toDouble(),
      phosphorus: (json['phosphorus'] as num?)?.toDouble(),
      transFat: (json['transFat'] as num?)?.toDouble(),
      saturatedFat: (json['saturatedFat'] as num?)?.toDouble(),
      servingUnits: (json['servingUnits'] as List<dynamic>?)
              ?.map((e) => FoodServingUnit.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <FoodServingUnit>[],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'unit': unit,
        'amount': amount,
        'calories': calories,
        'fat': fat,
        'protein': protein,
        'carbs': carbs,
        'fiber': fiber,
        'sugar': sugar,
        'sodium': sodium,
        'cholesterol': cholesterol,
        'calcium': calcium,
        'iron': iron,
        'magnesium': magnesium,
        'potassium': potassium,
        'phosphorus': phosphorus,
        'transFat': transFat,
        'saturatedFat': saturatedFat,
        'servingUnits': servingUnits.map((e) => e.toJson()).toList(),
      };
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
