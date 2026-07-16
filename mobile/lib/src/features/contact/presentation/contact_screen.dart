import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../../../core/widgets/state_views.dart';
import '../../profile/data/profile_repository.dart';

class TicketItem {
  const TicketItem({
    required this.id,
    required this.title,
    required this.status,
    this.createdAt,
    this.answered = false,
    this.priority = '',
  });

  final int id;
  final String title;
  final String status;
  final String? createdAt;
  final bool answered;
  final String priority;

  factory TicketItem.fromJson(Map<String, dynamic> json) => TicketItem(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? json['subject'] as String? ?? '',
        status: json['status'] as String? ?? '',
        createdAt: json['createdAt']?.toString(),
        answered: json['answered'] == true,
        priority: json['priority'] as String? ?? '',
      );
}

class TicketDetail {
  const TicketDetail({
    required this.id,
    required this.title,
    required this.status,
    required this.message,
    this.answer = '',
    this.createdAt,
    this.answeredAt,
    this.priority = '',
  });

  final int id;
  final String title;
  final String status;
  final String message;
  final String answer;
  final String? createdAt;
  final String? answeredAt;
  final String priority;

  factory TicketDetail.fromJson(Map<String, dynamic> json) => TicketDetail(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? '',
        status: json['status'] as String? ?? '',
        message: json['message'] as String? ?? json['body'] as String? ?? '',
        answer: json['answer'] as String? ?? '',
        createdAt: json['createdAt']?.toString(),
        answeredAt: json['answeredAt']?.toString(),
        priority: json['priority'] as String? ?? '',
      );
}

class ContactRepository {
  ContactRepository(this._dio);
  final Dio _dio;

  Future<List<TicketItem>> list() async {
    try {
      final res = await _dio.get(ApiPaths.meTickets);
      final data = res.data;
      final list = data is Map
          ? (data['items'] as List? ?? data['tickets'] as List? ?? const [])
          : (data as List? ?? const []);
      return list
          .map((e) => TicketItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<TicketDetail> detail(int id) async {
    try {
      final res = await _dio.get(ApiPaths.meTicket(id));
      return TicketDetail.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<TicketItem> create({
    required String title,
    required String message,
    String priority = 'normal',
  }) async {
    try {
      final res = await _dio.post(
        ApiPaths.meTickets,
        data: {
          'title': title,
          'message': message,
          'priority': priority,
        },
      );
      return TicketItem.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final contactRepositoryProvider =
    Provider((ref) => ContactRepository(ref.watch(dioProvider)));

final ticketsProvider = FutureProvider.autoDispose<List<TicketItem>>((ref) {
  return ref.watch(contactRepositoryProvider).list();
});

final ticketDetailProvider =
    FutureProvider.autoDispose.family<TicketDetail, int>((ref, id) {
  return ref.watch(contactRepositoryProvider).detail(id);
});

String ticketStatusFa(String s) {
  return switch (s) {
    'pending' || 'in_review' => 'در حال بررسی',
    'answered' => 'پاسخ داده شده',
    'closed' => 'بسته شده',
    _ => s.isEmpty ? 'نامشخص' : s,
  };
}

class ContactScreen extends ConsumerWidget {
  const ContactScreen({super.key});

  Future<void> _createTicket(BuildContext context, WidgetRef ref) async {
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تیکت جدید'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleCtrl,
              decoration: const InputDecoration(labelText: 'موضوع'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: bodyCtrl,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'پیام'),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('انصراف')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('ارسال')),
        ],
      ),
    );
    if (ok != true) return;
    final title = titleCtrl.text.trim();
    final message = bodyCtrl.text.trim();
    if (title.isEmpty || message.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('موضوع و پیام الزامی است')),
        );
      }
      return;
    }
    try {
      await ref.read(contactRepositoryProvider).create(
            title: title,
            message: message,
          );
      ref.invalidate(ticketsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تیکت ارسال شد')),
        );
      }
    } on ApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(ticketsProvider);
    final profile = ref.watch(myProfileProvider);
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.brandMid,
        onRefresh: () async => ref.refresh(ticketsProvider.future),
        child: AsyncValueWidget<List<TicketItem>>(
          value: async,
          onRetry: () => ref.invalidate(ticketsProvider),
          data: (items) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              children: [
                FitinoPageHeader(
                  title: 'ارتباط با مربی',
                  description: 'تیکت‌ها و پشتیبانی',
                  meta: FitinoMetaIconButton(
                    icon: Icons.add_comment_outlined,
                    tooltip: 'تیکت جدید',
                    onTap: () => _createTicket(context, ref),
                  ),
                ),
                const SizedBox(height: 12),
                profile.whenOrNull(
                      data: (p) {
                        if (p.assignedCoachName.isEmpty) return null;
                        return FitinoPanelCard(
                          padding: EdgeInsets.zero,
                          child: ListTile(
                            leading: const Icon(Icons.person,
                                color: AppColors.brandMid),
                            title: Text(p.assignedCoachName),
                            subtitle: const Text('مربی اختصاصی شما'),
                          ),
                        );
                      },
                    ) ??
                    const SizedBox.shrink(),
                if (items.isEmpty) ...[
                  const SizedBox(height: 60),
                  const EmptyView(
                    message: 'هنوز تیکتی ندارید',
                    icon: Icons.support_agent,
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: FilledButton.icon(
                      onPressed: () => _createTicket(context, ref),
                      icon: const Icon(Icons.add),
                      label: const Text('تیکت جدید'),
                    ),
                  ),
                ] else
                  ...items.map(
                    (t) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: FitinoPanelCard(
                        padding: EdgeInsets.zero,
                        child: ListTile(
                          title: Text(t.title),
                          subtitle: Text(
                            [
                              ticketStatusFa(t.status),
                              if (t.createdAt != null) t.createdAt!,
                            ].join(' · '),
                            style: const TextStyle(color: AppColors.muted),
                          ),
                          trailing: t.answered
                              ? const Icon(Icons.mark_chat_read,
                                  color: AppColors.brandMid)
                              : const Icon(Icons.chevron_left),
                          onTap: () =>
                              context.push('/student/tickets/${t.id}'),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class TicketDetailScreen extends ConsumerWidget {
  const TicketDetailScreen({super.key, required this.id});
  final int id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(ticketDetailProvider(id));
    return FitinoPushScaffold(
      title: 'جزئیات تیکت',
      description: 'پیام شما و پاسخ مربی',
      body: AsyncValueWidget<TicketDetail>(
        value: async,
        onRetry: () => ref.invalidate(ticketDetailProvider(id)),
        data: (t) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Chip(label: Text(ticketStatusFa(t.status))),
                const Spacer(),
                if (t.createdAt != null)
                  Text(t.createdAt!,
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 12),
            Text(t.title,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            FitinoPanelCard(
              title: 'پیام شما',
              icon: Icons.chat_bubble_outline,
              child: Text(t.message, style: const TextStyle(height: 1.6)),
            ),
            const SizedBox(height: 12),
            FitinoPanelCard(
              title: 'پاسخ مربی',
              icon: Icons.support_agent,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.answer.isEmpty
                        ? 'هنوز پاسخی ثبت نشده است.'
                        : t.answer,
                    style: TextStyle(
                      height: 1.6,
                      color: t.answer.isEmpty ? AppColors.muted : null,
                    ),
                  ),
                  if (t.answeredAt != null) ...[
                    const SizedBox(height: 8),
                    Text('پاسخ در ${t.answeredAt}',
                        style: const TextStyle(
                            color: AppColors.muted, fontSize: 12)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Optional helper to open social links if available later.
Future<void> openExternal(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
