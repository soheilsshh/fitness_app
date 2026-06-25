import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/token_store.dart';
import '../../features/auth/application/auth_controller.dart';

/// Attaches the bearer token to every request and reacts to 401 by clearing the
/// session and forcing the auth controller to re-evaluate (which drives the
/// router back to login). Mirrors `frontend/src/lib/axios/client.js`.
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._ref);

  final Ref _ref;
  bool _handlingExpiry = false;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _ref.read(tokenStoreProvider).accessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final status = err.response?.statusCode;
    final path = err.requestOptions.path;
    final isAuthEndpoint = path.contains('/auth/');

    if (status == 401 && !isAuthEndpoint && !_handlingExpiry) {
      _handlingExpiry = true;
      await _ref.read(tokenStoreProvider).clear();
      // Rebuild the auth controller -> no token -> unauthenticated -> redirect.
      _ref.invalidate(authControllerProvider);
      _handlingExpiry = false;
    }
    handler.next(err);
  }
}
