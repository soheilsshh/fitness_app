import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/state_views.dart';
import '../data/coach_tickets_repository.dart';

String coachTicketStatusFa(String status) {
  switch (status) {
    case 'pending':
    case 'in_review':
      return 'در حال بررسی';
    case 'answered':
      return 'پاسخ داده شده';
    case 'closed':
      return 'بسته شده';
    default:
      return status;
  }
}

String coachTicketPriorityFa(String priority) {
  switch (priority) {
    case 'low':
      return 'کم';
    case 'high':
      return 'بالا';
    default:
      return 'معمولی';
  }
}

class CoachTicketsScreen extends ConsumerWidget {
  const CoachTicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(coachTicketsProvider);
    final filter = ref.watch(coachTicketsFilterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('تیکت‌ها')),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                for (final f in const [
                  ('all', 'همه'),
                  ('pending', 'در انتظار'),
                  ('answered', 'پاسخ‌داده‌شده'),
                  ('closed', 'بسته'),
                ])
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: ChoiceChip(
                      label: Text(f.$2),
                      selected: filter == f.$1,
                      onSelected: (_) {
                        ref.read(coachTicketsFilterProvider.notifier).state =
                            f.$1;
                      },
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.refresh(coachTicketsProvider.future),
              child: AsyncValueWidget<CoachTicketsPage>(
                value: async,
                onRetry: () => ref.invalidate(coachTicketsProvider),
                data: (page) {
                  if (page.items.isEmpty) {
                    return const EmptyView(message: 'تیکتی یافت نشد.');
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: page.items.length,
                    itemBuilder: (_, i) {
                      final t = page.items[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(t.title),
                          subtitle: Text(
                            '${t.studentName} · ${coachTicketStatusFa(t.status)} · ${coachTicketPriorityFa(t.priority)}',
                            style: const TextStyle(color: AppColors.muted),
                          ),
                          trailing: const Icon(Icons.chevron_left),
                          onTap: () =>
                              context.push('/coach/tickets/${t.id}'),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CoachTicketDetailScreen extends ConsumerStatefulWidget {
  const CoachTicketDetailScreen({super.key, required this.id});
  final int id;

  @override
  ConsumerState<CoachTicketDetailScreen> createState() =>
      _CoachTicketDetailScreenState();
}

class _CoachTicketDetailScreenState
    extends ConsumerState<CoachTicketDetailScreen> {
  final _answerCtrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _answerCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit(CoachTicketDetail t) async {
    final text = _answerCtrl.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('متن پاسخ را وارد کنید')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(coachTicketsRepositoryProvider).answer(widget.id, text);
      _answerCtrl.clear();
      ref.invalidate(coachTicketDetailProvider(widget.id));
      ref.invalidate(coachTicketsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('پاسخ ثبت شد')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(coachTicketDetailProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: const Text('پاسخ به تیکت')),
      body: AsyncValueWidget<CoachTicketDetail>(
        value: async,
        onRetry: () => ref.invalidate(coachTicketDetailProvider(widget.id)),
        data: (t) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(t.title,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                Chip(label: Text(coachTicketStatusFa(t.status))),
                Chip(label: Text(coachTicketPriorityFa(t.priority))),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                for (final s in const [
                  ('pending', 'در انتظار'),
                  ('answered', 'پاسخ‌داده‌شده'),
                  ('closed', 'بسته'),
                ])
                  ChoiceChip(
                    label: Text(s.$2),
                    selected: t.status == s.$1,
                    onSelected: _busy
                        ? null
                        : (_) async {
                            setState(() => _busy = true);
                            try {
                              await ref
                                  .read(coachTicketsRepositoryProvider)
                                  .updateStatus(widget.id, s.$1);
                              ref.invalidate(
                                  coachTicketDetailProvider(widget.id));
                              ref.invalidate(coachTicketsProvider);
                            } on ApiException catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(e.message)),
                                );
                              }
                            } finally {
                              if (mounted) setState(() => _busy = false);
                            }
                          },
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${t.studentName}${t.studentPhone.isNotEmpty ? ' · ${t.studentPhone}' : ''}',
              style: const TextStyle(color: AppColors.muted),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('پیام شاگرد',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(t.message, style: const TextStyle(height: 1.6)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (t.answer.isNotEmpty)
              Card(
                color: AppColors.primary.withValues(alpha: 0.08),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('پاسخ قبلی',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(t.answer, style: const TextStyle(height: 1.6)),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 16),
            TextField(
              controller: _answerCtrl,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'پاسخ شما',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _busy ? null : () => _submit(t),
              child: Text(_busy ? 'در حال ارسال...' : 'ثبت پاسخ'),
            ),
          ],
        ),
      ),
    );
  }
}
