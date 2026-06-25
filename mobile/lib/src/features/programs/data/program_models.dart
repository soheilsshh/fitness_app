import 'package:freezed_annotation/freezed_annotation.dart';

part 'program_models.freezed.dart';
part 'program_models.g.dart';

/// `GET /me/programs` item (MeProgramDTO).
@freezed
abstract class ProgramSummary with _$ProgramSummary {
  const factory ProgramSummary({
    required int id,
    @Default('') String title,
    @Default('') String type,
    @Default('') String status,
    @Default('') String startDate,
    @Default(0) int durationDays,
    @Default(0) int remainingDays,
    @Default(0) int price,
    @Default('') String coachName,
  }) = _ProgramSummary;

  factory ProgramSummary.fromJson(Map<String, dynamic> json) =>
      _$ProgramSummaryFromJson(json);
}

@freezed
abstract class ProgramsResponse with _$ProgramsResponse {
  const factory ProgramsResponse({
    @Default(<ProgramSummary>[]) List<ProgramSummary> programs,
  }) = _ProgramsResponse;

  factory ProgramsResponse.fromJson(Map<String, dynamic> json) =>
      _$ProgramsResponseFromJson(json);
}

/// `GET /me/programs/:id` (MeProgramDetailDTO) — captures the headline fields
/// plus the per-day plan map.
@freezed
abstract class ProgramDetail with _$ProgramDetail {
  const factory ProgramDetail({
    required int id,
    @Default('') String title,
    @Default('') String type,
    @Default('') String status,
    @Default(0) int durationDays,
    @Default(0) int remainingDays,
    @Default('') String goal,
    @Default('') String level,
    @Default('') String coach,
    @Default(<String>[]) List<String> tags,
    ProgramSchedule? schedule,
    @Default(<String, DayPlan>{}) Map<String, DayPlan> planByDay,
  }) = _ProgramDetail;

  factory ProgramDetail.fromJson(Map<String, dynamic> json) =>
      _$ProgramDetailFromJson(json);
}

@freezed
abstract class ProgramSchedule with _$ProgramSchedule {
  const factory ProgramSchedule({
    @Default(<String>[]) List<String> weekly,
    @Default(<String>[]) List<String> restDays,
  }) = _ProgramSchedule;

  factory ProgramSchedule.fromJson(Map<String, dynamic> json) =>
      _$ProgramScheduleFromJson(json);
}

@freezed
abstract class DayPlan with _$DayPlan {
  const factory DayPlan({
    WorkoutPlan? workout,
    NutritionPlan? nutrition,
  }) = _DayPlan;

  factory DayPlan.fromJson(Map<String, dynamic> json) =>
      _$DayPlanFromJson(json);
}

@freezed
abstract class WorkoutPlan with _$WorkoutPlan {
  const factory WorkoutPlan({
    @Default('') String title,
    @Default(0) int durationMin,
    @Default(0) int calories,
    @Default(<String>[]) List<String> steps,
    @Default(<WorkoutExercise>[]) List<WorkoutExercise> exercises,
  }) = _WorkoutPlan;

  factory WorkoutPlan.fromJson(Map<String, dynamic> json) =>
      _$WorkoutPlanFromJson(json);
}

@freezed
abstract class WorkoutExercise with _$WorkoutExercise {
  const factory WorkoutExercise({
    @Default('') String name,
    @Default(0) int sets,
    @Default('') String reps,
    @Default('') String imageUrl,
    @Default('') String target,
  }) = _WorkoutExercise;

  factory WorkoutExercise.fromJson(Map<String, dynamic> json) =>
      _$WorkoutExerciseFromJson(json);
}

@freezed
abstract class NutritionPlan with _$NutritionPlan {
  const factory NutritionPlan({
    @Default(0) int caloriesTarget,
    @Default('') String proteinTarget,
    @Default(<NutritionMeal>[]) List<NutritionMeal> meals,
  }) = _NutritionPlan;

  factory NutritionPlan.fromJson(Map<String, dynamic> json) =>
      _$NutritionPlanFromJson(json);
}

@freezed
abstract class NutritionMeal with _$NutritionMeal {
  const factory NutritionMeal({
    @Default('') String title,
    @Default('') String detail,
    @Default(0) double calories,
    @Default(0) double protein,
  }) = _NutritionMeal;

  factory NutritionMeal.fromJson(Map<String, dynamic> json) =>
      _$NutritionMealFromJson(json);
}
