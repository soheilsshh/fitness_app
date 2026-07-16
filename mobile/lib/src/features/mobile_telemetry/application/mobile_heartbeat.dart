import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/flavor/flavor_config.dart';
import '../../../core/network/dio_provider.dart';
import '../../auth/application/auth_controller.dart';

/// Sends a lightweight heartbeat so admin mobile reports stay complete.
class MobileHeartbeatHost extends ConsumerStatefulWidget {
  const MobileHeartbeatHost({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<MobileHeartbeatHost> createState() =>
      _MobileHeartbeatHostState();
}

class _MobileHeartbeatHostState extends ConsumerState<MobileHeartbeatHost> {
  static const _deviceKey = 'fitino_device_id';
  bool _sent = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeSend());
  }

  Future<String> _deviceId() async {
    const storage = FlutterSecureStorage();
    var id = await storage.read(key: _deviceKey);
    if (id == null || id.isEmpty) {
      id = 'dev-${DateTime.now().microsecondsSinceEpoch}';
      await storage.write(key: _deviceKey, value: id);
    }
    return id;
  }

  Future<void> _maybeSend() async {
    if (_sent) return;
    _sent = true;
    try {
      final deviceId = await _deviceId();
      final auth = ref.read(authControllerProvider).value;
      final dio = ref.read(dioProvider);
      final body = {
        'deviceId': deviceId,
        'store': FlavorConfig.instance.storeId,
        'platform': Platform.isIOS ? 'ios' : 'android',
        'appVersion': const String.fromEnvironment('APP_VERSION',
            defaultValue: '1.0.0'),
        'buildNumber': const String.fromEnvironment('APP_BUILD',
            defaultValue: '1'),
        'osVersion': Platform.operatingSystemVersion,
      };
      if (auth != null) {
        await dio.post(ApiPaths.meMobileHeartbeat, data: body);
      } else {
        await dio.post(ApiPaths.mobileHeartbeatPublic, data: body);
      }
    } catch (_) {
      // Telemetry must never block app startup.
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authControllerProvider, (prev, next) {
      final wasIn = prev?.value != null;
      final nowIn = next.value != null;
      if (!wasIn && nowIn) {
        _sent = false;
        _maybeSend();
      }
    });
    return widget.child;
  }
}
