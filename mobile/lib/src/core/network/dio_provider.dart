import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../config/app_config.dart';
import 'auth_interceptor.dart';
import 'logging_interceptor.dart';

part 'dio_provider.g.dart';

@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {'Content-Type': 'application/json'},
      // Let us inspect non-2xx ourselves rather than only throwing.
      validateStatus: (s) => s != null && s < 400,
    ),
  );
  dio.interceptors.add(AuthInterceptor(ref));
  // Added last so it logs the final outgoing request (with auth header applied).
  dio.interceptors.add(LoggingInterceptor());
  return dio;
}
