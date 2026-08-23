import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../application/daily_plan_controller.dart';
import '../data/ai_nutrition_models.dart';

/// "☀️ برنامه روزانه" — Phase 2: goal → full-day AI plan → per-meal
/// regenerate → confirm/save. Mirrors web `DailyPlanClient.jsx`.
class DailyPlanScreen extends ConsumerWidget {
  const DailyPlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(dailyPlanControllerProvider);
    final notifier = ref.read(dailyPlanControllerProvider.notifier);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          const FitinoPageHeader(
            title: '☀️ برنامه روزانه با AI',
            description: 'یک برنامه کامل غذایی برای امروز، متناسب با هدفت.',
          ),
          const SizedBox(height: 16),
          if (state.plan == null)
            _GoalPicker(state: state, notifier: notifier)
          else
            _PlanView(state: state, notifier: notifier),
        ],
      ),
    );
  }
}

class _GoalPicker extends StatelessWidget {
  const _GoalPicker({required this.state, required this.notifier});
  final DailyPlanState state;
  final DailyPlanController notifier;

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
                  : const Text('برنامه امروز را بساز'),
            ),
          ),
        ],
      ),
    );
  }
}

class _PlanView extends StatelessWidget {
  const _PlanView({required this.state, required this.notifier});
  final DailyPlanState state;
  final DailyPlanController notifier;

  @override
  Widget build(BuildContext context) {
    final plan = state.plan!;
    return Column(
      children: [
        for (var i = 0; i < plan.meals.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _MealCard(
              meal: plan.meals[i],
              regenerating: state.regeneratingMealIndex == i,
              onRegenerate: () => _openRegenerateSheet(context, notifier, i, plan.meals[i].name),
            ),
          ),
        const SizedBox(height: 4),
        _SummaryCard(state: state, notifier: notifier),
      ],
    );
  }

  void _openRegenerateSheet(
    BuildContext context,
    DailyPlanController notifier,
    int index,
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
          notifier.regenerateMeal(index, reason);
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.state, required this.notifier});
  final DailyPlanState state;
  final DailyPlanController notifier;

  @override
  Widget build(BuildContext context) {
    final plan = state.plan!;
    final targets = state.targets;
    return FitinoPanelCard(
      title: 'جمع روز',
      icon: Icons.pie_chart_outline_rounded,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: _Stat(
                      label: 'کیلوکالری',
                      value: '${plan.liveCalories.round()}',
                      target: targets != null ? '${targets.targetCalories}' : null)),
              const SizedBox(width: 8),
              Expanded(
                  child: _Stat(
                      label: 'پروتئین',
                      value: '${plan.liveProtein.round()}g',
                      target: targets != null ? '${targets.proteinG}g' : null)),
              const SizedBox(width: 8),
              Expanded(
                  child: _Stat(
                      label: 'کربو',
                      value: '${plan.liveCarbs.round()}g',
                      target: targets != null ? '${targets.carbsG}g' : null)),
              const SizedBox(width: 8),
              Expanded(
                  child: _Stat(
                      label: 'چربی',
                      value: '${plan.liveFat.round()}g',
                      target: targets != null ? '${targets.fatG}g' : null)),
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
  const _Stat({required this.label, required this.value, this.target});
  final String label;
  final String value;
  final String? target;

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
          if (target != null)
            Text('هدف $target', style: const TextStyle(fontSize: 9.5, color: AppColors.muted)),
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
