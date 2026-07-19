import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/theme_mode_provider.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../../../core/widgets/jalali_date_field.dart';
import '../data/profile_models.dart';
import '../data/profile_repository.dart';

const _goalOptions = [
  'کاهش وزن',
  'افزایش وزن',
  'عضله‌سازی',
  'سلامت عمومی',
  'آمادگی جسمانی',
  'سایر',
];

const _bodyConditions = [
  'لاغر',
  'متوسط',
  'عضلانی',
  'چاق',
];

class ProfileEditScreen extends ConsumerStatefulWidget {
  const ProfileEditScreen({super.key, required this.profile});

  final MeProfile profile;

  @override
  ConsumerState<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<ProfileEditScreen> {
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _email;
  late final TextEditingController _height;
  late final TextEditingController _weight;
  late final TextEditingController _targetWeight;
  late final TextEditingController _bodyFat;
  late final TextEditingController _primaryGoal;
  late final TextEditingController _medical;
  late final TextEditingController _injuries;
  late final TextEditingController _limitations;
  late final TextEditingController _nationalId;

  String _gender = '';
  String _bodyCondition = '';
  List<String> _goals = [];
  int? _jYear;
  int? _jMonth;
  int? _jDay;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _firstName = TextEditingController(text: p.firstName);
    _lastName = TextEditingController(text: p.lastName);
    _email = TextEditingController(text: p.email);
    _height = TextEditingController(text: p.heightCm == null ? '' : '${p.heightCm}');
    _weight = TextEditingController(text: p.weightKg == null ? '' : '${p.weightKg}');
    _targetWeight = TextEditingController(
        text: p.targetWeightKg == null ? '' : '${p.targetWeightKg}');
    _bodyFat = TextEditingController(
        text: p.bodyFatPercent == null ? '' : '${p.bodyFatPercent}');
    _primaryGoal = TextEditingController(text: p.primaryGoal);
    _medical = TextEditingController(text: p.medicalHistory);
    _injuries = TextEditingController(text: p.injuries);
    _limitations = TextEditingController(text: p.physicalLimitations);
    _nationalId = TextEditingController(text: p.nationalId);
    _gender = p.gender;
    _bodyCondition = p.bodyCondition;
    _goals = List<String>.from(p.goals);
    final j = JalaliDates.gregorianIsoToJalali(p.birthDate);
    _jYear = j.year;
    _jMonth = j.month;
    _jDay = j.day;
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _height.dispose();
    _weight.dispose();
    _targetWeight.dispose();
    _bodyFat.dispose();
    _primaryGoal.dispose();
    _medical.dispose();
    _injuries.dispose();
    _limitations.dispose();
    _nationalId.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final patch = <String, dynamic>{
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
        'email': _email.text.trim(),
        'primaryGoal': _primaryGoal.text.trim(),
        'medicalHistory': _medical.text.trim(),
        'injuries': _injuries.text.trim(),
        'physicalLimitations': _limitations.text.trim(),
        'nationalId': _nationalId.text.trim(),
        'goals': _goals,
      };
      if (_gender.isNotEmpty) patch['gender'] = _gender;
      if (_bodyCondition.isNotEmpty) patch['bodyCondition'] = _bodyCondition;

      final h = double.tryParse(_height.text.trim());
      final w = double.tryParse(_weight.text.trim());
      final tw = double.tryParse(_targetWeight.text.trim());
      final bf = double.tryParse(_bodyFat.text.trim());
      if (h != null) patch['heightCm'] = h;
      if (w != null) patch['weightKg'] = w;
      if (tw != null) patch['targetWeightKg'] = tw;
      if (bf != null) patch['bodyFatPercent'] = bf;

      final iso = JalaliDates.jalaliToGregorianIso(_jYear, _jMonth, _jDay);
      if (iso != null) patch['birthDate'] = iso;

      await ref.read(profileRepositoryProvider).updateProfile(patch);
      ref.invalidate(myProfileProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('پروفایل ذخیره شد')),
        );
        Navigator.of(context).pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FitinoPushScaffold(
      title: 'ویرایش پروفایل',
      description: 'اطلاعات پایه، بدن و اهداف',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('اطلاعات پایه',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          AppTextField(controller: _firstName, label: 'نام'),
          const SizedBox(height: 12),
          AppTextField(controller: _lastName, label: 'نام خانوادگی'),
          const SizedBox(height: 12),
          AppTextField(
            controller: _email,
            label: 'ایمیل',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: _nationalId,
            label: 'کد ملی',
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _gender.isEmpty ? null : _gender,
            decoration: const InputDecoration(labelText: 'جنسیت'),
            items: const [
              DropdownMenuItem(value: 'male', child: Text('مرد')),
              DropdownMenuItem(value: 'female', child: Text('زن')),
            ],
            onChanged: (v) => setState(() => _gender = v ?? ''),
          ),
          const SizedBox(height: 12),
          JalaliDateField(
            label: 'تاریخ تولد',
            year: _jYear,
            month: _jMonth,
            day: _jDay,
            onChanged: (y, m, d) => setState(() {
              _jYear = y;
              _jMonth = m;
              _jDay = d;
            }),
          ),
          const SizedBox(height: 20),
          const Text('اهداف', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          AppTextField(controller: _primaryGoal, label: 'هدف اصلی'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final g in _goalOptions)
                FilterChip(
                  label: Text(g),
                  selected: _goals.contains(g),
                  onSelected: (sel) {
                    setState(() {
                      if (sel) {
                        _goals = [..._goals, g];
                      } else {
                        _goals = _goals.where((e) => e != g).toList();
                      }
                    });
                  },
                ),
            ],
          ),
          const SizedBox(height: 20),
          const Text('وضعیت بدن',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: AppTextField(
                  controller: _height,
                  label: 'قد (سانتی‌متر)',
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AppTextField(
                  controller: _weight,
                  label: 'وزن (کیلو)',
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppTextField(
                  controller: _targetWeight,
                  label: 'وزن هدف',
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AppTextField(
                  controller: _bodyFat,
                  label: 'چربی بدن ٪',
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _bodyCondition.isEmpty ? null : _bodyCondition,
            decoration: const InputDecoration(labelText: 'وضعیت بدنی'),
            items: [
              for (final c in _bodyConditions)
                DropdownMenuItem(value: c, child: Text(c)),
            ],
            onChanged: (v) => setState(() => _bodyCondition = v ?? ''),
          ),
          const SizedBox(height: 20),
          const Text('سوابق پزشکی',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          AppTextField(controller: _medical, label: 'سوابق پزشکی'),
          const SizedBox(height: 12),
          AppTextField(controller: _injuries, label: 'آسیب‌دیدگی‌ها'),
          const SizedBox(height: 12),
          AppTextField(controller: _limitations, label: 'محدودیت‌های حرکتی'),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

/// Theme toggle tile used from profile.
class ThemeToggleTile extends ConsumerWidget {
  const ThemeToggleTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final isDark = mode == ThemeMode.dark ||
        (mode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);
    return SwitchListTile(
      secondary: Icon(isDark ? Icons.dark_mode : Icons.light_mode,
          color: AppColors.primary),
      title: const Text('حالت تاریک'),
      subtitle: Text(isDark ? 'فعال' : 'خاموش'),
      value: isDark,
      onChanged: (_) =>
          ref.read(themeModeProvider.notifier).toggleLightDark(),
    );
  }
}
