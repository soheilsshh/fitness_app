import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/application/session.dart';
import '../../features/auth/presentation/forgot_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/programs/presentation/program_detail_screen.dart';
import '../../features/subscription/data/subscription_models.dart';
import '../../features/subscription/presentation/payment_result_screen.dart';
import '../../features/subscription/presentation/subscribe_screen.dart';
import '../../features/shell/coach_shell.dart';
import '../../features/shell/student_shell.dart';

part 'app_router.g.dart';

@Riverpod(keepAlive: true)
GoRouter router(Ref ref) {
  // Bump a ValueNotifier whenever auth state changes so GoRouter re-evaluates
  // its redirect.
  final refresh = ValueNotifier(0);
  ref.listen(authControllerProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      // Still hydrating from secure storage — keep showing the splash.
      if (auth.isLoading) return null;

      final Session? session = auth.value;
      final loggedIn = session != null;
      final loc = state.matchedLocation;
      final isAuthRoute = loc.startsWith('/auth');

      if (!loggedIn) {
        return isAuthRoute ? null : '/auth/login';
      }

      // Logged in: students with an incomplete profile go to onboarding.
      if (session.isStudent && !session.isProfileComplete) {
        return loc == '/onboarding' ? null : '/onboarding';
      }

      final home = session.isCoach ? '/coach' : '/student';
      if (loc == '/' || isAuthRoute || loc == '/onboarding') {
        return home;
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, _) => const _Splash()),
      GoRoute(path: '/auth/login', builder: (_, _) => const LoginScreen()),
      GoRoute(
          path: '/auth/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/auth/forgot', builder: (_, _) => const ForgotScreen()),
      GoRoute(path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
      GoRoute(path: '/student', builder: (_, _) => const StudentShell()),
      GoRoute(
        path: '/student/programs/:id',
        builder: (_, state) => ProgramDetailScreen(
          id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(path: '/student/subscribe', builder: (_, _) => const SubscribeScreen()),
      GoRoute(
        path: '/student/payment-result',
        builder: (_, state) {
          final success = state.uri.queryParameters['status'] == 'success';
          final txId = int.tryParse(state.uri.queryParameters['tx_id'] ?? '') ?? 0;
          final refId = state.uri.queryParameters['ref_id'];
          return PaymentResultScreen(
            result: PaymentResult(success: success, txId: txId, refId: refId),
          );
        },
      ),
      GoRoute(path: '/coach', builder: (_, _) => const CoachShell()),
    ],
  );
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}
