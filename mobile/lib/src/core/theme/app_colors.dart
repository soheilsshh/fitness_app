import 'package:flutter/material.dart';

/// Fitino brand tokens — mirrored from `frontend/src/app/globals.css`
/// (logo aqua: #187272 → #2a9c96 → #58cac0 → #26fce3).
class AppColors {
  const AppColors._();

  static const Color brandDeep = Color(0xFF187272);
  static const Color brandMid = Color(0xFF2A9C96);
  static const Color brandAqua = Color(0xFF58CAC0);
  static const Color brandGlow = Color(0xFF26FCE3);
  static const Color brandLight = Color(0xFF6CEADE);

  static const Color primary = brandMid;
  static const Color primaryDark = brandDeep;
  static const Color onPrimary = Color(0xFFFFFFFF);

  // Light panel (web default)
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF5FBFA);
  static const Color surfaceVariant = Color(0xFFEEF8F6);
  static const Color border = Color(0xFFD7EBE8);
  static const Color foreground = Color(0xFF171717);
  static const Color muted = Color(0xFF6B8582);
  static const Color destructive = Color(0xFFE5484D);

  // Dark panel
  static const Color backgroundDark = Color(0xFF101818);
  static const Color surfaceDark = Color(0xFF152222);
  static const Color surfaceVariantDark = Color(0xFF1C2C2C);
  static const Color borderDark = Color(0xFF2A3D3D);
  static const Color foregroundDark = Color(0xFFF4FFFD);
  static const Color mutedDark = Color(0xFF9AB5B1);

  static const List<Color> chart = [
    brandGlow,
    brandAqua,
    brandMid,
    brandDeep,
    Color(0xFF0F4F4C),
  ];

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandDeep, brandMid, brandAqua, brandGlow],
    stops: [0.0, 0.4, 0.7, 1.0],
  );

  static const LinearGradient jewelGradient = LinearGradient(
    begin: Alignment(-0.4, -1),
    end: Alignment(0.6, 1),
    colors: [
      Color(0xFF7AF5E8),
      Color(0xFF2FB8AD),
      Color(0xFF1A7F7A),
      Color(0xFF0F4F4C),
    ],
    stops: [0.0, 0.38, 0.72, 1.0],
  );

  static const LinearGradient jewelGradientDark = LinearGradient(
    begin: Alignment(-0.4, -1),
    end: Alignment(0.6, 1),
    colors: [
      Color(0xFF5EF0DF),
      Color(0xFF2A9C96),
      Color(0xFF145E5A),
      Color(0xFF0A3331),
    ],
  );

  static const LinearGradient fabCore = LinearGradient(
    begin: Alignment(-0.5, -1),
    end: Alignment(0.5, 1),
    colors: [Color(0xFF8FFFF0), brandMid, Color(0xFF145E5A)],
    stops: [0.0, 0.42, 1.0],
  );

  static const LinearGradient accentBar = LinearGradient(
    colors: [brandGlow, brandDeep],
  );
}

class FitinoRadii {
  static const double sm = 10;
  static const double md = 14;
  static const double lg = 18;
  static const double xl = 22;
  static const double dock = 30.7; // ~1.92rem
  static const double dockOuter = 32; // ~2rem
  static const double jewel = 21.6; // ~1.35rem
}
