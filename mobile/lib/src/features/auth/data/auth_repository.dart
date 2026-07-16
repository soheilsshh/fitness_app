import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'auth_models.dart';

part 'auth_repository.g.dart';

/// Thin wrapper over the auth endpoints. Throws [ApiException] on failure.
class AuthRepository {
  AuthRepository(this._dio);

  final Dio _dio;

  Future<bool> checkPhone(String phone) async {
    final res = await _guard(
      () => _dio.post(ApiPaths.checkPhone, data: {'phone': phone}),
    );
    final data = res.data;
    if (data is Map) return data['exists'] == true;
    return false;
  }

  Future<AuthResponse> loginWithPassword(
    String identifier,
    String password,
  ) async {
    return _post(ApiPaths.loginPassword, {
      'identifier': identifier,
      'password': password,
    });
  }

  Future<AuthResponse> register({
    required String phone,
    required String password,
    required String code,
    String name = '',
    String email = '',
  }) async {
    return _post(ApiPaths.register, {
      if (name.isNotEmpty) 'name': name,
      if (email.isNotEmpty) 'email': email,
      'phone': phone,
      'password': password,
      'code': code,
    });
  }

  Future<AuthResponse> registerCoach({
    required String name,
    required String phone,
    required String password,
  }) async {
    return _post(ApiPaths.registerCoach, {
      'name': name,
      'phone': phone,
      'password': password,
    });
  }

  Future<void> requestOtp(String phone) async {
    await _guard(() => _dio.post(ApiPaths.otpRequest, data: {'phone': phone}));
  }

  Future<AuthResponse> verifyOtp(String phone, String code) async {
    return _post(ApiPaths.otpVerify, {'phone': phone, 'code': code});
  }

  Future<void> forgotSendOtp(String phone) async {
    await _guard(
      () => _dio.post(ApiPaths.forgotSendOtp, data: {'phone': phone}),
    );
  }

  Future<void> resetPassword({
    required String phone,
    required String code,
    required String newPassword,
  }) async {
    await _guard(
      () => _dio.post(ApiPaths.resetPassword, data: {
        'phone': phone,
        'code': code,
        'new_password': newPassword,
      }),
    );
  }

  Future<AuthUser> me() async {
    final res = await _guard(() => _dio.get(ApiPaths.authMe));
    return AuthUser.fromJson(Map<String, dynamic>.from(res.data as Map));
  }

  Future<void> logout(String? refreshToken) async {
    try {
      await _dio.post(ApiPaths.logout, data: {'refresh_token': refreshToken});
    } catch (_) {
      // Best-effort: local cleanup happens regardless.
    }
  }

  Future<AuthResponse> _post(String path, Map<String, dynamic> body) async {
    final res = await _guard(() => _dio.post(path, data: body));
    return AuthResponse.fromJson(Map<String, dynamic>.from(res.data as Map));
  }

  Future<Response> _guard(Future<Response> Function() run) async {
    try {
      return await run();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

@Riverpod(keepAlive: true)
AuthRepository authRepository(Ref ref) {
  return AuthRepository(ref.watch(dioProvider));
}
