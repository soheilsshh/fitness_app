import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'fitino_ui.dart';

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});

  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: AppColors.brandMid));
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: FitinoEmptyState(
          icon: Icons.error_outline,
          title: 'خطا',
          message: message,
          action: onRetry == null
              ? null
              : OutlinedButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('تلاش مجدد'),
                ),
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, required this.message, this.icon});

  final String message;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return FitinoEmptyState(message: message, icon: icon);
  }
}

/// Simple placeholder for not-yet-implemented (stubbed) screens.
class ComingSoonView extends StatelessWidget {
  const ComingSoonView({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.construction, color: AppColors.muted, size: 44),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 6),
          const Text('به‌زودی', style: TextStyle(color: AppColors.muted)),
        ],
      ),
    );
  }
}
