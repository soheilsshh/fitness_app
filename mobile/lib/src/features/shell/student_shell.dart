import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../contact/presentation/contact_screen.dart';
import '../dashboard/presentation/dashboard_screen.dart';
import '../food_diary/presentation/food_diary_screen.dart';
import '../orders/presentation/orders_screen.dart';
import '../profile/presentation/profile_screen.dart';
import '../programs/presentation/programs_screen.dart';
import '../tracking/presentation/tracking_screen.dart';
import '../workout_history/presentation/workout_history_screen.dart';

/// Bottom-nav shell matching web IA:
/// خانه · تمرین · تغذیه · پایش · حساب من
class StudentShell extends ConsumerStatefulWidget {
  const StudentShell({super.key});

  @override
  ConsumerState<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends ConsumerState<StudentShell> {
  int _index = 0;
  int _trainingSub = 0; // 0 programs, 1 history
  int _accountSub = 0; // 0 profile, 1 orders, 2 contact

  @override
  Widget build(BuildContext context) {
    final tabs = <Widget>[
      const DashboardScreen(),
      _TrainingHub(
        subIndex: _trainingSub,
        onSubChanged: (i) => setState(() => _trainingSub = i),
      ),
      const FoodDiaryScreen(),
      const TrackingScreen(),
      _AccountHub(
        subIndex: _accountSub,
        onSubChanged: (i) => setState(() => _accountSub = i),
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: tabs),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fitino_ai_fab',
        tooltip: 'دستیار فیتینو',
        onPressed: () => context.push('/student/ai'),
        child: const Icon(Icons.auto_awesome),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'خانه',
          ),
          NavigationDestination(
            icon: Icon(Icons.fitness_center_outlined),
            selectedIcon: Icon(Icons.fitness_center),
            label: 'تمرین',
          ),
          NavigationDestination(
            icon: Icon(Icons.restaurant_outlined),
            selectedIcon: Icon(Icons.restaurant),
            label: 'تغذیه',
          ),
          NavigationDestination(
            icon: Icon(Icons.show_chart_outlined),
            selectedIcon: Icon(Icons.show_chart),
            label: 'پایش',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'حساب من',
          ),
        ],
      ),
    );
  }
}

class _TrainingHub extends StatelessWidget {
  const _TrainingHub({
    required this.subIndex,
    required this.onSubChanged,
  });

  final int subIndex;
  final ValueChanged<int> onSubChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, label: Text('برنامه‌ها')),
                ButtonSegment(value: 1, label: Text('تاریخچه')),
              ],
              selected: {subIndex},
              onSelectionChanged: (s) => onSubChanged(s.first),
            ),
          ),
        ),
        Expanded(
          child: IndexedStack(
            index: subIndex,
            children: const [
              ProgramsScreen(),
              WorkoutHistoryScreen(),
            ],
          ),
        ),
      ],
    );
  }
}

class _AccountHub extends StatelessWidget {
  const _AccountHub({
    required this.subIndex,
    required this.onSubChanged,
  });

  final int subIndex;
  final ValueChanged<int> onSubChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SafeArea(
          bottom: false,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                child: SegmentedButton<int>(
                  segments: const [
                    ButtonSegment(value: 0, label: Text('پروفایل')),
                    ButtonSegment(value: 1, label: Text('سفارش‌ها')),
                    ButtonSegment(value: 2, label: Text('مربی')),
                  ],
                  selected: {subIndex},
                  onSelectionChanged: (s) => onSubChanged(s.first),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/student/academy'),
                        icon: const Icon(Icons.school_outlined, size: 18),
                        label: const Text('آموزش'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/student/faq'),
                        icon: const Icon(Icons.help_outline, size: 18),
                        label: const Text('سوالات'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: IndexedStack(
            index: subIndex,
            children: const [
              ProfileScreen(),
              OrdersScreen(),
              ContactScreen(),
            ],
          ),
        ),
      ],
    );
  }
}
