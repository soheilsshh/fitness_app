import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../application/programs_controller.dart';
import '../data/program_models.dart';

class ProgramDetailScreen extends ConsumerWidget {
  const ProgramDetailScreen({super.key, required this.id});
  final int id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(programDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('جزئیات برنامه')),
      body: AsyncValueWidget<ProgramDetail>(
        value: async,
        onRetry: () => ref.invalidate(programDetailProvider(id)),
        data: (d) => _Detail(d: d),
      ),
    );
  }
}

class _Detail extends StatelessWidget {
  const _Detail({required this.d});
  final ProgramDetail d;

  @override
  Widget build(BuildContext context) {
    final days = d.planByDay.entries.toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(d.title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: [
            if (d.goal.isNotEmpty) _chip(d.goal),
            if (d.level.isNotEmpty) _chip(d.level),
            if (d.coach.isNotEmpty) _chip('مربی: ${d.coach}'),
            ...d.tags.map(_chip),
          ],
        ),
        const SizedBox(height: 12),
        Text('${d.remainingDays} روز از ${d.durationDays} روز باقی‌مانده',
            style: const TextStyle(color: AppColors.muted)),
        const Divider(height: 28),
        if (days.isEmpty)
          const Text('جزئیات روزانه‌ای ثبت نشده است.',
              style: TextStyle(color: AppColors.muted))
        else
          ...days.map((e) => _DaySection(day: e.key, plan: e.value)),
      ],
    );
  }

  Widget _chip(String label) => Chip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        backgroundColor: AppColors.surfaceVariant,
        side: const BorderSide(color: AppColors.border),
      );
}

class _DaySection extends StatelessWidget {
  const _DaySection({required this.day, required this.plan});
  final String day;
  final DayPlan plan;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(day, style: const TextStyle(fontWeight: FontWeight.bold)),
            if (plan.workout != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.fitness_center,
                      size: 18, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text(plan.workout!.title.isEmpty
                      ? 'تمرین'
                      : plan.workout!.title),
                ],
              ),
              ...plan.workout!.exercises.map(
                (ex) => Padding(
                  padding: const EdgeInsets.only(top: 6, right: 24),
                  child: Text(
                    '• ${ex.name}  ${ex.sets}×${ex.reps}',
                    style: const TextStyle(color: AppColors.muted, fontSize: 13),
                  ),
                ),
              ),
            ],
            if (plan.nutrition != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.restaurant,
                      size: 18, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text('تغذیه · ${plan.nutrition!.caloriesTarget} کالری'),
                ],
              ),
              ...plan.nutrition!.meals.map(
                (m) => Padding(
                  padding: const EdgeInsets.only(top: 6, right: 24),
                  child: Text(
                    '• ${m.title}: ${m.detail}',
                    style: const TextStyle(color: AppColors.muted, fontSize: 13),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
