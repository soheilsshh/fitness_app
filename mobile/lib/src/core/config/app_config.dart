import 'dart:io' show Platform;

/// App-wide configuration. The API base URL is provided at build/run time via
/// `--dart-define=API_BASE_URL=...`. When unset we fall back to a sensible
/// per-platform default for local development:
///   - Android emulator reaches the host machine at 10.0.2.2
///   - everything else (iOS sim, desktop, web) uses localhost
class AppConfig {
  const AppConfig._();

  static const String _defineBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static String get baseUrl {
    if (_defineBaseUrl.isNotEmpty) return _defineBaseUrl;
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:8080';
    } catch (_) {
      // Platform is unavailable on web; fall through to localhost.
    }
    return 'http://localhost:8080';
  }

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
