import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';

class CoachProfile {
  const CoachProfile({
    required this.userId,
    this.slug = '',
    this.displayName = '',
    this.title = '',
    this.bio = '',
    this.aboutCoach = '',
    this.specialty = '',
    this.nationalId = '',
    this.city = '',
    this.status = '',
    this.avatarUrl = '',
    this.coverImageUrl = '',
    this.isPublished = false,
    this.publicUrl = '',
    this.phone = '',
    this.instagram = '',
    this.telegram = '',
    this.whatsapp = '',
    this.website = '',
  });

  final int userId;
  final String slug;
  final String displayName;
  final String title;
  final String bio;
  final String aboutCoach;
  final String specialty;
  final String nationalId;
  final String city;
  final String status;
  final String avatarUrl;
  final String coverImageUrl;
  final bool isPublished;
  final String publicUrl;
  final String phone;
  final String instagram;
  final String telegram;
  final String whatsapp;
  final String website;

  factory CoachProfile.fromJson(Map<String, dynamic> json) {
    final social = json['social'] is Map
        ? Map<String, dynamic>.from(json['social'] as Map)
        : <String, dynamic>{};
    return CoachProfile(
      userId: (json['userId'] as num?)?.toInt() ?? 0,
      slug: json['slug'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      title: json['title'] as String? ?? '',
      bio: json['bio'] as String? ?? '',
      aboutCoach: json['aboutCoach'] as String? ?? '',
      specialty: json['specialty'] as String? ?? '',
      nationalId: json['nationalId'] as String? ?? '',
      city: json['city'] as String? ?? '',
      status: json['status'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String? ?? '',
      coverImageUrl: json['coverImageUrl'] as String? ?? '',
      isPublished: json['isPublished'] == true,
      publicUrl: json['publicUrl'] as String? ?? '',
      phone: social['phone'] as String? ?? '',
      instagram: social['instagram'] as String? ?? '',
      telegram: social['telegram'] as String? ?? '',
      whatsapp: social['whatsapp'] as String? ?? '',
      website: social['website'] as String? ?? '',
    );
  }
}

class CoachAchievement {
  const CoachAchievement({
    required this.id,
    this.type = '',
    this.title = '',
    this.issuer = '',
    this.year = 0,
    this.description = '',
    this.imageUrl = '',
    this.sortOrder = 0,
    this.isVisible = true,
  });

  final int id;
  final String type;
  final String title;
  final String issuer;
  final int year;
  final String description;
  final String imageUrl;
  final int sortOrder;
  final bool isVisible;

  factory CoachAchievement.fromJson(Map<String, dynamic> json) =>
      CoachAchievement(
        id: (json['id'] as num?)?.toInt() ?? 0,
        type: json['type'] as String? ?? '',
        title: json['title'] as String? ?? '',
        issuer: json['issuer'] as String? ?? '',
        year: (json['year'] as num?)?.toInt() ?? 0,
        description: json['description'] as String? ?? '',
        imageUrl: json['imageUrl'] as String? ?? '',
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
        isVisible: json['isVisible'] != false,
      );
}

class CoachProfileRepository {
  CoachProfileRepository(this._dio);
  final Dio _dio;

  Future<CoachProfile> get() async {
    try {
      final res = await _dio.get(ApiPaths.coachProfile);
      return CoachProfile.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachProfile> update(Map<String, dynamic> body) async {
    try {
      final res = await _dio.put(ApiPaths.coachProfile, data: body);
      return CoachProfile.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> submitRequest() async {
    try {
      await _dio.post(ApiPaths.coachProfileSubmit);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<bool> checkSlug(String slug) async {
    try {
      final res = await _dio.get(ApiPaths.coachProfileSlugCheck,
          queryParameters: {'slug': slug});
      final data = res.data;
      if (data is Map) return data['available'] == true;
      return false;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<String> uploadAvatar(String path) async {
    try {
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(path),
      });
      final res = await _dio.post(ApiPaths.coachProfileAvatar, data: form);
      final data = res.data;
      if (data is Map) return data['url'] as String? ?? '';
      return '';
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<String> uploadCover(String path) async {
    try {
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(path),
      });
      final res = await _dio.post(ApiPaths.coachProfileCover, data: form);
      final data = res.data;
      if (data is Map) return data['url'] as String? ?? '';
      return '';
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<CoachAchievement>> achievements() async {
    try {
      final res = await _dio.get(ApiPaths.coachAchievements);
      final data = res.data;
      final items =
          data is Map ? (data['items'] as List? ?? const []) : const [];
      return items
          .map((e) =>
              CoachAchievement.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachAchievement> createAchievement(Map<String, dynamic> body) async {
    try {
      final res = await _dio.post(ApiPaths.coachAchievements, data: body);
      return CoachAchievement.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<CoachAchievement> updateAchievement(
      int id, Map<String, dynamic> body) async {
    try {
      final res = await _dio.put(ApiPaths.coachAchievement(id), data: body);
      return CoachAchievement.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> deleteAchievement(int id) async {
    try {
      await _dio.delete(ApiPaths.coachAchievement(id));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<String> uploadAchievementImage(String path) async {
    try {
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(path),
      });
      final res = await _dio.post(ApiPaths.coachAchievementImage, data: form);
      final data = res.data;
      if (data is Map) return data['url'] as String? ?? '';
      return '';
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final coachProfileRepositoryProvider = Provider<CoachProfileRepository>((ref) {
  return CoachProfileRepository(ref.watch(dioProvider));
});

final coachProfileProvider = FutureProvider.autoDispose<CoachProfile>((ref) {
  return ref.watch(coachProfileRepositoryProvider).get();
});

final coachAchievementsProvider =
    FutureProvider.autoDispose<List<CoachAchievement>>((ref) {
  return ref.watch(coachProfileRepositoryProvider).achievements();
});
