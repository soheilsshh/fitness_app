import 'package:flutter/material.dart';
import '../../../core/widgets/fitino_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../data/coach_plans_repository.dart';
import 'coach_plans_screen.dart' show planTypeFa;

class CoachPlanFormScreen extends ConsumerStatefulWidget {
  const CoachPlanFormScreen({super.key, this.planId});

  final int? planId;

  @override
  ConsumerState<CoachPlanFormScreen> createState() =>
      _CoachPlanFormScreenState();
}

class _CoachPlanFormScreenState extends ConsumerState<CoachPlanFormScreen> {
  final _title = TextEditingController();
  final _subtitle = TextEditingController();
  final _course = TextEditingController();
  final _description = TextEditingController();
  final _features = TextEditingController();
  final _price = TextEditingController(text: '0');
  final _discountPrice = TextEditingController(text: '0');
  final _discountPercent = TextEditingController(text: '0');
  final _duration = TextEditingController(text: '30');
  String _planType = 'both';
  bool _isPopular = false;
  bool _loading = false;
  bool _busy = false;
  bool _loaded = false;

  bool get _isEdit => widget.planId != null;

  @override
  void dispose() {
    _title.dispose();
    _subtitle.dispose();
    _course.dispose();
    _description.dispose();
    _features.dispose();
    _price.dispose();
    _discountPrice.dispose();
    _discountPercent.dispose();
    _duration.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isEdit && !_loaded) {
      _loaded = true;
      _load();
    }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final p =
          await ref.read(coachPlansRepositoryProvider).get(widget.planId!);
      _title.text = p.title;
      _subtitle.text = p.subtitle;
      _course.text = p.courseName;
      _description.text = p.description;
      _features.text = p.featuresText;
      _price.text = '${p.price}';
      _discountPrice.text = '${p.discountPrice}';
      _discountPercent.text = '${p.discountPercent}';
      _duration.text = '${p.durationDays}';
      _planType = p.planType;
      _isPopular = p.isPopular;
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _body() => {
        'title': _title.text.trim(),
        'subtitle': _subtitle.text.trim(),
        'courseName': _course.text.trim(),
        'description': _description.text.trim(),
        'featuresText': _features.text.trim(),
        'planType': _planType,
        'price': int.tryParse(_price.text.trim()) ?? 0,
        'discountPrice': int.tryParse(_discountPrice.text.trim()) ?? 0,
        'discountPercent': int.tryParse(_discountPercent.text.trim()) ?? 0,
        'durationDays': int.tryParse(_duration.text.trim()) ?? 0,
        'isPopular': _isPopular,
      };

  Future<void> _save() async {
    if (_title.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('عنوان پلن الزامی است')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final repo = ref.read(coachPlansRepositoryProvider);
      final plan = _isEdit
          ? await repo.update(widget.planId!, _body())
          : await repo.create(_body());
      ref.invalidate(coachPlansProvider);
      ref.invalidate(coachPlanDetailProvider(plan.id));
      if (mounted) context.go('/coach/plans/${plan.id}');
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FitinoPushScaffold(
      title: _isEdit ? 'ویرایش پلن' : 'پلن جدید',
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextField(
                  controller: _title,
                  decoration: const InputDecoration(labelText: 'عنوان'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _subtitle,
                  decoration: const InputDecoration(labelText: 'زیرعنوان'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _course,
                  decoration: const InputDecoration(labelText: 'نام دوره'),
                ),
                const SizedBox(height: 12),
                Text('نوع پلن',
                    style: TextStyle(color: AppColors.muted, fontSize: 12)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final t in const [
                      ('both', 'تمرین + تغذیه'),
                      ('workout', 'تمرین'),
                      ('nutrition', 'تغذیه'),
                    ])
                      ChoiceChip(
                        label: Text(t.$2),
                        selected: _planType == t.$1,
                        onSelected: (_) => setState(() => _planType = t.$1),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _price,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'قیمت (تومان)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _discountPrice,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'قیمت با تخفیف'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _discountPercent,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'درصد تخفیف'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _duration,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'مدت (روز)'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('پلن محبوب'),
                  value: _isPopular,
                  onChanged: (v) => setState(() => _isPopular = v),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _features,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'ویژگی‌ها (هر خط یک مورد)',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _description,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'توضیحات',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _busy ? null : _save,
                  child: Text(_busy ? 'در حال ذخیره...' : 'ذخیره پلن'),
                ),
              ],
            ),
    );
  }
}

class CoachPlanDetailScreen extends ConsumerWidget {
  const CoachPlanDetailScreen({super.key, required this.id});
  final int id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachPlanDetailProvider(id));
    return FitinoPushScaffold(
      title: 'جزئیات پلن',
      actions: [IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/coach/plans/$id/edit'),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('حذف پلن'),
                  content: const Text('آیا از حذف این پلن مطمئن هستید؟'),
                  actions: [
                    TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('انصراف')),
                    FilledButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text('حذف')),
                  ],
                ),
              );
              if (ok != true) return;
              try {
                await ref.read(coachPlansRepositoryProvider).delete(id);
                ref.invalidate(coachPlansProvider);
                if (context.mounted) context.go('/coach/plans');
              } on ApiException catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context)
                      .showSnackBar(SnackBar(content: Text(e.message)));
                }
              }
            },
          ),],
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (p) {
          final price = p.discountPrice > 0 ? p.discountPrice : p.price;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(p.title,
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold)),
              if (p.subtitle.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(p.subtitle, style: const TextStyle(color: AppColors.muted)),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: [
                  Chip(label: Text(planTypeFa(p.planType))),
                  if (p.durationDays > 0)
                    Chip(label: Text('${p.durationDays} روز')),
                  if (p.isPopular) const Chip(label: Text('محبوب')),
                ],
              ),
              const SizedBox(height: 16),
              Text('$price تومان',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w600)),
              if (p.discountPrice > 0 && p.price > p.discountPrice)
                Text('${p.price} تومان',
                    style: const TextStyle(
                      decoration: TextDecoration.lineThrough,
                      color: AppColors.muted,
                    )),
              if (p.featuresText.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text('ویژگی‌ها',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(p.featuresText, style: const TextStyle(height: 1.6)),
              ],
              if (p.description.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text('توضیحات',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(p.description, style: const TextStyle(height: 1.6)),
              ],
            ],
          );
        },
      ),
    );
  }
}
