import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Logs every request, response, and error to the developer console.
///
/// Debug-only: guarded by [kDebugMode] so it is a no-op in profile/release
/// builds and never leaks payloads in production. The `Authorization` header is
/// redacted, and large bodies are truncated to keep the log readable.
class LoggingInterceptor extends Interceptor {
  LoggingInterceptor({this.maxBodyChars = 2000});

  /// Bodies longer than this are truncated in the log (0 = no limit).
  final int maxBodyChars;

  static const _redactedHeaders = {'authorization', 'cookie', 'set-cookie'};

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      final b = StringBuffer()
        ..writeln('--> ${options.method} ${options.uri}');
      _writeHeaders(b, options.headers);
      if (options.data != null) {
        b.writeln('Body: ${_truncate(options.data)}');
      }
      b.write('--> END ${options.method}');
      _log(b.toString());
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      final req = response.requestOptions;
      final b = StringBuffer()
        ..writeln(
            '<-- ${response.statusCode} ${req.method} ${req.uri}')
        ..writeln('Body: ${_truncate(response.data)}')
        ..write('<-- END HTTP');
      _log(b.toString());
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      final req = err.requestOptions;
      final b = StringBuffer()
        ..writeln(
            '<-- ERROR ${err.response?.statusCode ?? ''} ${req.method} ${req.uri}')
        ..writeln('Type: ${err.type}  Message: ${err.message}');
      if (err.response?.data != null) {
        b.writeln('Body: ${_truncate(err.response!.data)}');
      }
      b.write('<-- END ERROR');
      _log(b.toString(), error: err);
    }
    handler.next(err);
  }

  void _writeHeaders(StringBuffer b, Map<String, dynamic> headers) {
    headers.forEach((k, v) {
      final value = _redactedHeaders.contains(k.toLowerCase()) ? '***' : v;
      b.writeln('$k: $value');
    });
  }

  String _truncate(Object? data) {
    final s = data.toString();
    if (maxBodyChars <= 0 || s.length <= maxBodyChars) return s;
    return '${s.substring(0, maxBodyChars)}… (${s.length} chars)';
  }

  void _log(String message, {Object? error}) {
    developer.log(message, name: 'HTTP', error: error);
  }
}
