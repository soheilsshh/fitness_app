import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';

class CoachNotification {
  const CoachNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });

  final int id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final String createdAt;

  factory CoachNotification.fromJson(Map<String, dynamic> json) =>
      CoachNotification(
        id: (json['id'] as num?)?.toInt() ?? 0,
        type: json['type'] as String? ?? '',
        title: json['title'] as String? ?? '',
        message: json['message'] as String? ?? '',
        isRead: json['isRead'] == true,
        createdAt: json['createdAt']?.toString() ?? '',
      );
}

class CoachNotificationsRepository {
  CoachNotificationsRepository(this._dio);
  final Dio _dio;

  Future<List<CoachNotification>> list({int limit = 30}) async {
    try {
      final res = await _dio.get(ApiPaths.coachNotifications,
          queryParameters: {'limit': limit});
      final data = res.data;
      final items = data is List
          ? data
          : (data is Map ? (data['items'] as List? ?? data['notifications'] as List? ?? const []) : const []);
      return items
          .map((e) =>
              CoachNotification.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final coachNotificationsRepositoryProvider =
    Provider<CoachNotificationsRepository>((ref) {
  return CoachNotificationsRepository(ref.watch(dioProvider));
});

final coachNotificationsProvider =
    FutureProvider.autoDispose<List<CoachNotification>>((ref) {
  return ref.watch(coachNotificationsRepositoryProvider).list();
});
