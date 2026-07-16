import 'package:flutter/material.dart';

import 'app_colors.dart';

/// RTL-friendly Fitino theme — light panel first (matches web student chrome).
class AppTheme {
  const AppTheme._();

  static const String fontFamily = 'IRANSansX';

  static ThemeData get light {
    final scheme = ColorScheme.light(
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      secondary: AppColors.brandAqua,
      onSecondary: AppColors.brandDeep,
      surface: AppColors.surface,
      onSurface: AppColors.foreground,
      error: AppColors.destructive,
      outline: AppColors.border,
    );

    return _finish(
      ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        fontFamily: fontFamily,
        colorScheme: scheme,
        scaffoldBackgroundColor: AppColors.background,
      ),
      isDark: false,
    );
  }

  static ThemeData get dark {
    final scheme = ColorScheme.dark(
      primary: AppColors.brandGlow,
      onPrimary: AppColors.brandDeep,
      secondary: AppColors.brandAqua,
      onSecondary: AppColors.foregroundDark,
      surface: AppColors.surfaceDark,
      onSurface: AppColors.foregroundDark,
      error: AppColors.destructive,
      outline: AppColors.borderDark,
    );

    return _finish(
      ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: fontFamily,
        colorScheme: scheme,
        scaffoldBackgroundColor: AppColors.backgroundDark,
      ),
      isDark: true,
    );
  }

  static ThemeData _finish(ThemeData base, {required bool isDark}) {
    final fg = isDark ? AppColors.foregroundDark : AppColors.foreground;
    final bg = isDark ? AppColors.backgroundDark : AppColors.background;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surface;
    final border = isDark ? AppColors.borderDark : AppColors.border;
    final fill =
        isDark ? AppColors.surfaceVariantDark : AppColors.surfaceVariant;
    final muted = isDark ? AppColors.mutedDark : AppColors.muted;

    return base.copyWith(
      appBarTheme: AppBarTheme(
        backgroundColor: bg.withValues(alpha: 0.92),
        foregroundColor: fg,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: fontFamily,
          fontWeight: FontWeight.w700,
          fontSize: 16,
          color: fg,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shadowColor: AppColors.brandDeep.withValues(alpha: isDark ? 0.22 : 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(FitinoRadii.lg),
          side: BorderSide(color: border.withValues(alpha: 0.9)),
        ),
        margin: const EdgeInsets.only(bottom: 8),
        clipBehavior: Clip.antiAlias,
      ),
      dividerColor: border,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: fill,
        hintStyle: TextStyle(color: muted),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(FitinoRadii.md),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(FitinoRadii.md),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(FitinoRadii.md),
          borderSide: const BorderSide(color: AppColors.brandGlow, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brandMid,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 48),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(FitinoRadii.md),
          ),
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: fg,
          minimumSize: const Size(0, 44),
          side: BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: fill,
        selectedColor: AppColors.brandMid.withValues(alpha: 0.16),
        labelStyle: TextStyle(fontFamily: fontFamily, color: fg, fontSize: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
          side: BorderSide(color: border),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.transparent,
        indicatorColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontFamily: fontFamily, fontSize: 10),
        ),
      ),
    );
  }
}
