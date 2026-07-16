import 'package:flutter/material.dart';

import 'app_colors.dart';

/// RTL-friendly theme using the bundled IRANSansX Persian font.
class AppTheme {
  const AppTheme._();

  static const String fontFamily = 'IRANSansX';

  static ThemeData get dark {
    final scheme = const ColorScheme.dark(
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      secondary: AppColors.primary,
      surface: AppColors.surface,
      onSurface: AppColors.foreground,
      error: AppColors.destructive,
    );

    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: fontFamily,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.background,
      dividerColor: AppColors.border,
    );

    return _finish(base, isDark: true);
  }

  static ThemeData get light {
    const bg = Color(0xFFF5F7F6);
    const surface = Color(0xFFFFFFFF);
    const fg = Color(0xFF14201A);

    final scheme = const ColorScheme.light(
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      secondary: AppColors.primaryDark,
      surface: surface,
      onSurface: fg,
      error: AppColors.destructive,
    );

    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: fontFamily,
      colorScheme: scheme,
      scaffoldBackgroundColor: bg,
      dividerColor: const Color(0xFFE2E8E4),
    );

    return _finish(base, isDark: false);
  }

  static ThemeData _finish(ThemeData base, {required bool isDark}) {
    final fg = isDark ? AppColors.foreground : const Color(0xFF14201A);
    final bg = isDark ? AppColors.background : const Color(0xFFF5F7F6);
    final surface = isDark ? AppColors.surface : const Color(0xFFFFFFFF);
    final border = isDark ? AppColors.border : const Color(0xFFE2E8E4);
    final fill = isDark ? AppColors.surfaceVariant : const Color(0xFFF0F3F1);
    final muted = isDark ? AppColors.muted : const Color(0xFF6B7A72);

    return base.copyWith(
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        foregroundColor: fg,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: border),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: fill,
        hintStyle: TextStyle(color: muted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          minimumSize: const Size(0, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: AppColors.primary.withValues(alpha: 0.18),
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontFamily: fontFamily, fontSize: 12),
        ),
      ),
    );
  }
}
