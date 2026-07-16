import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../data/content_models.dart';
import '../data/content_repository.dart';

class FaqScreen extends ConsumerStatefulWidget {
  const FaqScreen({super.key});

  @override
  ConsumerState<FaqScreen> createState() => _FaqScreenState();
}

class _FaqScreenState extends ConsumerState<FaqScreen> {
  final _query = TextEditingController();

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(faqProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('سوالات متداول')),
      body: AsyncValueWidget<List<FaqGroup>>(
        value: async,
        onRetry: () => ref.invalidate(faqProvider),
        data: (groups) {
          final q = _query.text.trim().toLowerCase();
          final filtered = q.isEmpty
              ? groups
              : groups
                  .map((g) => FaqGroup(
                        id: g.id,
                        title: g.title,
                        items: g.items
                            .where((i) =>
                                i.q.toLowerCase().contains(q) ||
                                i.a.toLowerCase().contains(q))
                            .toList(),
                      ))
                  .where((g) => g.items.isNotEmpty)
                  .toList();

          final total =
              filtered.fold<int>(0, (n, g) => n + g.items.length);

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                controller: _query,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'جستجو در سوالات…',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: q.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _query.clear();
                            setState(() {});
                          },
                        ),
                ),
              ),
              const SizedBox(height: 12),
              Text('$total پاسخ',
                  style: const TextStyle(color: AppColors.muted)),
              const SizedBox(height: 12),
              if (filtered.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: Center(child: Text('موردی پیدا نشد')),
                )
              else
                ...filtered.map((g) => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(g.title,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 15)),
                        ),
                        ...g.items.map(
                          (item) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ExpansionTile(
                              title: Text(item.q,
                                  style: const TextStyle(fontSize: 14)),
                              children: [
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(
                                      16, 0, 16, 16),
                                  child: Text(item.a,
                                      style: const TextStyle(
                                          color: AppColors.muted,
                                          height: 1.6)),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )),
            ],
          );
        },
      ),
    );
  }
}
