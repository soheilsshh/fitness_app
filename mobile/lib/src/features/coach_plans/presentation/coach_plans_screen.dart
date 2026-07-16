import 'package:flutter/material.dart';
import '../../../core/widgets/fitino_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../data/coach_plans_repository.dart';

String planTypeFa(String type) {
  switch (type) {
    case 'both':
      return 'تمرین + تغذیه';
    case 'workout':
      return 'تمرین';
    case 'nutrition':
      return 'تغذیه';
    default:
      return type;
  }
}

class CoachPlansScreen extends ConsumerWidget {
  const CoachPlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachPlansProvider);
    return FitinoPushScaffold(
      title: 'پلن‌های من',
      description: 'پلن‌های قابل فروش شما',
      floatingActionButton: FitinoExtendedFab(
        onPressed: () => context.push('/coach/plans/new'),
        icon: Icons.add,
        label: 'پلن جدید',
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(coachPlansProvider.future),
        child: AsyncValueWidget<CoachPlansPage>(
          value: async,
          onRetry: () => ref.invalidate(coachPlansProvider),
          data: (page) {
            if (page.items.isEmpty) {
              return const EmptyView(message: 'هنوز پلنی نساخته‌اید.');
            }
            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: page.items.length,
              itemBuilder: (_, i) {
                final p = page.items[i];
                final price = p.discountPrice > 0 ? p.discountPrice : p.price;
                return Padding(padding: const EdgeInsets.only(bottom: 8), child: FitinoPanelCard(padding: EdgeInsets.zero, child: ListTile(
                    title: Text(p.title),
                    subtitle: Text(
                      [
                        planTypeFa(p.planType),
                        if (p.durationDays > 0) '${p.durationDays} روز',
                        if (p.isPopular) 'محبوب',
                      ].join(' · '),
                      style: const TextStyle(color: AppColors.muted),
                    ),
                    trailing: Text(
                      '${price.toString()} تومان',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    onTap: () => context.push('/coach/plans/${p.id}'),
                  )));
              },
            );
          },
        ),
      ),
    );
  }
}
