import 'package:flutter/material.dart';

/// Palette ported from the web app (`frontend/src/app/globals.css`).
/// Web primary is `oklch(0.527 0.154 150)` — a sea-green — and the default
/// shell is dark (`~#131313`).
class AppColors {
  const AppColors._();

  static const Color primary = Color(0xFF2E8B57); // sea green
  static const Color primaryDark = Color(0xFF246941);
  static const Color onPrimary = Color(0xFFEAF7EF);

  static const Color background = Color(0xFF131313);
  static const Color surface = Color(0xFF1C1C1C);
  static const Color surfaceVariant = Color(0xFF242424);
  static const Color border = Color(0xFF2E2E2E);

  static const Color foreground = Color(0xFFE2E2E2);
  static const Color muted = Color(0xFF9A9A9A);

  static const Color destructive = Color(0xFFE5484D);

  // Green ramp used by charts (chart-1..5).
  static const List<Color> chart = [
    Color(0xFF7DE3A3),
    Color(0xFF49C97A),
    Color(0xFF2FA85E),
    Color(0xFF2E8B57),
    Color(0xFF1F6B43),
  ];
}
