// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'programs_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(myPrograms)
final myProgramsProvider = MyProgramsProvider._();

final class MyProgramsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ProgramSummary>>,
          List<ProgramSummary>,
          FutureOr<List<ProgramSummary>>
        >
    with
        $FutureModifier<List<ProgramSummary>>,
        $FutureProvider<List<ProgramSummary>> {
  MyProgramsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'myProgramsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$myProgramsHash();

  @$internal
  @override
  $FutureProviderElement<List<ProgramSummary>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ProgramSummary>> create(Ref ref) {
    return myPrograms(ref);
  }
}

String _$myProgramsHash() => r'6b13a9b16c1fdcff54d3d1b1549975fdf08ad9f0';

@ProviderFor(programDetail)
final programDetailProvider = ProgramDetailFamily._();

final class ProgramDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<ProgramDetail>,
          ProgramDetail,
          FutureOr<ProgramDetail>
        >
    with $FutureModifier<ProgramDetail>, $FutureProvider<ProgramDetail> {
  ProgramDetailProvider._({
    required ProgramDetailFamily super.from,
    required int super.argument,
  }) : super(
         retry: null,
         name: r'programDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$programDetailHash();

  @override
  String toString() {
    return r'programDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<ProgramDetail> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<ProgramDetail> create(Ref ref) {
    final argument = this.argument as int;
    return programDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ProgramDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$programDetailHash() => r'7c7f9b1c2915763ee45838bf78b8e181e780a3ca';

final class ProgramDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<ProgramDetail>, int> {
  ProgramDetailFamily._()
    : super(
        retry: null,
        name: r'programDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ProgramDetailProvider call(int id) =>
      ProgramDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'programDetailProvider';
}
