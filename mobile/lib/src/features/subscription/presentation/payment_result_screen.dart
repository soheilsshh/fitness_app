import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../data/subscription_models.dart';

class PaymentResultScreen extends StatelessWidget {
  const PaymentResultScreen({
    super.key,
    required this.result,
  });

  final PaymentResult result;

  @override
  Widget build(BuildContext context) {
    return FitinoPushScaffold(
      title: 'نتیجه پرداخت',
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FitinoPanelCard(
              child: Column(
                children: [
                  Icon(
                    result.success ? Icons.check_circle : Icons.cancel,
                    size: 72,
                    color: result.success
                        ? AppColors.brandMid
                        : AppColors.destructive,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    result.success ? 'پرداخت موفق' : 'پرداخت ناموفق',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  if (result.txId > 0)
                    Text('شماره سفارش: ${result.txId}',
                        textAlign: TextAlign.center),
                  if (result.refId != null && result.refId!.isNotEmpty)
                    Text('کد پیگیری: ${result.refId}',
                        textAlign: TextAlign.center),
                ],
              ),
            ),
            const Spacer(),
            FilledButton(
              onPressed: () => context.go('/student'),
              child: const Text('بازگشت به داشبورد'),
            ),
          ],
        ),
      ),
    );
  }
}
