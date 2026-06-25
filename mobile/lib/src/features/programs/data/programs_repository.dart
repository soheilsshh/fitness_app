import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import 'program_models.dart';

part 'programs_repository.g.dart';

class ProgramsRepository {
  ProgramsRepository(this._dio);
  final Dio _dio;

  Future<List<ProgramSummary>> list() async {
    try {
      final res = await _dio.get(ApiPaths.mePrograms);
      final body = ProgramsResponse.fromJson(
          Map<String, dynamic>.from(res.data as Map));
      return body.programs;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<ProgramDetail> detail(int id) async {
    try {
      final res = await _dio.get('${ApiPaths.mePrograms}/$id');
      return ProgramDetail.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

@riverpod
ProgramsRepository programsRepository(Ref ref) {
  return ProgramsRepository(ref.watch(dioProvider));
}
