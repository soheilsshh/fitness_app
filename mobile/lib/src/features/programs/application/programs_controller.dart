import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../data/program_models.dart';
import '../data/programs_repository.dart';

part 'programs_controller.g.dart';

@riverpod
Future<List<ProgramSummary>> myPrograms(Ref ref) {
  return ref.watch(programsRepositoryProvider).list();
}

@riverpod
Future<ProgramDetail> programDetail(Ref ref, int id) {
  return ref.watch(programsRepositoryProvider).detail(id);
}
