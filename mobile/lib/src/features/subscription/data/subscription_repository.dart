import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'subscription_models.dart';

final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  return SubscriptionRepository(ref.watch(dioProvider));
});

class SubscriptionRepository {
  SubscriptionRepository(this._dio);

  final Dio _dio;

  Future<List<PublicCoachItem>> listCoaches() async {
    final res = await _dio.get(ApiPaths.coaches);
    final items = (res.data['items'] as List<dynamic>? ?? []);
    return items
        .map((e) => PublicCoachItem.fromJson(e as Map<String, dynamic>))
        .where((c) => c.slug.isNotEmpty)
        .toList();
  }

  Future<List<PublicPlan>> listCoachPlans(String slug) async {
    final res = await _dio.get(ApiPaths.coachPlans(slug));
    final plans = (res.data['plans'] as List<dynamic>? ?? []);
    return plans
        .map((e) => PublicPlan.fromJson(e as Map<String, dynamic>))
        .where((p) => p.id > 0)
        .toList();
  }

  Future<ZarinpalPaymentData> requestZarinpalPayment(int planId) async {
    final res = await _dio.post(
      ApiPaths.zarinpalRequest,
      data: {'plan_id': planId},
    );
    if (res.statusCode != null && res.statusCode! >= 400) {
      final data = res.data;
      String? raw;
      if (data is Map) raw = (data['error'] ?? data['message'])?.toString();
      throw ApiException(
        raw == null ? 'خطا در پرداخت' : translateApiError(raw),
        statusCode: res.statusCode,
      );
    }
    return ZarinpalPaymentData.fromJson(res.data as Map<String, dynamic>);
  }
}
