import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app/app.dart';
import 'src/core/flavor/flavor_config.dart';
import 'src/features/mobile_telemetry/application/mobile_heartbeat.dart';

Future<void> bootstrap(AppStoreFlavor flavor) async {
  WidgetsFlutterBinding.ensureInitialized();
  FlavorConfig.init(flavor);
  runApp(ProviderScope(
    child: MobileHeartbeatHost(
      child: const FitnessApp(),
    ),
  ));
}
