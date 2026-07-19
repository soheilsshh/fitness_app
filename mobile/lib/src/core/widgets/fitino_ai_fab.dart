import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart';

/// Draggable Fitino AI launcher — port of web `FitinoAIAssistant`.
class FitinoAiFab extends StatefulWidget {
  const FitinoAiFab({super.key, this.hidden = false});

  final bool hidden;

  @override
  State<FitinoAiFab> createState() => _FitinoAiFabState();
}

class _FitinoAiFabState extends State<FitinoAiFab>
    with TickerProviderStateMixin {
  static const _size = 48.0;
  static const _storageKey = 'fitino_ai_fab_pos';

  Offset _pos = const Offset(16, 120);
  bool _ready = false;
  bool _pressed = false;
  bool _dragging = false;
  Offset? _dragStart;
  Offset? _origin;

  late final AnimationController _spin;
  late final AnimationController _breathe;

  @override
  void initState() {
    super.initState();
    _spin = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4500),
    )..repeat();
    _breathe = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    )..repeat(reverse: true);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadPos());
  }

  @override
  void dispose() {
    _spin.dispose();
    _breathe.dispose();
    super.dispose();
  }

  Future<void> _loadPos() async {
    if (!mounted) return;
    final size = MediaQuery.sizeOf(context);
    final pad = MediaQuery.paddingOf(context);
    Offset next = Offset(
      size.width - _size - 18,
      size.height - _size - 118 - pad.bottom,
    );
    try {
      const storage = FlutterSecureStorage();
      final raw = await storage.read(key: _storageKey);
      if (raw != null && raw.contains(',')) {
        final parts = raw.split(',');
        final x = double.tryParse(parts[0]);
        final y = double.tryParse(parts[1]);
        if (x != null && y != null) next = Offset(x, y);
      }
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      _pos = _clamp(next, size, pad);
      _ready = true;
    });
  }

  Offset _clamp(Offset p, Size size, EdgeInsets pad) {
    const margin = 10.0;
    final maxX = math.max(margin, size.width - _size - margin);
    final maxY = math.max(margin, size.height - _size - margin - pad.bottom);
    return Offset(
      p.dx.clamp(margin, maxX),
      p.dy.clamp(margin + pad.top, maxY),
    );
  }

  Future<void> _persist() async {
    try {
      const storage = FlutterSecureStorage();
      await storage.write(key: _storageKey, value: '${_pos.dx},${_pos.dy}');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (widget.hidden || !_ready) return const SizedBox.shrink();

    return Positioned(
      left: _pos.dx,
      top: _pos.dy,
      child: GestureDetector(
        onPanStart: (d) {
          _dragging = false;
          _pressed = true;
          _dragStart = d.globalPosition;
          _origin = _pos;
          setState(() {});
        },
        onPanUpdate: (d) {
          final start = _dragStart;
          final origin = _origin;
          if (start == null || origin == null) return;
          final delta = d.globalPosition - start;
          if (delta.distance > 6) _dragging = true;
          final size = MediaQuery.sizeOf(context);
          final pad = MediaQuery.paddingOf(context);
          setState(() => _pos = _clamp(origin + delta, size, pad));
        },
        onPanEnd: (_) {
          setState(() => _pressed = false);
          if (_dragging) {
            _persist();
          } else {
            context.push('/student/ai');
          }
        },
        onPanCancel: () => setState(() => _pressed = false),
        child: AnimatedScale(
          scale: _pressed ? 0.95 : 1,
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          child: SizedBox(
            width: _size,
            height: _size,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedBuilder(
                  animation: _spin,
                  builder: (_, __) => Transform.rotate(
                    angle: _spin.value * 2 * math.pi,
                    child: Container(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: SweepGradient(
                          colors: [
                            AppColors.brandGlow,
                            AppColors.brandDeep,
                            AppColors.brandLight,
                            AppColors.brandGlow,
                          ],
                        ),
                      ),
                      padding: const EdgeInsets.all(1.5),
                      child: const DecoratedBox(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0x33000000),
                        ),
                        child: SizedBox.expand(),
                      ),
                    ),
                  ),
                ),
                AnimatedBuilder(
                  animation: _breathe,
                  builder: (_, child) {
                    final t = 0.96 + (_breathe.value * 0.08);
                    return Transform.scale(scale: t, child: child);
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.fabCore,
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.35),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.brandDeep.withValues(alpha: 0.55),
                          blurRadius: 18,
                          offset: const Offset(0, 8),
                          spreadRadius: -8,
                        ),
                      ],
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Positioned(
                          top: 2,
                          left: 6,
                          right: 6,
                          height: 10,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(999),
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.white.withValues(alpha: 0.5),
                                  Colors.white.withValues(alpha: 0),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const Icon(Icons.auto_awesome,
                            color: Colors.white, size: 18),
                        Positioned(
                          top: 0,
                          right: 0,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.brandGlow,
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.7),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.brandGlow
                                      .withValues(alpha: 0.9),
                                  blurRadius: 8,
                                ),
                              ],
                            ),
                          ),
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
    );
  }
}
