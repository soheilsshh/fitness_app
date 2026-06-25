// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'program_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ProgramSummary _$ProgramSummaryFromJson(Map<String, dynamic> json) =>
    _ProgramSummary(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '',
      type: json['type'] as String? ?? '',
      status: json['status'] as String? ?? '',
      startDate: json['startDate'] as String? ?? '',
      durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
      remainingDays: (json['remainingDays'] as num?)?.toInt() ?? 0,
      price: (json['price'] as num?)?.toInt() ?? 0,
      coachName: json['coachName'] as String? ?? '',
    );

Map<String, dynamic> _$ProgramSummaryToJson(_ProgramSummary instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'type': instance.type,
      'status': instance.status,
      'startDate': instance.startDate,
      'durationDays': instance.durationDays,
      'remainingDays': instance.remainingDays,
      'price': instance.price,
      'coachName': instance.coachName,
    };

_ProgramsResponse _$ProgramsResponseFromJson(Map<String, dynamic> json) =>
    _ProgramsResponse(
      programs:
          (json['programs'] as List<dynamic>?)
              ?.map((e) => ProgramSummary.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <ProgramSummary>[],
    );

Map<String, dynamic> _$ProgramsResponseToJson(_ProgramsResponse instance) =>
    <String, dynamic>{'programs': instance.programs};

_ProgramDetail _$ProgramDetailFromJson(Map<String, dynamic> json) =>
    _ProgramDetail(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '',
      type: json['type'] as String? ?? '',
      status: json['status'] as String? ?? '',
      durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
      remainingDays: (json['remainingDays'] as num?)?.toInt() ?? 0,
      goal: json['goal'] as String? ?? '',
      level: json['level'] as String? ?? '',
      coach: json['coach'] as String? ?? '',
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
          const <String>[],
      schedule: json['schedule'] == null
          ? null
          : ProgramSchedule.fromJson(json['schedule'] as Map<String, dynamic>),
      planByDay:
          (json['planByDay'] as Map<String, dynamic>?)?.map(
            (k, e) => MapEntry(k, DayPlan.fromJson(e as Map<String, dynamic>)),
          ) ??
          const <String, DayPlan>{},
    );

Map<String, dynamic> _$ProgramDetailToJson(_ProgramDetail instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'type': instance.type,
      'status': instance.status,
      'durationDays': instance.durationDays,
      'remainingDays': instance.remainingDays,
      'goal': instance.goal,
      'level': instance.level,
      'coach': instance.coach,
      'tags': instance.tags,
      'schedule': instance.schedule,
      'planByDay': instance.planByDay,
    };

_ProgramSchedule _$ProgramScheduleFromJson(
  Map<String, dynamic> json,
) => _ProgramSchedule(
  weekly:
      (json['weekly'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  restDays:
      (json['restDays'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
);

Map<String, dynamic> _$ProgramScheduleToJson(_ProgramSchedule instance) =>
    <String, dynamic>{'weekly': instance.weekly, 'restDays': instance.restDays};

_DayPlan _$DayPlanFromJson(Map<String, dynamic> json) => _DayPlan(
  workout: json['workout'] == null
      ? null
      : WorkoutPlan.fromJson(json['workout'] as Map<String, dynamic>),
  nutrition: json['nutrition'] == null
      ? null
      : NutritionPlan.fromJson(json['nutrition'] as Map<String, dynamic>),
);

Map<String, dynamic> _$DayPlanToJson(_DayPlan instance) => <String, dynamic>{
  'workout': instance.workout,
  'nutrition': instance.nutrition,
};

_WorkoutPlan _$WorkoutPlanFromJson(Map<String, dynamic> json) => _WorkoutPlan(
  title: json['title'] as String? ?? '',
  durationMin: (json['durationMin'] as num?)?.toInt() ?? 0,
  calories: (json['calories'] as num?)?.toInt() ?? 0,
  steps:
      (json['steps'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  exercises:
      (json['exercises'] as List<dynamic>?)
          ?.map((e) => WorkoutExercise.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <WorkoutExercise>[],
);

Map<String, dynamic> _$WorkoutPlanToJson(_WorkoutPlan instance) =>
    <String, dynamic>{
      'title': instance.title,
      'durationMin': instance.durationMin,
      'calories': instance.calories,
      'steps': instance.steps,
      'exercises': instance.exercises,
    };

_WorkoutExercise _$WorkoutExerciseFromJson(Map<String, dynamic> json) =>
    _WorkoutExercise(
      name: json['name'] as String? ?? '',
      sets: (json['sets'] as num?)?.toInt() ?? 0,
      reps: json['reps'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      target: json['target'] as String? ?? '',
    );

Map<String, dynamic> _$WorkoutExerciseToJson(_WorkoutExercise instance) =>
    <String, dynamic>{
      'name': instance.name,
      'sets': instance.sets,
      'reps': instance.reps,
      'imageUrl': instance.imageUrl,
      'target': instance.target,
    };

_NutritionPlan _$NutritionPlanFromJson(Map<String, dynamic> json) =>
    _NutritionPlan(
      caloriesTarget: (json['caloriesTarget'] as num?)?.toInt() ?? 0,
      proteinTarget: json['proteinTarget'] as String? ?? '',
      meals:
          (json['meals'] as List<dynamic>?)
              ?.map((e) => NutritionMeal.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <NutritionMeal>[],
    );

Map<String, dynamic> _$NutritionPlanToJson(_NutritionPlan instance) =>
    <String, dynamic>{
      'caloriesTarget': instance.caloriesTarget,
      'proteinTarget': instance.proteinTarget,
      'meals': instance.meals,
    };

_NutritionMeal _$NutritionMealFromJson(Map<String, dynamic> json) =>
    _NutritionMeal(
      title: json['title'] as String? ?? '',
      detail: json['detail'] as String? ?? '',
      calories: (json['calories'] as num?)?.toDouble() ?? 0,
      protein: (json['protein'] as num?)?.toDouble() ?? 0,
    );

Map<String, dynamic> _$NutritionMealToJson(_NutritionMeal instance) =>
    <String, dynamic>{
      'title': instance.title,
      'detail': instance.detail,
      'calories': instance.calories,
      'protein': instance.protein,
    };
