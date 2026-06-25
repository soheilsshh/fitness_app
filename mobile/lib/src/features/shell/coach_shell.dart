import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/state_views.dart';
import '../auth/application/auth_controller.dart';
import '../coach_dashboard/presentation/coach_dashboard_screen.dart';

/// Bottom-nav shell for the coach role. Dashboard is live; the other tabs are
/// stubbed for this build.
class CoachShell extends ConsumerStatefulWidget {
  const CoachShell({super.key});

  @override
  ConsumerState<CoachShell> createState() => _CoachShellState();
}

class _CoachShellState extends ConsumerState<CoachShell> {
  int _index = 0;

  late final List<Widget> _tabs = const [
    CoachDashboardScreen(),
    _CoachStub(title: 'شاگردان'),
    _CoachStub(title: 'تیکت‌ها'),
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

class _CoachStub extends StatelessWidget {
  const _CoachStub({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ComingSoonView(title: title),
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
            leading: const Icon(Icons.logout),
            title: const Text('خروج از حساب'),
            onTap: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }
}
