import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../theme/theme_mode_provider.dart';
import 'fitino_ui.dart';

/// Sticky Fitino coach header — brand + tools shortcuts.
class FitinoCoachHeader extends ConsumerWidget {
  const FitinoCoachHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: (isDark ? AppColors.backgroundDark : AppColors.background)
            .withValues(alpha: 0.92),
        border: Border(
          bottom: BorderSide(
            color: (isDark ? AppColors.borderDark : AppColors.border)
                .withValues(alpha: 0.7),
          ),
        ),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.asset(
              'assets/branding/fitino-logo.png',
              width: 36,
              height: 36,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  gradient: AppColors.brandGradient,
                ),
                child: const Icon(Icons.fitness_center,
                    color: Colors.white, size: 18),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'فیتینو',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontFamily: AppTheme.fontFamily,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
                Text(
                  'پنل مربی · مدیریت شاگردان',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontFamily: AppTheme.fontFamily,
                    fontSize: 11,
                    color: isDark ? AppColors.mutedDark : AppColors.muted,
                  ),
                ),
              ],
            ),
          ),
          FitinoMetaIconButton(
            icon: Icons.notifications_outlined,
            tooltip: 'اعلان‌ها',
            onTap: () => context.push('/coach/notifications'),
          ),
          const SizedBox(width: 6),
          FitinoMetaIconButton(
            icon: Icons.person_outline,
            tooltip: 'پروفایل',
            onTap: () => context.push('/coach/profile'),
          ),
          const SizedBox(width: 6),
          FitinoMetaIconButton(
            icon: isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            tooltip: 'تم',
            onTap: () =>
                ref.read(themeModeProvider.notifier).toggleLightDark(),
          ),
        ],
      ),
    );
  }
}
