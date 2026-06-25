// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'coach_dashboard_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CoachStats _$CoachStatsFromJson(Map<String, dynamic> json) => _CoachStats(
  totalStudents: (json['totalStudents'] as num?)?.toInt() ?? 0,
  activeSubscriptions: (json['activeSubscriptions'] as num?)?.toInt() ?? 0,
  monthlySales: (json['monthlySales'] as num?)?.toInt() ?? 0,
  completedSessions: (json['completedSessions'] as num?)?.toInt() ?? 0,
  programAdherence: (json['programAdherence'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$CoachStatsToJson(_CoachStats instance) =>
    <String, dynamic>{
      'totalStudents': instance.totalStudents,
      'activeSubscriptions': instance.activeSubscriptions,
      'monthlySales': instance.monthlySales,
      'completedSessions': instance.completedSessions,
      'programAdherence': instance.programAdherence,
    };

_CoachRecentStudent _$CoachRecentStudentFromJson(Map<String, dynamic> json) =>
    _CoachRecentStudent(
      studentId: (json['studentId'] as num?)?.toInt() ?? 0,
      fullName: json['fullName'] as String? ?? '',
      joinedAt: json['joinedAt'] as String? ?? '',
    );

Map<String, dynamic> _$CoachRecentStudentToJson(_CoachRecentStudent instance) =>
    <String, dynamic>{
      'studentId': instance.studentId,
      'fullName': instance.fullName,
      'joinedAt': instance.joinedAt,
    };
