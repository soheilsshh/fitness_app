import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

class FitinoPageHeader extends StatelessWidget {
  const FitinoPageHeader({
    super.key,
    required this.title,
    this.description,
    this.meta,
  });

  final String title;
  final String? description;
  final Widget? meta;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  gradient: AppColors.accentBar,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  fontFamily: AppTheme.fontFamily,
                  fontWeight: FontWeight.w900,
                  fontSize: 21,
                  letterSpacing: -0.3,
                  color: isDark
                      ? AppColors.foregroundDark
                      : AppColors.foreground,
                ),
              ),
              if (description != null) ...[
                const SizedBox(height: 6),
                Text(
                  description!,
                  style: TextStyle(
                    fontFamily: AppTheme.fontFamily,
                    fontWeight: FontWeight.w500,
                    fontSize: 13.5,
                    height: 1.45,
                    color: isDark ? AppColors.mutedDark : AppColors.muted,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (meta != null) meta!,
      ],
    );
  }
}

class FitinoPanelCard extends StatelessWidget {
  const FitinoPanelCard({
    super.key,
    required this.child,
    this.title,
    this.icon,
    this.action,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final String? title;
  final IconData? icon;
  final Widget? action;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(FitinoRadii.lg),
        color: isDark ? AppColors.surfaceDark : AppColors.surface,
        border: Border.all(
          color: (isDark ? AppColors.borderDark : AppColors.border)
              .withValues(alpha: 0.9),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.brandDeep.withValues(alpha: isDark ? 0.22 : 0.08),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  AppColors.surfaceDark,
                  AppColors.surfaceVariantDark.withValues(alpha: 0.85),
                ]
              : [
                  Colors.white,
                  AppColors.surfaceMuted,
                ],
        ),
      ),
      child: Padding(
        padding: padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null) ...[
              Row(
                children: [
                  if (icon != null) ...[
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppColors.brandGlow.withValues(alpha: 0.35),
                            AppColors.brandDeep.withValues(alpha: 0.12),
                          ],
                        ),
                      ),
                      child: Icon(icon, size: 18, color: AppColors.brandDeep),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Text(
                      title!,
                      style: const TextStyle(
                        fontFamily: AppTheme.fontFamily,
                        fontWeight: FontWeight.w700,
                        fontSize: 15.5,
                      ),
                    ),
                  ),
                  if (action != null) action!,
                ],
              ),
              const SizedBox(height: 14),
            ],
            child,
          ],
        ),
      ),
    );
  }
}

class FitinoMetaIconButton extends StatelessWidget {
  const FitinoMetaIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    required this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: Ink(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [
                        AppColors.brandGlow.withValues(alpha: 0.18),
                        AppColors.brandDeep.withValues(alpha: 0.35),
                      ]
                    : [
                        Colors.white,
                        AppColors.brandGlow.withValues(alpha: 0.18),
                      ],
              ),
              border: Border.all(
                color: AppColors.brandAqua.withValues(alpha: 0.35),
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.brandDeep.withValues(alpha: 0.12),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, size: 18, color: AppColors.brandDeep),
          ),
        ),
      ),
    );
  }
}

/// Push-route scaffold — Fitino page chrome without Material AppBar chrome.
class FitinoPushScaffold extends StatelessWidget {
  const FitinoPushScaffold({
    super.key,
    required this.title,
    required this.body,
    this.description,
    this.actions,
    this.floatingActionButton,
  });

  final String title;
  final String? description;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      floatingActionButton: floatingActionButton,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 4, 12, 8),
              child: Row(
                children: [
                  FitinoMetaIconButton(
                    icon: Icons.arrow_forward_rounded,
                    tooltip: 'بازگشت',
                    onTap: () => Navigator.of(context).maybePop(),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FitinoPageHeader(
                      title: title,
                      description: description,
                      meta: actions == null
                          ? null
                          : Row(
                              mainAxisSize: MainAxisSize.min,
                              children: actions!,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(child: body),
        ],
      ),
    );
  }
}

/// Soft aqua empty state — matches web `.fitino-empty`.
class FitinoEmptyState extends StatelessWidget {
  const FitinoEmptyState({
    super.key,
    required this.message,
    this.title,
    this.icon,
    this.action,
  });

  final String message;
  final String? title;
  final IconData? icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return FitinoPanelCard(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.brandGlow.withValues(alpha: 0.35),
                  AppColors.brandDeep.withValues(alpha: 0.12),
                ],
              ),
              border: Border.all(
                color: AppColors.brandAqua.withValues(alpha: 0.35),
              ),
            ),
            child: Icon(
              icon ?? Icons.inbox_outlined,
              color: isDark ? AppColors.brandLight : AppColors.brandDeep,
              size: 26,
            ),
          ),
          if (title != null) ...[
            const SizedBox(height: 14),
            Text(
              title!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: AppTheme.fontFamily,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: AppTheme.fontFamily,
              color: isDark ? AppColors.mutedDark : AppColors.muted,
              height: 1.5,
              fontSize: 13.5,
            ),
          ),
          if (action != null) ...[
            const SizedBox(height: 18),
            action!,
          ],
        ],
      ),
    );
  }
}

/// Brand gradient extended action — replaces Material FAB.extended.
class FitinoExtendedFab extends StatelessWidget {
  const FitinoExtendedFab({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            gradient: enabled
                ? AppColors.brandGradient
                : LinearGradient(
                    colors: [
                      AppColors.muted.withValues(alpha: 0.4),
                      AppColors.muted.withValues(alpha: 0.25),
                    ],
                  ),
            boxShadow: enabled
                ? [
                    BoxShadow(
                      color: AppColors.brandDeep.withValues(alpha: 0.35),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ]
                : null,
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.35),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: const TextStyle(
                    fontFamily: AppTheme.fontFamily,
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Brand spinner — use instead of raw CircularProgressIndicator.
class FitinoLoading extends StatelessWidget {
  const FitinoLoading({super.key, this.size = 28});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: size,
        height: size,
        child: const CircularProgressIndicator(
          strokeWidth: 2.5,
          color: AppColors.brandMid,
        ),
      ),
    );
  }
}

/// Jewel filter/choice chip — matches web `.fitino-subnav-chip`.
class FitinoChoiceChip extends StatelessWidget {
  const FitinoChoiceChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onSelected,
    this.icon,
  });

  final String label;
  final bool selected;
  final ValueChanged<bool> onSelected;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => onSelected(!selected),
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            gradient: selected
                ? (isDark
                    ? AppColors.jewelGradientDark
                    : AppColors.jewelGradient)
                : null,
            color: selected
                ? null
                : (isDark
                    ? AppColors.surfaceVariantDark
                    : AppColors.surfaceVariant),
            border: Border.all(
              color: selected
                  ? Colors.white.withValues(alpha: 0.3)
                  : (isDark ? AppColors.borderDark : AppColors.border),
            ),
            boxShadow: selected
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
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 14,
                  color: selected
                      ? Colors.white
                      : (isDark ? AppColors.mutedDark : AppColors.muted),
                ),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontFamily: AppTheme.fontFamily,
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected
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

/// Quick-action pill for dashboard shortcuts.
class FitinoQuickLink extends StatelessWidget {
  const FitinoQuickLink({
    super.key,
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FitinoChoiceChip(
      label: label,
      icon: icon,
      selected: false,
      onSelected: (_) => onTap(),
    );
  }
}

/// Compact meta badge — web `MetaBadge` / `.fitino-meta-badge`.
class FitinoMetaBadge extends StatelessWidget {
  const FitinoMetaBadge({
    super.key,
    required this.value,
    this.label,
    this.icon,
  });

  final String value;
  final String? label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        gradient: LinearGradient(
          colors: isDark
              ? [
                  AppColors.brandGlow.withValues(alpha: 0.16),
                  AppColors.brandDeep.withValues(alpha: 0.28),
                ]
              : [
                  Colors.white,
                  AppColors.brandGlow.withValues(alpha: 0.18),
                ],
        ),
        border: Border.all(
          color: AppColors.brandAqua.withValues(alpha: 0.4),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.brandDeep.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: AppColors.brandDeep),
            const SizedBox(width: 6),
          ],
          if (label != null) ...[
            Text(
              label!,
              style: TextStyle(
                fontFamily: AppTheme.fontFamily,
                fontSize: 12,
                color: isDark ? AppColors.mutedDark : AppColors.muted,
              ),
            ),
            const SizedBox(width: 6),
          ],
          Text(
            value,
            style: const TextStyle(
              fontFamily: AppTheme.fontFamily,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
