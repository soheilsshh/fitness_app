import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'dashboard_models.dart';

part 'dashboard_repository.g.dart';

class DashboardRepository {
  DashboardRepository(this._dio);
  final Dio _dio;

  Future<DashboardSummary> summary() async {
    try {
      final res = await _dio.get(ApiPaths.meDashboard);
      return DashboardSummary.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<PersonalRecord>> records() async {
    try {
      final res = await _dio.get(ApiPaths.meRecords);
      final list = (res.data as List?) ?? const [];
      return list
          .map((e) => PersonalRecord.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

@riverpod
DashboardRepository dashboardRepository(Ref ref) {
  return DashboardRepository(ref.watch(dioProvider));
}
