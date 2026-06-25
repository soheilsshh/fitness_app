import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'food_models.dart';

part 'food_repository.g.dart';

class FoodRepository {
  FoodRepository(this._dio);
  final Dio _dio;

  Future<List<Food>> searchFoods({String query = '', int limit = 30}) async {
    try {
      final res = await _dio.get(ApiPaths.userFoods, queryParameters: {
        if (query.isNotEmpty) 'q': query,
        'limit': limit,
      });
      final data = res.data;
      // Endpoint may return either a bare list or a paginated object.
      if (data is List) {
        return data
            .map((e) => Food.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
      return FoodListResponse.fromJson(Map<String, dynamic>.from(data as Map))
          .items;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<DailyFoodLog> logsByDate(String isoDate) async {
    try {
      final res = await _dio
          .get(ApiPaths.userFoodLogs, queryParameters: {'date': isoDate});
      return DailyFoodLog.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> createLog({
    required String logDate,
    int? foodId,
    required String foodName,
    required String quantity,
    double? multiplier,
  }) async {
    try {
      await _dio.post(ApiPaths.userFoodLogs, data: {
        'logDate': logDate,
        // ignore: use_null_aware_elements
        if (foodId != null) 'foodId': foodId,
        'foodName': foodName,
        'quantity': quantity,
        // ignore: use_null_aware_elements
        if (multiplier != null) 'multiplier': multiplier,
      });
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> deleteLog(int id) async {
    try {
      await _dio.delete('${ApiPaths.userFoodLogs}/$id');
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

@riverpod
FoodRepository foodRepository(Ref ref) {
  return FoodRepository(ref.watch(dioProvider));
}
