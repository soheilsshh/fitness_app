import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../data/subscription_models.dart';
import '../data/subscription_repository.dart';

class SubscribeScreen extends ConsumerStatefulWidget {
  const SubscribeScreen({super.key});

  @override
  ConsumerState<SubscribeScreen> createState() => _SubscribeScreenState();
}

class _SubscribeScreenState extends ConsumerState<SubscribeScreen> {
  bool _loading = true;
  bool _paying = false;
  String? _error;
  List<PublicCoachItem> _coaches = [];
  List<PublicPlan> _plans = [];
  PublicCoachItem? _selectedCoach;

  @override
  void initState() {
    super.initState();
    _loadCoaches();
  }

  Future<void> _loadCoaches() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(subscriptionRepositoryProvider);
      final coaches = await repo.listCoaches();
      if (!mounted) return;
      setState(() {
        _coaches = coaches;
        _selectedCoach = coaches.isNotEmpty ? coaches.first : null;
        _loading = false;
      });
      if (_selectedCoach != null) {
        await _loadPlans(_selectedCoach!.slug);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : 'خطا در بارگذاری مربی‌ها';
        _loading = false;
      });
    }
  }

  Future<void> _loadPlans(String slug) async {
    setState(() {
      _loading = true;
      _error = null;
      _plans = [];
    });
    try {
      final repo = ref.read(subscriptionRepositoryProvider);
      final plans = await repo.listCoachPlans(slug);
      if (!mounted) return;
      setState(() {
        _plans = plans;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : 'خطا در بارگذاری پلن‌ها';
        _loading = false;
      });
    }
  }

  Future<void> _pay(PublicPlan plan) async {
    setState(() => _paying = true);
    try {
      final repo = ref.read(subscriptionRepositoryProvider);
      final payment = await repo.requestZarinpalPayment(plan.id);
      final uri = Uri.parse(payment.paymentUrl);
      final launched =
          await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('باز کردن درگاه پرداخت ناموفق بود')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e is ApiException ? e.message : 'خطا در شروع پرداخت'),
        ),
      );
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  String _formatToman(int value) => '$value تومان';

  @override
  Widget build(BuildContext context) {
    return FitinoPushScaffold(
      title: 'خرید اشتراک',
      description: 'انتخاب مربی و پلن',
      actions: [
        TextButton(
          onPressed: () => context.push('/student/coaches'),
          child: const Text('لیست مربی‌ها'),
        ),
      ],
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadCoaches,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child:
                          Text(_error!, style: const TextStyle(color: Colors.red)),
                    ),
                  if (_coaches.isNotEmpty) ...[
                    DropdownButtonFormField<PublicCoachItem>(
                      value: _selectedCoach,
                      decoration: const InputDecoration(labelText: 'مربی'),
                      items: _coaches
                          .map(
                            (c) => DropdownMenuItem(
                              value: c,
                              child: Text(c.displayName),
                            ),
                          )
                          .toList(),
                      onChanged: (coach) {
                        if (coach == null) return;
                        setState(() => _selectedCoach = coach);
                        _loadPlans(coach.slug);
                      },
                    ),
                    if (_selectedCoach != null) ...[
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () => context.push(
                          '/student/coaches/${_selectedCoach!.slug}',
                        ),
                        child: const Text('مشاهده صفحه عمومی مربی'),
                      ),
                    ],
                    const SizedBox(height: 16),
                  ],
                  if (_plans.isEmpty)
                    const FitinoEmptyState(
                        message: 'پلنی برای نمایش وجود ندارد.')
                  else
                    ..._plans.map(
                      (plan) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: FitinoPanelCard(
                          padding: EdgeInsets.zero,
                          child: ListTile(
                            title: Text(plan.title),
                            subtitle: Text('${plan.durationDays} روز'),
                            trailing: Text(_formatToman(plan.payable)),
                            onTap: _paying ? null : () => _pay(plan),
                          ),
                        ),
                      ),
                    ),
                  if (_paying)
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                ],
              ),
            ),
    );
  }
}
