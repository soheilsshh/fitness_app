import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import '../../tracking/data/tracking_models.dart';

class CoachTrackingStudentItem {
  const CoachTrackingStudentItem({
    required this.id,
    required this.fullName,
    required this.phone,
    this.nextDueDate,
    this.alerts = const [],
    this.weightOverdue = false,
    this.photosOverdue = false,
    this.maxOverdueDays = 0,
  });

  final int id;
  final String fullName;
  final String phone;
  final String? nextDueDate;
  final List<TrackingAlert> alerts;
  final bool weightOverdue;
  final bool photosOverdue;
  final int maxOverdueDays;

  factory CoachTrackingStudentItem.fromJson(Map<String, dynamic> json) =>
      CoachTrackingStudentItem(
        id: (json['id'] as num?)?.toInt() ?? 0,
        fullName: json['fullName'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        nextDueDate: json['nextDueDate'] as String?,
        alerts: (json['alerts'] as List? ?? const [])
            .map((e) =>
                TrackingAlert.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        weightOverdue: json['weightOverdue'] == true,
        photosOverdue: json['photosOverdue'] == true,
        maxOverdueDays: (json['maxOverdueDays'] as num?)?.toInt() ?? 0,
      );
}

class CoachTrackingDetail {
  const CoachTrackingDetail({
    required this.studentId,
    required this.fullName,
    required this.phone,
    required this.tracking,
  });

  final int studentId;
  final String fullName;
  final String phone;
  final TrackingStatus tracking;

  factory CoachTrackingDetail.fromJson(Map<String, dynamic> json) =>
      CoachTrackingDetail(
        studentId: (json['studentId'] as num?)?.toInt() ?? 0,
        fullName: json['fullName'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        tracking: TrackingStatus.fromJson(
          Map<String, dynamic>.from(
              (json['tracking'] as Map?) ?? const <String, dynamic>{}),
        ),
      );
}

class CoachTrackingRepository {
  CoachTrackingRepository(this._dio);
  final Dio _dio;

  Future<List<CoachTrackingStudentItem>> list({String query = ''}) async {
    try {
      final res =
          await _dio.get(ApiPaths.coachTrackingStudents, queryParameters: {
        'page': 1,
        'pageSize': 50,
        if (query.isNotEmpty) 'query': query,
      });
      final data = Map<String, dynamic>.from(res.data as Map);
      return (data['items'] as List? ?? const [])
          .map((e) => CoachTrackingStudentItem.fromJson(
              Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachTrackingDetail> detail(int studentId) async {
    try {
      final res = await _dio.get(ApiPaths.coachTrackingStudent(studentId));
      return CoachTrackingDetail.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final coachTrackingRepositoryProvider =
    Provider<CoachTrackingRepository>((ref) {
  return CoachTrackingRepository(ref.watch(dioProvider));
});

final coachTrackingListProvider =
    FutureProvider.autoDispose<List<CoachTrackingStudentItem>>((ref) {
  return ref.watch(coachTrackingRepositoryProvider).list();
});

final coachTrackingDetailProvider =
    FutureProvider.autoDispose.family<CoachTrackingDetail, int>((ref, id) {
  return ref.watch(coachTrackingRepositoryProvider).detail(id);
});
