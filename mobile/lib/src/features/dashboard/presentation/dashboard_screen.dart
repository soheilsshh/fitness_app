import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../application/dashboard_controller.dart';
import '../data/dashboard_models.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(dashboardDataProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('داشبورد')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(dashboardDataProvider.future),
        child: AsyncValueWidget<DashboardData>(
          value: async,
          onRetry: () => ref.invalidate(dashboardDataProvider),
          data: (d) => _Content(summary: d.summary, records: d.records),
        ),
      ),
    );
  }
}

class _Content extends StatelessWidget {
  const _Content({required this.summary, required this.records});

  final DashboardSummary summary;
  final List<PersonalRecord> records;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            _StatCard(
              label: 'جلسات این هفته',
              value: '${summary.sessionsThisWeek}',
              icon: Icons.calendar_today,
            ),
            _StatCard(
              label: 'کل جلسات',
              value: '${summary.totalSessions}',
              icon: Icons.fitness_center,
            ),
            _StatCard(
              label: 'پایبندی',
              value: '${summary.adherence}٪',
              icon: Icons.trending_up,
            ),
            _StatCard(
              label: 'رکورد هفتگی (هفته)',
              value: '${summary.streakWeeks}',
              icon: Icons.local_fire_department,
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('هدف هفتگی',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                LinearProgressIndicator(
                  value: summary.weeklyGoalDays == 0
                      ? 0
                      : (summary.completedThisWeek / summary.weeklyGoalDays)
                          .clamp(0, 1),
                  minHeight: 10,
                  borderRadius: BorderRadius.circular(8),
                  backgroundColor: AppColors.surfaceVariant,
                ),
                const SizedBox(height: 8),
                Text(
                  '${summary.completedThisWeek} از ${summary.weeklyGoalDays} روز',
                  style: const TextStyle(color: AppColors.muted),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text('رکوردهای شخصی',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        if (records.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: EmptyView(message: 'هنوز رکوردی ثبت نشده است.'),
          )
        else
          ...records.map(
            (r) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(Icons.emoji_events, color: AppColors.primary),
                title: Text(r.exerciseName),
                subtitle: Text('${r.bestWeightKg} کیلوگرم × ${r.bestReps}'),
                trailing: Text('1RM ${r.est1rm}'),
              ),
            ),
          ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: AppColors.primary),
            const Spacer(),
            Text(value,
                style: const TextStyle(
                    fontSize: 22, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
