import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'token_store.g.dart';

/// Persists the auth session in the platform secure storage. Mirrors the keys
/// used by the web app's `lib/auth/session.js` (access/refresh/role/name/
/// profile-complete) so the same backend contract is honoured.
class TokenStore {
  TokenStore(this._storage);

  final FlutterSecureStorage _storage;

  static const _kAccess = 'access_token';
  static const _kRefresh = 'refresh_token';
  static const _kRole = 'user_role';
  static const _kName = 'user_name';
  static const _kProfileComplete = 'profile_complete';

  Future<String?> accessToken() => _storage.read(key: _kAccess);
  Future<String?> refreshToken() => _storage.read(key: _kRefresh);

  Future<void> save({
    required String accessToken,
    String? refreshToken,
    String? role,
    String? name,
    bool? isProfileComplete,
  }) async {
    await _storage.write(key: _kAccess, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _kRefresh, value: refreshToken);
    }
    if (role != null) await _storage.write(key: _kRole, value: role);
    if (name != null) await _storage.write(key: _kName, value: name);
    if (isProfileComplete != null) {
      await _storage.write(
        key: _kProfileComplete,
        value: isProfileComplete ? '1' : '0',
      );
    }
  }

  Future<({String? role, String? name, bool profileComplete})> readMeta() async {
    final role = await _storage.read(key: _kRole);
    final name = await _storage.read(key: _kName);
    final complete = await _storage.read(key: _kProfileComplete);
    return (role: role, name: name, profileComplete: complete == '1');
  }

  Future<void> clear() async {
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
    await _storage.delete(key: _kRole);
    await _storage.delete(key: _kName);
    await _storage.delete(key: _kProfileComplete);
  }
}

@Riverpod(keepAlive: true)
TokenStore tokenStore(Ref ref) {
  return TokenStore(const FlutterSecureStorage());
}
