import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../data/ai_repository.dart';

const _quickPrompts = [
  'پروفایلم کجاست؟',
  'چطور با مربی تیکت بزنم؟',
  'تاریخچه تمرینات کجاست؟',
  'پایش وزن چطور کار می‌کند؟',
];

List<AiChatMessage> _defaultMessages() => const [
      AiChatMessage(
        role: 'assistant',
        content:
            'سلام! من دستیار فیتینو هستم. درباره امکانات اپ بپرس — برنامه تمرین و تغذیه را مربی‌ات می‌دهد.',
      ),
    ];

class AiChatScreen extends ConsumerStatefulWidget {
  const AiChatScreen({super.key});

  @override
  ConsumerState<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends ConsumerState<AiChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  late List<AiChatMessage> _messages;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _messages = _defaultMessages();
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _send(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || _sending) return;

    setState(() {
      _messages = [..._messages, AiChatMessage(role: 'user', content: trimmed)];
      _input.clear();
      _sending = true;
    });
    _scrollToEnd();

    try {
      final history = _messages
          .where((m) => m.role == 'user' || m.role == 'assistant')
          .toList();
      // Exclude the just-added user message from history payload (web does the same).
      final prior = history.length > 1
          ? history.sublist(0, history.length - 1)
          : <AiChatMessage>[];
      final slice =
          prior.length > 12 ? prior.sublist(prior.length - 12) : prior;

      final reply = await ref.read(aiChatRepositoryProvider).chat(
            message: trimmed,
            history: slice,
          );
      if (!mounted) return;
      setState(() {
        _messages = [
          ..._messages,
          AiChatMessage(role: 'assistant', content: reply),
        ];
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _messages = [
          ..._messages,
          AiChatMessage(role: 'assistant', content: e.message),
        ];
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages = [
          ..._messages,
          const AiChatMessage(
            role: 'assistant',
            content: 'ارتباط با دستیار برقرار نشد. کمی بعد دوباره تلاش کن.',
          ),
        ];
      });
    } finally {
      if (mounted) setState(() => _sending = false);
      _scrollToEnd();
    }
  }

  void _reset() {
    setState(() => _messages = _defaultMessages());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('دستیار فیتینو'),
        actions: [
          IconButton(
            tooltip: 'شروع مجدد',
            onPressed: _reset,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              itemCount: _messages.length + (_sending ? 1 : 0),
              itemBuilder: (_, i) {
                if (_sending && i == _messages.length) {
                  return const Align(
                    alignment: Alignment.centerRight,
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  );
                }
                final m = _messages[i];
                final isUser = m.role == 'user';
                return Align(
                  alignment:
                      isUser ? Alignment.centerLeft : Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.sizeOf(context).width * 0.82,
                    ),
                    decoration: BoxDecoration(
                      color: isUser
                          ? AppColors.primary.withValues(alpha: 0.2)
                          : AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(m.content, style: const TextStyle(height: 1.5)),
                  ),
                );
              },
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                for (final p in _quickPrompts)
                  Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: ActionChip(
                      label: Text(p, style: const TextStyle(fontSize: 12)),
                      onPressed: _sending ? null : () => _send(p),
                    ),
                  ),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: _sending ? null : _send,
                      decoration: const InputDecoration(
                        hintText: 'سوالت را بنویس…',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed:
                        _sending ? null : () => _send(_input.text),
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
