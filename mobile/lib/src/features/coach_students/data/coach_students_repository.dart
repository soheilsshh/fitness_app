import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';

class CoachStudentItem {
  const CoachStudentItem({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.status,
    required this.planTitle,
    required this.planType,
  });

  final int id;
  final String fullName;
  final String phone;
  final String status;
  final String planTitle;
  final String planType;

  factory CoachStudentItem.fromJson(Map<String, dynamic> json) =>
      CoachStudentItem(
        id: (json['id'] as num?)?.toInt() ?? 0,
        fullName: json['fullName'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        status: json['status'] as String? ?? '',
        planTitle: json['planTitle'] as String? ?? '',
        planType: json['planType'] as String? ?? '',
      );
}

class CoachStudentsPage {
  const CoachStudentsPage({
    required this.items,
    required this.total,
    required this.page,
  });

  final List<CoachStudentItem> items;
  final int total;
  final int page;
}

class CoachStudentDetail {
  const CoachStudentDetail({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.status,
    required this.planTitle,
    required this.planType,
    this.email = '',
    this.heightCm,
    this.weightKg,
    this.startDate,
    this.durationDays = 0,
    this.remainingDays = 0,
    this.subscriptionId = 0,
    this.hasWorkoutProgram = false,
    this.hasNutritionProgram = false,
    this.weekly = const [],
    this.restDays = const [],
  });

  final int id;
  final String fullName;
  final String phone;
  final String status;
  final String planTitle;
  final String planType;
  final String email;
  final double? heightCm;
  final double? weightKg;
  final String? startDate;
  final int durationDays;
  final int remainingDays;
  final int subscriptionId;
  final bool hasWorkoutProgram;
  final bool hasNutritionProgram;
  final List<String> weekly;
  final List<String> restDays;

  factory CoachStudentDetail.fromJson(Map<String, dynamic> json) =>
      CoachStudentDetail(
        id: (json['id'] as num?)?.toInt() ?? 0,
        fullName: json['fullName'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        status: json['status'] as String? ?? '',
        planTitle: json['planTitle'] as String? ?? '',
        planType: json['planType'] as String? ?? '',
        email: json['email'] as String? ?? '',
        heightCm: (json['heightCm'] as num?)?.toDouble(),
        weightKg: (json['weightKg'] as num?)?.toDouble(),
        startDate: json['startDate']?.toString(),
        durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
        remainingDays: (json['remainingDays'] as num?)?.toInt() ?? 0,
        subscriptionId: (json['subscriptionId'] as num?)?.toInt() ?? 0,
        hasWorkoutProgram: json['hasWorkoutProgram'] == true,
        hasNutritionProgram: json['hasNutritionProgram'] == true,
        weekly: (json['weekly'] as List? ?? const [])
            .map((e) => e.toString())
            .toList(),
        restDays: (json['restDays'] as List? ?? const [])
            .map((e) => e.toString())
            .toList(),
      );
}

class CoachStudentPrograms {
  const CoachStudentPrograms({
    this.workoutProgramId = 0,
    this.nutritionProgramId = 0,
    this.schedule,
    this.planByDay = const {},
  });

  final int workoutProgramId;
  final int nutritionProgramId;
  final Map<String, dynamic>? schedule;
  final Map<String, dynamic> planByDay;

  factory CoachStudentPrograms.fromJson(Map<String, dynamic> json) {
    final rawPlan = json['planByDay'];
    final plan = <String, dynamic>{};
    if (rawPlan is Map) {
      rawPlan.forEach((k, v) {
        if (v is Map) plan[k.toString()] = Map<String, dynamic>.from(v);
      });
    }
    return CoachStudentPrograms(
      workoutProgramId: (json['workoutProgramId'] as num?)?.toInt() ?? 0,
      nutritionProgramId: (json['nutritionProgramId'] as num?)?.toInt() ?? 0,
      schedule: json['schedule'] is Map
          ? Map<String, dynamic>.from(json['schedule'] as Map)
          : null,
      planByDay: plan,
    );
  }
}

class ProgramTemplate {
  const ProgramTemplate({
    required this.id,
    required this.title,
    this.extra = '',
  });

  final int id;
  final String title;
  final String extra;

  factory ProgramTemplate.fromWorkoutJson(Map<String, dynamic> json) =>
      ProgramTemplate(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? '',
        extra: [
          if ((json['level'] as String?)?.isNotEmpty == true) json['level'],
          if ((json['target'] as String?)?.isNotEmpty == true) json['target'],
          if (json['dayCount'] != null) '${json['dayCount']} روز',
        ].whereType<String>().join(' · '),
      );

  factory ProgramTemplate.fromNutritionJson(Map<String, dynamic> json) =>
      ProgramTemplate(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? '',
        extra: [
          if ((json['target'] as String?)?.isNotEmpty == true) json['target'],
          if (json['calorie'] != null) '${json['calorie']} kcal',
        ].whereType<String>().join(' · '),
      );
}

class CoachStudentsRepository {
  CoachStudentsRepository(this._dio);
  final Dio _dio;

  Future<CoachStudentsPage> list({
    int page = 1,
    int pageSize = 20,
    String status = '',
    String query = '',
  }) async {
    try {
      final res = await _dio.get(ApiPaths.coachStudents, queryParameters: {
        'page': page,
        'pageSize': pageSize,
        if (status.isNotEmpty && status != 'all') 'status': status,
        if (query.isNotEmpty) 'query': query,
      });
      final data = Map<String, dynamic>.from(res.data as Map);
      final items = (data['items'] as List? ?? const [])
          .map((e) =>
              CoachStudentItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return CoachStudentsPage(
        items: items,
        total: (data['total'] as num?)?.toInt() ?? items.length,
        page: (data['page'] as num?)?.toInt() ?? page,
      );
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachStudentDetail> detail(int id) async {
    try {
      final res = await _dio.get(ApiPaths.coachStudent(id));
      return CoachStudentDetail.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachStudentPrograms> programs(int id) async {
    try {
      final res = await _dio.get(ApiPaths.coachStudentPrograms(id));
      return CoachStudentPrograms.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachStudentPrograms> saveWorkout({
    required int studentId,
    required int programId,
    required Map<String, dynamic> body,
  }) async {
    try {
      final Response res;
      if (programId > 0) {
        res = await _dio.patch(
          ApiPaths.coachStudentWorkoutProgram(studentId, programId),
          data: body,
        );
      } else {
        res = await _dio.post(
          ApiPaths.coachStudentWorkoutPrograms(studentId),
          data: body,
        );
      }
      return CoachStudentPrograms.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachStudentPrograms> saveNutrition({
    required int studentId,
    required int programId,
    required Map<String, dynamic> body,
  }) async {
    try {
      final Response res;
      if (programId > 0) {
        res = await _dio.patch(
          ApiPaths.coachStudentNutritionProgram(studentId, programId),
          data: body,
        );
      } else {
        res = await _dio.post(
          ApiPaths.coachStudentNutritionPrograms(studentId),
          data: body,
        );
      }
      return CoachStudentPrograms.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachStudentPrograms> assignWorkoutTemplate(
      int studentId, int templateId) async {
    try {
      final res = await _dio.post(
        ApiPaths.coachStudentWorkoutFromTemplate(studentId, templateId),
      );
      return CoachStudentPrograms.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachStudentPrograms> assignNutritionTemplate(
      int studentId, int templateId) async {
    try {
      final res = await _dio.post(
        ApiPaths.coachStudentNutritionFromTemplate(studentId, templateId),
      );
      return CoachStudentPrograms.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<ProgramTemplate>> workoutTemplates() async {
    try {
      final res = await _dio.get(ApiPaths.coachWorkoutTemplates);
      final data = res.data;
      final items =
          data is Map ? (data['items'] as List? ?? const []) : const [];
      return items
          .map((e) => ProgramTemplate.fromWorkoutJson(
              Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<ProgramTemplate>> nutritionTemplates() async {
    try {
      final res = await _dio.get(ApiPaths.coachNutritionTemplates);
      final data = res.data;
      final items =
          data is Map ? (data['items'] as List? ?? const []) : const [];
      return items
          .map((e) => ProgramTemplate.fromNutritionJson(
              Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final coachStudentsRepositoryProvider =
    Provider<CoachStudentsRepository>((ref) {
  return CoachStudentsRepository(ref.watch(dioProvider));
});

final coachStudentsFilterProvider = StateProvider<String>((_) => 'all');
final coachStudentsQueryProvider = StateProvider<String>((_) => '');

final coachStudentsProvider =
    FutureProvider.autoDispose<CoachStudentsPage>((ref) {
  final filter = ref.watch(coachStudentsFilterProvider);
  final query = ref.watch(coachStudentsQueryProvider);
  return ref.watch(coachStudentsRepositoryProvider).list(
        status: filter,
        query: query,
      );
});

final coachStudentDetailProvider =
    FutureProvider.autoDispose.family<CoachStudentDetail, int>((ref, id) {
  return ref.watch(coachStudentsRepositoryProvider).detail(id);
});

final coachStudentProgramsProvider =
    FutureProvider.autoDispose.family<CoachStudentPrograms, int>((ref, id) {
  return ref.watch(coachStudentsRepositoryProvider).programs(id);
});
