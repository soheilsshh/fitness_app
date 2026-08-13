import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../application/nutrition_scale.dart';
import '../data/food_models.dart';
import 'nutrition_facts_table.dart';

/// What the sheet returns when the user confirms an amount.
class ServingPickerResult {
  const ServingPickerResult({required this.grams, required this.label});
  final double grams;
  final String label;
}

/// Bottom sheet for "how much of this food": pick a serving unit
/// (spoon/gram/cup/...) and a quantity, see the full nutrition panel update
/// live, then confirm. Every food always has at least a "گرم" unit even if
/// it has no others (see backend serving-unit derivation).
class ServingPickerSheet extends StatefulWidget {
  const ServingPickerSheet({super.key, required this.food});

  final Food food;

  static Future<ServingPickerResult?> show(BuildContext context, Food food) {
    return showModalBottomSheet<ServingPickerResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ServingPickerSheet(food: food),
    );
  }

  @override
  State<ServingPickerSheet> createState() => _ServingPickerSheetState();
}

class _ServingPickerSheetState extends State<ServingPickerSheet> {
  late FoodServingUnit _selectedUnit;
  late final TextEditingController _qtyController;

  List<FoodServingUnit> get _units => widget.food.servingUnits.isEmpty
      ? [_selectedUnit]
      : widget.food.servingUnits;

  double get _qty => double.tryParse(_qtyController.text) ?? 0;
  double get _grams => gramsForServing(_selectedUnit, _qty);

  @override
  void initState() {
    super.initState();
    _selectedUnit = widget.food.defaultServingUnit;
    _qtyController = TextEditingController(text: '1');
  }

  @override
  void dispose() {
    _qtyController.dispose();
    super.dispose();
  }

  void _adjustQty(double delta) {
    final next = (_qty + delta).clamp(0, 999).toDouble();
    setState(() {
      _qtyController.text =
          next == next.roundToDouble() ? next.toStringAsFixed(0) : next.toStringAsFixed(1);
    });
  }

  void _confirm() {
    if (_grams <= 0) return;
    final qtyLabel = _qtyController.text.trim();
    Navigator.of(context).pop(
      ServingPickerResult(
        grams: _grams,
        label: '$qtyLabel ${_selectedUnit.label}',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final food = widget.food;
    final facts = scaleByGrams(food, _grams);

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(FitinoRadii.xl)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  children: [
                    _FoodHeader(food: food),
                    const SizedBox(height: 20),
                    Text('واحد', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final unit in _units)
                          ChoiceChip(
                            label: Text(unit.label),
                            selected: unit.label == _selectedUnit.label,
                            onSelected: (_) => setState(() => _selectedUnit = unit),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text('مقدار', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        IconButton.filledTonal(
                          icon: const Icon(Icons.remove),
                          onPressed: () => _adjustQty(-1),
                        ),
                        SizedBox(
                          width: 72,
                          child: TextField(
                            controller: _qtyController,
                            textAlign: TextAlign.center,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        IconButton.filledTonal(
                          icon: const Icon(Icons.add),
                          onPressed: () => _adjustQty(1),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '≈ ${_grams.toStringAsFixed(0)} گرم',
                          style: const TextStyle(color: AppColors.muted),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    NutritionFactsTable(facts: facts),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _grams > 0 ? _confirm : null,
                      child: const Text('افزودن'),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _FoodHeader extends StatelessWidget {
  const _FoodHeader({required this.food});
  final Food food;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(FitinoRadii.md),
          child: Container(
            width: 56,
            height: 56,
            color: AppColors.surfaceVariant,
            alignment: Alignment.center,
            child: const Icon(Icons.restaurant, color: AppColors.muted),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            food.name,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
      ],
    );
  }
}
