import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../application/nutrition_scale.dart';

/// The full 15-field nutrition panel for a scaled serving, styled after the
/// reference نمای ارزش غذایی screenshot: icon + label on the leading side,
/// value on the trailing side. Fields with no data yet (not USDA-enriched)
/// show "نامشخص" instead of a fabricated number.
class NutritionFactsTable extends StatelessWidget {
  const NutritionFactsTable({super.key, required this.facts});

  final NutritionFacts facts;

  @override
  Widget build(BuildContext context) {
    final rows = [
      _NutrientRow('کالری', '🔥', facts.calories, 'کالری'),
      _NutrientRow('پروتئین', '🍗', facts.protein, 'گرم'),
      _NutrientRow('چربی', '🧈', facts.fat, 'گرم'),
      _NutrientRow('کربوهیدرات', '🍞', facts.carbs, 'گرم'),
      _NutrientRow('شکر', '🍬', facts.sugar, 'گرم'),
      _NutrientRow('سدیم', '🧂', facts.sodium, 'میلی‌گرم'),
      _NutrientRow('کلسترول', '🥚', facts.cholesterol, 'میلی‌گرم'),
      _NutrientRow('کلسیم', '🥛', facts.calcium, 'میلی‌گرم'),
      _NutrientRow('آهن', '🥬', facts.iron, 'میلی‌گرم'),
      _NutrientRow('فیبر', '🌾', facts.fiber, 'گرم'),
      _NutrientRow('منیزیم', '🥜', facts.magnesium, 'میلی‌گرم'),
      _NutrientRow('پتاسیم', '🍌', facts.potassium, 'میلی‌گرم'),
      _NutrientRow('فسفر', '🐟', facts.phosphorus, 'میلی‌گرم'),
      _NutrientRow('ترانس', '🍟', facts.transFat, 'گرم'),
      _NutrientRow('اسید چرب اشباع', '🥩', facts.saturatedFat, 'گرم'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(FitinoRadii.md),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < rows.length; i++)
            _NutrientTile(row: rows[i], showDivider: i != rows.length - 1),
        ],
      ),
    );
  }
}

class _NutrientRow {
  const _NutrientRow(this.label, this.emoji, this.value, this.unit);
  final String label;
  final String emoji;
  final double? value;
  final String unit;
}

class _NutrientTile extends StatelessWidget {
  const _NutrientTile({required this.row, required this.showDivider});

  final _NutrientRow row;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final hasValue = row.value != null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: showDivider
            ? const Border(bottom: BorderSide(color: AppColors.border))
            : null,
      ),
      child: Row(
        children: [
          Text(row.emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              row.label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Text(
            hasValue ? _formatValue(row.value!, row.unit) : 'نامشخص',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: hasValue ? AppColors.foreground : AppColors.muted,
            ),
          ),
        ],
      ),
    );
  }
}

String _formatValue(double value, String unit) {
  final display = value.abs() < 10
      ? value.toStringAsFixed(1)
      : value.round().toString();
  return '$display $unit';
}
