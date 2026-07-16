import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';

class CoachTicketItem {
  const CoachTicketItem({
    required this.id,
    required this.title,
    required this.priority,
    required this.status,
    required this.createdAt,
    required this.answered,
    required this.studentId,
    required this.studentName,
  });

  final int id;
  final String title;
  final String priority;
  final String status;
  final String createdAt;
  final bool answered;
  final int studentId;
  final String studentName;

  factory CoachTicketItem.fromJson(Map<String, dynamic> json) =>
      CoachTicketItem(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? '',
        priority: json['priority'] as String? ?? '',
        status: json['status'] as String? ?? '',
        createdAt: json['createdAt']?.toString() ?? '',
        answered: json['answered'] == true,
        studentId: (json['studentId'] as num?)?.toInt() ?? 0,
        studentName: json['studentName'] as String? ?? '',
      );
}

class CoachTicketDetail {
  const CoachTicketDetail({
    required this.id,
    required this.title,
    required this.priority,
    required this.status,
    required this.message,
    required this.answer,
    required this.createdAt,
    required this.studentId,
    required this.studentName,
    this.studentPhone = '',
    this.answeredAt,
  });

  final int id;
  final String title;
  final String priority;
  final String status;
  final String message;
  final String answer;
  final String createdAt;
  final int studentId;
  final String studentName;
  final String studentPhone;
  final String? answeredAt;

  factory CoachTicketDetail.fromJson(Map<String, dynamic> json) =>
      CoachTicketDetail(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? '',
        priority: json['priority'] as String? ?? '',
        status: json['status'] as String? ?? '',
        message: json['message'] as String? ?? '',
        answer: json['answer'] as String? ?? '',
        createdAt: json['createdAt']?.toString() ?? '',
        studentId: (json['studentId'] as num?)?.toInt() ?? 0,
        studentName: json['studentName'] as String? ?? '',
        studentPhone: json['studentPhone'] as String? ?? '',
        answeredAt: json['answeredAt']?.toString(),
      );
}

class CoachTicketsPage {
  const CoachTicketsPage({
    required this.items,
    required this.total,
  });

  final List<CoachTicketItem> items;
  final int total;
}

class CoachTicketsRepository {
  CoachTicketsRepository(this._dio);
  final Dio _dio;

  Future<CoachTicketsPage> list({
    int page = 1,
    int pageSize = 20,
    String status = '',
  }) async {
    try {
      final res = await _dio.get(ApiPaths.coachTickets, queryParameters: {
        'page': page,
        'pageSize': pageSize,
        if (status.isNotEmpty && status != 'all') 'status': status,
      });
      final data = Map<String, dynamic>.from(res.data as Map);
      final items = (data['items'] as List? ?? const [])
          .map((e) =>
              CoachTicketItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return CoachTicketsPage(
        items: items,
        total: (data['total'] as num?)?.toInt() ?? items.length,
      );
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachTicketDetail> detail(int id) async {
    try {
      final res = await _dio.get(ApiPaths.coachTicket(id));
      return CoachTicketDetail.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachTicketDetail> answer(int id, String answer) async {
    try {
      final res = await _dio.patch(
        '${ApiPaths.coachTicket(id)}/answer',
        data: {'answer': answer},
      );
      return CoachTicketDetail.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachTicketDetail> updateStatus(int id, String status) async {
    try {
      final res = await _dio.patch(
        '${ApiPaths.coachTicket(id)}/status',
        data: {'status': status},
      );
      return CoachTicketDetail.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final coachTicketsRepositoryProvider = Provider<CoachTicketsRepository>((ref) {
  return CoachTicketsRepository(ref.watch(dioProvider));
});

final coachTicketsFilterProvider = StateProvider<String>((_) => 'all');

final coachTicketsProvider =
    FutureProvider.autoDispose<CoachTicketsPage>((ref) {
  final filter = ref.watch(coachTicketsFilterProvider);
  return ref.watch(coachTicketsRepositoryProvider).list(status: filter);
});

final coachTicketDetailProvider =
    FutureProvider.autoDispose.family<CoachTicketDetail, int>((ref, id) {
  return ref.watch(coachTicketsRepositoryProvider).detail(id);
});
