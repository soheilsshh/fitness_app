import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/state_views.dart';
import '../application/food_diary_controller.dart';
import '../data/food_models.dart';

/// Bottom sheet to add a food log — either from the catalog (with a multiplier)
/// or as a free-text manual entry.
class AddFoodSheet extends ConsumerStatefulWidget {
  const AddFoodSheet({super.key});

  @override
  ConsumerState<AddFoodSheet> createState() => _AddFoodSheetState();
}

class _AddFoodSheetState extends ConsumerState<AddFoodSheet> {
  final _search = TextEditingController();
  String _query = '';
  bool _busy = false;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _addFood(Food food) async {
    final multiplier = await _askMultiplier(food);
    if (multiplier == null) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(foodDiaryActionsProvider.notifier)
          .addFromFood(food, multiplier);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      _toast(e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<double?> _askMultiplier(Food food) async {
    final ctrl = TextEditingController(text: '1');
    return showDialog<double>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(food.name),
        content: TextField(
          controller: ctrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'تعداد واحد (${food.amount} ${food.unit})',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('انصراف'),
          ),
          ElevatedButton(
            onPressed: () =>
                Navigator.pop(context, double.tryParse(ctrl.text) ?? 1),
            child: const Text('افزودن'),
          ),
        ],
      ),
    );
  }

  Future<void> _addManual() async {
    final nameCtrl = TextEditingController();
    final qtyCtrl = TextEditingController();
    final calCtrl = TextEditingController();
    final proCtrl = TextEditingController();
    final carbCtrl = TextEditingController();
    final fatCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('ثبت دستی'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'نام غذا'),
              ),
              TextField(
                controller: qtyCtrl,
                decoration: const InputDecoration(labelText: 'مقدار'),
              ),
              TextField(
                controller: calCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'کالری'),
              ),
              TextField(
                controller: proCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'پروتئین (گرم)'),
              ),
              TextField(
                controller: carbCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'کربوهیدرات (گرم)'),
              ),
              TextField(
                controller: fatCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'چربی (گرم)'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('انصراف'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ثبت'),
          ),
        ],
      ),
    );
    if (ok != true || nameCtrl.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(foodDiaryActionsProvider.notifier).addManual(
            nameCtrl.text.trim(),
            qtyCtrl.text.trim(),
            calories: double.tryParse(calCtrl.text.trim()),
            protein: double.tryParse(proCtrl.text.trim()),
            carbs: double.tryParse(carbCtrl.text.trim()),
            fat: double.tryParse(fatCtrl.text.trim()),
          );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      _toast(e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(foodSearchProvider(_query));
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
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
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _search,
                      onChanged: (v) => setState(() => _query = v.trim()),
                      decoration: const InputDecoration(
                        hintText: 'جستجوی غذا...',
                        prefixIcon: Icon(Icons.search),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: _busy ? null : _addManual,
                    child: const Text('دستی'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: results.when(
                loading: () => const LoadingView(),
                error: (e, _) => ErrorView(message: e.toString()),
                data: (foods) {
                  if (foods.isEmpty) {
                    return const EmptyView(message: 'غذایی یافت نشد.');
                  }
                  return ListView.builder(
                    itemCount: foods.length,
                    itemBuilder: (_, i) {
                      final f = foods[i];
                      return ListTile(
                        title: Text(f.name),
                        subtitle: Text(
                          '${f.calories.round()} کالری در ${f.amount} ${f.unit}',
                          style: const TextStyle(color: AppColors.muted),
                        ),
                        trailing: const Icon(Icons.add_circle_outline,
                            color: AppColors.primary),
                        onTap: _busy ? null : () => _addFood(f),
                      );
                    },
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
