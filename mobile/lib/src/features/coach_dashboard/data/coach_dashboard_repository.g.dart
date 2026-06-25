// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'coach_dashboard_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(coachDashboardRepository)
final coachDashboardRepositoryProvider = CoachDashboardRepositoryProvider._();

final class CoachDashboardRepositoryProvider
    extends
        $FunctionalProvider<
          CoachDashboardRepository,
          CoachDashboardRepository,
          CoachDashboardRepository
        >
    with $Provider<CoachDashboardRepository> {
  CoachDashboardRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'coachDashboardRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$coachDashboardRepositoryHash();

  @$internal
  @override
  $ProviderElement<CoachDashboardRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  CoachDashboardRepository create(Ref ref) {
    return coachDashboardRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(CoachDashboardRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<CoachDashboardRepository>(value),
    );
  }
}

String _$coachDashboardRepositoryHash() =>
    r'b3c411358bb387ee30af811d4faf8e4521835f23';

@ProviderFor(coachDashboardData)
final coachDashboardDataProvider = CoachDashboardDataProvider._();

final class CoachDashboardDataProvider
    extends
        $FunctionalProvider<
          AsyncValue<CoachDashboardData>,
          CoachDashboardData,
          FutureOr<CoachDashboardData>
        >
    with
        $FutureModifier<CoachDashboardData>,
        $FutureProvider<CoachDashboardData> {
  CoachDashboardDataProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'coachDashboardDataProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$coachDashboardDataHash();

  @$internal
  @override
  $FutureProviderElement<CoachDashboardData> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<CoachDashboardData> create(Ref ref) {
    return coachDashboardData(ref);
  }
}

String _$coachDashboardDataHash() =>
    r'97b0f9faa0f87495867c94c1f6f32f2025f8d390';
