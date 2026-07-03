import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/subscription/data/subscription_models.dart';

class PaymentDeepLinkHandler {
  PaymentDeepLinkHandler._();

  static final AppLinks _appLinks = AppLinks();

  static PaymentResult? parse(Uri? uri) {
    if (uri == null) return null;
    if (uri.scheme != 'fitinoo' || uri.host != 'payment') return null;
    final status = uri.queryParameters['status'];
    final txId = int.tryParse(uri.queryParameters['tx_id'] ?? '') ?? 0;
    final refId = uri.queryParameters['ref_id'];
    return PaymentResult(
      success: status == 'success',
      txId: txId,
      refId: refId,
    );
  }

  static Future<Uri?> getInitialUri() => _appLinks.getInitialLink();

  static Stream<Uri> get uriStream => _appLinks.uriLinkStream;

  static void navigate(BuildContext context, PaymentResult result) {
    context.go(
      '/student/payment-result?status=${result.success ? 'success' : 'failed'}&tx_id=${result.txId}${result.refId != null ? '&ref_id=${Uri.encodeComponent(result.refId!)}' : ''}',
    );
  }
}
