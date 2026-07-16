import 'package:flutter/material.dart';
import '../../../core/widgets/fitino_ui.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../coach_students/data/coach_students_repository.dart';
import '../tools_math.dart';

class BmiCalculatorScreen extends StatefulWidget {
  const BmiCalculatorScreen({super.key});

  @override
  State<BmiCalculatorScreen> createState() => _BmiCalculatorScreenState();
}

class _BmiCalculatorScreenState extends State<BmiCalculatorScreen> {
  final _weight = TextEditingController();
  final _height = TextEditingController();

  @override
  void dispose() {
    _weight.dispose();
    _height.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = double.tryParse(_weight.text.trim()) ?? 0;
    final h = double.tryParse(_height.text.trim()) ?? 0;
    final result = calculateBmiResult(w, h);

    return FitinoPushScaffold(
      title: 'محاسبه‌گر BMI',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _weight,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'وزن (کیلوگرم)'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _height,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'قد (سانتی‌متر)'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 24),
          if (result == null)
            const Text('وزن و قد را وارد کنید.',
                style: TextStyle(color: AppColors.muted))
          else ...[
            Text('${result.bmi}',
                style: const TextStyle(
                    fontSize: 40, fontWeight: FontWeight.bold)),
            Text(result.category?.label ?? '',
                style: const TextStyle(
                    fontSize: 18, color: AppColors.primary)),
            const SizedBox(height: 8),
            Text(result.category?.hint ?? '',
                style: const TextStyle(color: AppColors.muted, height: 1.5)),
          ],
        ],
      ),
    );
  }
}

class CalorieCalculatorScreen extends ConsumerStatefulWidget {
  const CalorieCalculatorScreen({super.key});

  @override
  ConsumerState<CalorieCalculatorScreen> createState() =>
      _CalorieCalculatorScreenState();
}

class _CalorieCalculatorScreenState
    extends ConsumerState<CalorieCalculatorScreen> {
  final _age = TextEditingController();
  final _height = TextEditingController();
  final _weight = TextEditingController();
  String _gender = 'male';
  String _activity = 'moderate';
  String _goal = 'maintain';
  List<CoachStudentItem> _students = const [];
  int? _selectedStudentId;

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  @override
  void dispose() {
    _age.dispose();
    _height.dispose();
    _weight.dispose();
    super.dispose();
  }

  Future<void> _loadStudents() async {
    try {
      final page = await ref.read(coachStudentsRepositoryProvider).list(
            status: 'active',
            pageSize: 100,
          );
      if (mounted) setState(() => _students = page.items);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final plan = calculateCaloriePlan(
      age: int.tryParse(_age.text.trim()) ?? 0,
      gender: _gender,
      heightCm: double.tryParse(_height.text.trim()) ?? 0,
      weightKg: double.tryParse(_weight.text.trim()) ?? 0,
      activityLevel: _activity,
      goal: _goal,
    );

    return FitinoPushScaffold(
      title: 'محاسبه‌گر کالری',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _age,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'سن'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          const Text('جنسیت'),
          Row(
            children: [
              ChoiceChip(
                label: const Text('مرد'),
                selected: _gender == 'male',
                onSelected: (_) => setState(() => _gender = 'male'),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('زن'),
                selected: _gender == 'female',
                onSelected: (_) => setState(() => _gender = 'female'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _height,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'قد (سانتی‌متر)'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _weight,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'وزن (کیلوگرم)'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _activity,
            decoration: const InputDecoration(labelText: 'سطح فعالیت'),
            items: activityLevels
                .map((l) =>
                    DropdownMenuItem(value: l.id, child: Text(l.label)))
                .toList(),
            onChanged: (v) => setState(() => _activity = v ?? _activity),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _goal,
            decoration: const InputDecoration(labelText: 'هدف'),
            items: calorieGoals
                .map((g) =>
                    DropdownMenuItem(value: g.id, child: Text(g.label)))
                .toList(),
            onChanged: (v) => setState(() => _goal = v ?? _goal),
          ),
          const SizedBox(height: 24),
          if (plan.recommended == null)
            const Text('ورودی‌ها را کامل کنید.',
                style: TextStyle(color: AppColors.muted))
          else ...[
            _stat('BMR', '${plan.bmr} kcal'),
            _stat('TDEE', '${plan.tdee} kcal'),
            _stat('پیشنهادی', '${plan.recommended} kcal'),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {
                final text =
                    'BMR: ${plan.bmr} | TDEE: ${plan.tdee} | کالری پیشنهادی: ${plan.recommended} kcal';
                Clipboard.setData(ClipboardData(text: text));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('کپی شد')),
                );
              },
              icon: const Icon(Icons.copy),
              label: const Text('کپی خلاصه'),
            ),
            const SizedBox(height: 20),
            const Text('اعمال روی برنامه غذایی شاگرد',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            DropdownButtonFormField<int>(
              value: _selectedStudentId,
              decoration: const InputDecoration(labelText: 'انتخاب شاگرد'),
              items: _students
                  .map((s) => DropdownMenuItem(
                        value: s.id,
                        child: Text(s.fullName.isEmpty ? s.phone : s.fullName),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _selectedStudentId = v),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _selectedStudentId == null
                  ? null
                  : () {
                      context.push(
                        '/coach/students/$_selectedStudentId/nutrition?calories=${plan.recommended}',
                      );
                    },
              icon: const Icon(Icons.send),
              label: const Text('رفتن به ادیتور تغذیه'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _stat(String label, String value) {
    return FitinoPanelCard(padding: EdgeInsets.zero, child: ListTile(
        title: Text(label),
        trailing: Text(value,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ));
  }
}
