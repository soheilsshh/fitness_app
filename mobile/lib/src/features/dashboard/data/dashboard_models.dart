import 'package:freezed_annotation/freezed_annotation.dart';

part 'dashboard_models.freezed.dart';
part 'dashboard_models.g.dart';

/// `GET /me/dashboard` → MeDashboardSummary.
@freezed
abstract class DashboardSummary with _$DashboardSummary {
  const factory DashboardSummary({
    @Default(0) int totalSessions,
    @Default(0) int sessionsThisWeek,
    @Default(0) int sessionsThisMonth,
    @Default(0) int avgDurationMin,
    @Default(0) int streakWeeks,
    @Default(0) int adherence,
    @Default(0) int weeklyGoalDays,
    @Default(0) int completedThisWeek,
    @Default(<ProgressPoint>[]) List<ProgressPoint> progressSeries,
  }) = _DashboardSummary;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) =>
      _$DashboardSummaryFromJson(json);
}

@freezed
abstract class ProgressPoint with _$ProgressPoint {
  const factory ProgressPoint({
    @Default('') String date,
    @Default(0) int value,
  }) = _ProgressPoint;

  factory ProgressPoint.fromJson(Map<String, dynamic> json) =>
      _$ProgressPointFromJson(json);
}

/// `GET /me/records` → []PersonalRecord.
@freezed
abstract class PersonalRecord with _$PersonalRecord {
  const factory PersonalRecord({
    @Default('') String exerciseName,
    @Default(0) double bestWeightKg,
    @Default(0) int bestReps,
    @JsonKey(name: 'est1rm') @Default(0) int est1rm,
    @Default('') String achievedAt,
  }) = _PersonalRecord;

  factory PersonalRecord.fromJson(Map<String, dynamic> json) =>
      _$PersonalRecordFromJson(json);
}
