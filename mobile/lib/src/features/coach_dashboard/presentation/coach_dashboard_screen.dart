import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../data/coach_dashboard_models.dart';
import '../data/coach_dashboard_repository.dart';

class CoachDashboardScreen extends ConsumerWidget {
  const CoachDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachDashboardDataProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('داشبورد مربی')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(coachDashboardDataProvider.future),
        child: AsyncValueWidget<CoachDashboardData>(
          value: async,
          onRetry: () => ref.invalidate(coachDashboardDataProvider),
          data: (d) => _Body(stats: d.stats, recent: d.recent),
        ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.stats, required this.recent});
  final CoachStats stats;
  final List<CoachRecentStudent> recent;

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
            _stat('شاگردان', '${stats.totalStudents}', Icons.group),
            _stat('اشتراک فعال', '${stats.activeSubscriptions}', Icons.verified),
            _stat('فروش ماه', '${stats.monthlySales}', Icons.payments),
            _stat('پایبندی', '${stats.programAdherence}٪', Icons.trending_up),
          ],
        ),
        const SizedBox(height: 20),
        const Text('شاگردان اخیر',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        if (recent.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: EmptyView(message: 'شاگرد جدیدی نیست.'),
          )
        else
          ...recent.map(
            (s) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const CircleAvatar(child: Icon(Icons.person)),
                title: Text(s.fullName),
                subtitle: Text(s.joinedAt,
                    style: const TextStyle(color: AppColors.muted)),
              ),
            ),
          ),
      ],
    );
  }

  Widget _stat(String label, String value, IconData icon) {
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
            Text(label,
                style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
