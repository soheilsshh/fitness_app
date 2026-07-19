import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'tracking_models.dart';

class TrackingRepository {
  TrackingRepository(this._dio);
  final Dio _dio;

  Future<TrackingStatus> getStatus() async {
    try {
      final res = await _dio.get(ApiPaths.meTracking);
      return TrackingStatus.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<TrackingStatus> submitWeight(double weight) async {
    try {
      final res = await _dio.post(
        ApiPaths.meTrackingWeight,
        data: {'weight': weight},
      );
      return TrackingStatus.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> uploadPhoto({
    required String path,
    required String type,
  }) async {
    try {
      final form = FormData.fromMap({
        'type': type,
        'photo': await MultipartFile.fromFile(path),
      });
      await _dio.post(ApiPaths.meTrackingPhotos, data: form);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final trackingRepositoryProvider = Provider<TrackingRepository>((ref) {
  return TrackingRepository(ref.watch(dioProvider));
});

final trackingStatusProvider =
    FutureProvider.autoDispose<TrackingStatus>((ref) {
  return ref.watch(trackingRepositoryProvider).getStatus();
});
