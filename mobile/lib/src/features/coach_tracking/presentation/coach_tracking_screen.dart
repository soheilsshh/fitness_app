import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../../../core/widgets/state_views.dart';
import '../../tracking/data/tracking_models.dart';
import '../data/coach_tracking_repository.dart';

String _assetUrl(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

class CoachTrackingScreen extends ConsumerWidget {
  const CoachTrackingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachTrackingListProvider);
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.brandMid,
        onRefresh: () async => ref.refresh(coachTrackingListProvider.future),
        child: AsyncValueWidget<List<CoachTrackingStudentItem>>(
          value: async,
          onRetry: () => ref.invalidate(coachTrackingListProvider),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                children: const [
                  FitinoPageHeader(
                    title: 'پایش شاگردان',
                    description: 'وزن و عکس‌های دوره‌ای',
                  ),
                  SizedBox(height: 48),
                  EmptyView(message: 'شاگردی برای پایش نیست.'),
                ],
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              itemCount: items.length + 1,
              itemBuilder: (_, i) {
                if (i == 0) {
                  return const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: FitinoPageHeader(
                      title: 'پایش شاگردان',
                      description: 'وزن و عکس‌های دوره‌ای',
                    ),
                  );
                }
                final s = items[i - 1];
                final overdue = s.weightOverdue || s.photosOverdue;
                return Padding(padding: const EdgeInsets.only(bottom: 8), child: FitinoPanelCard(padding: EdgeInsets.zero, child: ListTile(
                    title: Text(s.fullName),
                    subtitle: Text(
                      [
                        s.phone,
                        if (s.nextDueDate != null) 'موعد: ${s.nextDueDate}',
                        if (overdue) 'تأخیر ${s.maxOverdueDays} روز',
                      ].join(' · '),
                      style: TextStyle(
                        color: overdue ? AppColors.destructive : AppColors.muted,
                      ),
                    ),
                    trailing: const Icon(Icons.chevron_left),
                    onTap: () => context.push('/coach/tracking/${s.id}'),
                  )));
              },
            );
          },
        ),
      ),
    );
  }
}

class CoachTrackingDetailScreen extends ConsumerWidget {
  const CoachTrackingDetailScreen({super.key, required this.studentId});
  final int studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachTrackingDetailProvider(studentId));
    return FitinoPushScaffold(
      title: 'پایش شاگرد',
      body: AsyncValueWidget<CoachTrackingDetail>(
        value: async,
        onRetry: () =>
            ref.invalidate(coachTrackingDetailProvider(studentId)),
        data: (d) {
          final t = d.tracking;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(d.fullName,
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              Text(d.phone, style: const TextStyle(color: AppColors.muted)),
              if (t.nextDueDate != null) ...[
                const SizedBox(height: 8),
                Chip(label: Text('موعد بعدی: ${t.nextDueDate}')),
              ],
              if (t.alerts.isNotEmpty) ...[
                const SizedBox(height: 12),
                ...t.alerts.map(
                  (a) => FitinoPanelCard(padding: EdgeInsets.zero, child: ListTile(
                      leading: const Icon(Icons.warning_amber,
                          color: AppColors.destructive),
                      title: Text(a.message),
                    )),
                ),
              ],
              const SizedBox(height: 16),
              const Text('روند وزن',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (t.weightHistory.isEmpty)
                const Text('وزنی ثبت نشده.',
                    style: TextStyle(color: AppColors.muted))
              else
                ...t.weightHistory.reversed.take(12).map(
                      (p) => ListTile(
                        dense: true,
                        title: Text('${p.weight} کیلو'),
                        trailing: Text(p.date,
                            style: const TextStyle(color: AppColors.muted)),
                      ),
                    ),
              const SizedBox(height: 16),
              const Text('عکس‌ها',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...t.photoHistories.map((h) => _PhotoHistoryCard(history: h)),
            ],
          );
        },
      ),
    );
  }
}

class _PhotoHistoryCard extends StatefulWidget {
  const _PhotoHistoryCard({required this.history});
  final PhotoTypeHistory history;

  @override
  State<_PhotoHistoryCard> createState() => _PhotoHistoryCardState();
}

class _PhotoHistoryCardState extends State<_PhotoHistoryCard> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final photos = widget.history.photos;
    final current =
        photos.isEmpty ? null : photos[_index.clamp(0, photos.length - 1)];
    return FitinoPanelCard(padding: const EdgeInsets.all(12), child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.history.label,
                style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            AspectRatio(
              aspectRatio: 3 / 4,
              child: current == null
                  ? const ColoredBox(
                      color: AppColors.surfaceVariant,
                      child: Center(
                          child: Text('بدون عکس',
                              style: TextStyle(color: AppColors.muted))),
                    )
                  : Image.network(
                      _assetUrl(current.url),
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          const Icon(Icons.broken_image),
                    ),
            ),
            if (photos.length > 1)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: _index >= photos.length - 1
                        ? null
                        : () => setState(() => _index++),
                    icon: const Icon(Icons.chevron_right),
                  ),
                  Text('${_index + 1}/${photos.length}'),
                  IconButton(
                    onPressed:
                        _index <= 0 ? null : () => setState(() => _index--),
                    icon: const Icon(Icons.chevron_left),
                  ),
                ],
              ),
          ],
        ));
  }
}
