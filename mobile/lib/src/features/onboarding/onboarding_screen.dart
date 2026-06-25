import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../auth/application/auth_controller.dart';

/// Placeholder onboarding shown to students whose profile is incomplete.
/// Full multi-step onboarding is out of scope for this build.
class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تکمیل پروفایل'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.assignment_ind_outlined,
                  size: 56, color: AppColors.primary),
              SizedBox(height: 16),
              Text(
                'برای استفاده کامل، پروفایل خود را در نسخه وب تکمیل کنید.',
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 8),
              Text('فرم آنبوردینگ موبایل به‌زودی اضافه می‌شود.',
                  style: TextStyle(color: AppColors.muted)),
            ],
          ),
        ),
      ),
    );
  }
}
