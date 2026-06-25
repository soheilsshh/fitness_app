import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/src/app/app.dart';

void main() {
  testWidgets('App boots to the splash/login flow', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: FitnessApp()));
    // First frame shows the splash spinner while auth hydrates.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
