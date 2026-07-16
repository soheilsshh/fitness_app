import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_colors.dart';
import '../data/coach_catalog_repository.dart';

String _assetUrl(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

/// Returns a workout exercise map ready to append into planByDay.
Future<Map<String, dynamic>?> showExercisePicker(BuildContext context) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    builder: (_) => const _ExercisePickerSheet(),
  );
}

class _ExercisePickerSheet extends ConsumerStatefulWidget {
  const _ExercisePickerSheet();

  @override
  ConsumerState<_ExercisePickerSheet> createState() =>
      _ExercisePickerSheetState();
}

class _ExercisePickerSheetState extends ConsumerState<_ExercisePickerSheet> {
  final _query = TextEditingController();
  final _sets = TextEditingController(text: '3');
  final _reps = TextEditingController(text: '12');
  Timer? _debounce;
  List<String> _categories = const [];
  String _category = '';
  List<CoachExercise> _items = const [];
  CoachExercise? _selected;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _query.dispose();
    _sets.dispose();
    _reps.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    final repo = ref.read(coachCatalogRepositoryProvider);
    try {
      final cats = await repo.exerciseCategories();
      if (mounted) setState(() => _categories = cats);
    } catch (_) {}
    await _search();
  }

  Future<void> _search() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items =
          await ref.read(coachCatalogRepositoryProvider).searchExercises(
                query: _query.text.trim(),
                category: _category,
              );
      if (mounted) setState(() => _items = items);
    } catch (e) {
      if (mounted) {
        setState(() {
          _items = const [];
          _error = e.toString();
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onQueryChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), _search);
  }

  void _confirm() {
    final ex = _selected;
    if (ex == null) return;
    Navigator.pop(context, {
      'exerciseId': ex.id,
      'name': ex.name,
      'imageUrl': ex.imageUrl,
      'sets': int.tryParse(_sets.text.trim()) ?? 3,
      'reps': _reps.text.trim().isEmpty ? '12' : _reps.text.trim(),
      'target': ex.target,
    });
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.85;
    return SizedBox(
      height: height,
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _query,
              decoration: const InputDecoration(
                hintText: 'جستجوی حرکت...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: _onQueryChanged,
              onSubmitted: (_) => _search(),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: ChoiceChip(
                    label: const Text('همه'),
                    selected: _category.isEmpty,
                    onSelected: (_) {
                      setState(() => _category = '');
                      _search();
                    },
                  ),
                ),
                ..._categories.map(
                  (c) => Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: ChoiceChip(
                      label: Text(c),
                      selected: _category == c,
                      onSelected: (_) {
                        setState(() => _category = c);
                        _search();
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brandMid))
                : _error != null
                    ? Center(child: Text(_error!))
                    : _items.isEmpty
                        ? const Center(child: Text('حرکتی یافت نشد.'))
                        : ListView.builder(
                            itemCount: _items.length,
                            itemBuilder: (_, i) {
                              final ex = _items[i];
                              final selected = _selected?.id == ex.id;
                              return ListTile(
                                selected: selected,
                                leading: ex.imageUrl.isEmpty
                                    ? const CircleAvatar(
                                        child: Icon(Icons.fitness_center),
                                      )
                                    : CircleAvatar(
                                        backgroundImage: NetworkImage(
                                            _assetUrl(ex.imageUrl)),
                                      ),
                                title: Text(ex.name),
                                subtitle: Text(
                                  [
                                    if (ex.category.isNotEmpty) ex.category,
                                    if (ex.bodyPart.isNotEmpty) ex.bodyPart,
                                    if (ex.equipment.isNotEmpty) ex.equipment,
                                  ].join(' · '),
                                  style:
                                      const TextStyle(color: AppColors.muted),
                                ),
                                trailing: selected
                                    ? const Icon(Icons.check_circle,
                                        color: AppColors.primary)
                                    : null,
                                onTap: () => setState(() => _selected = ex),
                              );
                            },
                          ),
          ),
          if (_selected != null)
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _sets,
                            keyboardType: TextInputType.number,
                            decoration:
                                const InputDecoration(labelText: 'ست'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _reps,
                            decoration:
                                const InputDecoration(labelText: 'تکرار'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _confirm,
                        child: Text('افزودن «${_selected!.name}»'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Returns a nutrition meal map with foodId + macros.
Future<Map<String, dynamic>?> showFoodPicker(BuildContext context) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    builder: (_) => const _FoodPickerSheet(),
  );
}

class _FoodPickerSheet extends ConsumerStatefulWidget {
  const _FoodPickerSheet();

  @override
  ConsumerState<_FoodPickerSheet> createState() => _FoodPickerSheetState();
}

class _FoodPickerSheetState extends ConsumerState<_FoodPickerSheet> {
  final _query = TextEditingController();
  final _multiplier = TextEditingController(text: '1');
  Timer? _debounce;
  List<CoachCatalogFood> _items = const [];
  CoachCatalogFood? _selected;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _search();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _query.dispose();
    _multiplier.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    setState(() => _loading = true);
    try {
      final items = await ref
          .read(coachCatalogRepositoryProvider)
          .searchFoods(query: _query.text.trim());
      if (mounted) setState(() => _items = items);
    } catch (_) {
      if (mounted) setState(() => _items = const []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _confirm() {
    final f = _selected;
    if (f == null) return;
    final mult = double.tryParse(_multiplier.text.trim()) ?? 1;
    Navigator.pop(context, {
      'foodId': f.id,
      'title': f.name,
      'detail': '${f.amount * mult} ${f.unit}',
      'multiplier': mult,
      'unit': f.unit,
      'amount': f.amount * mult,
      'calories': f.calories * mult,
      'protein': f.protein * mult,
      'carbs': f.carbs * mult,
      'fat': f.fat * mult,
    });
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.85;
    return SizedBox(
      height: height,
      child: Column(
        children: [
          const SizedBox(height: 10),
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
            child: TextField(
              controller: _query,
              decoration: const InputDecoration(
                hintText: 'جستجوی غذا...',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: (_) => _search(),
              onChanged: (_) {
                _debounce?.cancel();
                _debounce =
                    Timer(const Duration(milliseconds: 300), _search);
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brandMid))
                : _items.isEmpty
                    ? const Center(child: Text('غذایی یافت نشد.'))
                    : ListView.builder(
                        itemCount: _items.length,
                        itemBuilder: (_, i) {
                          final f = _items[i];
                          final selected = _selected?.id == f.id;
                          return ListTile(
                            selected: selected,
                            title: Text(f.name),
                            subtitle: Text(
                              '${f.calories.round()} کالری · ${f.amount} ${f.unit} · P ${f.protein.round()}g',
                              style: const TextStyle(color: AppColors.muted),
                            ),
                            trailing: selected
                                ? const Icon(Icons.check_circle,
                                    color: AppColors.primary)
                                : null,
                            onTap: () => setState(() => _selected = f),
                          );
                        },
                      ),
          ),
          if (_selected != null)
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Column(
                  children: [
                    TextField(
                      controller: _multiplier,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText:
                            'تعداد واحد (${_selected!.amount} ${_selected!.unit})',
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _confirm,
                        child: Text('افزودن «${_selected!.name}»'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
