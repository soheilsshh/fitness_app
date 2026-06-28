import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'profile_models.dart';

part 'profile_repository.g.dart';

class ProfileRepository {
  ProfileRepository(this._dio);
  final Dio _dio;

  Future<MeProfile> getProfile() async {
    try {
      final res = await _dio.get(ApiPaths.me);
      return MeProfile.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<MeProfile> updateProfile(Map<String, dynamic> patch) async {
    try {
      final res = await _dio.patch(ApiPaths.me, data: patch);
      return MeProfile.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  /// Uploads one body photo (multipart `file` + `type`) and returns the
  /// created [MePhoto]. Mirrors web's `POST /me/body-photos`.
  Future<MePhoto> uploadBodyPhoto(String type, String filePath) async {
    try {
      final form = FormData.fromMap({
        'type': type,
        'file': await MultipartFile.fromFile(filePath),
      });
      final res = await _dio.post(ApiPaths.bodyPhotos, data: form);
      return MePhoto.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> changePassword(String current, String next) async {
    try {
      await _dio.post(ApiPaths.changePassword, data: {
        'currentPassword': current,
        'newPassword': next,
      });
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

@riverpod
ProfileRepository profileRepository(Ref ref) {
  return ProfileRepository(ref.watch(dioProvider));
}

@riverpod
Future<MeProfile> myProfile(Ref ref) {
  return ref.watch(profileRepositoryProvider).getProfile();
}
