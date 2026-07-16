import 'package:flutter/material.dart';
import '../../../core/widgets/fitino_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../data/coach_notifications_repository.dart';

IconData _iconForType(String type) {
  switch (type) {
    case 'ticket':
      return Icons.confirmation_number_outlined;
    case 'tracking':
    case 'alert':
      return Icons.warning_amber_outlined;
    case 'order':
    case 'subscription':
      return Icons.shopping_bag_outlined;
    default:
      return Icons.notifications_outlined;
  }
}

class CoachNotificationsScreen extends ConsumerWidget {
  const CoachNotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachNotificationsProvider);
    return FitinoPushScaffold(
      title: 'اعلان‌ها',
      body: RefreshIndicator(
        onRefresh: () async =>
            ref.refresh(coachNotificationsProvider.future),
        child: AsyncValueWidget<List<CoachNotification>>(
          value: async,
          onRetry: () => ref.invalidate(coachNotificationsProvider),
          data: (items) {
            if (items.isEmpty) {
              return const EmptyView(message: 'اعلانی وجود ندارد.');
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (_, i) {
                final n = items[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  color: n.isRead
                      ? null
                      : AppColors.primary.withValues(alpha: 0.06),
                  child: ListTile(
                    leading: Icon(_iconForType(n.type),
                        color: AppColors.primary),
                    title: Text(n.title,
                        style: TextStyle(
                          fontWeight:
                              n.isRead ? FontWeight.normal : FontWeight.bold,
                        )),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(n.message),
                        if (n.createdAt.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(n.createdAt,
                              style: const TextStyle(
                                  color: AppColors.muted, fontSize: 11)),
                        ],
                      ],
                    ),
                    isThreeLine: true,
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

/// Compact recent notifications block for the coach dashboard.
class CoachNotificationsPreview extends ConsumerWidget {
  const CoachNotificationsPreview({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachNotificationsProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('اعلان‌های اخیر',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const Spacer(),
            TextButton(
              onPressed: () => context.push('/coach/notifications'),
              child: const Text('همه'),
            ),
          ],
        ),
        async.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(12),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, _) => const Text('بارگذاری اعلان‌ها ناموفق بود.',
              style: TextStyle(color: AppColors.muted)),
          data: (items) {
            if (items.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text('اعلانی نیست.',
                    style: TextStyle(color: AppColors.muted)),
              );
            }
            return Column(
              children: items.take(5).map((n) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 6),
                  child: ListTile(
                    dense: true,
                    leading: Icon(_iconForType(n.type), size: 20),
                    title: Text(n.title),
                    subtitle: Text(n.message,
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    onTap: () => context.push('/coach/notifications'),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}
