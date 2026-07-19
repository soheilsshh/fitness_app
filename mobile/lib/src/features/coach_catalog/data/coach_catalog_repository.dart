import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';

class CoachExercise {
  const CoachExercise({
    required this.id,
    required this.name,
    this.category = '',
    this.bodyPart = '',
    this.equipment = '',
    this.target = '',
    this.imageUrl = '',
    this.gifUrl = '',
  });

  final int id;
  final String name;
  final String category;
  final String bodyPart;
  final String equipment;
  final String target;
  final String imageUrl;
  final String gifUrl;

  factory CoachExercise.fromJson(Map<String, dynamic> json) => CoachExercise(
        id: (json['id'] as num?)?.toInt() ?? 0,
        name: json['name'] as String? ?? '',
        category: json['category'] as String? ?? '',
        bodyPart: json['bodyPart'] as String? ?? '',
        equipment: json['equipment'] as String? ?? '',
        target: json['target'] as String? ?? '',
        imageUrl: json['imageUrl'] as String? ?? '',
        gifUrl: json['gifUrl'] as String? ?? '',
      );
}

class CoachCatalogFood {
  const CoachCatalogFood({
    required this.id,
    required this.name,
    this.unit = '',
    this.amount = 0,
    this.calories = 0,
    this.protein = 0,
    this.carbs = 0,
    this.fat = 0,
  });

  final int id;
  final String name;
  final String unit;
  final double amount;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;

  factory CoachCatalogFood.fromJson(Map<String, dynamic> json) =>
      CoachCatalogFood(
        id: (json['id'] as num?)?.toInt() ?? 0,
        name: json['name'] as String? ?? '',
        unit: json['unit'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        calories: (json['calories'] as num?)?.toDouble() ?? 0,
        protein: (json['protein'] as num?)?.toDouble() ?? 0,
        carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
        fat: (json['fat'] as num?)?.toDouble() ?? 0,
      );
}

class CoachCatalogRepository {
  CoachCatalogRepository(this._dio);
  final Dio _dio;

  Future<List<String>> exerciseCategories() async {
    try {
      final res = await _dio.get(ApiPaths.coachExerciseCategories);
      final data = res.data;
      if (data is Map) {
        return (data['categories'] as List? ?? const [])
            .map((e) => e.toString())
            .toList();
      }
      return const [];
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<CoachExercise>> searchExercises({
    String query = '',
    String category = '',
    int pageSize = 48,
  }) async {
    try {
      final res = await _dio.get(ApiPaths.coachExercises, queryParameters: {
        if (query.isNotEmpty) 'query': query,
        if (category.isNotEmpty) 'category': category,
        'pageSize': pageSize,
        'page': 1,
      });
      final data = res.data;
      final items =
          data is Map ? (data['items'] as List? ?? const []) : const [];
      return items
          .map((e) =>
              CoachExercise.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<CoachCatalogFood>> searchFoods({
    String query = '',
    int limit = 40,
  }) async {
    try {
      final res = await _dio.get(ApiPaths.coachFoods, queryParameters: {
        if (query.isNotEmpty) 'query': query,
        'page': 1,
        'limit': limit,
      });
      final data = res.data;
      final items =
          data is Map ? (data['items'] as List? ?? const []) : const [];
      return items
          .map((e) =>
              CoachCatalogFood.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  /// Multipart create — mirrors web ManualExerciseModal.
  Future<CoachExercise> createExercise({
    required String name,
    String category = '',
    String bodyPart = '',
    String equipment = '',
    String target = '',
    String description = '',
    String? mediaPath,
  }) async {
    try {
      final map = <String, dynamic>{
        'name': name,
        'category': category,
        'bodyPart': bodyPart,
        'equipment': equipment,
        'target': target,
        'description': description,
      };
      if (mediaPath != null && mediaPath.isNotEmpty) {
        map['media'] = await MultipartFile.fromFile(mediaPath);
      }
      final form = FormData.fromMap(map);
      final res = await _dio.post(ApiPaths.coachExercises, data: form);
      return CoachExercise.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final coachCatalogRepositoryProvider = Provider<CoachCatalogRepository>((ref) {
  return CoachCatalogRepository(ref.watch(dioProvider));
});
