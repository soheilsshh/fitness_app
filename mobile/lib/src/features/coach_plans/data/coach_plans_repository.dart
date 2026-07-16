import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';

class CoachPlan {
  const CoachPlan({
    required this.id,
    required this.title,
    this.subtitle = '',
    this.courseName = '',
    this.description = '',
    this.featuresText = '',
    this.planType = 'both',
    this.price = 0,
    this.discountPrice = 0,
    this.discountPercent = 0,
    this.durationDays = 0,
    this.isPopular = false,
  });

  final int id;
  final String title;
  final String subtitle;
  final String courseName;
  final String description;
  final String featuresText;
  final String planType;
  final int price;
  final int discountPrice;
  final int discountPercent;
  final int durationDays;
  final bool isPopular;

  factory CoachPlan.fromJson(Map<String, dynamic> json) => CoachPlan(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? '',
        subtitle: json['subtitle'] as String? ?? '',
        courseName: json['courseName'] as String? ?? '',
        description: json['description'] as String? ?? '',
        featuresText: json['featuresText'] as String? ?? '',
        planType: json['planType'] as String? ?? 'both',
        price: (json['price'] as num?)?.toInt() ?? 0,
        discountPrice: (json['discountPrice'] as num?)?.toInt() ?? 0,
        discountPercent: (json['discountPercent'] as num?)?.toInt() ?? 0,
        durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
        isPopular: json['isPopular'] == true,
      );

  Map<String, dynamic> toPayload() => {
        'title': title,
        'subtitle': subtitle,
        'courseName': courseName,
        'description': description,
        'featuresText': featuresText,
        'planType': planType,
        'price': price,
        'discountPrice': discountPrice,
        'discountPercent': discountPercent,
        'durationDays': durationDays,
        'isPopular': isPopular,
      };

  CoachPlan copyWith({
    String? title,
    String? subtitle,
    String? courseName,
    String? description,
    String? featuresText,
    String? planType,
    int? price,
    int? discountPrice,
    int? discountPercent,
    int? durationDays,
    bool? isPopular,
  }) =>
      CoachPlan(
        id: id,
        title: title ?? this.title,
        subtitle: subtitle ?? this.subtitle,
        courseName: courseName ?? this.courseName,
        description: description ?? this.description,
        featuresText: featuresText ?? this.featuresText,
        planType: planType ?? this.planType,
        price: price ?? this.price,
        discountPrice: discountPrice ?? this.discountPrice,
        discountPercent: discountPercent ?? this.discountPercent,
        durationDays: durationDays ?? this.durationDays,
        isPopular: isPopular ?? this.isPopular,
      );
}

class CoachPlansPage {
  const CoachPlansPage({required this.items, required this.total});
  final List<CoachPlan> items;
  final int total;
}

class CoachPlansRepository {
  CoachPlansRepository(this._dio);
  final Dio _dio;

  Future<CoachPlansPage> list({int page = 1, String query = ''}) async {
    try {
      final res = await _dio.get(ApiPaths.coachPlans, queryParameters: {
        'page': page,
        'pageSize': 50,
        if (query.isNotEmpty) 'query': query,
      });
      final data = Map<String, dynamic>.from(res.data as Map);
      final items = (data['items'] as List? ?? const [])
          .map((e) => CoachPlan.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return CoachPlansPage(
        items: items,
        total: (data['total'] as num?)?.toInt() ?? items.length,
      );
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachPlan> get(int id) async {
    try {
      final res = await _dio.get(ApiPaths.coachPlan(id));
      return CoachPlan.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachPlan> create(Map<String, dynamic> body) async {
    try {
      final res = await _dio.post(ApiPaths.coachPlans, data: body);
      return CoachPlan.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachPlan> update(int id, Map<String, dynamic> body) async {
    try {
      final res = await _dio.patch(ApiPaths.coachPlan(id), data: body);
      return CoachPlan.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> delete(int id) async {
    try {
      await _dio.delete(ApiPaths.coachPlan(id));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final coachPlansRepositoryProvider = Provider<CoachPlansRepository>((ref) {
  return CoachPlansRepository(ref.watch(dioProvider));
});

final coachPlansProvider =
    FutureProvider.autoDispose<CoachPlansPage>((ref) {
  return ref.watch(coachPlansRepositoryProvider).list();
});

final coachPlanDetailProvider =
    FutureProvider.autoDispose.family<CoachPlan, int>((ref, id) {
  return ref.watch(coachPlansRepositoryProvider).get(id);
});
