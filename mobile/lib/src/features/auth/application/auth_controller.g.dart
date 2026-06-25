// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Holds the auth state (`Session?`). `null` data means unauthenticated.
/// On build it hydrates from secure storage so a returning user stays logged in.

@ProviderFor(AuthController)
final authControllerProvider = AuthControllerProvider._();

/// Holds the auth state (`Session?`). `null` data means unauthenticated.
/// On build it hydrates from secure storage so a returning user stays logged in.
final class AuthControllerProvider
    extends $AsyncNotifierProvider<AuthController, Session?> {
  /// Holds the auth state (`Session?`). `null` data means unauthenticated.
  /// On build it hydrates from secure storage so a returning user stays logged in.
  AuthControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authControllerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$authControllerHash();

  @$internal
  @override
  AuthController create() => AuthController();
}

String _$authControllerHash() => r'e050f919808adec54bb247c6394ec61a29607f88';

/// Holds the auth state (`Session?`). `null` data means unauthenticated.
/// On build it hydrates from secure storage so a returning user stays logged in.

abstract class _$AuthController extends $AsyncNotifier<Session?> {
  FutureOr<Session?> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<Session?>, Session?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<Session?>, Session?>,
              AsyncValue<Session?>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
