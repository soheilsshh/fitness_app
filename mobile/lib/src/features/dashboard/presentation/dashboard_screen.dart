import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../../tracking/data/tracking_models.dart';
import '../application/dashboard_bundle.dart';
import '../data/dashboard_models.dart';

const _dayLabels = {
  1: 'شنبه',
  2: 'یکشنبه',
  3: 'دوشنبه',
  4: 'سه‌شنبه',
  5: 'چهارشنبه',
  6: 'پنجشنبه',
  7: 'جمعه',
};

int _todayDayNumber() {
  // Match web: Persian week Sat=1 … Fri=7 (JS getDay mapping).
  final jsDay = DateTime.now().weekday % 7; // Sun=0 … Sat=6
  return ((jsDay + 1) % 7) + 1;
}

String _dueLabel(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final due = DateTime.tryParse(iso);
  if (due == null) return '—';
  final days = due.difference(DateTime.now()).inDays;
  if (days > 0) return '$days روز مانده';
  if (days == 0) return 'امروز';
  return '${days.abs()} روز گذشته';
}

String _timeAgo(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  final then = DateTime.tryParse(iso);
  if (then == null) return '';
  final diff = DateTime.now().difference(then);
  if (diff.inMinutes < 60) return '${diff.inMinutes} دقیقه پیش';
  if (diff.inHours < 24) return '${diff.inHours} ساعت پیش';
  return '${diff.inDays} روز پیش';
}

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(dashboardBundleProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('خانه')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(dashboardBundleProvider.future),
        child: AsyncValueWidget<DashboardBundle>(
          value: async,
          onRetry: () => ref.invalidate(dashboardBundleProvider),
          data: (d) => _DashboardBody(data: d),
        ),
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody({required this.data});
  final DashboardBundle data;

  @override
  Widget build(BuildContext context) {
    final firstName =
        data.profile.firstName.isEmpty ? 'ورزشکار' : data.profile.firstName;
    final s = data.summary;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'سلام $firstName',
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
        Text(
          'امروز ${JalaliDates.longFromDate(DateTime.now())}',
          style: const TextStyle(color: AppColors.muted),
        ),
        const SizedBox(height: 16),
        if (data.profile.progress.percent < 100)
          _ProfileBoostCard(progress: data.profile.progress),
        if (data.tracking?.alerts.isNotEmpty == true) ...[
          const SizedBox(height: 12),
          ...data.tracking!.alerts.map(
            (a) => Card(
              color: Colors.amber.withValues(alpha: 0.12),
              child: ListTile(
                leading: const Icon(Icons.warning_amber_rounded),
                title: Text(a.message),
              ),
            ),
          ),
        ],
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.35,
          children: [
            _StatCard(
              label: 'جلسات این هفته',
              value: '${s.sessionsThisWeek}',
              sub: s.streakWeeks > 0
                  ? '${s.streakWeeks} هفته متوالی'
                  : 'این هفته شروع کن',
              icon: Icons.calendar_today,
            ),
            _StatCard(
              label: 'پایبندی',
              value: '${s.adherence}٪',
              sub: s.weeklyGoalDays > 0
                  ? '${s.completedThisWeek} از ${s.weeklyGoalDays} روز'
                  : 'برنامه‌ای فعال نیست',
              icon: Icons.trending_up,
            ),
            _StatCard(
              label: 'میانگین مدت',
              value: '${s.avgDurationMin}د',
              sub: 'میانگین کل تمرین‌ها',
              icon: Icons.timer_outlined,
            ),
            _StatCard(
              label: 'کل جلسات',
              value: '${s.totalSessions}',
              sub: '${s.sessionsThisMonth} جلسه این ماه',
              icon: Icons.fitness_center,
            ),
          ],
        ),
        const SizedBox(height: 16),
        _Section(
          title: 'هدف هفتگی',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LinearProgressIndicator(
                value: s.weeklyGoalDays == 0
                    ? 0
                    : (s.completedThisWeek / s.weeklyGoalDays).clamp(0, 1),
                minHeight: 10,
                borderRadius: BorderRadius.circular(8),
              ),
              const SizedBox(height: 8),
              Text(
                '${s.completedThisWeek} از ${s.weeklyGoalDays} روز · استریک ${s.streakWeeks} هفته',
                style: const TextStyle(color: AppColors.muted, fontSize: 13),
              ),
            ],
          ),
        ),
        if (s.progressSeries.isNotEmpty) ...[
          const SizedBox(height: 12),
          _Section(
            title: 'روند فعالیت (۳۰ روز)',
            child: _MiniBars(points: s.progressSeries),
          ),
        ],
        const SizedBox(height: 12),
        _GoalCard(profile: data.profile, tracking: data.tracking),
        const SizedBox(height: 12),
        _CheckinCard(tracking: data.tracking),
        const SizedBox(height: 12),
        _TodayPlanCard(program: data.program),
        const SizedBox(height: 12),
        _RecordsCard(records: data.records),
        const SizedBox(height: 12),
        _RecentSessionsCard(items: data.history),
        const SizedBox(height: 12),
        _SubscriptionCard(sub: data.subscription),
        if (data.tracking?.weightHistory.isNotEmpty == true) ...[
          const SizedBox(height: 12),
          _Section(
            title: 'روند وزن',
            child: _WeightSparkline(points: data.tracking!.weightHistory),
          ),
        ],
        const SizedBox(height: 16),
        const Text('دسترسی سریع',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ActionChip(
              avatar: const Icon(Icons.school_outlined, size: 18),
              label: const Text('آموزش'),
              onPressed: () => context.push('/student/academy'),
            ),
            ActionChip(
              avatar: const Icon(Icons.help_outline, size: 18),
              label: const Text('سوالات'),
              onPressed: () => context.push('/student/faq'),
            ),
            ActionChip(
              avatar: const Icon(Icons.auto_awesome, size: 18),
              label: const Text('دستیار AI'),
              onPressed: () => context.push('/student/ai'),
            ),
            ActionChip(
              avatar: const Icon(Icons.shopping_bag_outlined, size: 18),
              label: const Text('خرید پلن'),
              onPressed: () => context.push('/student/subscribe'),
            ),
            ActionChip(
              avatar: const Icon(Icons.storefront_outlined, size: 18),
              label: const Text('مربی‌ها'),
              onPressed: () => context.push('/student/coaches'),
            ),
          ],
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    this.sub,
  });

  final String label;
  final String value;
  final IconData icon;
  final String? sub;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(label,
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12)),
                ),
                Icon(icon, color: AppColors.primary, size: 18),
              ],
            ),
            const Spacer(),
            Text(value,
                style:
                    const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            if (sub != null)
              Text(sub!,
                  style:
                      const TextStyle(color: AppColors.muted, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _ProfileBoostCard extends StatelessWidget {
  const _ProfileBoostCard({required this.progress});
  final ProfileProgress progress;

  @override
  Widget build(BuildContext context) {
    final items = [
      ('نام و هدف', progress.essentials),
      ('قد، وزن و بدن', progress.body),
      ('سوابق پزشکی', progress.medical),
      ('عکس‌های بدن', progress.photos),
    ];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('تکمیل پروفایل — ${progress.percent}٪',
                style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text(
              'هر بخش را کامل کنید تا مربی برنامه دقیق‌تری بسازد.',
              style: TextStyle(color: AppColors.muted, fontSize: 12),
            ),
            const SizedBox(height: 10),
            LinearProgressIndicator(
              value: (progress.percent / 100).clamp(0, 1),
              minHeight: 8,
              borderRadius: BorderRadius.circular(8),
            ),
            const SizedBox(height: 12),
            ...items.map(
              (e) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  e.$2 ? Icons.check_circle : Icons.circle_outlined,
                  color: e.$2 ? Colors.green : AppColors.muted,
                ),
                title: Text(e.$1),
                trailing: e.$2
                    ? null
                    : const Icon(Icons.chevron_left, size: 18),
                onTap: e.$2
                    ? null
                    : () {
                        // Account tab / profile edit is inside shell; push nothing —
                        // user opens حساب من. Snack hint:
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'از تب «حساب من» پروفایل را تکمیل کنید.',
                            ),
                          ),
                        );
                      },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard({required this.profile, required this.tracking});
  final DashboardProfileBrief profile;
  final TrackingStatus? tracking;

  @override
  Widget build(BuildContext context) {
    final current = tracking?.lastWeightKg ?? profile.weightKg;
    final target = profile.targetWeightKg;
    final height = profile.heightCm;
    double? bmi;
    if (current != null && height != null && height > 0) {
      bmi = current / ((height / 100) * (height / 100));
    }
    final history = tracking?.weightHistory ?? const <WeightPoint>[];
    int? pct;
    if (history.length >= 2 && target != null && current != null) {
      final start = history.first.weight;
      final total = (start - target).abs();
      final done = (start - current).abs();
      if (total > 0) pct = ((done / total) * 100).round().clamp(0, 100);
    }

    return _Section(
      title: 'هدف وزن',
      child: current == null || target == null
          ? const Text('وزن فعلی یا هدف ثبت نشده است.',
              style: TextStyle(color: AppColors.muted))
          : Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('وزن فعلی',
                            style: TextStyle(
                                color: AppColors.muted, fontSize: 12)),
                        Text('${current.toStringAsFixed(1)} کیلوگرم',
                            style: const TextStyle(
                                fontSize: 20, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('هدف',
                            style: TextStyle(
                                color: AppColors.muted, fontSize: 12)),
                        Text('${target.toStringAsFixed(1)} کیلوگرم',
                            style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.green)),
                      ],
                    ),
                  ],
                ),
                if (pct != null) ...[
                  const SizedBox(height: 12),
                  LinearProgressIndicator(
                    value: pct / 100,
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.green,
                  ),
                  const SizedBox(height: 6),
                  Text('$pct٪ مسیر تا هدف طی شده',
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12)),
                ],
                if (bmi != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('BMI',
                          style: TextStyle(color: AppColors.muted)),
                      Text(bmi.toStringAsFixed(1),
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ],
            ),
    );
  }
}

class _CheckinCard extends StatelessWidget {
  const _CheckinCard({required this.tracking});
  final TrackingStatus? tracking;

  @override
  Widget build(BuildContext context) {
    final t = tracking;
    final photos = t?.photosSubmitted ?? {};
    final allPhotos =
        photos.isNotEmpty && photos.values.every((v) => v);
    return _Section(
      title: 'کارهای پایش این دوره',
      child: t == null
          ? const Text('اشتراک فعالی برای پایش یافت نشد.',
              style: TextStyle(color: AppColors.muted))
          : Column(
              children: [
                _TaskRow(done: t.weightSubmitted, label: 'ثبت وزن این دوره'),
                _TaskRow(
                    done: allPhotos,
                    label: 'آپلود عکس‌های پایش (جلو، بغل، پشت)'),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('مهلت چک‌این بعدی',
                        style: TextStyle(color: AppColors.muted)),
                    Chip(
                      label: Text(_dueLabel(t.nextDueDate)),
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}

class _TaskRow extends StatelessWidget {
  const _TaskRow({required this.done, required this.label});
  final bool done;
  final String label;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        done ? Icons.check_circle : Icons.circle_outlined,
        color: done ? Colors.green : AppColors.muted,
      ),
      title: Text(
        label,
        style: TextStyle(
          decoration: done ? TextDecoration.lineThrough : null,
          color: done ? AppColors.muted : null,
        ),
      ),
    );
  }
}

class _TodayPlanCard extends StatelessWidget {
  const _TodayPlanCard({required this.program});
  final DashboardProgram program;

  @override
  Widget build(BuildContext context) {
    final num = _todayDayNumber();
    final todays =
        program.items.where((e) => e.dayNumber == num).toList();
    final trainingDays =
        program.items.map((e) => e.dayNumber).toSet().toList()..sort();

    return _Section(
      title: 'تمرین امروز',
      child: program.items.isEmpty
          ? const Text('برنامه تمرینی فعالی ندارید.',
              style: TextStyle(color: AppColors.muted))
          : todays.isEmpty
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'امروز (${_dayLabels[num] ?? ''}) روز استراحت است.',
                      style: const TextStyle(color: AppColors.muted),
                    ),
                    if (trainingDays.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        children: trainingDays
                            .map((d) => Chip(
                                  label: Text(_dayLabels[d] ?? 'روز $d'),
                                  visualDensity: VisualDensity.compact,
                                ))
                            .toList(),
                      ),
                    ],
                  ],
                )
              : Column(
                  children: todays
                      .map(
                        (e) => ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          title: Text(e.exercise),
                          trailing: Text('${e.sets} ست × ${e.reps}',
                              style: const TextStyle(
                                  color: AppColors.muted, fontSize: 12)),
                        ),
                      )
                      .toList(),
                ),
    );
  }
}

class _RecordsCard extends StatelessWidget {
  const _RecordsCard({required this.records});
  final List<PersonalRecord> records;

  @override
  Widget build(BuildContext context) {
    final max = records.fold<int>(1, (m, r) => r.est1rm > m ? r.est1rm : m);
    return _Section(
      title: 'رکوردهای شخصی',
      child: records.isEmpty
          ? const EmptyView(message: 'هنوز رکوردی ثبت نشده است.')
          : Column(
              children: records
                  .map(
                    (r) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: Text(r.exerciseName)),
                              Text(
                                '${r.bestWeightKg}kg × ${r.bestReps}',
                                style: const TextStyle(
                                    color: AppColors.muted, fontSize: 12),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          LinearProgressIndicator(
                            value: (r.est1rm / max).clamp(0, 1),
                            minHeight: 6,
                            borderRadius: BorderRadius.circular(6),
                            color: Colors.amber,
                          ),
                          const SizedBox(height: 4),
                          Text('1RM ${r.est1rm}',
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.amber)),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class _RecentSessionsCard extends StatelessWidget {
  const _RecentSessionsCard({required this.items});
  final List<RecentSession> items;

  @override
  Widget build(BuildContext context) {
    return _Section(
      title: 'جلسات اخیر',
      child: items.isEmpty
          ? const Text('هنوز جلسه‌ای ثبت نکرده‌اید.',
              style: TextStyle(color: AppColors.muted))
          : Column(
              children: items
                  .map(
                    (s) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const CircleAvatar(
                        child: Icon(Icons.fitness_center, size: 18),
                      ),
                      title: Text(
                        '${s.programTitle.isEmpty ? 'تمرین' : s.programTitle} — ${s.dayLabel}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(_timeAgo(s.completedAt)),
                      trailing: Text('${s.durationMin}د'),
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class _SubscriptionCard extends StatelessWidget {
  const _SubscriptionCard({required this.sub});
  final DashboardSubscription? sub;

  @override
  Widget build(BuildContext context) {
    int? remaining;
    int? pctUsed;
    if (sub?.endsAt != null) {
      final ends = DateTime.tryParse(sub!.endsAt!);
      if (ends != null) {
        remaining = ends.difference(DateTime.now()).inDays.clamp(0, 9999);
        final total = sub!.durationDays;
        if (total > 0) {
          pctUsed =
              (((total - remaining) / total) * 100).round().clamp(0, 100);
        }
      }
    }

    return _Section(
      title: 'اشتراک من',
      child: sub == null
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('اشتراک فعالی ندارید.',
                    style: TextStyle(color: AppColors.muted)),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () => context.push('/student/subscribe'),
                  child: const Text('خرید پلن'),
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        sub!.planName.isEmpty ? 'اشتراک' : sub!.planName,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    Chip(
                      label: Text(sub!.planType == 'both'
                          ? 'تمرین + تغذیه'
                          : sub!.planType),
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${remaining ?? 0} روز باقی‌مانده',
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold),
                ),
                if (pctUsed != null) ...[
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: pctUsed / 100,
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.green,
                  ),
                  const SizedBox(height: 4),
                  Text('$pctUsed٪ از دوره سپری شده',
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12)),
                ],
              ],
            ),
    );
  }
}

class _MiniBars extends StatelessWidget {
  const _MiniBars({required this.points});
  final List<ProgressPoint> points;

  @override
  Widget build(BuildContext context) {
    final recent = points.length > 14 ? points.sublist(points.length - 14) : points;
    final max = recent.fold<int>(1, (m, p) => p.value > m ? p.value : m);
    return SizedBox(
      height: 120,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (final p in recent)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Container(
                  height: 16 + (90 * (p.value / max)),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _WeightSparkline extends StatelessWidget {
  const _WeightSparkline({required this.points});
  final List<WeightPoint> points;

  @override
  Widget build(BuildContext context) {
    final recent = points.length > 12 ? points.sublist(points.length - 12) : points;
    final weights = recent.map((e) => e.weight).toList();
    final min = weights.reduce((a, b) => a < b ? a : b);
    final max = weights.reduce((a, b) => a > b ? a : b);
    final span = (max - min).abs() < 0.01 ? 1.0 : (max - min);

    return SizedBox(
      height: 100,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (final w in weights)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Container(
                  height: 20 + (70 * ((w - min) / span)),
                  decoration: BoxDecoration(
                    color: Colors.teal.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
