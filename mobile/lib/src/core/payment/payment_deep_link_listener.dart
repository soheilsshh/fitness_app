import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../payment/payment_deep_link_handler.dart';
import '../router/app_router.dart';

class PaymentDeepLinkListener extends ConsumerStatefulWidget {
  const PaymentDeepLinkListener({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<PaymentDeepLinkListener> createState() =>
      _PaymentDeepLinkListenerState();
}

class _PaymentDeepLinkListenerState extends ConsumerState<PaymentDeepLinkListener> {
  StreamSubscription<Uri>? _sub;

  @override
  void initState() {
    super.initState();
    _handleInitialLink();
    _sub = PaymentDeepLinkHandler.uriStream.listen(_handleUri);
  }

  Future<void> _handleInitialLink() async {
    final uri = await PaymentDeepLinkHandler.getInitialUri();
    _handleUri(uri);
  }

  void _handleUri(Uri? uri) {
    final result = PaymentDeepLinkHandler.parse(uri);
    if (result == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final router = ref.read(routerProvider);
      router.go(
        '/student/payment-result?status=${result.success ? 'success' : 'failed'}&tx_id=${result.txId}${result.refId != null ? '&ref_id=${Uri.encodeComponent(result.refId!)}' : ''}',
      );
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
