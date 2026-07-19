import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../../../core/widgets/state_views.dart';
import '../application/programs_controller.dart';
import '../data/program_models.dart';

class ProgramDetailScreen extends ConsumerStatefulWidget {
  const ProgramDetailScreen({super.key, required this.id});
  final int id;

  @override
  ConsumerState<ProgramDetailScreen> createState() =>
      _ProgramDetailScreenState();
}

class _ProgramDetailScreenState extends ConsumerState<ProgramDetailScreen> {
  String? _selectedDay;
  bool _logging = false;
  int _tab = 0; // 0 workout, 1 nutrition

  Future<void> _logWorkout(ProgramDetail d, String dayKey) async {
    final workout = d.planByDay[dayKey]?.workout;
    if (workout == null) return;
    setState(() => _logging = true);
    try {
      final dio = ref.read(dioProvider);
      await dio.post(ApiPaths.meWorkoutSessions, data: {
        'subscriptionId': d.id,
        'dayKey': dayKey,
        'durationMin': workout.durationMin,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تمرین در تاریخچه ثبت شد')),
        );
      }
    } on DioException catch (e) {
      final msg = ApiException.fromDio(e).message;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg)),
        );
      }
    } finally {
      if (mounted) setState(() => _logging = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(programDetailProvider(widget.id));
    return FitinoPushScaffold(
      title: 'جزئیات برنامه',
      description: 'تمرین و تغذیه روزانه',
      body: AsyncValueWidget<ProgramDetail>(
        value: async,
        onRetry: () => ref.invalidate(programDetailProvider(widget.id)),
        data: (d) {
          final days = d.planByDay.keys.toList();
          final day = _selectedDay ?? (days.isNotEmpty ? days.first : null);
          final plan = day == null ? null : d.planByDay[day];

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(d.title,
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold)),
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
              Text(
                '${d.remainingDays} روز از ${d.durationDays} روز باقی‌مانده',
                style: const TextStyle(color: AppColors.muted),
              ),
              if (days.isNotEmpty) ...[
                const SizedBox(height: 16),
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      for (final key in days)
                        Padding(
                          padding: const EdgeInsets.only(left: 6),
                          child: FitinoChoiceChip(
                            label: _dayLabel(key),
                            selected: day == key,
                            onSelected: (_) =>
                                setState(() => _selectedDay = key),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    FitinoChoiceChip(
                      label: 'تمرین',
                      icon: Icons.fitness_center_rounded,
                      selected: _tab == 0,
                      onSelected: (_) => setState(() => _tab = 0),
                    ),
                    const SizedBox(width: 8),
                    FitinoChoiceChip(
                      label: 'تغذیه',
                      icon: Icons.restaurant_rounded,
                      selected: _tab == 1,
                      onSelected: (_) => setState(() => _tab = 1),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (_tab == 0 && plan?.workout != null) ...[
                  FitinoPanelCard(
                    title: plan!.workout!.title.isEmpty
                        ? 'تمرین'
                        : plan.workout!.title,
                    icon: Icons.fitness_center_rounded,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (plan.workout!.durationMin > 0)
                          Text('${plan.workout!.durationMin} دقیقه',
                              style: const TextStyle(
                                  color: AppColors.muted, fontSize: 12)),
                        const SizedBox(height: 12),
                        ...plan.workout!.exercises.map(
                          (ex) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: ex.imageUrl.isEmpty
                                ? const Icon(Icons.fitness_center,
                                    color: AppColors.brandMid)
                                : ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      ex.imageUrl,
                                      width: 48,
                                      height: 48,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, _, _) =>
                                          const Icon(Icons.fitness_center),
                                    ),
                                  ),
                            title: Text(ex.name),
                            subtitle: Text('${ex.sets}×${ex.reps}'),
                          ),
                        ),
                        const SizedBox(height: 8),
                        FilledButton.icon(
                          onPressed: _logging || day == null
                              ? null
                              : () => _logWorkout(d, day),
                          icon: _logging
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2),
                                )
                              : const Icon(Icons.check),
                          label: Text(_logging
                              ? 'در حال ثبت…'
                              : 'ثبت این جلسه در تاریخچه'),
                        ),
                      ],
                    ),
                  ),
                ] else if (_tab == 0)
                  const EmptyView(message: 'تمرینی برای این روز نیست'),
                if (_tab == 1 && plan?.nutrition != null) ...[
                  FitinoPanelCard(
                    title: 'هدف کالری: ${plan!.nutrition!.caloriesTarget}',
                    icon: Icons.restaurant_rounded,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (plan.nutrition!.proteinTarget.isNotEmpty)
                          Text('پروتئین: ${plan.nutrition!.proteinTarget}',
                              style: const TextStyle(color: AppColors.muted)),
                        const SizedBox(height: 12),
                        ...plan.nutrition!.meals.map(
                          (m) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(m.title),
                            subtitle: Text(m.detail),
                            trailing: Text('${m.calories.toInt()} کال'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else if (_tab == 1)
                  const EmptyView(message: 'تغذیه‌ای برای این روز نیست'),
              ] else
                const Text('جزئیات روزانه‌ای ثبت نشده است.',
                    style: TextStyle(color: AppColors.muted)),
            ],
          );
        },
      ),
    );
  }

  Widget _chip(String label) => Chip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        backgroundColor: AppColors.surfaceVariant,
        side: const BorderSide(color: AppColors.border),
      );

  String _dayLabel(String key) {
    const map = {
      'sat': 'شنبه',
      'sun': 'یکشنبه',
      'mon': 'دوشنبه',
      'tue': 'سه‌شنبه',
      'wed': 'چهارشنبه',
      'thu': 'پنجشنبه',
      'fri': 'جمعه',
    };
    return map[key] ?? key;
  }
}
