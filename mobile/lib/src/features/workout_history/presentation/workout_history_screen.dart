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

class WorkoutSessionItem {
  const WorkoutSessionItem({
    required this.id,
    required this.title,
    required this.date,
    this.durationMinutes,
  });

  final int id;
  final String title;
  final String date;
  final int? durationMinutes;

  factory WorkoutSessionItem.fromJson(Map<String, dynamic> json) =>
      WorkoutSessionItem(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ??
            json['programTitle'] as String? ??
            json['name'] as String? ??
            'جلسه تمرین',
        date: json['date'] as String? ??
            json['performedAt'] as String? ??
            json['createdAt'] as String? ??
            '',
        durationMinutes: (json['durationMinutes'] as num?)?.toInt() ??
            (json['duration'] as num?)?.toInt(),
      );
}

class WorkoutHistoryRepository {
  WorkoutHistoryRepository(this._dio);
  final Dio _dio;

  Future<List<WorkoutSessionItem>> list() async {
    try {
      final res = await _dio.get(ApiPaths.meWorkoutHistory);
      final data = res.data;
      final list = data is Map
          ? (data['items'] as List? ?? data['sessions'] as List? ?? const [])
          : (data as List? ?? const []);
      return list
          .map((e) =>
              WorkoutSessionItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final workoutHistoryRepositoryProvider =
    Provider((ref) => WorkoutHistoryRepository(ref.watch(dioProvider)));

final workoutHistoryProvider =
    FutureProvider.autoDispose<List<WorkoutSessionItem>>((ref) {
  return ref.watch(workoutHistoryRepositoryProvider).list();
});

class WorkoutHistoryScreen extends ConsumerWidget {
  const WorkoutHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(workoutHistoryProvider);
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.brandMid,
        onRefresh: () async => ref.refresh(workoutHistoryProvider.future),
        child: AsyncValueWidget<List<WorkoutSessionItem>>(
          value: async,
          onRetry: () => ref.invalidate(workoutHistoryProvider),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                children: const [
                  FitinoPageHeader(
                    title: 'تاریخچه تمرینات',
                    description: 'جلسات ثبت‌شده شما',
                  ),
                  SizedBox(height: 80),
                  EmptyView(
                    message: 'هنوز جلسه تمرینی ثبت نشده',
                    icon: Icons.history,
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              itemCount: items.length + 1,
              separatorBuilder: (_, i) =>
                  SizedBox(height: i == 0 ? 12 : 8),
              itemBuilder: (_, i) {
                if (i == 0) {
                  return const FitinoPageHeader(
                    title: 'تاریخچه تمرینات',
                    description: 'جلسات ثبت‌شده شما',
                  );
                }
                final s = items[i - 1];
                return FitinoPanelCard(
                  padding: EdgeInsets.zero,
                  child: ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: AppColors.surfaceVariant,
                      ),
                      child: const Icon(Icons.fitness_center,
                          color: AppColors.brandMid, size: 20),
                    ),
                    title: Text(s.title),
                    subtitle: Text(s.date,
                        style: const TextStyle(color: AppColors.muted)),
                    trailing: s.durationMinutes != null
                        ? Text('${s.durationMinutes} دقیقه')
                        : null,
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
