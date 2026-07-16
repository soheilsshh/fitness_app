import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../data/coach_catalog_repository.dart';

String _assetUrl(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

class CoachExercisesCatalogScreen extends ConsumerStatefulWidget {
  const CoachExercisesCatalogScreen({super.key});

  @override
  ConsumerState<CoachExercisesCatalogScreen> createState() =>
      _CoachExercisesCatalogScreenState();
}

class _CoachExercisesCatalogScreenState
    extends ConsumerState<CoachExercisesCatalogScreen> {
  final _query = TextEditingController();
  List<String> _categories = const [];
  String _category = '';
  List<CoachExercise> _items = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      final cats =
          await ref.read(coachCatalogRepositoryProvider).exerciseCategories();
      if (mounted) setState(() => _categories = cats);
    } catch (_) {}
    await _search();
  }

  Future<void> _search() async {
    setState(() => _loading = true);
    try {
      final items =
          await ref.read(coachCatalogRepositoryProvider).searchExercises(
                query: _query.text.trim(),
                category: _category,
              );
      if (mounted) setState(() => _items = items);
    } catch (_) {
      if (mounted) setState(() => _items = const []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createCustom() async {
    final name = TextEditingController();
    final category = TextEditingController();
    final bodyPart = TextEditingController();
    final equipment = TextEditingController();
    final target = TextEditingController();
    String? mediaPath;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('حرکت سفارشی'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                    controller: name,
                    decoration: const InputDecoration(labelText: 'نام')),
                TextField(
                    controller: category,
                    decoration: const InputDecoration(labelText: 'دسته')),
                TextField(
                    controller: bodyPart,
                    decoration: const InputDecoration(labelText: 'بخش بدن')),
                TextField(
                    controller: equipment,
                    decoration: const InputDecoration(labelText: 'تجهیزات')),
                TextField(
                    controller: target,
                    decoration: const InputDecoration(labelText: 'هدف عضله')),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () async {
                    final file = await ImagePicker().pickImage(
                      source: ImageSource.gallery,
                      imageQuality: 85,
                    );
                    if (file != null) {
                      setLocal(() => mediaPath = file.path);
                    }
                  },
                  icon: const Icon(Icons.image_outlined),
                  label: Text(mediaPath == null ? 'انتخاب تصویر' : 'تصویر انتخاب شد'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('انصراف')),
            FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('ساخت')),
          ],
        ),
      ),
    );
    if (ok != true || name.text.trim().isEmpty) return;
    try {
      await ref.read(coachCatalogRepositoryProvider).createExercise(
            name: name.text.trim(),
            category: category.text.trim(),
            bodyPart: bodyPart.text.trim(),
            equipment: equipment.text.trim(),
            target: target.text.trim(),
            mediaPath: mediaPath,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('حرکت ساخته شد')),
        );
      }
      await _search();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FitinoPushScaffold(
      title: 'کاتالوگ حرکات',
      floatingActionButton: FitinoExtendedFab(
        onPressed: _createCustom,
        icon: Icons.add,
        label: 'حرکت جدید',
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _query,
              decoration: const InputDecoration(
                hintText: 'جستجوی حرکت...',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: (_) => _search(),
              onChanged: (_) => _search(),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                ChoiceChip(
                  label: const Text('همه'),
                  selected: _category.isEmpty,
                  onSelected: (_) {
                    setState(() => _category = '');
                    _search();
                  },
                ),
                ..._categories.map(
                  (c) => Padding(
                    padding: const EdgeInsets.only(right: 8),
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
                ? const FitinoLoading()
                : _items.isEmpty
                    ? const Center(child: Text('حرکتی یافت نشد.'))
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                        itemCount: _items.length,
                        itemBuilder: (_, i) {
                          final ex = _items[i];
                          return Padding(padding: const EdgeInsets.only(bottom: 8), child: FitinoPanelCard(padding: EdgeInsets.zero, child: ListTile(
                              leading: ex.imageUrl.isEmpty
                                  ? const CircleAvatar(
                                      child: Icon(Icons.fitness_center))
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
                                style: const TextStyle(color: AppColors.muted),
                              ),
                            )));
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class CoachFoodsCatalogScreen extends ConsumerStatefulWidget {
  const CoachFoodsCatalogScreen({super.key});

  @override
  ConsumerState<CoachFoodsCatalogScreen> createState() =>
      _CoachFoodsCatalogScreenState();
}

class _CoachFoodsCatalogScreenState
    extends ConsumerState<CoachFoodsCatalogScreen> {
  final _query = TextEditingController();
  List<CoachCatalogFood> _items = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _search();
  }

  @override
  void dispose() {
    _query.dispose();
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

  @override
  Widget build(BuildContext context) {
    return FitinoPushScaffold(
      title: 'کاتالوگ غذاها',
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _query,
              decoration: const InputDecoration(
                hintText: 'جستجوی غذا...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (_) => _search(),
              onSubmitted: (_) => _search(),
            ),
          ),
          Expanded(
            child: _loading
                ? const FitinoLoading()
                : _items.isEmpty
                    ? const Center(child: Text('غذایی یافت نشد.'))
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        itemCount: _items.length,
                        itemBuilder: (_, i) {
                          final f = _items[i];
                          return Padding(padding: const EdgeInsets.only(bottom: 8), child: FitinoPanelCard(padding: EdgeInsets.zero, child: ListTile(
                              title: Text(f.name),
                              subtitle: Text(
                                '${f.calories.round()} کالری در ${f.amount} ${f.unit} · '
                                'P ${f.protein.round()} · C ${f.carbs.round()} · F ${f.fat.round()}',
                                style: const TextStyle(color: AppColors.muted),
                              ),
                            )));
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
