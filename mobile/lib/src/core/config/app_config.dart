/// App-wide configuration. Override at build/run time with
/// `--dart-define=API_BASE_URL=...` (e.g. for local backend).
class AppConfig {
  const AppConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.fitinoo.ir',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
