// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'food_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Food _$FoodFromJson(Map<String, dynamic> json) => _Food(
  id: (json['id'] as num).toInt(),
  name: json['name'] as String? ?? '',
  unit: json['unit'] as String? ?? '',
  amount: (json['amount'] as num?)?.toDouble() ?? 0,
  calories: (json['calories'] as num?)?.toDouble() ?? 0,
  fat: (json['fat'] as num?)?.toDouble() ?? 0,
  protein: (json['protein'] as num?)?.toDouble() ?? 0,
  carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
);

Map<String, dynamic> _$FoodToJson(_Food instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'unit': instance.unit,
  'amount': instance.amount,
  'calories': instance.calories,
  'fat': instance.fat,
  'protein': instance.protein,
  'carbs': instance.carbs,
};

_FoodListResponse _$FoodListResponseFromJson(Map<String, dynamic> json) =>
    _FoodListResponse(
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => Food.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <Food>[],
      total: (json['total'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$FoodListResponseToJson(_FoodListResponse instance) =>
    <String, dynamic>{'items': instance.items, 'total': instance.total};

_FoodLog _$FoodLogFromJson(Map<String, dynamic> json) => _FoodLog(
  id: (json['id'] as num).toInt(),
  logDate: json['logDate'] as String? ?? '',
  foodId: (json['foodId'] as num?)?.toInt(),
  foodName: json['foodName'] as String? ?? '',
  quantity: json['quantity'] as String? ?? '',
  calories: (json['calories'] as num?)?.toDouble() ?? 0,
  protein: (json['protein'] as num?)?.toDouble() ?? 0,
  carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
  fat: (json['fat'] as num?)?.toDouble() ?? 0,
);

Map<String, dynamic> _$FoodLogToJson(_FoodLog instance) => <String, dynamic>{
  'id': instance.id,
  'logDate': instance.logDate,
  'foodId': instance.foodId,
  'foodName': instance.foodName,
  'quantity': instance.quantity,
  'calories': instance.calories,
  'protein': instance.protein,
  'carbs': instance.carbs,
  'fat': instance.fat,
};

_MacroTotals _$MacroTotalsFromJson(Map<String, dynamic> json) => _MacroTotals(
  calories: (json['calories'] as num?)?.toDouble() ?? 0,
  protein: (json['protein'] as num?)?.toDouble() ?? 0,
  carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
  fat: (json['fat'] as num?)?.toDouble() ?? 0,
);

Map<String, dynamic> _$MacroTotalsToJson(_MacroTotals instance) =>
    <String, dynamic>{
      'calories': instance.calories,
      'protein': instance.protein,
      'carbs': instance.carbs,
      'fat': instance.fat,
    };

_DailyFoodLog _$DailyFoodLogFromJson(Map<String, dynamic> json) =>
    _DailyFoodLog(
      date: json['date'] as String? ?? '',
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => FoodLog.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <FoodLog>[],
      totals: json['totals'] == null
          ? const MacroTotals()
          : MacroTotals.fromJson(json['totals'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$DailyFoodLogToJson(_DailyFoodLog instance) =>
    <String, dynamic>{
      'date': instance.date,
      'items': instance.items,
      'totals': instance.totals,
    };
