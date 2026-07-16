import 'package:freezed_annotation/freezed_annotation.dart';

part 'coach_dashboard_models.freezed.dart';
part 'coach_dashboard_models.g.dart';

/// `GET /coach/dashboard/stats`.
@freezed
abstract class CoachStats with _$CoachStats {
  const factory CoachStats({
    @Default(0) int totalStudents,
    @Default(0) int activeSubscriptions,
    @Default(0) int monthlySales,
    @Default(0) int completedSessions,
    @Default(0) int programAdherence,
  }) = _CoachStats;

  factory CoachStats.fromJson(Map<String, dynamic> json) =>
      _$CoachStatsFromJson(json);
}

/// `GET /coach/dashboard/recent-students`.
@freezed
abstract class CoachRecentStudent with _$CoachRecentStudent {
  const factory CoachRecentStudent({
    @Default(0) int studentId,
    @Default('') String fullName,
    @Default('') String joinedAt,
  }) = _CoachRecentStudent;

  factory CoachRecentStudent.fromJson(Map<String, dynamic> json) =>
      _$CoachRecentStudentFromJson(json);
}

class CoachTopStudent {
  const CoachTopStudent({
    required this.studentId,
    required this.fullName,
    required this.adherence,
  });

  final int studentId;
  final String fullName;
  final int adherence;

  factory CoachTopStudent.fromJson(Map<String, dynamic> json) =>
      CoachTopStudent(
        studentId: (json['studentId'] as num?)?.toInt() ?? 0,
        fullName: json['fullName'] as String? ?? '',
        adherence: (json['adherence'] as num?)?.toInt() ?? 0,
      );
}

class CoachProgressPoint {
  const CoachProgressPoint({required this.date, required this.value});

  final String date;
  final int value;

  factory CoachProgressPoint.fromJson(Map<String, dynamic> json) =>
      CoachProgressPoint(
        date: json['date'] as String? ?? '',
        value: (json['value'] as num?)?.toInt() ?? 0,
      );
}
