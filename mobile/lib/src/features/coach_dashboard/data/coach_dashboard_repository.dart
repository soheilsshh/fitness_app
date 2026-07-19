import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'coach_dashboard_models.dart';

part 'coach_dashboard_repository.g.dart';

class CoachDashboardRepository {
  CoachDashboardRepository(this._dio);
  final Dio _dio;

  Future<CoachStats> stats() async {
    try {
      final res = await _dio.get(ApiPaths.coachDashboardStats);
      return CoachStats.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<CoachRecentStudent>> recentStudents() async {
    try {
      final res = await _dio.get(ApiPaths.coachDashboardRecent,
          queryParameters: {'limit': 5});
      final data = res.data;
      final list = data is List
          ? data
          : (data is Map ? (data['items'] as List? ?? const []) : const []);
      return list
          .map((e) =>
              CoachRecentStudent.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<CoachTopStudent>> topStudents({int limit = 3}) async {
    try {
      final res = await _dio.get(ApiPaths.coachDashboardTop,
          queryParameters: {'limit': limit});
      final data = res.data;
      final list = data is List
          ? data
          : (data is Map ? (data['items'] as List? ?? const []) : const []);
      return list
          .map((e) =>
              CoachTopStudent.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<CoachProgressPoint>> progressSeries({int days = 30}) async {
    try {
      final res = await _dio.get(ApiPaths.coachDashboardProgress,
          queryParameters: {'days': days});
      final data = res.data;
      final list = data is List
          ? data
          : (data is Map ? (data['items'] as List? ?? const []) : const []);
      return list
          .map((e) =>
              CoachProgressPoint.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

@riverpod
CoachDashboardRepository coachDashboardRepository(Ref ref) {
  return CoachDashboardRepository(ref.watch(dioProvider));
}

typedef CoachDashboardData = ({
  CoachStats stats,
  List<CoachRecentStudent> recent,
});

@riverpod
Future<CoachDashboardData> coachDashboardData(Ref ref) async {
  final repo = ref.watch(coachDashboardRepositoryProvider);
  final stats = await repo.stats();
  final recent = await repo.recentStudents();
  return (stats: stats, recent: recent);
}
