import 'package:dio/dio.dart';

/// A user-presentable API error. The [message] is already localized to Persian
/// where a known mapping exists (mirrors the web `translateError.js`).
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'ApiException($statusCode): $message';

  /// Builds an [ApiException] from a Dio error, extracting the backend
  /// `{"error": "..."}` / `{"message": "..."}` body and translating it.
  factory ApiException.fromDio(DioException e) {
    final status = e.response?.statusCode;
    final data = e.response?.data;
    String? raw;
    if (data is Map) {
      raw = (data['error'] ?? data['message'])?.toString();
    }
    if (raw == null || raw.trim().isEmpty) {
      raw = switch (e.type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.receiveTimeout ||
        DioExceptionType.sendTimeout =>
          'ارتباط با سرور بیش از حد طول کشید.',
        DioExceptionType.connectionError =>
          'اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید.',
        _ => 'خطایی رخ داد. لطفاً دوباره تلاش کنید.',
      };
    }
    return ApiException(translateApiError(raw), statusCode: status);
  }
}

/// Maps known backend English error strings to Persian. Mirrors the spirit of
/// `frontend/src/lib/api/translateError.js`.
String translateApiError(String raw) {
  final key = raw.trim().toLowerCase();
  return _messages[key] ?? raw;
}

const Map<String, String> _messages = {
  'invalid credentials': 'ایمیل/شماره یا گذرواژه نادرست است.',
  'email already in use': 'این ایمیل قبلاً ثبت شده است.',
  'phone already in use': 'این شماره قبلاً ثبت شده است.',
  'invalid or expired otp code': 'کد تأیید نادرست یا منقضی شده است.',
  'unauthorized': 'دسترسی غیرمجاز.',
};
