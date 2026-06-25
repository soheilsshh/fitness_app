import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../application/food_diary_controller.dart';
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
              onRefresh: () async => ref.refresh(dailyDiaryProvider.future),
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
          // RTL: "previous day" is the right-pointing chevron.
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
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        _TotalsCard(totals: day.totals),
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
                  subtitle: Text(log.quantity,
                      style: const TextStyle(color: AppColors.muted)),
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
  const _TotalsCard({required this.totals});
  final MacroTotals totals;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text('${totals.calories.round()}',
                style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary)),
            const Text('کالری کل', style: TextStyle(color: AppColors.muted)),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _macro('پروتئین', totals.protein),
                _macro('کربوهیدرات', totals.carbs),
                _macro('چربی', totals.fat),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _macro(String label, double grams) {
    return Column(
      children: [
        Text('${grams.round()} گرم',
            style: const TextStyle(fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      ],
    );
  }
}
