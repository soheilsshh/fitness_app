import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../auth/application/auth_controller.dart';
import '../data/profile_models.dart';
import '../data/profile_repository.dart';
import 'change_password_dialog.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myProfileProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('پروفایل')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(myProfileProvider.future),
        child: AsyncValueWidget<MeProfile>(
          value: async,
          onRetry: () => ref.invalidate(myProfileProvider),
          data: (p) => _Body(profile: p),
        ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.profile});
  final MeProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 42,
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                child: const Icon(Icons.person,
                    size: 44, color: AppColors.primary),
              ),
              const SizedBox(height: 12),
              Text(
                profile.fullName.isEmpty ? 'کاربر' : profile.fullName,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Text(profile.phone,
                  style: const TextStyle(color: AppColors.muted)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _infoRow('ایمیل', profile.email),
        _infoRow('قد', profile.heightCm == null ? '—' : '${profile.heightCm} سانتی‌متر'),
        _infoRow('وزن', profile.weightKg == null ? '—' : '${profile.weightKg} کیلوگرم'),
        _infoRow('هدف اصلی', profile.primaryGoal.isEmpty ? '—' : profile.primaryGoal),
        _infoRow('مربی', profile.assignedCoachName.isEmpty ? '—' : profile.assignedCoachName),
        _infoRow('برنامه‌ها', '${profile.programsCount}'),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: () => context.push('/student/subscribe'),
          icon: const Icon(Icons.payment),
          label: const Text('خرید اشتراک'),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => showDialog(
            context: context,
            builder: (_) => const ChangePasswordDialog(),
          ),
          icon: const Icon(Icons.lock_outline),
          label: const Text('تغییر گذرواژه'),
        ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.destructive,
          ),
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          icon: const Icon(Icons.logout),
          label: const Text('خروج از حساب'),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.muted)),
          Flexible(child: Text(value, textAlign: TextAlign.left)),
        ],
      ),
    );
  }
}
