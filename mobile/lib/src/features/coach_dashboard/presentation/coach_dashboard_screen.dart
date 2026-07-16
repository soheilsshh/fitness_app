import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../../coach_notifications/presentation/coach_notifications_screen.dart';
import '../data/coach_dashboard_extras.dart';
import '../data/coach_dashboard_models.dart';
import '../data/coach_dashboard_repository.dart';

class CoachDashboardScreen extends ConsumerWidget {
  const CoachDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachDashboardDataProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('داشبورد مربی'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/coach/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(coachDashboardExtrasProvider);
          await ref.refresh(coachDashboardDataProvider.future);
        },
        child: AsyncValueWidget<CoachDashboardData>(
          value: async,
          onRetry: () => ref.invalidate(coachDashboardDataProvider),
          data: (d) => _Body(stats: d.stats, recent: d.recent),
        ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.stats, required this.recent});
  final CoachStats stats;
  final List<CoachRecentStudent> recent;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final extras = ref.watch(coachDashboardExtrasProvider);

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
        const CoachNotificationsPreview(),
        const SizedBox(height: 16),
        extras.when(
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
          data: (e) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (e.attention.isNotEmpty) ...[
                Row(
                  children: [
                    const Text('نیاز به توجه',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    TextButton(
                      onPressed: () => context.push('/coach/tracking'),
                      child: const Text('پایش'),
                    ),
                  ],
                ),
                ...e.attention.take(5).map(
                      (s) => Card(
                        color: AppColors.destructive.withValues(alpha: 0.08),
                        margin: const EdgeInsets.only(bottom: 6),
                        child: ListTile(
                          leading: const Icon(Icons.warning_amber,
                              color: AppColors.destructive),
                          title: Text(s.fullName),
                          subtitle: Text(
                            s.alerts.isNotEmpty
                                ? s.alerts.first.message
                                : 'تأخیر در ثبت وزن/عکس',
                          ),
                          onTap: () =>
                              context.push('/coach/tracking/${s.id}'),
                        ),
                      ),
                    ),
                const SizedBox(height: 12),
              ],
              if (e.top.isNotEmpty) ...[
                const Text('برترین شاگردان',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...e.top.map(
                  (s) => Card(
                    margin: const EdgeInsets.only(bottom: 6),
                    child: ListTile(
                      leading: const Icon(Icons.emoji_events,
                          color: AppColors.primary),
                      title: Text(s.fullName),
                      trailing: Text('${s.adherence}٪',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      onTap: () =>
                          context.push('/coach/students/${s.studentId}'),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (e.series.isNotEmpty) ...[
                const Text('روند جلسات (۳۰ روز)',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: e.series.reversed
                          .take(7)
                          .map(
                            (p) => ListTile(
                              dense: true,
                              title: Text(p.date),
                              trailing: Text('${p.value} جلسه'),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ],
          ),
        ),
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
                onTap: () => context.push('/coach/students/${s.studentId}'),
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
