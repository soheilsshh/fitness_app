// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'food_diary_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Currently selected diary day (defaults to today).

@ProviderFor(SelectedDiaryDate)
final selectedDiaryDateProvider = SelectedDiaryDateProvider._();

/// Currently selected diary day (defaults to today).
final class SelectedDiaryDateProvider
    extends $NotifierProvider<SelectedDiaryDate, DateTime> {
  /// Currently selected diary day (defaults to today).
  SelectedDiaryDateProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'selectedDiaryDateProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$selectedDiaryDateHash();

  @$internal
  @override
  SelectedDiaryDate create() => SelectedDiaryDate();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(DateTime value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<DateTime>(value),
    );
  }
}

String _$selectedDiaryDateHash() => r'f6eef1ca7c1f48d59f9c207e532c9b0ef10dfcc9';

/// Currently selected diary day (defaults to today).

abstract class _$SelectedDiaryDate extends $Notifier<DateTime> {
  DateTime build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<DateTime, DateTime>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<DateTime, DateTime>,
              DateTime,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

/// The day's logs + totals for the selected date.

@ProviderFor(dailyDiary)
final dailyDiaryProvider = DailyDiaryProvider._();

/// The day's logs + totals for the selected date.

final class DailyDiaryProvider
    extends
        $FunctionalProvider<
          AsyncValue<DailyFoodLog>,
          DailyFoodLog,
          FutureOr<DailyFoodLog>
        >
    with $FutureModifier<DailyFoodLog>, $FutureProvider<DailyFoodLog> {
  /// The day's logs + totals for the selected date.
  DailyDiaryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dailyDiaryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dailyDiaryHash();

  @$internal
  @override
  $FutureProviderElement<DailyFoodLog> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<DailyFoodLog> create(Ref ref) {
    return dailyDiary(ref);
  }
}

String _$dailyDiaryHash() => r'6f860ed15beca7a97ab32c716b6028a6acd84b5e';

/// Catalog search for the food picker.

@ProviderFor(foodSearch)
final foodSearchProvider = FoodSearchFamily._();

/// Catalog search for the food picker.

final class FoodSearchProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Food>>,
          List<Food>,
          FutureOr<List<Food>>
        >
    with $FutureModifier<List<Food>>, $FutureProvider<List<Food>> {
  /// Catalog search for the food picker.
  FoodSearchProvider._({
    required FoodSearchFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'foodSearchProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$foodSearchHash();

  @override
  String toString() {
    return r'foodSearchProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<Food>> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<List<Food>> create(Ref ref) {
    final argument = this.argument as String;
    return foodSearch(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is FoodSearchProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$foodSearchHash() => r'10a08622ec8eafed8a71d4179680545210685d55';

/// Catalog search for the food picker.

final class FoodSearchFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<Food>>, String> {
  FoodSearchFamily._()
    : super(
        retry: null,
        name: r'foodSearchProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Catalog search for the food picker.

  FoodSearchProvider call(String query) =>
      FoodSearchProvider._(argument: query, from: this);

  @override
  String toString() => r'foodSearchProvider';
}

/// Mutations: add (catalog or manual) and delete, then refresh the day.

@ProviderFor(FoodDiaryActions)
final foodDiaryActionsProvider = FoodDiaryActionsProvider._();

/// Mutations: add (catalog or manual) and delete, then refresh the day.
final class FoodDiaryActionsProvider
    extends $NotifierProvider<FoodDiaryActions, void> {
  /// Mutations: add (catalog or manual) and delete, then refresh the day.
  FoodDiaryActionsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'foodDiaryActionsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$foodDiaryActionsHash();

  @$internal
  @override
  FoodDiaryActions create() => FoodDiaryActions();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(void value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<void>(value),
    );
  }
}

String _$foodDiaryActionsHash() => r'71cadf69e78c47ebf07db3409532ae9cca628651';

/// Mutations: add (catalog or manual) and delete, then refresh the day.

abstract class _$FoodDiaryActions extends $Notifier<void> {
  void build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<void, void>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<void, void>,
              void,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
