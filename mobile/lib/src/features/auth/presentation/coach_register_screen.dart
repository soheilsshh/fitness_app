import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../application/auth_controller.dart';
import '../data/auth_repository.dart';

class CoachRegisterScreen extends ConsumerStatefulWidget {
  const CoachRegisterScreen({super.key});

  @override
  ConsumerState<CoachRegisterScreen> createState() =>
      _CoachRegisterScreenState();
}

class _CoachRegisterScreenState extends ConsumerState<CoachRegisterScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) {
      _toast('نام را وارد کنید');
      return;
    }
    if (Validators.phone(_phone.text.trim()) != null) {
      _toast('شماره موبایل نامعتبر است');
      return;
    }
    if (Validators.password(_password.text) != null) {
      _toast('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    setState(() => _busy = true);
    try {
      final res = await ref.read(authRepositoryProvider).registerCoach(
            name: _name.text.trim(),
            phone: _phone.text.trim(),
            password: _password.text,
          );
      await ref.read(authControllerProvider.notifier).applyAuthResponse(res);
    } catch (e) {
      _toast(e.toString().replaceFirst(RegExp(r'^ApiException\(\d*\):\s*'), ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  @override
  Widget build(BuildContext context) {
    return FitinoPushScaffold(
      title: 'ثبت‌نام مربی',
      description: 'ساخت حساب مربی فیتینو',
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'حساب مربی بسازید. نام نمایشی و لینک عمومی بعداً توسط ادمین تنظیم می‌شود.',
                style: TextStyle(color: AppColors.muted),
              ),
              const SizedBox(height: 20),
              AppTextField(controller: _name, label: 'نام و نام خانوادگی'),
              const SizedBox(height: 12),
              AppTextField(
                controller: _phone,
                label: 'شماره موبایل',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              AppTextField(
                controller: _password,
                label: 'رمز عبور',
                obscure: _obscure,
                suffix: IconButton(
                  icon: Icon(_obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _busy ? null : _submit,
                child: Text(_busy ? 'در حال ثبت…' : 'ثبت‌نام مربی'),
              ),
              TextButton(
                onPressed: () => context.go('/auth'),
                child: const Text('حساب دانشجو دارم'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
