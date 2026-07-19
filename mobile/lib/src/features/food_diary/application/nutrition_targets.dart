import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../programs/data/program_models.dart';
import '../../programs/data/programs_repository.dart';
import '../application/food_diary_controller.dart';

class NutritionTargets {
  const NutritionTargets({
    this.caloriesTarget = 0,
    this.proteinTarget = '',
  });

  final int caloriesTarget;
  final String proteinTarget;

  double get proteinGrams => parseProteinTargetGrams(proteinTarget);
  bool get hasAny => caloriesTarget > 0 || proteinGrams > 0;
}

/// Match web `dateToDayKey` / JS `Date.getDay()` (0=Sun … 6=Sat).
String dateToDayKey(DateTime date) {
  const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return keys[date.weekday % 7];
}

double parseProteinTargetGrams(String proteinTarget) {
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  final buf = StringBuffer();
  for (final unit in proteinTarget.trim().runes) {
    final ch = String.fromCharCode(unit);
    final i = persian.indexOf(ch);
    buf.write(i >= 0 ? '$i' : ch);
  }
  final match = RegExp(r'(\d+(?:\.\d+)?)').firstMatch(buf.toString());
  if (match == null) return 0;
  return double.tryParse(match.group(1)!) ?? 0;
}

double? targetProgressPercent(double current, double target) {
  if (target <= 0) return null;
  return (current / target * 100).clamp(0, 100);
}

NutritionTargets extractNutritionTargets(ProgramDetail program, String dayKey) {
  final nutrition = program.planByDay[dayKey]?.nutrition;
  if (nutrition == null) return const NutritionTargets();
  return NutritionTargets(
    caloriesTarget: nutrition.caloriesTarget,
    proteinTarget: nutrition.proteinTarget,
  );
}

/// Loads calories/protein targets from the first nutrition|both program
/// that has targets for the selected diary day (same as web FoodDiaryClient).
final nutritionTargetsProvider =
    FutureProvider.autoDispose<NutritionTargets>((ref) async {
  final date = ref.watch(selectedDiaryDateProvider);
  final dayKey = dateToDayKey(date);
  final repo = ref.watch(programsRepositoryProvider);
  final programs = await repo.list();
  final candidates = programs
      .where((p) => p.type == 'nutrition' || p.type == 'both')
      .toList();

  for (final program in candidates) {
    try {
      final detail = await repo.detail(program.id);
      final next = extractNutritionTargets(detail, dayKey);
      if (next.hasAny) return next;
    } catch (_) {
      // try next
    }
  }
  return const NutritionTargets();
});
