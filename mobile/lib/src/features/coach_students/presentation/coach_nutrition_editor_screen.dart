import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../coach_catalog/presentation/catalog_pickers.dart';
import '../data/coach_students_repository.dart';

const _days = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
const _dayLabels = {
  'sat': 'شنبه',
  'sun': 'یکشنبه',
  'mon': 'دوشنبه',
  'tue': 'سه‌شنبه',
  'wed': 'چهارشنبه',
  'thu': 'پنجشنبه',
  'fri': 'جمعه',
};

class CoachNutritionEditorScreen extends ConsumerStatefulWidget {
  const CoachNutritionEditorScreen({
    super.key,
    required this.studentId,
    this.initialCalories,
  });

  final int studentId;
  final int? initialCalories;

  @override
  ConsumerState<CoachNutritionEditorScreen> createState() =>
      _CoachNutritionEditorScreenState();
}

class _CoachNutritionEditorScreenState
    extends ConsumerState<CoachNutritionEditorScreen> {
  final _title = TextEditingController(text: 'برنامه غذایی');
  final _calories = TextEditingController();
  final _protein = TextEditingController();
  int _programId = 0;
  String _selectedDay = 'sat';
  Map<String, Map<String, dynamic>> _planByDay = {};
  bool _loading = true;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialCalories != null) {
      _calories.text = '${widget.initialCalories}';
    }
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _calories.dispose();
    _protein.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final p = await ref
          .read(coachStudentsRepositoryProvider)
          .programs(widget.studentId);
      _programId = p.nutritionProgramId;
      final map = <String, Map<String, dynamic>>{};
      for (final d in _days) {
        final day = p.planByDay[d];
        if (day is Map && day['nutrition'] is Map) {
          map[d] = Map<String, dynamic>.from(day['nutrition'] as Map);
        } else {
          map[d] = {
            'caloriesTarget': widget.initialCalories ?? 0,
            'proteinTarget': '',
            'meals': <Map<String, dynamic>>[],
          };
        }
      }
      _planByDay = map;
      _syncDayFields();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _current() {
    return _planByDay.putIfAbsent(
      _selectedDay,
      () => {
        'caloriesTarget': 0,
        'proteinTarget': '',
        'meals': <Map<String, dynamic>>[],
      },
    );
  }

  void _syncDayFields() {
    final n = _current();
    _calories.text = '${n['caloriesTarget'] ?? 0}';
    _protein.text = n['proteinTarget']?.toString() ?? '';
  }

  void _selectDay(String day) {
    _current()['caloriesTarget'] = int.tryParse(_calories.text.trim()) ?? 0;
    _current()['proteinTarget'] = _protein.text.trim();
    setState(() {
      _selectedDay = day;
      _syncDayFields();
    });
  }

  List<Map<String, dynamic>> _meals() {
    final n = _current();
    final raw = n['meals'];
    if (raw is! List) {
      n['meals'] = <Map<String, dynamic>>[];
      return n['meals'] as List<Map<String, dynamic>>;
    }
    return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  void _setMeals(List<Map<String, dynamic>> list) {
    setState(() => _current()['meals'] = list);
  }

  Future<void> _pickTemplate() async {
    final templates =
        await ref.read(coachStudentsRepositoryProvider).nutritionTemplates();
    if (!mounted) return;
    final picked = await showModalBottomSheet<ProgramTemplate>(
      context: context,
      builder: (ctx) => ListView(
        children: [
          const ListTile(title: Text('انتخاب قالب تغذیه')),
          ...templates.map(
            (t) => ListTile(
              title: Text(t.title),
              subtitle: t.extra.isEmpty ? null : Text(t.extra),
              onTap: () => Navigator.pop(ctx, t),
            ),
          ),
        ],
      ),
    );
    if (picked == null) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(coachStudentsRepositoryProvider)
          .assignNutritionTemplate(widget.studentId, picked.id);
      ref.invalidate(coachStudentProgramsProvider(widget.studentId));
      ref.invalidate(coachStudentDetailProvider(widget.studentId));
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('قالب اعمال شد')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _save() async {
    _current()['caloriesTarget'] = int.tryParse(_calories.text.trim()) ?? 0;
    _current()['proteinTarget'] = _protein.text.trim();
    setState(() => _busy = true);
    try {
      final planByDay = <String, dynamic>{};
      for (final e in _planByDay.entries) {
        final meals = e.value['meals'] as List? ?? const [];
        final cal = (e.value['caloriesTarget'] as num?)?.toInt() ?? 0;
        final pro = e.value['proteinTarget']?.toString() ?? '';
        if (meals.isEmpty && cal == 0 && pro.isEmpty) continue;
        planByDay[e.key] = {'nutrition': e.value};
      }
      await ref.read(coachStudentsRepositoryProvider).saveNutrition(
            studentId: widget.studentId,
            programId: _programId,
            body: {
              'title': _title.text.trim().isEmpty
                  ? 'برنامه غذایی'
                  : _title.text.trim(),
              'durationWeeks': 4,
              'planByDay': planByDay,
            },
          );
      ref.invalidate(coachStudentProgramsProvider(widget.studentId));
      ref.invalidate(coachStudentDetailProvider(widget.studentId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('برنامه غذایی ذخیره شد')),
        );
        Navigator.of(context).pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _editMeal(Map<String, dynamic>? existing, int? index) async {
    final title =
        TextEditingController(text: existing?['title']?.toString() ?? '');
    final detail =
        TextEditingController(text: existing?['detail']?.toString() ?? '');
    final cal =
        TextEditingController(text: '${existing?['calories'] ?? 0}');
    final pro =
        TextEditingController(text: '${existing?['protein'] ?? 0}');
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(existing == null ? 'وعده جدید' : 'ویرایش وعده'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                  controller: title,
                  decoration: const InputDecoration(labelText: 'عنوان وعده')),
              TextField(
                  controller: detail,
                  decoration: const InputDecoration(labelText: 'جزئیات'),
                  maxLines: 2),
              TextField(
                  controller: cal,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'کالری')),
              TextField(
                  controller: pro,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'پروتئین')),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('انصراف')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('تأیید')),
        ],
      ),
    );
    if (ok != true || title.text.trim().isEmpty) return;
    final list = _meals();
    final item = {
      'title': title.text.trim(),
      'detail': detail.text.trim(),
      'calories': double.tryParse(cal.text.trim()) ?? 0,
      'protein': double.tryParse(pro.text.trim()) ?? 0,
    };
    if (index == null) {
      list.add(item);
    } else {
      list[index] = item;
    }
    _setMeals(list);
  }

  @override
  Widget build(BuildContext context) {
    final meals = _loading ? const <Map<String, dynamic>>[] : _meals();

    return Scaffold(
      appBar: AppBar(
        title: const Text('برنامه غذایی'),
        actions: [
          TextButton(
            onPressed: _busy ? null : _pickTemplate,
            child: const Text('قالب'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _busy || _loading ? null : _save,
        icon: const Icon(Icons.save),
        label: Text(_busy ? '...' : 'ذخیره'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              children: [
                TextField(
                  controller: _title,
                  decoration: const InputDecoration(labelText: 'عنوان برنامه'),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      for (final d in _days)
                        Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: ChoiceChip(
                            label: Text(_dayLabels[d]!),
                            selected: _selectedDay == d,
                            onSelected: (_) => _selectDay(d),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _calories,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'هدف کالری روز'),
                  onChanged: (v) =>
                      _current()['caloriesTarget'] = int.tryParse(v) ?? 0,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _protein,
                  decoration:
                      const InputDecoration(labelText: 'هدف پروتئین'),
                  onChanged: (v) => _current()['proteinTarget'] = v,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Text('وعده‌ها',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () async {
                        final picked = await showFoodPicker(context);
                        if (picked == null) return;
                        final list = _meals()..add(picked);
                        _setMeals(list);
                      },
                      icon: const Icon(Icons.search),
                      label: const Text('کاتالوگ'),
                    ),
                    TextButton.icon(
                      onPressed: () => _editMeal(null, null),
                      icon: const Icon(Icons.add),
                      label: const Text('دستی'),
                    ),
                  ],
                ),
                if (meals.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Text('وعده‌ای ثبت نشده.',
                        style: TextStyle(color: AppColors.muted)),
                  )
                else
                  ...meals.asMap().entries.map((e) {
                    final m = e.value;
                    return Card(
                      child: ListTile(
                        title: Text(m['title']?.toString() ?? ''),
                        subtitle: Text(
                          [
                            if ((m['detail'] as String?)?.isNotEmpty == true)
                              m['detail'],
                            '${m['calories'] ?? 0} kcal',
                            'P ${m['protein'] ?? 0}',
                          ].join(' · '),
                          style: const TextStyle(color: AppColors.muted),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit_outlined),
                              onPressed: () => _editMeal(m, e.key),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline),
                              onPressed: () {
                                final list = _meals()..removeAt(e.key);
                                _setMeals(list);
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
    );
  }
}
