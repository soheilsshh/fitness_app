import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../application/programs_controller.dart';
import '../data/program_models.dart';

class ProgramsScreen extends ConsumerWidget {
  const ProgramsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myProgramsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('برنامه‌های من')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(myProgramsProvider.future),
        child: AsyncValueWidget<List<ProgramSummary>>(
          value: async,
          onRetry: () => ref.invalidate(myProgramsProvider),
          data: (programs) {
            if (programs.isEmpty) {
              return const EmptyView(message: 'هنوز برنامه‌ای ندارید.');
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: programs.length,
              itemBuilder: (_, i) => _ProgramCard(p: programs[i]),
              separatorBuilder: (_, _) => const SizedBox(height: 12),
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
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/student/programs/${p.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                child: Icon(
                  isWorkout ? Icons.fitness_center : Icons.restaurant,
                  color: AppColors.primary,
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
