import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/jalali.dart';
import '../../core/widgets/fitino_ui.dart';
import '../../core/widgets/jalali_date_field.dart';
import '../auth/application/auth_controller.dart';
import '../profile/data/profile_models.dart';
import '../profile/data/profile_repository.dart';

/// Multi-step student onboarding — the mobile port of the web app's
/// `(panel)/user/onboarding` wizard. Each step PATCHes `/me`; the photos step
/// uploads via `/me/body-photos`. When the profile is complete the auth session
/// is refreshed so the router lands the user on the student shell.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _Step {
  const _Step(this.label, this.icon);
  final String label;
  final IconData icon;
}

const _steps = [
  _Step('اطلاعات شخصی', Icons.person_outline),
  _Step('اهداف و بدن', Icons.flag_outlined),
  _Step('سوابق پزشکی', Icons.medical_services_outlined),
  _Step('عکس‌های بدن', Icons.image_outlined),
];

const _goalOptions = [
  ('weight_loss', 'کاهش وزن'),
  ('muscle_gain', 'افزایش حجم عضلانی'),
  ('fitness', 'آمادگی عمومی'),
  ('endurance', 'استقامت'),
  ('flexibility', 'انعطاف‌پذیری'),
  ('rehabilitation', 'بازگشت به تمرین'),
];

const _bodyConditions = [
  ('slim', 'لاغر'),
  ('average', 'متوسط'),
  ('overweight', 'اضافه وزن'),
  ('athletic', 'ورزشکار'),
  ('muscular', 'عضلانی'),
];

const _photoSlots = [
  ('front', 'جلو'),
  ('right', 'راست'),
  ('back', 'عقب'),
  ('left', 'چپ'),
];

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _step = 0;
  bool _loading = true;
  bool _saving = false;
  String _uploadingType = '';
  String _error = '';

  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _nationalId = TextEditingController();
  final _heightCm = TextEditingController();
  final _weightKg = TextEditingController();
  final _targetWeightKg = TextEditingController();
  final _bodyFatPercent = TextEditingController();
  final _primaryGoal = TextEditingController();
  final _medicalHistory = TextEditingController();
  final _injuries = TextEditingController();
  final _physicalLimitations = TextEditingController();

  int? _birthYear;
  int? _birthMonth;
  int? _birthDay;
  String _gender = '';
  String _bodyCondition = '';
  final Set<String> _goals = {};

  final Map<String, MePhoto> _photos = {};
  final Map<String, String> _localPhotoPaths = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _nationalId.dispose();
    _heightCm.dispose();
    _weightKg.dispose();
    _targetWeightKg.dispose();
    _bodyFatPercent.dispose();
    _primaryGoal.dispose();
    _medicalHistory.dispose();
    _injuries.dispose();
    _physicalLimitations.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final me = await ref.read(profileRepositoryProvider).getProfile();
      if (!mounted) return;
      if (me.isProfileComplete) {
        await ref.read(authControllerProvider.notifier).refreshSession();
        return; // Router redirects to the student shell.
      }
      _firstName.text = me.firstName;
      _lastName.text = me.lastName;
      _nationalId.text = me.nationalId;
      _heightCm.text = _numStr(me.heightCm);
      _weightKg.text = _numStr(me.weightKg);
      _targetWeightKg.text = _numStr(me.targetWeightKg);
      _bodyFatPercent.text = _numStr(me.bodyFatPercent);
      _primaryGoal.text = me.primaryGoal;
      _medicalHistory.text = me.medicalHistory;
      _injuries.text = me.injuries;
      _physicalLimitations.text = me.physicalLimitations;
      _gender = me.gender;
      _bodyCondition = me.bodyCondition;
      _goals
        ..clear()
        ..addAll(me.goals);
      final j = JalaliDates.gregorianIsoToJalali(me.birthDate);
      _birthYear = j.year;
      _birthMonth = j.month;
      _birthDay = j.day;
      for (final p in me.photos) {
        if (p.type.isNotEmpty) _photos[p.type] = p;
      }
    } catch (_) {
      if (mounted) _error = 'بارگذاری اطلاعات ناموفق بود.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  static String _numStr(double? v) {
    if (v == null) return '';
    if (v == v.roundToDouble()) return v.toInt().toString();
    return v.toString();
  }

  String _birthDateIso() =>
      JalaliDates.jalaliToGregorianIso(_birthYear, _birthMonth, _birthDay) ?? '';

  String? _validateStep() {
    if (_step == 0) {
      if (_firstName.text.trim().isEmpty || _lastName.text.trim().isEmpty) {
        return 'نام و نام خانوادگی الزامی است.';
      }
      if (_birthYear == null || _birthMonth == null || _birthDay == null) {
        return 'تاریخ تولد شمسی را کامل انتخاب کنید.';
      }
      if (_birthDateIso().isEmpty) return 'تاریخ تولد وارد شده معتبر نیست.';
      final h = double.tryParse(_heightCm.text.trim());
      if (h == null || h < 80 || h > 250) {
        return 'قد باید بین ۸۰ تا ۲۵۰ سانتی‌متر باشد.';
      }
      final w = double.tryParse(_weightKg.text.trim());
      if (w == null || w < 20 || w > 300) {
        return 'وزن باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.';
      }
      if (!RegExp(r'^\d{10}$').hasMatch(_nationalId.text.trim())) {
        return 'کد ملی باید ۱۰ رقم باشد.';
      }
      if (_gender.isEmpty) return 'جنسیت را انتخاب کنید.';
    }
    if (_step == 1) {
      final tw = double.tryParse(_targetWeightKg.text.trim());
      if (tw == null || tw < 20 || tw > 300) {
        return 'وزن هدف باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.';
      }
      if (_bodyCondition.isEmpty) return 'وضعیت بدنی را انتخاب کنید.';
      if (_goals.isEmpty) return 'حداقل یک هدف انتخاب کنید.';
      if (_primaryGoal.text.trim().isEmpty) return 'هدف اصلی را بنویسید.';
      final bfRaw = _bodyFatPercent.text.trim();
      if (bfRaw.isNotEmpty) {
        final bf = double.tryParse(bfRaw);
        if (bf == null || bf < 1 || bf > 60) {
          return 'درصد چربی باید بین ۱ تا ۶۰ باشد.';
        }
      }
    }
    if (_step == 2) {
      if (_medicalHistory.text.trim().isEmpty) {
        return 'سوابق پزشکی را وارد کنید (در صورت نداشتن بنویسید: ندارم).';
      }
      if (_injuries.text.trim().isEmpty) {
        return 'آسیب‌دیدگی‌ها را وارد کنید (در صورت نداشتن بنویسید: ندارم).';
      }
      if (_physicalLimitations.text.trim().isEmpty) {
        return 'محدودیت بدنی را وارد کنید (در صورت نداشتن بنویسید: ندارم).';
      }
    }
    if (_step == 3) {
      for (final slot in _photoSlots) {
        if (_photos[slot.$1] == null) return 'عکس ${slot.$2} الزامی است.';
      }
    }
    return null;
  }

  Map<String, dynamic>? _buildPatch(int step) {
    switch (step) {
      case 0:
        return {
          'firstName': _firstName.text.trim(),
          'lastName': _lastName.text.trim(),
          'birthDate': _birthDateIso(),
          'nationalId': _nationalId.text.trim(),
          'gender': _gender,
          'heightCm': double.parse(_heightCm.text.trim()),
          'weightKg': double.parse(_weightKg.text.trim()),
        };
      case 1:
        final patch = <String, dynamic>{
          'targetWeightKg': double.parse(_targetWeightKg.text.trim()),
          'bodyCondition': _bodyCondition,
          'goals': _goals.toList(),
          'primaryGoal': _primaryGoal.text.trim(),
        };
        final bfRaw = _bodyFatPercent.text.trim();
        if (bfRaw.isNotEmpty) patch['bodyFatPercent'] = double.parse(bfRaw);
        return patch;
      case 2:
        return {
          'medicalHistory': _medicalHistory.text.trim(),
          'injuries': _injuries.text.trim(),
          'physicalLimitations': _physicalLimitations.text.trim(),
        };
      default:
        return null;
    }
  }

  Future<bool> _saveProfile(int step) async {
    final patch = _buildPatch(step);
    if (patch == null) return false;
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      await ref.read(profileRepositoryProvider).updateProfile(patch);
      return true;
    } catch (e) {
      if (mounted) setState(() => _error = _msg(e, 'ذخیره اطلاعات ناموفق بود.'));
      return false;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickPhoto(String type) async {
    final XFile? picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (picked == null) return;
    setState(() {
      _uploadingType = type;
      _error = '';
    });
    try {
      final photo =
          await ref.read(profileRepositoryProvider).uploadBodyPhoto(type, picked.path);
      if (!mounted) return;
      setState(() {
        _photos[type] = photo;
        _localPhotoPaths[type] = picked.path;
      });
    } catch (e) {
      if (mounted) setState(() => _error = _msg(e, 'آپلود عکس ناموفق بود.'));
    } finally {
      if (mounted) setState(() => _uploadingType = '');
    }
  }

  Future<void> _onNext() async {
    final err = _validateStep();
    if (err != null) {
      setState(() => _error = err);
      return;
    }
    if (_step < 3) {
      final saved = await _saveProfile(_step);
      if (!saved) return;
      setState(() => _step += 1);
      return;
    }
    // Final step: confirm completion server-side, then refresh the session.
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      final me = await ref.read(profileRepositoryProvider).getProfile();
      if (me.isProfileComplete) {
        await ref.read(authControllerProvider.notifier).refreshSession();
        // Router redirect handles navigation.
      } else if (mounted) {
        setState(() =>
            _error = 'هنوز برخی اطلاعات ناقص است. لطفاً همه فیلدها را بررسی کنید.');
      }
    } catch (e) {
      if (mounted) setState(() => _error = _msg(e, 'بررسی نهایی پروفایل ناموفق بود.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _onBack() {
    setState(() {
      _error = '';
      _step = (_step - 1).clamp(0, _steps.length - 1);
    });
  }

  String _msg(Object e, String fallback) {
    if (e is Exception) {
      final s = e.toString();
      final m = RegExp(r'ApiException\(\d*\):\s*(.*)').firstMatch(s);
      if (m != null) return m.group(1)!.trim();
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_step + 1) / _steps.length;
    return Scaffold(
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 4, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: FitinoPageHeader(
                      title: 'تکمیل پروفایل',
                      description: 'مرحله ${_step + 1} از ${_steps.length}',
                    ),
                  ),
                  FitinoMetaIconButton(
                    icon: Icons.logout,
                    tooltip: 'خروج',
                    onTap: () =>
                        ref.read(authControllerProvider.notifier).logout(),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'برای استفاده از پنل، لطفاً اطلاعات زیر را کامل کنید.',
                            style: TextStyle(color: AppColors.muted),
                          ),
                          const SizedBox(height: 16),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: progress,
                              minHeight: 8,
                              backgroundColor: AppColors.surfaceVariant,
                              color: AppColors.brandMid,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _stepChips(),
                          const SizedBox(height: 16),
                          if (_error.isNotEmpty) _errorBanner(),
                          Text(
                            'مرحله ${_step + 1} از ${_steps.length} — ${_steps[_step].label}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),
                          _stepBody(),
                        ],
                      ),
                    ),
                  ),
                  _navBar(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepChips() {
    return Row(
      children: [
        for (var i = 0; i < _steps.length; i++) ...[
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: i == _step ? AppColors.primary : AppColors.border,
                ),
                color: i == _step
                    ? AppColors.primary.withValues(alpha: 0.12)
                    : (i < _step
                        ? AppColors.surfaceVariant
                        : Colors.transparent),
              ),
              child: Column(
                children: [
                  Icon(_steps[i].icon,
                      size: 18,
                      color: i <= _step ? AppColors.primary : AppColors.muted),
                  const SizedBox(height: 4),
                  Text(
                    _steps[i].label,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
          if (i != _steps.length - 1) const SizedBox(width: 6),
        ],
      ],
    );
  }

  Widget _errorBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.destructive.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.destructive.withValues(alpha: 0.4)),
      ),
      child: Text(_error, style: const TextStyle(color: AppColors.destructive)),
    );
  }

  Widget _stepBody() {
    switch (_step) {
      case 0:
        return _personalStep();
      case 1:
        return _bodyStep();
      case 2:
        return _medicalStep();
      default:
        return _photosStep();
    }
  }

  Widget _personalStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: _field('نام', _firstName)),
            const SizedBox(width: 12),
            Expanded(child: _field('نام خانوادگی', _lastName)),
          ],
        ),
        const SizedBox(height: 16),
        JalaliDateField(
          label: 'تاریخ تولد (شمسی)',
          year: _birthYear,
          month: _birthMonth,
          day: _birthDay,
          onChanged: (y, m, d) => setState(() {
            _birthYear = y;
            _birthMonth = m;
            _birthDay = d;
          }),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _field('قد (cm)', _heightCm, number: true)),
            const SizedBox(width: 12),
            Expanded(child: _field('وزن فعلی (kg)', _weightKg, number: true)),
          ],
        ),
        const SizedBox(height: 16),
        _field('کد ملی', _nationalId,
            number: true,
            maxLength: 10,
            formatters: [FilteringTextInputFormatter.digitsOnly]),
        const SizedBox(height: 16),
        const Text('جنسیت', style: TextStyle(fontSize: 13)),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(child: _choice('مرد', _gender == 'male', () => setState(() => _gender = 'male'))),
            const SizedBox(width: 8),
            Expanded(child: _choice('زن', _gender == 'female', () => setState(() => _gender = 'female'))),
          ],
        ),
      ],
    );
  }

  Widget _bodyStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: _field('وزن هدف (kg)', _targetWeightKg, number: true)),
            const SizedBox(width: 12),
            Expanded(
                child: _field('درصد چربی (اختیاری)', _bodyFatPercent,
                    number: true)),
          ],
        ),
        const SizedBox(height: 16),
        const Text('وضعیت بدنی', style: TextStyle(fontSize: 13)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final c in _bodyConditions)
              _choice(c.$2, _bodyCondition == c.$1,
                  () => setState(() => _bodyCondition = c.$1)),
          ],
        ),
        const SizedBox(height: 16),
        const Text('اهداف', style: TextStyle(fontSize: 13)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final g in _goalOptions)
              _choice(g.$2, _goals.contains(g.$1), () => setState(() {
                    if (!_goals.add(g.$1)) _goals.remove(g.$1);
                  })),
          ],
        ),
        const SizedBox(height: 16),
        _field('هدف اصلی (توضیح کوتاه)', _primaryGoal,
            hint: 'مثلاً: کاهش ۸ کیلو تا شهریور'),
      ],
    );
  }

  Widget _medicalStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _field('سوابق پزشکی', _medicalHistory,
            lines: 3, hint: 'در صورت نداشتن بنویسید: ندارم'),
        const SizedBox(height: 16),
        _field('بیماری‌ها و آسیب‌دیدگی‌ها', _injuries,
            lines: 3, hint: 'در صورت نداشتن بنویسید: ندارم'),
        const SizedBox(height: 16),
        _field('محدودیت‌های بدنی', _physicalLimitations,
            lines: 3, hint: 'در صورت نداشتن بنویسید: ندارم'),
      ],
    );
  }

  Widget _photosStep() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 0.78,
      children: [
        for (final slot in _photoSlots) _photoCard(slot.$1, slot.$2),
      ],
    );
  }

  Widget _photoCard(String type, String label) {
    final photo = _photos[type];
    final localPath = _localPhotoPaths[type];
    final uploading = _uploadingType == type;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('نمای $label', style: const TextStyle(fontSize: 13)),
          const SizedBox(height: 8),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: _photoPreview(localPath, photo),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: uploading ? null : () => _pickPhoto(type),
            child: Text(
              uploading
                  ? 'در حال آپلود...'
                  : (photo != null ? 'تغییر عکس' : 'انتخاب عکس'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _photoPreview(String? localPath, MePhoto? photo) {
    if (localPath != null) {
      return Image.file(File(localPath), fit: BoxFit.cover);
    }
    if (photo != null && photo.url.isNotEmpty) {
      return Image.network(_assetUrl(photo.url), fit: BoxFit.cover);
    }
    return Container(
      color: AppColors.surfaceVariant,
      alignment: Alignment.center,
      child: const Text('عکس انتخاب نشده',
          style: TextStyle(color: AppColors.muted, fontSize: 12)),
    );
  }

  static String _assetUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
    return '$base${url.startsWith('/') ? url : '/$url'}';
  }

  Widget _navBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          OutlinedButton(
            onPressed: (_step == 0 || _saving) ? null : _onBack,
            child: const Text('قبلی'),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: (_saving || _uploadingType.isNotEmpty) ? null : _onNext,
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : Text(_step == 3 ? 'اتمام' : 'بعدی'),
          ),
        ],
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController controller, {
    bool number = false,
    int lines = 1,
    String? hint,
    int? maxLength,
    List<TextInputFormatter>? formatters,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 6, right: 2),
          child: Text(label, style: const TextStyle(fontSize: 13)),
        ),
        TextField(
          controller: controller,
          keyboardType: number
              ? const TextInputType.numberWithOptions(decimal: true)
              : (lines > 1 ? TextInputType.multiline : TextInputType.text),
          maxLines: lines,
          maxLength: maxLength,
          inputFormatters: formatters,
          decoration: InputDecoration(
            hintText: hint,
            counterText: '',
          ),
        ),
      ],
    );
  }

  Widget _choice(String label, bool selected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
          ),
          color: selected
              ? AppColors.primary.withValues(alpha: 0.14)
              : Colors.transparent,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: selected ? AppColors.primary : AppColors.foreground,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
