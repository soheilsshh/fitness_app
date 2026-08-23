import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../application/single_meal_controller.dart';
import '../data/ai_nutrition_models.dart';

/// "🍳 امروز چی درست کنم؟" — Phase 1 تک‌غذا flow: quick-pick ingredients +
/// free text → summary → AI suggestion. Mirrors the web `SingleMealClient.jsx`.
class SingleMealScreen extends ConsumerWidget {
  const SingleMealScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(singleMealControllerProvider);
    final notifier = ref.read(singleMealControllerProvider.notifier);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          const FitinoPageHeader(
            title: '🍳 امروز چی درست کنم؟',
            description:
                'بگو چه مواد غذایی در دسترس داری یا نداری تا یک غذای مناسب برایت بسازیم.',
          ),
          const SizedBox(height: 16),
          if (state.step == SingleMealStep.input)
            _InputStep(state: state, notifier: notifier)
          else if (state.step == SingleMealStep.summary)
            _SummaryStep(state: state, notifier: notifier)
          else
            _ResultStep(state: state, notifier: notifier),
        ],
      ),
    );
  }
}

class _InputStep extends StatefulWidget {
  const _InputStep({required this.state, required this.notifier});
  final SingleMealState state;
  final SingleMealController notifier;

  @override
  State<_InputStep> createState() => _InputStepState();
}

class _InputStepState extends State<_InputStep> {
  late final TextEditingController _freeTextController =
      TextEditingController(text: widget.state.freeText);

  @override
  void dispose() {
    _freeTextController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final notifier = widget.notifier;
    return FitinoPanelCard(
      title: 'هدف و مواد غذایی',
      icon: Icons.tune_rounded,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('هدف', style: _labelStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final g in kGoalOptions)
                FitinoChoiceChip(
                  label: g.label,
                  selected: state.goal == g.value,
                  onSelected: (_) => notifier.setGoal(g.value),
                ),
            ],
          ),
          const SizedBox(height: 18),
          const Text('مواد غذایی که در دسترس داری', style: _labelStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final name in kCommonIngredients)
                FitinoChoiceChip(
                  label: name,
                  selected: state.selectedIngredients.contains(name),
                  onSelected: (_) => notifier.toggleIngredient(name),
                ),
            ],
          ),
          const SizedBox(height: 18),
          const Text('یا متن آزاد بنویس', style: _labelStyle),
          const SizedBox(height: 8),
          TextField(
            minLines: 3,
            maxLines: 5,
            onChanged: notifier.setFreeText,
            controller: _freeTextController,
            decoration: InputDecoration(
              hintText:
                  'مثلاً: مرغ و تخم‌مرغ دارم، ماهی ندارم، لبنیات دوست ندارم و شامم سبک باشه.',
              filled: true,
              fillColor: AppColors.surfaceVariant,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: state.canContinue ? notifier.goToSummary : null,
              child: const Text('ادامه'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryStep extends StatelessWidget {
  const _SummaryStep({required this.state, required this.notifier});
  final SingleMealState state;
  final SingleMealController notifier;

  @override
  Widget build(BuildContext context) {
    final goalMatches = kGoalOptions.where((g) => g.value == state.goal);
    final goalLabel = goalMatches.isEmpty ? null : goalMatches.first.label;

    return FitinoPanelCard(
      title: 'خلاصه درخواست شما',
      icon: Icons.fact_check_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SummaryRow(label: 'هدف', value: goalLabel ?? 'بدون هدف مشخص'),
          _SummaryRow(
            label: 'مواد غذایی',
            value: state.selectedIngredients.isEmpty
                ? '—'
                : state.selectedIngredients.join('، '),
          ),
          _SummaryRow(
            label: 'توضیحات آزاد',
            value: state.freeText.trim().isEmpty ? '—' : state.freeText.trim(),
          ),
          if (state.error != null) ...[
            const SizedBox(height: 8),
            Text(
              state.error!,
              style: const TextStyle(color: Colors.redAccent, fontSize: 12.5),
            ),
          ],
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: state.loading ? null : notifier.backToInput,
                  child: const Text('بازگشت'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton(
                  onPressed: state.loading ? null : notifier.generate,
                  child: state.loading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('تولید کن'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 96,
            child: Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResultStep extends StatelessWidget {
  const _ResultStep({required this.state, required this.notifier});
  final SingleMealState state;
  final SingleMealController notifier;

  @override
  Widget build(BuildContext context) {
    final suggestion = state.suggestion;
    if (suggestion == null) return const FitinoLoading();

    return FitinoPanelCard(
      title: suggestion.recipeName,
      icon: Icons.restaurant_menu_rounded,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (suggestion.instructions.isNotEmpty)
            Text(
              suggestion.instructions,
              style: const TextStyle(color: AppColors.muted, fontSize: 13, height: 1.5),
            ),
          const SizedBox(height: 14),
          for (final item in suggestion.items) _FoodItemTile(item: item),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _TotalTile(label: 'کیلوکالری', value: '${suggestion.totalCalories}')),
              const SizedBox(width: 8),
              Expanded(
                  child: _TotalTile(
                      label: 'پروتئین', value: '${suggestion.totalProtein.round()}g')),
              const SizedBox(width: 8),
              Expanded(
                  child:
                      _TotalTile(label: 'کربوهیدرات', value: '${suggestion.totalCarbs.round()}g')),
              const SizedBox(width: 8),
              Expanded(child: _TotalTile(label: 'چربی', value: '${suggestion.totalFat.round()}g')),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: state.loading ? null : notifier.generate,
              icon: state.loading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh_rounded, size: 18),
              label: Text(state.loading ? 'در حال ساخت پیشنهاد دیگر...' : 'پیشنهاد دیگر'),
            ),
          ),
        ],
      ),
    );
  }
}

class _FoodItemTile extends StatelessWidget {
  const _FoodItemTile({required this.item});
  final SuggestedFoodItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.foodName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 2),
                Text(
                  [
                    if (item.amountG > 0) '${item.amountG.toStringAsFixed(0)} گرم',
                    if (item.servingLabel.isNotEmpty) item.servingLabel,
                  ].join(' · '),
                  style: const TextStyle(color: AppColors.muted, fontSize: 11.5),
                ),
              ],
            ),
          ),
          Text('${item.calories} kcal', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _TotalTile extends StatelessWidget {
  const _TotalTile({required this.label, required this.value});
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

const _labelStyle = TextStyle(
  fontFamily: AppTheme.fontFamily,
  fontWeight: FontWeight.w700,
  fontSize: 13,
);
