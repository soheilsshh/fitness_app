import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../data/content_models.dart';
import '../data/content_repository.dart';
import 'academy_media_player_screen.dart';

String resolveMediaUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

bool isGradientCover(String? cover) {
  if (cover == null || cover.isEmpty) return true;
  return cover.contains('gradient') || cover.contains('linear-');
}

class AcademyScreen extends ConsumerStatefulWidget {
  const AcademyScreen({super.key});

  @override
  ConsumerState<AcademyScreen> createState() => _AcademyScreenState();
}

class _AcademyScreenState extends ConsumerState<AcademyScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  String _category = 'همه';

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _tabs.addListener(() {
      if (!_tabs.indexIsChanging) setState(() => _category = 'همه');
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  String get _type =>
      switch (_tabs.index) { 0 => 'podcast', 1 => 'video', _ => 'text' };

  void _openMedia(AcademyItem item) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AcademyMediaPlayerScreen(item: item),
      ),
    );
  }

  void _readText(AcademyItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        builder: (_, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.all(20),
          children: [
            Text(item.title,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(item.description,
                style: const TextStyle(color: AppColors.muted)),
            const SizedBox(height: 16),
            Text(item.body?.isNotEmpty == true ? item.body! : item.description),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(academyProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('آموزش فیتینو'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'پادکست'),
            Tab(text: 'ویدیو'),
            Tab(text: 'متن'),
          ],
        ),
      ),
      body: AsyncValueWidget<List<AcademyItem>>(
        value: async,
        onRetry: () => ref.invalidate(academyProvider),
        data: (items) {
          final typed = items.where((i) => i.type == _type).toList();
          final cats = [
            'همه',
            ...{for (final i in typed) i.category}.where((c) => c.isNotEmpty),
          ];
          final filtered = _category == 'همه'
              ? typed
              : typed.where((i) => i.category == _category).toList();
          final featured = items.where((i) => i.featured).toList();

          return Column(
            children: [
              if (featured.isNotEmpty)
                SizedBox(
                  height: 140,
                  child: PageView.builder(
                    itemCount: featured.length,
                    itemBuilder: (_, i) {
                      final item = featured[i];
                      return Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                        child: Card(
                          color: AppColors.primaryDark,
                          child: InkWell(
                            onTap: () {
                              if (item.type == 'text') {
                                _readText(item);
                              } else if (item.src != null &&
                                  item.src!.isNotEmpty) {
                                _openMedia(item);
                              } else {
                                final idx = item.type == 'podcast'
                                    ? 0
                                    : item.type == 'video'
                                        ? 1
                                        : 2;
                                _tabs.animateTo(idx);
                              }
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('ویژه',
                                      style: TextStyle(
                                          color: AppColors.onPrimary,
                                          fontSize: 12)),
                                  const SizedBox(height: 6),
                                  Text(item.title,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16)),
                                  const Spacer(),
                                  Text(item.category,
                                      style: TextStyle(
                                          color: AppColors.onPrimary
                                              .withValues(alpha: 0.8),
                                          fontSize: 12)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              if (cats.length > 1)
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    children: [
                      for (final c in cats)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: FilterChip(
                            label: Text(c),
                            selected: _category == c,
                            onSelected: (_) => setState(() => _category = c),
                          ),
                        ),
                    ],
                  ),
                ),
              Expanded(
                child: filtered.isEmpty
                    ? const EmptyView(message: 'موردی در این دسته نیست')
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) {
                          final item = filtered[i];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Chip(
                                        label: Text(item.type == 'podcast'
                                            ? 'پادکست'
                                            : item.type == 'video'
                                                ? 'ویدیو'
                                                : 'متن'),
                                        visualDensity: VisualDensity.compact,
                                      ),
                                      const Spacer(),
                                      if (item.duration != null)
                                        Text(item.duration!,
                                            style: const TextStyle(
                                                color: AppColors.muted,
                                                fontSize: 12)),
                                    ],
                                  ),
                                  Text(item.title,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 6),
                                  Text(item.description,
                                      style: const TextStyle(
                                          color: AppColors.muted, fontSize: 13)),
                                  const SizedBox(height: 10),
                                  if (item.type == 'text')
                                    OutlinedButton.icon(
                                      onPressed: () => _readText(item),
                                      icon: const Icon(Icons.menu_book),
                                      label: const Text('مطالعه آموزش'),
                                    )
                                  else
                                    FilledButton.icon(
                                      onPressed: item.src == null ||
                                              item.src!.isEmpty
                                          ? null
                                          : () => _openMedia(item),
                                      icon: const Icon(Icons.play_arrow),
                                      label: Text(item.type == 'podcast'
                                          ? 'پخش پادکست'
                                          : 'پخش ویدیو'),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
