import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/fitino_ai_fab.dart';
import '../../core/widgets/fitino_bottom_dock.dart';
import '../../core/widgets/fitino_student_header.dart';
import '../contact/presentation/contact_screen.dart';
import '../dashboard/presentation/dashboard_screen.dart';
import '../food_diary/presentation/food_diary_screen.dart';
import '../orders/presentation/orders_screen.dart';
import '../profile/presentation/profile_screen.dart';
import '../programs/presentation/programs_screen.dart';
import '../tracking/presentation/tracking_screen.dart';
import '../workout_history/presentation/workout_history_screen.dart';

/// Student panel chrome — pixel-faithful Fitino dock + header + AI FAB.
class StudentShell extends ConsumerStatefulWidget {
  const StudentShell({super.key});

  @override
  ConsumerState<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends ConsumerState<StudentShell> {
  int _index = 0;
  int _trainingSub = 0;
  int _accountSub = 0;

  static const _nav = [
    FitinoNavItem(id: 'home', label: 'خانه', icon: Icons.home_rounded),
    FitinoNavItem(
        id: 'training', label: 'تمرین', icon: Icons.fitness_center_rounded),
    FitinoNavItem(
        id: 'nutrition', label: 'تغذیه', icon: Icons.restaurant_rounded),
    FitinoNavItem(
        id: 'tracking', label: 'پایش', icon: Icons.show_chart_rounded),
    FitinoNavItem(
        id: 'account', label: 'حساب من', icon: Icons.person_rounded),
  ];

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
      extendBody: true,
      body: Stack(
        children: [
          Column(
            children: [
              SafeArea(
                bottom: false,
                child: const FitinoStudentHeader(),
              ),
              Expanded(
                child: IndexedStack(index: _index, children: tabs),
              ),
            ],
          ),
          const FitinoAiFab(),
          Align(
            alignment: Alignment.bottomCenter,
            child: FitinoBottomDock(
              items: _nav,
              selectedIndex: _index,
              onSelect: (i) => setState(() => _index = i),
            ),
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
        FitinoSubNavChips(
          selectedIndex: subIndex,
          onSelect: onSubChanged,
          items: const [
            (label: 'برنامه‌های من', icon: Icons.assignment_outlined),
            (label: 'تاریخچه تمرینات', icon: Icons.history_rounded),
          ],
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
        FitinoSubNavChips(
          selectedIndex: subIndex,
          onSelect: onSubChanged,
          items: const [
            (label: 'پروفایل', icon: Icons.person_outline),
            (label: 'سفارش‌ها', icon: Icons.shopping_bag_outlined),
            (label: 'ارتباط با مربی', icon: Icons.contact_mail_outlined),
          ],
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
