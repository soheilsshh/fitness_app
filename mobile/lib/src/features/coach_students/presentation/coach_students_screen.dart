import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../../../core/widgets/state_views.dart';
import '../data/coach_students_repository.dart';

class CoachStudentsScreen extends ConsumerStatefulWidget {
  const CoachStudentsScreen({super.key});

  @override
  ConsumerState<CoachStudentsScreen> createState() =>
      _CoachStudentsScreenState();
}

class _CoachStudentsScreenState extends ConsumerState<CoachStudentsScreen> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  String _planTypeFa(String type) {
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

  String _statusFa(String status) {
    switch (status) {
      case 'active':
        return 'فعال';
      case 'pending':
        return 'در انتظار';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(coachStudentsProvider);
    final filter = ref.watch(coachStudentsFilterProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: FitinoPageHeader(
              title: 'شاگردان من',
              description: 'مدیریت برنامه‌ها و وضعیت اشتراک',
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(
                hintText: 'جستجو نام یا موبایل...',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: (v) {
                ref.read(coachStudentsQueryProvider.notifier).set(v.trim());
              },
              onChanged: (v) {
                if (v.trim().isEmpty) {
                  ref.read(coachStudentsQueryProvider.notifier).set('');
                }
              },
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                for (final f in const [
                  ('all', 'همه'),
                  ('active', 'فعال'),
                  ('pending', 'در انتظار'),
                ])
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: FitinoChoiceChip(
                      label: f.$2,
                      selected: filter == f.$1,
                      onSelected: (_) {
                        ref.read(coachStudentsFilterProvider.notifier).set(
                              f.$1,
                            );
                      },
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async =>
                  ref.refresh(coachStudentsProvider.future),
              child: AsyncValueWidget<CoachStudentsPage>(
                value: async,
                onRetry: () => ref.invalidate(coachStudentsProvider),
                data: (page) {
                  if (page.items.isEmpty) {
                    return const EmptyView(message: 'شاگردی یافت نشد.');
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                    itemCount: page.items.length,
                    itemBuilder: (_, i) {
                      final s = page.items[i];
                      return Padding(padding: const EdgeInsets.only(bottom: 8), child: FitinoPanelCard(padding: EdgeInsets.zero, child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppColors.primary.withValues(
                                alpha: 0.15),
                            child: Text(
                              s.fullName.isNotEmpty ? s.fullName[0] : '?',
                              style: const TextStyle(color: AppColors.primary),
                            ),
                          ),
                          title: Text(s.fullName.isEmpty ? 'بدون نام' : s.fullName),
                          subtitle: Text(
                            [
                              s.phone,
                              if (s.planTitle.isNotEmpty) s.planTitle,
                              _planTypeFa(s.planType),
                            ].where((e) => e.isNotEmpty).join(' · '),
                            style: const TextStyle(color: AppColors.muted),
                          ),
                          trailing: Chip(
                            label: Text(_statusFa(s.status),
                                style: const TextStyle(fontSize: 11)),
                            visualDensity: VisualDensity.compact,
                          ),
                          onTap: () =>
                              context.push('/coach/students/${s.id}'),
                        )));
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
