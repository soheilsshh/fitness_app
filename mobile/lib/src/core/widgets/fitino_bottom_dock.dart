import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

class FitinoNavItem {
  const FitinoNavItem({
    required this.id,
    required this.label,
    required this.icon,
  });

  final String id;
  final String label;
  final IconData icon;
}

/// Liquid-glass dock — pixel-faithful port of web `UserBottomNav`.
class FitinoBottomDock extends StatelessWidget {
  const FitinoBottomDock({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onSelect,
  });

  final List<FitinoNavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(14, 0, 14, math.max(bottom, 12)),
      child: Stack(
        alignment: Alignment.bottomCenter,
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 24,
            right: 24,
            bottom: 4,
            height: 40,
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.brandGlow.withValues(alpha: 0.28),
                      blurRadius: 36,
                      spreadRadius: 2,
                    ),
                    BoxShadow(
                      color: AppColors.brandDeep.withValues(alpha: 0.22),
                      blurRadius: 28,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
              ),
            ),
          ),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 416),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(FitinoRadii.dockOuter),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: isDark
                      ? [
                          AppColors.brandGlow.withValues(alpha: 0.55),
                          AppColors.brandGlow.withValues(alpha: 0.2),
                          AppColors.brandDeep.withValues(alpha: 0.55),
                          Colors.white.withValues(alpha: 0.08),
                        ]
                      : [
                          Colors.white.withValues(alpha: 0.55),
                          AppColors.brandLight.withValues(alpha: 0.45),
                          AppColors.brandDeep.withValues(alpha: 0.35),
                          Colors.white.withValues(alpha: 0.12),
                        ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF082828)
                        .withValues(alpha: isDark ? 0.75 : 0.45),
                    blurRadius: 50,
                    offset: const Offset(0, 22),
                    spreadRadius: -18,
                  ),
                  BoxShadow(
                    color: AppColors.brandGlow.withValues(alpha: 0.3),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                    spreadRadius: -10,
                  ),
                ],
              ),
              padding: const EdgeInsets.all(1),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(FitinoRadii.dock),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
                  child: Stack(
                    children: [
                      DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius:
                              BorderRadius.circular(FitinoRadii.dock),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: isDark
                                ? [
                                    const Color(0xE0122424),
                                    const Color(0xD10A1616),
                                    const Color(0xE6081010),
                                  ]
                                : [
                                    const Color(0xB8FFFFFF),
                                    const Color(0x8CE8FCFA),
                                    const Color(0x7AD2F0EC),
                                  ],
                          ),
                          border: Border.all(
                            color: Colors.white
                                .withValues(alpha: isDark ? 0.08 : 0.4),
                          ),
                        ),
                        child: const SizedBox.expand(),
                      ),
                      const Positioned.fill(child: _DockSheen()),
                      Padding(
                      padding: const EdgeInsets.all(6),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final tabW = constraints.maxWidth / items.length;
                          return Stack(
                            children: [
                              AnimatedPositioned(
                                duration: const Duration(milliseconds: 380),
                                curve: Curves.easeOutCubic,
                                // RTL: index 0 is on the right
                                right: selectedIndex * tabW,
                                width: tabW,
                                top: 0,
                                bottom: 0,
                                child: Padding(
                                  padding: const EdgeInsets.all(2),
                                  child: DecoratedBox(
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(
                                          FitinoRadii.jewel),
                                      gradient: isDark
                                          ? AppColors.jewelGradientDark
                                          : AppColors.jewelGradient,
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.brandDeep
                                              .withValues(alpha: 0.55),
                                          blurRadius: 18,
                                          offset: const Offset(0, 8),
                                          spreadRadius: -6,
                                        ),
                                      ],
                                      border: Border.all(
                                        color: Colors.white
                                            .withValues(alpha: 0.35),
                                      ),
                                    ),
                                    child: Stack(
                                      children: [
                                        Positioned(
                                          left: 8,
                                          right: 8,
                                          top: 2,
                                          height: 22,
                                          child: DecoratedBox(
                                            decoration: BoxDecoration(
                                              borderRadius:
                                                  BorderRadius.circular(14),
                                              gradient: LinearGradient(
                                                begin: Alignment.topCenter,
                                                end: Alignment.bottomCenter,
                                                colors: [
                                                  Colors.white
                                                      .withValues(alpha: 0.45),
                                                  Colors.white
                                                      .withValues(alpha: 0),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        Positioned(
                                          left: 12,
                                          right: 12,
                                          bottom: -4,
                                          height: 12,
                                          child: DecoratedBox(
                                            decoration: BoxDecoration(
                                              borderRadius:
                                                  BorderRadius.circular(999),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: AppColors.brandGlow
                                                      .withValues(alpha: 0.45),
                                                  blurRadius: 10,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Row(
                                children: [
                                  for (var i = 0; i < items.length; i++)
                                    Expanded(
                                      child: _DockTab(
                                        item: items[i],
                                        active: i == selectedIndex,
                                        onTap: () => onSelect(i),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Soft aqua sheen sweep — matches web `.fitino-dock-sheen` (4.8s).
class _DockSheen extends StatefulWidget {
  const _DockSheen();

  @override
  State<_DockSheen> createState() => _DockSheenState();
}

class _DockSheenState extends State<_DockSheen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4800),
    )..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _c,
        builder: (_, _) {
          final t = _c.value;
          return Align(
            alignment: Alignment(-1.2 + t * 2.4, 0),
            child: Container(
              width: 72,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Colors.white.withValues(alpha: 0),
                    Colors.white.withValues(alpha: 0.22),
                    Colors.white.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _DockTab extends StatelessWidget {
  const _DockTab({
    required this.item,
    required this.active,
    required this.onTap,
  });

  final FitinoNavItem item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final inactive = isDark
        ? Colors.white.withValues(alpha: 0.45)
        : const Color(0xE664748B);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(FitinoRadii.jewel),
        child: SizedBox(
          height: 56.8,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedScale(
                scale: active ? 1.1 : 1,
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutCubic,
                child: Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: active
                      ? BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          color: Colors.white.withValues(alpha: 0.15),
                        )
                      : null,
                  child: Icon(
                    item.icon,
                    size: 21,
                    color: active ? Colors.white : inactive,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                item.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: AppTheme.fontFamily,
                  fontSize: 10,
                  fontWeight: active ? FontWeight.w900 : FontWeight.w500,
                  color: active ? Colors.white : inactive,
                  height: 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
