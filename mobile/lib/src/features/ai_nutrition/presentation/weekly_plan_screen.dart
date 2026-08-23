import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../application/daily_plan_controller.dart' show kDailyGoalOptions, kRegenerateReasons;
import '../application/weekly_plan_controller.dart';
import '../data/ai_nutrition_models.dart';

/// "📅 برنامه هفتگی" — Phase 3: goal → 7-day AI plan → day tabs → per-meal
/// regenerate → confirm/save. Mirrors web `WeeklyPlanClient.jsx`.
class WeeklyPlanScreen extends ConsumerWidget {
  const WeeklyPlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(weeklyPlanControllerProvider);
    final notifier = ref.read(weeklyPlanControllerProvider.notifier);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          const FitinoPageHeader(
            title: '📅 برنامه هفتگی با AI',
            description: 'برنامه غذایی ۷ روز آینده، متناسب با هدفت.',
          ),
          const SizedBox(height: 16),
          if (state.plan == null)
            _GoalPicker(state: state, notifier: notifier)
          else
            _WeekView(state: state, notifier: notifier),
        ],
      ),
    );
  }
}

class _GoalPicker extends StatelessWidget {
  const _GoalPicker({required this.state, required this.notifier});
  final WeeklyPlanState state;
  final WeeklyPlanController notifier;

  @override
  Widget build(BuildContext context) {
    return FitinoPanelCard(
      title: 'هدف',
      icon: Icons.flag_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final g in kDailyGoalOptions)
                FitinoChoiceChip(
                  label: g.label,
                  selected: state.goal == g.value,
                  onSelected: (_) => notifier.setGoal(g.value),
                ),
            ],
          ),
          if (state.error != null) ...[
            const SizedBox(height: 10),
            Text(state.error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12.5)),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: state.goal.isEmpty || state.loading ? null : notifier.generate,
              child: state.loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('برنامه هفتگی را بساز'),
            ),
          ),
        ],
      ),
    );
  }
}

class _WeekView extends StatelessWidget {
  const _WeekView({required this.state, required this.notifier});
  final WeeklyPlanState state;
  final WeeklyPlanController notifier;

  @override
  Widget build(BuildContext context) {
    final plan = state.plan!;
    final targets = state.targets;
    final day = plan.days[state.selectedDay];

    return Column(
      children: [
        FitinoPanelCard(
          title: 'هدف روزانه',
          icon: Icons.flag_circle_outlined,
          child: Wrap(
            spacing: 8,
            children: [
              if (targets != null)
                Chip(label: Text('${targets.targetCalories} kcal')),
              if (targets != null && targets.proteinG > 0)
                Chip(label: Text('پروتئین ${targets.proteinG}g')),
            ],
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: plan.days.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) => FitinoChoiceChip(
              label: plan.days[i].dayName,
              selected: state.selectedDay == i,
              onSelected: (_) => notifier.selectDay(i),
            ),
          ),
        ),
        const SizedBox(height: 10),
        for (var mealIndex = 0; mealIndex < day.meals.length; mealIndex++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _MealCard(
              meal: day.meals[mealIndex],
              regenerating: state.regeneratingDay == state.selectedDay &&
                  state.regeneratingMeal == mealIndex,
              onRegenerate: () => _openRegenerateSheet(
                context,
                notifier,
                state.selectedDay,
                mealIndex,
                day.meals[mealIndex].name,
              ),
            ),
          ),
        const SizedBox(height: 4),
        _WeekSummaryCard(state: state, notifier: notifier),
      ],
    );
  }

  void _openRegenerateSheet(
    BuildContext context,
    WeeklyPlanController notifier,
    int dayIndex,
    int mealIndex,
    String mealName,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => _RegenerateMealSheet(
        mealName: mealName,
        onConfirm: (reason) {
          Navigator.of(context).pop();
          notifier.regenerateMeal(dayIndex, mealIndex, reason);
        },
      ),
    );
  }
}

class _MealCard extends StatelessWidget {
  const _MealCard({required this.meal, required this.regenerating, required this.onRegenerate});
  final NutritionMeal meal;
  final bool regenerating;
  final VoidCallback onRegenerate;

  @override
  Widget build(BuildContext context) {
    return FitinoPanelCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(meal.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              ),
              Text('${meal.calories.round()} kcal',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          for (final item in meal.items)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.foodName, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                          Text(
                            [
                              if (item.amountG > 0) '${item.amountG.toStringAsFixed(0)} گرم',
                              if (item.servingLabel.isNotEmpty) item.servingLabel,
                            ].join(' · '),
                            style: const TextStyle(fontSize: 10.5, color: AppColors.muted),
                          ),
                        ],
                      ),
                    ),
                    Text('${item.calories} kcal', style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: regenerating ? null : onRegenerate,
              icon: regenerating
                  ? const SizedBox(
                      width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('تغییر این وعده', style: TextStyle(fontSize: 12.5)),
            ),
          ),
        ],
      ),
    );
  }
}

class _WeekSummaryCard extends StatelessWidget {
  const _WeekSummaryCard({required this.state, required this.notifier});
  final WeeklyPlanState state;
  final WeeklyPlanController notifier;

  @override
  Widget build(BuildContext context) {
    final plan = state.plan!;
    return FitinoPanelCard(
      title: 'جمع هفته',
      icon: Icons.pie_chart_outline_rounded,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: _Stat(label: 'کیلوکالری', value: '${plan.liveCalories.round()}')),
              const SizedBox(width: 8),
              Expanded(child: _Stat(label: 'پروتئین', value: '${plan.liveProtein.round()}g')),
              const SizedBox(width: 8),
              Expanded(child: _Stat(label: 'کربو', value: '${plan.liveCarbs.round()}g')),
              const SizedBox(width: 8),
              Expanded(child: _Stat(label: 'چربی', value: '${plan.liveFat.round()}g')),
            ],
          ),
          if (state.error != null) ...[
            const SizedBox(height: 10),
            Text(state.error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12.5)),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: state.confirming || state.confirmed ? null : notifier.confirmPlan,
              icon: state.confirming
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.check_rounded, size: 18),
              label: Text(state.confirmed
                  ? 'برای تأیید مربی ارسال شد'
                  : state.confirming
                      ? 'در حال ارسال...'
                      : 'تأیید برنامه'),
            ),
          ),
          if (state.confirmed) ...[
            const SizedBox(height: 8),
            const Text(
              'برنامه برای مربی‌ات ارسال شد و بعد از تأییدش می‌توانی از وب فعالش کنی.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: AppColors.muted),
            ),
          ],
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 10.5)),
        ],
      ),
    );
  }
}

class _RegenerateMealSheet extends StatefulWidget {
  const _RegenerateMealSheet({required this.mealName, required this.onConfirm});
  final String mealName;
  final ValueChanged<String> onConfirm;

  @override
  State<_RegenerateMealSheet> createState() => _RegenerateMealSheetState();
}

class _RegenerateMealSheetState extends State<_RegenerateMealSheet> {
  String? _selectedReason;
  final _customController = TextEditingController();

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('چرا می‌خواهی «${widget.mealName}» را تغییر بدهی؟',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final reason in kRegenerateReasons)
                FitinoChoiceChip(
                  label: reason,
                  selected: _selectedReason == reason,
                  onSelected: (v) => setState(() => _selectedReason = v ? reason : null),
                ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _customController,
            minLines: 2,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'مثلاً: مرغ ندارم، با تخم‌مرغ جایگزینش کن.',
              filled: true,
              fillColor: AppColors.surfaceVariant,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: (_selectedReason == null && _customController.text.trim().isEmpty)
                  ? null
                  : () {
                      final reason = [_selectedReason, _customController.text.trim()]
                          .where((s) => s != null && s.isNotEmpty)
                          .join(' — ');
                      widget.onConfirm(reason);
                    },
              child: const Text('غذای دیگری پیشنهاد بده'),
            ),
          ),
        ],
      ),
    );
  }
}
