import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';

class AiChatMessage {
  const AiChatMessage({required this.role, required this.content});

  final String role; // user | assistant
  final String content;

  Map<String, dynamic> toJson() => {'role': role, 'content': content};

  factory AiChatMessage.fromJson(Map<String, dynamic> json) => AiChatMessage(
        role: json['role'] as String? ?? 'assistant',
        content: json['content'] as String? ?? '',
      );
}

class AiChatRepository {
  AiChatRepository(this._dio);
  final Dio _dio;

  Future<String> chat({
    required String message,
    required List<AiChatMessage> history,
    String pagePath = '/student/ai',
  }) async {
    try {
      final res = await _dio.post(
        ApiPaths.meAiChat,
        data: {
          'message': message,
          'history': history.map((m) => m.toJson()).toList(),
          'pagePath': pagePath,
        },
      );
      final data = res.data;
      if (data is Map) {
        return data['reply'] as String? ??
            'الان نتونستم پاسخ بدم. از بخش ارتباط با مربی تیکت بزن.';
      }
      return 'الان نتونستم پاسخ بدم.';
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final aiChatRepositoryProvider = Provider<AiChatRepository>((ref) {
  return AiChatRepository(ref.watch(dioProvider));
});
