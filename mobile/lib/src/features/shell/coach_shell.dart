import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/fitino_bottom_dock.dart';
import '../../core/widgets/fitino_coach_header.dart';
import '../../core/widgets/fitino_ui.dart';
import '../auth/application/auth_controller.dart';
import '../coach_dashboard/presentation/coach_dashboard_screen.dart';
import '../coach_students/presentation/coach_students_screen.dart';
import '../coach_tickets/presentation/coach_tickets_screen.dart';
import '../coach_tracking/presentation/coach_tracking_screen.dart';

/// Coach panel chrome — Fitino dock + header matching web panel brand.
class CoachShell extends ConsumerStatefulWidget {
  const CoachShell({super.key});

  @override
  ConsumerState<CoachShell> createState() => _CoachShellState();
}

class _CoachShellState extends ConsumerState<CoachShell> {
  int _index = 0;

  static const _nav = [
    FitinoNavItem(
        id: 'dashboard', label: 'داشبورد', icon: Icons.dashboard_rounded),
    FitinoNavItem(
        id: 'students', label: 'شاگردان', icon: Icons.group_rounded),
    FitinoNavItem(
        id: 'tracking', label: 'پایش', icon: Icons.show_chart_rounded),
    FitinoNavItem(
        id: 'tickets', label: 'تیکت‌ها', icon: Icons.forum_rounded),
    FitinoNavItem(id: 'more', label: 'بیشتر', icon: Icons.menu_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final tabs = <Widget>[
      const CoachDashboardScreen(),
      const CoachStudentsScreen(),
      const CoachTrackingScreen(),
      const CoachTicketsScreen(),
      const _CoachMore(),
    ];

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          Column(
            children: [
              const SafeArea(
                bottom: false,
                child: FitinoCoachHeader(),
              ),
              Expanded(
                child: IndexedStack(index: _index, children: tabs),
              ),
            ],
          ),
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

class _CoachMore extends ConsumerWidget {
  const _CoachMore();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
      children: [
        const FitinoPageHeader(
          title: 'بیشتر',
          description: 'پلن‌ها، پروفایل، ابزارها و کاتالوگ',
        ),
        const SizedBox(height: 12),
        _MoreGroup(
          title: 'مدیریت',
          items: [
            _MoreItem(
              icon: Icons.card_membership_outlined,
              label: 'پلن‌ها',
              onTap: () => context.push('/coach/plans'),
            ),
            _MoreItem(
              icon: Icons.person_outline,
              label: 'پروفایل مربی',
              onTap: () => context.push('/coach/profile'),
            ),
            _MoreItem(
              icon: Icons.notifications_outlined,
              label: 'اعلان‌ها',
              onTap: () => context.push('/coach/notifications'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _MoreGroup(
          title: 'کاتالوگ',
          items: [
            _MoreItem(
              icon: Icons.fitness_center_outlined,
              label: 'کاتالوگ حرکات',
              onTap: () => context.push('/coach/catalog/exercises'),
            ),
            _MoreItem(
              icon: Icons.restaurant_outlined,
              label: 'کاتالوگ غذاها',
              onTap: () => context.push('/coach/catalog/foods'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _MoreGroup(
          title: 'ابزارها',
          items: [
            _MoreItem(
              icon: Icons.monitor_weight_outlined,
              label: 'محاسبه‌گر BMI',
              onTap: () => context.push('/coach/tools/bmi'),
            ),
            _MoreItem(
              icon: Icons.local_fire_department_outlined,
              label: 'محاسبه‌گر کالری',
              onTap: () => context.push('/coach/tools/calorie'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        FitinoPanelCard(
          padding: EdgeInsets.zero,
          child: ListTile(
            leading: const Icon(Icons.logout, color: AppColors.destructive),
            title: const Text('خروج از حساب',
                style: TextStyle(color: AppColors.destructive)),
            onTap: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ),
      ],
    );
  }
}

class _MoreGroup extends StatelessWidget {
  const _MoreGroup({required this.title, required this.items});
  final String title;
  final List<_MoreItem> items;

  @override
  Widget build(BuildContext context) {
    return FitinoPanelCard(
      title: title,
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const Divider(height: 1),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(items[i].icon, color: AppColors.brandDeep),
              title: Text(items[i].label),
              trailing: const Icon(Icons.chevron_left, color: AppColors.muted),
              onTap: items[i].onTap,
            ),
          ],
        ],
      ),
    );
  }
}

class _MoreItem {
  const _MoreItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;
}
