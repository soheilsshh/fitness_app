import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/dio_provider.dart';
import '../../tracking/data/tracking_models.dart';
import '../data/dashboard_models.dart';
import '../data/dashboard_repository.dart';

class ProfileProgress {
  const ProfileProgress({
    this.essentials = false,
    this.body = false,
    this.medical = false,
    this.photos = false,
    this.percent = 0,
  });

  final bool essentials;
  final bool body;
  final bool medical;
  final bool photos;
  final int percent;

  factory ProfileProgress.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const ProfileProgress();
    return ProfileProgress(
      essentials: json['essentials'] == true,
      body: json['body'] == true,
      medical: json['medical'] == true,
      photos: json['photos'] == true,
      percent: (json['percent'] as num?)?.toInt() ?? 0,
    );
  }
}

class DashboardProfileBrief {
  const DashboardProfileBrief({
    this.firstName = '',
    this.weightKg,
    this.heightCm,
    this.targetWeightKg,
    this.progress = const ProfileProgress(),
  });

  final String firstName;
  final double? weightKg;
  final double? heightCm;
  final double? targetWeightKg;
  final ProfileProgress progress;

  factory DashboardProfileBrief.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const DashboardProfileBrief();
    return DashboardProfileBrief(
      firstName: json['firstName'] as String? ?? '',
      weightKg: (json['weightKg'] as num?)?.toDouble(),
      heightCm: (json['heightCm'] as num?)?.toDouble(),
      targetWeightKg: (json['targetWeightKg'] as num?)?.toDouble(),
      progress: ProfileProgress.fromJson(
        json['profileProgress'] is Map
            ? Map<String, dynamic>.from(json['profileProgress'] as Map)
            : null,
      ),
    );
  }
}

class DashboardSubscription {
  const DashboardSubscription({
    this.planName = '',
    this.planType = '',
    this.startsAt,
    this.endsAt,
    this.durationDays = 0,
  });

  final String planName;
  final String planType;
  final String? startsAt;
  final String? endsAt;
  final int durationDays;

  factory DashboardSubscription.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const DashboardSubscription();
    final plan = json['plan'] is Map
        ? Map<String, dynamic>.from(json['plan'] as Map)
        : const <String, dynamic>{};
    return DashboardSubscription(
      planName: plan['name'] as String? ?? '',
      planType: plan['type'] as String? ?? '',
      startsAt: json['starts_at']?.toString() ?? json['startsAt']?.toString(),
      endsAt: json['ends_at']?.toString() ?? json['endsAt']?.toString(),
      durationDays: (plan['duration_days'] as num?)?.toInt() ??
          (plan['durationDays'] as num?)?.toInt() ??
          0,
    );
  }
}

class TodayExercise {
  const TodayExercise({
    required this.id,
    required this.exercise,
    required this.sets,
    required this.reps,
    required this.dayNumber,
  });

  final int id;
  final String exercise;
  final int sets;
  final String reps;
  final int dayNumber;

  factory TodayExercise.fromJson(Map<String, dynamic> json) => TodayExercise(
        id: (json['id'] as num?)?.toInt() ?? 0,
        exercise: json['exercise'] as String? ?? '',
        sets: (json['sets'] as num?)?.toInt() ?? 0,
        reps: '${json['reps'] ?? ''}',
        dayNumber: (json['day_number'] as num?)?.toInt() ??
            (json['dayNumber'] as num?)?.toInt() ??
            0,
      );
}

class DashboardProgram {
  const DashboardProgram({this.items = const []});

  final List<TodayExercise> items;

  factory DashboardProgram.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const DashboardProgram();
    final items = (json['items'] as List? ?? const [])
        .map((e) => TodayExercise.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return DashboardProgram(items: items);
  }
}

class RecentSession {
  const RecentSession({
    required this.id,
    this.programTitle = '',
    this.dayLabel = '',
    this.completedAt = '',
    this.durationMin = 0,
  });

  final int id;
  final String programTitle;
  final String dayLabel;
  final String completedAt;
  final int durationMin;

  factory RecentSession.fromJson(Map<String, dynamic> json) => RecentSession(
        id: (json['id'] as num?)?.toInt() ?? 0,
        programTitle: json['programTitle'] as String? ?? '',
        dayLabel: json['dayLabel'] as String? ?? '',
        completedAt: json['completedAt'] as String? ?? '',
        durationMin: (json['durationMin'] as num?)?.toInt() ?? 0,
      );
}

class DashboardBundle {
  const DashboardBundle({
    required this.summary,
    required this.records,
    this.tracking,
    this.profile = const DashboardProfileBrief(),
    this.subscription,
    this.program = const DashboardProgram(),
    this.history = const [],
  });

  final DashboardSummary summary;
  final List<PersonalRecord> records;
  final TrackingStatus? tracking;
  final DashboardProfileBrief profile;
  final DashboardSubscription? subscription;
  final DashboardProgram program;
  final List<RecentSession> history;
}

final dashboardBundleProvider =
    FutureProvider.autoDispose<DashboardBundle>((ref) async {
  final dio = ref.watch(dioProvider);
  final repo = ref.watch(dashboardRepositoryProvider);

  Future<Map<String, dynamic>?> getMap(String path) async {
    try {
      final res = await dio.get(path);
      if (res.data is Map) return Map<String, dynamic>.from(res.data as Map);
      return null;
    } catch (_) {
      return null;
    }
  }

  final results = await Future.wait([
    repo.summary(),
    repo.records(),
    getMap(ApiPaths.meTracking),
    getMap(ApiPaths.me),
    getMap(ApiPaths.subscriptionsCurrent),
    getMap(ApiPaths.programsCurrent),
    getMap('${ApiPaths.meWorkoutHistory}?pageSize=5'),
  ]);

  final summary = results[0] as DashboardSummary;
  final records = results[1] as List<PersonalRecord>;
  final trackingRaw = results[2] as Map<String, dynamic>?;
  final meRaw = results[3] as Map<String, dynamic>?;
  final subRaw = results[4] as Map<String, dynamic>?;
  final progRaw = results[5] as Map<String, dynamic>?;
  final histRaw = results[6] as Map<String, dynamic>?;

  DashboardSubscription? sub;
  final active = subRaw?['active_subscription'] ?? subRaw?['activeSubscription'];
  if (active is Map) {
    sub = DashboardSubscription.fromJson(Map<String, dynamic>.from(active));
  }

  final workout = progRaw?['workout_program'] ?? progRaw?['workoutProgram'];
  final program = DashboardProgram.fromJson(
    workout is Map ? Map<String, dynamic>.from(workout) : null,
  );

  final histItems = histRaw?['items'] as List? ?? const [];
  final history = histItems
      .map((e) => RecentSession.fromJson(Map<String, dynamic>.from(e as Map)))
      .toList();

  return DashboardBundle(
    summary: summary,
    records: records,
    tracking: trackingRaw == null ? null : TrackingStatus.fromJson(trackingRaw),
    profile: DashboardProfileBrief.fromJson(meRaw),
    subscription: sub,
    program: program,
    history: history,
  );
});
