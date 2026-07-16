import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/application/session.dart';
import '../../features/auth/presentation/coach_register_screen.dart';
import '../../features/auth/presentation/forgot_screen.dart';
import '../../features/auth/presentation/unified_auth_screen.dart';
import '../../features/ai/presentation/ai_chat_screen.dart';
import '../../features/contact/presentation/contact_screen.dart';
import '../../features/content/presentation/academy_screen.dart';
import '../../features/content/presentation/faq_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/programs/presentation/program_detail_screen.dart';
import '../../features/subscription/data/subscription_models.dart';
import '../../features/subscription/presentation/payment_result_screen.dart';
import '../../features/subscription/presentation/public_coach_screens.dart';
import '../../features/subscription/presentation/subscribe_screen.dart';
import '../../features/coach_catalog/presentation/catalog_browse_screens.dart';
import '../../features/coach_notifications/presentation/coach_notifications_screen.dart';
import '../../features/coach_plans/presentation/coach_plan_form_screen.dart';
import '../../features/coach_plans/presentation/coach_plans_screen.dart';
import '../../features/coach_profile/data/coach_profile_repository.dart';
import '../../features/coach_profile/presentation/coach_profile_screen.dart';
import '../../features/coach_students/presentation/coach_nutrition_editor_screen.dart';
import '../../features/coach_students/presentation/coach_student_detail_screen.dart';
import '../../features/coach_students/presentation/coach_workout_editor_screen.dart';
import '../../features/coach_tickets/presentation/coach_tickets_screen.dart';
import '../../features/coach_tools/presentation/coach_tools_screens.dart';
import '../../features/coach_tracking/presentation/coach_tracking_screen.dart';
import '../../features/shell/coach_shell.dart';
import '../../features/shell/student_shell.dart';

part 'app_router.g.dart';

@Riverpod(keepAlive: true)
GoRouter router(Ref ref) {
  final refresh = ValueNotifier(0);
  ref.listen(authControllerProvider, (_, _) => refresh.value++);
  ref.listen(coachProfileProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      if (auth.isLoading) return null;

      final Session? session = auth.value;
      final loggedIn = session != null;
      final loc = state.matchedLocation;
      final isAuthRoute = loc.startsWith('/auth');

      if (!loggedIn) {
        return isAuthRoute ? null : '/auth/login';
      }

      if (session.isStudent && !session.isProfileComplete) {
        return loc == '/onboarding' ? null : '/onboarding';
      }

      final home = session.isCoach ? '/coach' : '/student';
      if (loc == '/' || isAuthRoute || loc == '/onboarding') {
        return home;
      }

      // Unapproved coaches may only use /coach/profile (mirror web CoachApprovalGate).
      if (session.isCoach && loc.startsWith('/coach')) {
        final profileAsync = ref.read(coachProfileProvider);
        if (profileAsync.isLoading) return null;
        final status = profileAsync.asData?.value.status ?? 'pending';
        final restricted = status == 'pending' || status == 'reviewing';
        final onProfile = loc == '/coach/profile' || loc.startsWith('/coach/profile/');
        if (restricted && !onProfile) {
          return '/coach/profile';
        }
      }

      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, _) => const _Splash()),
      GoRoute(path: '/auth/login', builder: (_, _) => const UnifiedAuthScreen()),
      GoRoute(path: '/auth', builder: (_, _) => const UnifiedAuthScreen()),
      GoRoute(
        path: '/auth/register',
        builder: (_, _) => const UnifiedAuthScreen(),
      ),
      GoRoute(
        path: '/auth/register/coach',
        builder: (_, _) => const CoachRegisterScreen(),
      ),
      GoRoute(path: '/auth/forgot', builder: (_, _) => const ForgotScreen()),
      GoRoute(path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
      GoRoute(path: '/student', builder: (_, _) => const StudentShell()),
      GoRoute(
        path: '/student/academy',
        builder: (_, _) => const AcademyScreen(),
      ),
      GoRoute(
        path: '/student/faq',
        builder: (_, _) => const FaqScreen(),
      ),
      GoRoute(
        path: '/student/ai',
        builder: (_, _) => const AiChatScreen(),
      ),
      GoRoute(
        path: '/student/orders/:id',
        builder: (_, state) => OrderDetailScreen(
          id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/student/tickets/:id',
        builder: (_, state) => TicketDetailScreen(
          id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/student/programs/:id',
        builder: (_, state) => ProgramDetailScreen(
          id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
          path: '/student/subscribe',
          builder: (_, _) => const SubscribeScreen()),
      GoRoute(
        path: '/student/coaches',
        builder: (_, _) => const CoachesDirectoryScreen(),
      ),
      GoRoute(
        path: '/student/coaches/:slug',
        builder: (_, state) => PublicCoachLandingScreen(
          slug: state.pathParameters['slug'] ?? '',
        ),
      ),
      GoRoute(
        path: '/student/payment-result',
        builder: (_, state) {
          final success = state.uri.queryParameters['status'] == 'success';
          final txId =
              int.tryParse(state.uri.queryParameters['tx_id'] ?? '') ?? 0;
          final refId = state.uri.queryParameters['ref_id'];
          return PaymentResultScreen(
            result: PaymentResult(success: success, txId: txId, refId: refId),
          );
        },
      ),
      GoRoute(path: '/coach', builder: (_, _) => const CoachShell()),
      GoRoute(
        path: '/coach/tickets/:id',
        builder: (_, state) => CoachTicketDetailScreen(
          id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/coach/students/:id',
        builder: (_, state) => CoachStudentDetailScreen(
          id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/coach/students/:id/workout',
        builder: (_, state) => CoachWorkoutEditorScreen(
          studentId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/coach/students/:id/nutrition',
        builder: (_, state) => CoachNutritionEditorScreen(
          studentId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
          initialCalories:
              int.tryParse(state.uri.queryParameters['calories'] ?? ''),
        ),
      ),
      GoRoute(
        path: '/coach/plans',
        builder: (_, _) => const CoachPlansScreen(),
      ),
      GoRoute(
        path: '/coach/plans/new',
        builder: (_, _) => const CoachPlanFormScreen(),
      ),
      GoRoute(
        path: '/coach/plans/:id',
        builder: (_, state) {
          final id = state.pathParameters['id'] ?? '';
          if (id == 'new') return const CoachPlanFormScreen();
          return CoachPlanDetailScreen(id: int.tryParse(id) ?? 0);
        },
      ),
      GoRoute(
        path: '/coach/plans/:id/edit',
        builder: (_, state) => CoachPlanFormScreen(
          planId: int.tryParse(state.pathParameters['id'] ?? ''),
        ),
      ),
      GoRoute(
        path: '/coach/profile',
        builder: (_, _) => const CoachProfileScreen(),
      ),
      GoRoute(
        path: '/coach/tracking',
        builder: (_, _) => const CoachTrackingScreen(),
      ),
      GoRoute(
        path: '/coach/tracking/:id',
        builder: (_, state) => CoachTrackingDetailScreen(
          studentId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/coach/tools/bmi',
        builder: (_, _) => const BmiCalculatorScreen(),
      ),
      GoRoute(
        path: '/coach/tools/calorie',
        builder: (_, _) => const CalorieCalculatorScreen(),
      ),
      GoRoute(
        path: '/coach/notifications',
        builder: (_, _) => const CoachNotificationsScreen(),
      ),
      GoRoute(
        path: '/coach/catalog/exercises',
        builder: (_, _) => const CoachExercisesCatalogScreen(),
      ),
      GoRoute(
        path: '/coach/catalog/foods',
        builder: (_, _) => const CoachFoodsCatalogScreen(),
      ),
    ],
  );
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}
