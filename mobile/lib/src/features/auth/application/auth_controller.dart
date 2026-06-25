import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/storage/token_store.dart';
import '../data/auth_models.dart';
import '../data/auth_repository.dart';
import 'roles.dart';
import 'session.dart';

part 'auth_controller.g.dart';

/// Holds the auth state (`Session?`). `null` data means unauthenticated.
/// On build it hydrates from secure storage so a returning user stays logged in.
@Riverpod(keepAlive: true)
class AuthController extends _$AuthController {
  @override
  Future<Session?> build() async {
    final store = ref.watch(tokenStoreProvider);
    final token = await store.accessToken();
    if (token == null || token.isEmpty) return null;

    // Trust stored metadata first so we render instantly even when offline,
    // then opportunistically refresh from /auth/me.
    final meta = await store.readMeta();
    var session = Session(
      role: AppRole.fromString(meta.role),
      name: meta.name ?? '',
      isProfileComplete: meta.profileComplete,
    );

    try {
      final user = await ref.read(authRepositoryProvider).me();
      await store.save(
        accessToken: token,
        role: user.role,
        name: user.name,
        isProfileComplete: user.isProfileComplete,
      );
      session = _sessionFromUser(user);
    } catch (_) {
      // Keep the stored session; the interceptor handles a real 401.
    }
    return session;
  }

  Future<void> loginWithPassword(String identifier, String password) async {
    await _run(
      () => ref.read(authRepositoryProvider).loginWithPassword(identifier, password),
    );
  }

  Future<void> verifyOtp(String phone, String code) async {
    await _run(() => ref.read(authRepositoryProvider).verifyOtp(phone, code));
  }

  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    await _run(
      () => ref.read(authRepositoryProvider).register(
            name: name,
            email: email,
            phone: phone,
            password: password,
          ),
    );
  }

  Future<void> logout() async {
    final store = ref.read(tokenStoreProvider);
    final refresh = await store.refreshToken();
    await ref.read(authRepositoryProvider).logout(refresh);
    await store.clear();
    state = const AsyncData(null);
  }

  /// Runs an auth call that returns an [AuthResponse], persisting the session
  /// and publishing it. Errors propagate so the UI can show them.
  Future<void> _run(Future<AuthResponse> Function() call) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final res = await call();
      await ref.read(tokenStoreProvider).save(
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            role: res.user.role,
            name: res.user.name,
            isProfileComplete: res.user.isProfileComplete,
          );
      return _sessionFromUser(res.user);
    });
    // Re-throw so callers can react (e.g. show a snackbar) without swallowing.
    if (state.hasError) {
      throw state.error!;
    }
  }

  Session _sessionFromUser(AuthUser u) => Session(
        role: AppRole.fromString(u.role),
        name: u.name,
        isProfileComplete: u.isProfileComplete,
      );
}
