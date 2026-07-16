import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../data/coach_students_repository.dart';

const _dayLabels = {
  'sat': 'شنبه',
  'sun': 'یکشنبه',
  'mon': 'دوشنبه',
  'tue': 'سه‌شنبه',
  'wed': 'چهارشنبه',
  'thu': 'پنجشنبه',
  'fri': 'جمعه',
};

class CoachStudentDetailScreen extends ConsumerWidget {
  const CoachStudentDetailScreen({super.key, required this.id});
  final int id;

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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentAsync = ref.watch(coachStudentDetailProvider(id));
    final programsAsync = ref.watch(coachStudentProgramsProvider(id));

    return Scaffold(
      appBar: AppBar(title: const Text('جزئیات شاگرد')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(coachStudentDetailProvider(id));
          ref.invalidate(coachStudentProgramsProvider(id));
          await ref.read(coachStudentDetailProvider(id).future);
        },
        child: AsyncValueWidget<CoachStudentDetail>(
          value: studentAsync,
          onRetry: () => ref.invalidate(coachStudentDetailProvider(id)),
          data: (s) {
            final isPending = s.status == 'pending';
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        s.fullName.isEmpty ? 'بدون نام' : s.fullName,
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Chip(
                      label: Text(isPending ? 'در انتظار' : 'فعال'),
                      backgroundColor: isPending
                          ? Colors.amber.withValues(alpha: 0.15)
                          : AppColors.primary.withValues(alpha: 0.15),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _info('موبایل', s.phone),
                if (s.email.isNotEmpty) _info('ایمیل', s.email),
                _info('پلن', s.planTitle.isEmpty ? '—' : s.planTitle),
                _info('نوع پلن', _planTypeFa(s.planType)),
                if (s.heightCm != null)
                  _info('قد', '${s.heightCm!.round()} سانتی‌متر'),
                if (s.weightKg != null)
                  _info('وزن', '${s.weightKg} کیلوگرم'),
                if (s.remainingDays > 0)
                  _info('روز باقی‌مانده', '${s.remainingDays}'),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (!isPending)
                      OutlinedButton.icon(
                        onPressed: () =>
                            context.push('/coach/students/$id/workout'),
                        icon: const Icon(Icons.fitness_center, size: 18),
                        label: Text(s.hasWorkoutProgram
                            ? 'ویرایش تمرین'
                            : 'برنامه تمرین'),
                      ),
                    FilledButton.icon(
                      onPressed: () =>
                          context.push('/coach/students/$id/nutrition'),
                      icon: const Icon(Icons.restaurant, size: 18),
                      label: Text(s.hasNutritionProgram
                          ? 'ویرایش تغذیه'
                          : 'برنامه غذایی'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () =>
                          context.push('/coach/tracking/$id'),
                      icon: const Icon(Icons.monitor_heart_outlined, size: 18),
                      label: const Text('پایش'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Text('برنامه فعلی',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                programsAsync.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (e, _) => Text('$e'),
                  data: (p) {
                    if (p.planByDay.isEmpty) {
                      return const Card(
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Text('هنوز برنامه‌ای تخصیص داده نشده است.',
                              style: TextStyle(color: AppColors.muted)),
                        ),
                      );
                    }
                    return Column(
                      children: p.planByDay.entries.map((e) {
                        final day = e.key;
                        final dayMap = Map<String, dynamic>.from(e.value as Map);
                        final workout = dayMap['workout'];
                        final nutrition = dayMap['nutrition'];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ExpansionTile(
                            title: Text(_dayLabels[day] ?? day),
                            children: [
                              if (workout is Map) ...[
                                ListTile(
                                  dense: true,
                                  title: Text(
                                      'تمرین: ${workout['title'] ?? 'بدون عنوان'}'),
                                  subtitle: Text(
                                    '${(workout['exercises'] as List? ?? const []).length} حرکت · ${workout['durationMin'] ?? 0} دقیقه',
                                  ),
                                ),
                              ],
                              if (nutrition is Map) ...[
                                ListTile(
                                  dense: true,
                                  title: Text(
                                    'تغذیه: ${nutrition['caloriesTarget'] ?? 0} کالری',
                                  ),
                                  subtitle: Text(
                                    'پروتئین: ${nutrition['proteinTarget'] ?? '—'} · ${(nutrition['meals'] as List? ?? const []).length} وعده',
                                  ),
                                ),
                              ],
                              if (workout == null && nutrition == null)
                                const ListTile(
                                  dense: true,
                                  title: Text('بدون محتوا',
                                      style: TextStyle(color: AppColors.muted)),
                                ),
                            ],
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _info(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: const TextStyle(color: AppColors.muted)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
