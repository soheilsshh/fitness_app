import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../data/dashboard_models.dart';
import '../data/dashboard_repository.dart';

part 'dashboard_controller.g.dart';

/// Bundles the dashboard summary and personal records into one async value.
typedef DashboardData = ({DashboardSummary summary, List<PersonalRecord> records});

@riverpod
Future<DashboardData> dashboardData(Ref ref) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  final summary = await repo.summary();
  final records = await repo.records();
  return (summary: summary, records: records);
}
