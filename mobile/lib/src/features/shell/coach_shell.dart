import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/application/auth_controller.dart';
import '../coach_dashboard/presentation/coach_dashboard_screen.dart';
import '../coach_students/presentation/coach_students_screen.dart';
import '../coach_tickets/presentation/coach_tickets_screen.dart';

/// Bottom-nav shell for the coach role.
class CoachShell extends ConsumerStatefulWidget {
  const CoachShell({super.key});

  @override
  ConsumerState<CoachShell> createState() => _CoachShellState();
}

class _CoachShellState extends ConsumerState<CoachShell> {
  int _index = 0;

  late final List<Widget> _tabs = const [
    CoachDashboardScreen(),
    CoachStudentsScreen(),
    CoachTicketsScreen(),
    _CoachMore(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard),
              label: 'داشبورد'),
          NavigationDestination(
              icon: Icon(Icons.group_outlined),
              selectedIcon: Icon(Icons.group),
              label: 'شاگردان'),
          NavigationDestination(
              icon: Icon(Icons.confirmation_number_outlined),
              selectedIcon: Icon(Icons.confirmation_number),
              label: 'تیکت‌ها'),
          NavigationDestination(
              icon: Icon(Icons.menu),
              label: 'بیشتر'),
        ],
      ),
    );
  }
}

class _CoachMore extends ConsumerWidget {
  const _CoachMore();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('بیشتر')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.card_membership_outlined),
            title: const Text('پلن‌ها'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push('/coach/plans'),
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('پروفایل مربی'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push('/coach/profile'),
          ),
          ListTile(
            leading: const Icon(Icons.monitor_heart_outlined),
            title: const Text('پایش شاگردان'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push('/coach/tracking'),
          ),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('اعلان‌ها'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push('/coach/notifications'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.fitness_center_outlined),
            title: const Text('کاتالوگ حرکات'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push('/coach/catalog/exercises'),
          ),
          ListTile(
            leading: const Icon(Icons.restaurant_outlined),
            title: const Text('کاتالوگ غذاها'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push('/coach/catalog/foods'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.monitor_weight_outlined),
            title: const Text('محاسبه‌گر BMI'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push('/coach/tools/bmi'),
          ),
          ListTile(
            leading: const Icon(Icons.local_fire_department_outlined),
            title: const Text('محاسبه‌گر کالری'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push('/coach/tools/calorie'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('خروج از حساب'),
            onTap: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }
}
