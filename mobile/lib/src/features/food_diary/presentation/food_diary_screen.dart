import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../application/food_diary_controller.dart';
import '../application/nutrition_targets.dart';
import '../data/food_models.dart';
import 'add_food_sheet.dart';

class FoodDiaryScreen extends ConsumerWidget {
  const FoodDiaryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final date = ref.watch(selectedDiaryDateProvider);
    final async = ref.watch(dailyDiaryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('دفتر غذای روزانه')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: AppColors.surface,
          builder: (_) => const AddFoodSheet(),
        ),
        icon: const Icon(Icons.add),
        label: const Text('افزودن غذا'),
      ),
      body: Column(
        children: [
          _DateBar(date: date, ref: ref),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(nutritionTargetsProvider);
                await ref.refresh(dailyDiaryProvider.future);
              },
              child: AsyncValueWidget<DailyFoodLog>(
                value: async,
                onRetry: () => ref.invalidate(dailyDiaryProvider),
                data: (day) => _DiaryBody(day: day),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DateBar extends StatelessWidget {
  const _DateBar({required this.date, required this.ref});
  final DateTime date;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final notifier = ref.read(selectedDiaryDateProvider.notifier);
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: () => notifier.shift(-1),
            icon: const Icon(Icons.chevron_right),
          ),
          Column(
            children: [
              Text(JalaliDates.longFromDate(date),
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(JalaliDates.shortFromDate(date),
                  style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ],
          ),
          IconButton(
            onPressed: () => notifier.shift(1),
            icon: const Icon(Icons.chevron_left),
          ),
        ],
      ),
    );
  }
}

class _DiaryBody extends ConsumerWidget {
  const _DiaryBody({required this.day});
  final DailyFoodLog day;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final targetsAsync = ref.watch(nutritionTargetsProvider);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        targetsAsync.when(
          loading: () => _TotalsCard(
            totals: day.totals,
            targets: const NutritionTargets(),
            loadingTargets: true,
          ),
          error: (_, _) => _TotalsCard(
            totals: day.totals,
            targets: const NutritionTargets(),
          ),
          data: (targets) => _TotalsCard(
            totals: day.totals,
            targets: targets,
          ),
        ),
        const SizedBox(height: 16),
        if (day.items.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 40),
            child: EmptyView(message: 'برای این روز غذایی ثبت نشده است.'),
          )
        else
          ...day.items.map(
            (log) => Dismissible(
              key: ValueKey(log.id),
              direction: DismissDirection.endToStart,
              background: Container(
                color: AppColors.destructive,
                alignment: Alignment.centerLeft,
                padding: const EdgeInsets.only(left: 20),
                child: const Icon(Icons.delete, color: Colors.white),
              ),
              onDismissed: (_) =>
                  ref.read(foodDiaryActionsProvider.notifier).delete(log.id),
              child: Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(log.foodName),
                  subtitle: Text(
                    [
                      log.quantity,
                      if (log.protein > 0) 'P ${log.protein.round()}g',
                      if (log.carbs > 0) 'C ${log.carbs.round()}g',
                      if (log.fat > 0) 'F ${log.fat.round()}g',
                    ].where((s) => s.isNotEmpty).join(' · '),
                    style: const TextStyle(color: AppColors.muted),
                  ),
                  trailing: Text('${log.calories.round()} کالری'),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _TotalsCard extends StatelessWidget {
  const _TotalsCard({
    required this.totals,
    required this.targets,
    this.loadingTargets = false,
  });

  final MacroTotals totals;
  final NutritionTargets targets;
  final bool loadingTargets;

  @override
  Widget build(BuildContext context) {
    final calPct = targetProgressPercent(
      totals.calories,
      targets.caloriesTarget.toDouble(),
    );
    final proPct = targetProgressPercent(totals.protein, targets.proteinGrams);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.local_fire_department, color: AppColors.primary),
                SizedBox(width: 8),
                Text('خلاصه مصرف روز',
                    style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              loadingTargets
                  ? 'در حال بارگذاری اهداف...'
                  : targets.hasAny
                      ? 'مقایسه با اهداف برنامه غذایی مربی'
                      : 'اهداف رژیم هنوز توسط مربی تنظیم نشده است',
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                    child: _StatTile(
                        label: 'کالری',
                        value: '${totals.calories.round()}',
                        unit: 'kcal')),
                Expanded(
                    child: _StatTile(
                        label: 'پروتئین',
                        value: '${totals.protein.round()}',
                        unit: 'g')),
                Expanded(
                    child: _StatTile(
                        label: 'کربو',
                        value: '${totals.carbs.round()}',
                        unit: 'g')),
                Expanded(
                    child: _StatTile(
                        label: 'چربی',
                        value: '${totals.fat.round()}',
                        unit: 'g')),
              ],
            ),
            if (targets.caloriesTarget > 0) ...[
              const SizedBox(height: 16),
              _ProgressRow(
                label: 'کالری',
                current: totals.calories,
                target: targets.caloriesTarget.toDouble(),
                unit: 'kcal',
                percent: calPct,
              ),
            ],
            if (targets.proteinGrams > 0) ...[
              const SizedBox(height: 12),
              _ProgressRow(
                label: 'پروتئین',
                current: totals.protein,
                target: targets.proteinGrams,
                unit: 'g',
                percent: proPct,
                targetLabel: targets.proteinTarget,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.unit,
  });

  final String label;
  final String value;
  final String unit;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label,
            style: const TextStyle(color: AppColors.muted, fontSize: 11)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        Text(unit,
            style: const TextStyle(color: AppColors.muted, fontSize: 10)),
      ],
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({
    required this.label,
    required this.current,
    required this.target,
    required this.unit,
    required this.percent,
    this.targetLabel,
  });

  final String label;
  final double current;
  final double target;
  final String unit;
  final double? percent;
  final String? targetLabel;

  @override
  Widget build(BuildContext context) {
    final pct = (percent ?? 0) / 100;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            const Spacer(),
            Text(
              '${current.round()} / ${target.round()} $unit'
              '${percent != null ? ' · ${percent!.round()}٪' : ''}',
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ],
        ),
        if (targetLabel != null && targetLabel!.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(targetLabel!,
              style: const TextStyle(color: AppColors.muted, fontSize: 11)),
        ],
        const SizedBox(height: 6),
        LinearProgressIndicator(
          value: pct.clamp(0, 1),
          minHeight: 8,
          borderRadius: BorderRadius.circular(6),
          backgroundColor: AppColors.surfaceVariant,
        ),
      ],
    );
  }
}
