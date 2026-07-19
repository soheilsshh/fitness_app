import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../config/app_config.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../theme/theme_mode_provider.dart';
import '../../features/profile/data/profile_models.dart';
import '../../features/profile/data/profile_repository.dart';
import 'fitino_ui.dart';

String _assetUrl(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

int _profilePercent(MeProfile? p) {
  if (p == null) return 0;
  if (p.isProfileComplete) return 100;
  var score = 0;
  if (p.firstName.isNotEmpty) score += 15;
  if (p.primaryGoal.isNotEmpty || p.goals.isNotEmpty) score += 15;
  if (p.heightCm != null && p.weightKg != null) score += 25;
  if (p.medicalHistory.isNotEmpty ||
      p.injuries.isNotEmpty ||
      p.physicalLimitations.isNotEmpty) {
    score += 20;
  }
  if (p.photos.isNotEmpty) score += 25;
  return score.clamp(0, 100);
}

/// Sticky Fitino student header — avatar ring + greeting + academy/FAQ/theme.
class FitinoStudentHeader extends ConsumerWidget {
  const FitinoStudentHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myProfileProvider);
    final avatarAsync = ref.watch(myAvatarUrlProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final profile = profileAsync.asData?.value;
    final name = (profile?.firstName.isNotEmpty == true)
        ? profile!.firstName
        : 'ورزشکار';
    final percent = _profilePercent(profile);
    final photo = avatarAsync.asData?.value ?? '';

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
          _ProgressAvatar(
            percent: percent,
            photoUrl: _assetUrl(photo),
            name: name,
            onTap: () {},
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: AppTheme.fontFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                Text(
                  'به مسیر اهدافت خوش آمدی',
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
            icon: Icons.school_outlined,
            tooltip: 'آموزش',
            onTap: () => context.push('/student/academy'),
          ),
          const SizedBox(width: 6),
          FitinoMetaIconButton(
            icon: Icons.help_outline,
            tooltip: 'سوالات متداول',
            onTap: () => context.push('/student/faq'),
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

class _ProgressAvatar extends StatelessWidget {
  const _ProgressAvatar({
    required this.percent,
    required this.photoUrl,
    required this.name,
    required this.onTap,
  });

  final int percent;
  final String photoUrl;
  final String name;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    const size = 44.0;
    const stroke = 3.0;
    final complete = percent >= 100;
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            CustomPaint(
              size: const Size(size, size),
              painter: _RingPainter(
                progress: complete ? 1 : (percent / 100).clamp(0.0, 1.0),
                complete: complete,
                stroke: stroke,
              ),
            ),
            Container(
              width: size - 6,
              height: size - 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.surfaceVariant,
                border: Border.all(color: Colors.white, width: 2),
                image: photoUrl.isNotEmpty
                    ? DecorationImage(
                        image: NetworkImage(photoUrl),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: photoUrl.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(6),
                      child: Image.asset(
                        'assets/branding/fitino-logo.png',
                        fit: BoxFit.contain,
                      ),
                    )
                  : null,
            ),
            if (complete)
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.green.shade500,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: const Icon(Icons.check, size: 8, color: Colors.white),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.complete,
    required this.stroke,
  });

  final double progress;
  final bool complete;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - stroke) / 2;
    final bg = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = AppColors.border;
    canvas.drawCircle(center, radius, bg);

    final fg = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = complete ? Colors.green : AppColors.brandMid;

    final sweep = complete ? 2 * math.pi : 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweep,
      false,
      fg,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.complete != complete;
}

class FitinoSubNavChips extends StatelessWidget {
  const FitinoSubNavChips({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onSelect,
  });

  final List<({String label, IconData icon})> items;
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            _Chip(
              label: items[i].label,
              icon: items[i].icon,
              active: i == selectedIndex,
              isDark: isDark,
              onTap: () => onSelect(i),
            ),
          ],
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.icon,
    required this.active,
    required this.isDark,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool active;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            gradient: active
                ? (isDark
                    ? AppColors.jewelGradientDark
                    : AppColors.jewelGradient)
                : null,
            color: active
                ? null
                : (isDark
                    ? AppColors.surfaceVariantDark
                    : AppColors.surfaceVariant),
            border: Border.all(
              color: active
                  ? Colors.white.withValues(alpha: 0.3)
                  : (isDark ? AppColors.borderDark : AppColors.border),
            ),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: AppColors.brandDeep.withValues(alpha: 0.35),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 14,
                color: active
                    ? Colors.white
                    : (isDark ? AppColors.mutedDark : AppColors.muted),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontFamily: AppTheme.fontFamily,
                  fontSize: 12,
                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  color: active
                      ? Colors.white
                      : (isDark ? AppColors.mutedDark : AppColors.muted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
