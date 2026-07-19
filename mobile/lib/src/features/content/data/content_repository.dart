import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'content_models.dart';

class ContentRepository {
  ContentRepository(this._dio);
  final Dio _dio;

  Future<List<AcademyItem>> getAcademy() async {
    try {
      final res = await _dio.get(ApiPaths.academy);
      final items = (res.data is Map)
          ? (res.data['items'] as List? ?? const [])
          : const [];
      final list = items
          .map((e) => AcademyItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      list.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      return list;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<FaqGroup>> getFaq() async {
    try {
      final res = await _dio.get(ApiPaths.faq);
      final groups = (res.data is Map)
          ? (res.data['groups'] as List? ?? const [])
          : const [];
      return groups
          .map((e) => FaqGroup.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final contentRepositoryProvider = Provider<ContentRepository>((ref) {
  return ContentRepository(ref.watch(dioProvider));
});

final academyProvider = FutureProvider.autoDispose<List<AcademyItem>>((ref) {
  return ref.watch(contentRepositoryProvider).getAcademy();
});

final faqProvider = FutureProvider.autoDispose<List<FaqGroup>>((ref) {
  return ref.watch(contentRepositoryProvider).getFaq();
});
