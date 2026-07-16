import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../data/subscription_models.dart';
import '../data/subscription_repository.dart';

String _asset(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

class CoachesDirectoryScreen extends ConsumerStatefulWidget {
  const CoachesDirectoryScreen({super.key});

  @override
  ConsumerState<CoachesDirectoryScreen> createState() =>
      _CoachesDirectoryScreenState();
}

class _CoachesDirectoryScreenState
    extends ConsumerState<CoachesDirectoryScreen> {
  bool _loading = true;
  String? _error;
  List<PublicCoachItem> _coaches = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ref.read(subscriptionRepositoryProvider).listCoaches();
      if (!mounted) return;
      setState(() {
        _coaches = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : 'خطا در بارگذاری مربی‌ها';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return FitinoPushScaffold(
      title: 'مربی‌ها',
      description: 'مربیان منتشرشده فیتینو',
      body: _loading
          ? const FitinoLoading()
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null)
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                  if (_coaches.isEmpty)
                    const FitinoEmptyState(
                      message: 'مربی منتشرشده‌ای یافت نشد.',
                      icon: Icons.person_search_outlined,
                    )
                  else
                    ..._coaches.map(
                      (c) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: FitinoPanelCard(
                          padding: EdgeInsets.zero,
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundImage: c.avatarUrl.isNotEmpty
                                  ? NetworkImage(_asset(c.avatarUrl))
                                  : null,
                              child: c.avatarUrl.isEmpty
                                  ? const Icon(Icons.person)
                                  : null,
                            ),
                            title: Text(c.displayName),
                            subtitle: Text(
                              [
                                if (c.title.isNotEmpty) c.title,
                                if (c.specialty.isNotEmpty) c.specialty,
                              ].join(' · '),
                            ),
                            trailing: const Icon(Icons.chevron_left),
                            onTap: () =>
                                context.push('/student/coaches/${c.slug}'),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

class PublicCoachLandingScreen extends ConsumerStatefulWidget {
  const PublicCoachLandingScreen({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<PublicCoachLandingScreen> createState() =>
      _PublicCoachLandingScreenState();
}

class _PublicCoachLandingScreenState
    extends ConsumerState<PublicCoachLandingScreen> {
  bool _loading = true;
  bool _paying = false;
  String? _error;
  PublicCoachProfile? _coach;
  List<PublicPlan> _plans = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(subscriptionRepositoryProvider);
      final coach = await repo.getCoach(widget.slug);
      final plans = await repo.listCoachPlans(widget.slug);
      if (!mounted) return;
      setState(() {
        _coach = coach;
        _plans = plans;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : 'خطا در بارگذاری صفحه مربی';
        _loading = false;
      });
    }
  }

  Future<void> _pay(PublicPlan plan) async {
    setState(() => _paying = true);
    try {
      final payment = await ref
          .read(subscriptionRepositoryProvider)
          .requestZarinpalPayment(plan.id);
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

  String _toman(int v) => '$v تومان';

  @override
  Widget build(BuildContext context) {
    final c = _coach;
    return FitinoPushScaffold(
      title: c?.displayName ?? 'صفحه مربی',
      description: 'پروفایل عمومی و پلن‌ها',
      body: _loading
          ? const FitinoLoading()
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.only(bottom: 32),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(_error!,
                          style: const TextStyle(color: Colors.red)),
                    ),
                  if (c != null) ...[
                    if (c.coverImageUrl.isNotEmpty)
                      AspectRatio(
                        aspectRatio: 16 / 7,
                        child: Image.network(
                          _asset(c.coverImageUrl),
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              Container(color: AppColors.surfaceVariant),
                        ),
                      ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 36,
                                backgroundImage: c.avatarUrl.isNotEmpty
                                    ? NetworkImage(_asset(c.avatarUrl))
                                    : null,
                                child: c.avatarUrl.isEmpty
                                    ? const Icon(Icons.person, size: 36)
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(c.displayName,
                                        style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold)),
                                    if (c.title.isNotEmpty)
                                      Text(c.title,
                                          style: const TextStyle(
                                              color: AppColors.muted)),
                                    if (c.specialty.isNotEmpty)
                                      Text(c.specialty,
                                          style: const TextStyle(
                                              color: AppColors.muted,
                                              fontSize: 13)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (c.bio.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Text(c.bio),
                          ],
                          if (c.aboutCoach.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            const Text('درباره مربی',
                                style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            Text(c.aboutCoach,
                                style: const TextStyle(color: AppColors.muted)),
                          ],
                          if (c.achievements.isNotEmpty) ...[
                            const SizedBox(height: 20),
                            const Text('افتخارات و مدارک',
                                style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            ...c.achievements.map(
                              (a) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: FitinoPanelCard(
                                  padding: EdgeInsets.zero,
                                  child: ListTile(
                                    leading: a.imageUrl.isNotEmpty
                                        ? ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(6),
                                            child: Image.network(
                                              _asset(a.imageUrl),
                                              width: 48,
                                              height: 48,
                                              fit: BoxFit.cover,
                                            ),
                                          )
                                        : const Icon(
                                            Icons.emoji_events_outlined),
                                    title: Text(a.title),
                                    subtitle: Text(
                                      [
                                        if (a.issuer.isNotEmpty) a.issuer,
                                        if (a.year > 0) '${a.year}',
                                      ].join(' · '),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 20),
                          const Text('پلن‌ها',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          if (_plans.isEmpty)
                            const Text('پلنی برای خرید نیست.',
                                style: TextStyle(color: AppColors.muted))
                          else
                            ..._plans.map(
                              (plan) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: FitinoPanelCard(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(plan.title,
                                                style: const TextStyle(
                                                    fontWeight:
                                                        FontWeight.bold)),
                                          ),
                                          if (plan.isPopular)
                                            const Chip(
                                              label: Text('محبوب'),
                                              visualDensity:
                                                  VisualDensity.compact,
                                            ),
                                        ],
                                      ),
                                      if (plan.subtitle.isNotEmpty)
                                        Text(plan.subtitle,
                                            style: const TextStyle(
                                                color: AppColors.muted,
                                                fontSize: 13)),
                                      const SizedBox(height: 6),
                                      Text('${plan.durationDays} روز'),
                                      if (plan.featuresText.isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(plan.featuresText,
                                            style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.muted)),
                                      ],
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          Text(
                                            _toman(plan.payable),
                                            style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16),
                                          ),
                                          if (plan.discountPrice > 0 &&
                                              plan.discountPrice <
                                                  plan.price) ...[
                                            const SizedBox(width: 8),
                                            Text(
                                              _toman(plan.price),
                                              style: const TextStyle(
                                                decoration:
                                                    TextDecoration.lineThrough,
                                                color: AppColors.muted,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                          const Spacer(),
                                          FilledButton(
                                            onPressed: _paying
                                                ? null
                                                : () => _pay(plan),
                                            child: Text(
                                                _paying ? '...' : 'خرید'),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}
