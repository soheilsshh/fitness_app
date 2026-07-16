import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../../../core/widgets/state_views.dart';
import '../application/programs_controller.dart';
import '../data/program_models.dart';

class ProgramsScreen extends ConsumerWidget {
  const ProgramsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myProgramsProvider);
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.brandMid,
        onRefresh: () async => ref.refresh(myProgramsProvider.future),
        child: AsyncValueWidget<List<ProgramSummary>>(
          value: async,
          onRetry: () => ref.invalidate(myProgramsProvider),
          data: (programs) {
            if (programs.isEmpty) {
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                children: const [
                  FitinoPageHeader(
                    title: 'برنامه‌های من',
                    description: 'برنامه‌های تمرینی و تغذیه فعال شما',
                  ),
                  SizedBox(height: 48),
                  EmptyView(message: 'هنوز برنامه‌ای ندارید.'),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              itemCount: programs.length + 1,
              itemBuilder: (_, i) {
                if (i == 0) {
                  return const Padding(
                    padding: EdgeInsets.only(bottom: 4),
                    child: FitinoPageHeader(
                      title: 'برنامه‌های من',
                      description: 'برنامه‌های تمرینی و تغذیه فعال شما',
                    ),
                  );
                }
                return _ProgramCard(p: programs[i - 1]);
              },
              separatorBuilder: (_, i) =>
                  SizedBox(height: i == 0 ? 12 : 12),
            );
          },
        ),
      ),
    );
  }
}

class _ProgramCard extends StatelessWidget {
  const _ProgramCard({required this.p});
  final ProgramSummary p;

  @override
  Widget build(BuildContext context) {
    final isWorkout = p.type == 'workout';
    return FitinoPanelCard(
      padding: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => context.push('/student/programs/${p.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: LinearGradient(
                    colors: [
                      AppColors.brandGlow.withValues(alpha: 0.35),
                      AppColors.brandDeep.withValues(alpha: 0.12),
                    ],
                  ),
                ),
                child: Icon(
                  isWorkout ? Icons.fitness_center : Icons.restaurant,
                  color: AppColors.brandDeep,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.title,
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      '${p.remainingDays} روز باقی‌مانده · ${_status(p.status)}',
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left, color: AppColors.muted),
            ],
          ),
        ),
      ),
    );
  }

  String _status(String s) => switch (s) {
        'active' => 'فعال',
        'expired' => 'منقضی',
        'pending' => 'در انتظار',
        _ => s,
      };
}
