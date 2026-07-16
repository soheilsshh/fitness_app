import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../coach_tracking/data/coach_tracking_repository.dart';
import 'coach_dashboard_models.dart';
import 'coach_dashboard_repository.dart';

class CoachDashboardExtras {
  const CoachDashboardExtras({
    required this.top,
    required this.series,
    required this.attention,
  });

  final List<CoachTopStudent> top;
  final List<CoachProgressPoint> series;
  final List<CoachTrackingStudentItem> attention;
}

final coachDashboardExtrasProvider =
    FutureProvider.autoDispose<CoachDashboardExtras>((ref) async {
  final dash = ref.watch(coachDashboardRepositoryProvider);
  final tracking = ref.watch(coachTrackingRepositoryProvider);
  final results = await Future.wait([
    dash.topStudents(),
    dash.progressSeries(),
    tracking.list(),
  ]);
  final top = results[0] as List<CoachTopStudent>;
  final series = results[1] as List<CoachProgressPoint>;
  final all = results[2] as List<CoachTrackingStudentItem>;
  final attention = all
      .where((s) =>
          s.alerts.isNotEmpty || s.weightOverdue || s.photosOverdue)
      .toList();
  return CoachDashboardExtras(
    top: top,
    series: series,
    attention: attention,
  );
});
