// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_DashboardSummary _$DashboardSummaryFromJson(Map<String, dynamic> json) =>
    _DashboardSummary(
      totalSessions: (json['totalSessions'] as num?)?.toInt() ?? 0,
      sessionsThisWeek: (json['sessionsThisWeek'] as num?)?.toInt() ?? 0,
      sessionsThisMonth: (json['sessionsThisMonth'] as num?)?.toInt() ?? 0,
      avgDurationMin: (json['avgDurationMin'] as num?)?.toInt() ?? 0,
      streakWeeks: (json['streakWeeks'] as num?)?.toInt() ?? 0,
      adherence: (json['adherence'] as num?)?.toInt() ?? 0,
      weeklyGoalDays: (json['weeklyGoalDays'] as num?)?.toInt() ?? 0,
      completedThisWeek: (json['completedThisWeek'] as num?)?.toInt() ?? 0,
      progressSeries:
          (json['progressSeries'] as List<dynamic>?)
              ?.map((e) => ProgressPoint.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <ProgressPoint>[],
    );

Map<String, dynamic> _$DashboardSummaryToJson(_DashboardSummary instance) =>
    <String, dynamic>{
      'totalSessions': instance.totalSessions,
      'sessionsThisWeek': instance.sessionsThisWeek,
      'sessionsThisMonth': instance.sessionsThisMonth,
      'avgDurationMin': instance.avgDurationMin,
      'streakWeeks': instance.streakWeeks,
      'adherence': instance.adherence,
      'weeklyGoalDays': instance.weeklyGoalDays,
      'completedThisWeek': instance.completedThisWeek,
      'progressSeries': instance.progressSeries,
    };

_ProgressPoint _$ProgressPointFromJson(Map<String, dynamic> json) =>
    _ProgressPoint(
      date: json['date'] as String? ?? '',
      value: (json['value'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$ProgressPointToJson(_ProgressPoint instance) =>
    <String, dynamic>{'date': instance.date, 'value': instance.value};

_PersonalRecord _$PersonalRecordFromJson(Map<String, dynamic> json) =>
    _PersonalRecord(
      exerciseName: json['exerciseName'] as String? ?? '',
      bestWeightKg: (json['bestWeightKg'] as num?)?.toDouble() ?? 0,
      bestReps: (json['bestReps'] as num?)?.toInt() ?? 0,
      est1rm: (json['est1rm'] as num?)?.toInt() ?? 0,
      achievedAt: json['achievedAt'] as String? ?? '',
    );

Map<String, dynamic> _$PersonalRecordToJson(_PersonalRecord instance) =>
    <String, dynamic>{
      'exerciseName': instance.exerciseName,
      'bestWeightKg': instance.bestWeightKg,
      'bestReps': instance.bestReps,
      'est1rm': instance.est1rm,
      'achievedAt': instance.achievedAt,
    };
