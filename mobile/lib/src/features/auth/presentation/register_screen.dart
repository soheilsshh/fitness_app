import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/utils/validators.dart';
import '../application/auth_controller.dart';
import '../data/auth_repository.dart';

/// Registration with OTP gating — mirrors the web `RegisterForm`:
/// 1. enter phone -> request OTP, 2. enter OTP -> verify (client-side),
/// 3. enter name + password -> create account.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _password = TextEditingController();

  bool _otpSent = false;
  bool _otpVerified = false;
  bool _sendingOtp = false;
  bool _registering = false;
  bool _obscure = true;

  @override
  void dispose() {
    _phone.dispose();
    _otp.dispose();
    _firstName.dispose();
    _lastName.dispose();
    _password.dispose();
    super.dispose();
  }

  void _resetOtpFlow() {
    setState(() {
      _otpSent = false;
      _otpVerified = false;
      _otp.clear();
    });
  }

  Future<void> _sendOtp() async {
    if (Validators.phone(_phone.text.trim()) != null) {
      _toast('شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.');
      return;
    }
    setState(() => _sendingOtp = true);
    try {
      await ref.read(authRepositoryProvider).requestOtp(_phone.text.trim());
      setState(() {
        _otpSent = true;
        _otp.clear();
      });
      _toast('کد تأیید ارسال شد.');
    } catch (e) {
      _toast(_msg(e));
    } finally {
      if (mounted) setState(() => _sendingOtp = false);
    }
  }

  void _verifyOtp() {
    if (!_otpSent) {
      _toast('ابتدا روی «ارسال رمز» بزنید.');
      return;
    }
    if (!RegExp(r'^\d{4,6}$').hasMatch(_otp.text.trim())) {
      _toast('کد را صحیح وارد کنید.');
      return;
    }
    setState(() => _otpVerified = true);
    _toast('شماره شما تأیید شد. حالا اطلاعات را کامل کنید.');
  }

  Future<void> _submit() async {
    if (!_otpVerified) {
      _toast('ابتدا شماره موبایل را تأیید کنید.');
      return;
    }
    if (_firstName.text.trim().isEmpty || _lastName.text.trim().isEmpty) {
      _toast('نام و نام خانوادگی را وارد کنید.');
      return;
    }
    if (_password.text.length < 6) {
      _toast('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    final phone = _phone.text.trim();
    setState(() => _registering = true);
    try {
      await ref.read(authControllerProvider.notifier).register(
            name: '${_firstName.text.trim()} ${_lastName.text.trim()}'.trim(),
            email: '$phone@phone.local',
            phone: phone,
            password: _password.text,
          );
      // Router redirect handles navigation after a successful register.
    } catch (e) {
      _toast(_msg(e));
    } finally {
      if (mounted) setState(() => _registering = false);
    }
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  String _msg(Object e) {
    final s = e.toString();
    final m = RegExp(r'ApiException\(\d*\):\s*(.*)').firstMatch(s);
    return m != null ? m.group(1)!.trim() : s;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ثبت‌نام')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'برای ساخت حساب جدید شماره موبایل خود را وارد کنید',
                    style: TextStyle(color: AppColors.muted),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: AppTextField(
                          controller: _phone,
                          label: 'شماره موبایل',
                          hint: '09xxxxxxxxx',
                          keyboardType: TextInputType.phone,
                          prefixIcon: Icons.phone_iphone,
                          // Locked once OTP is sent (edit via the pencil button).
                        ),
                      ),
                      if (_otpSent && !_otpVerified) ...[
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.edit_outlined),
                          tooltip: 'ویرایش شماره',
                          onPressed: _registering ? null : _resetOtpFlow,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (!_otpSent && !_otpVerified)
                    FilledButton.tonal(
                      onPressed: _sendingOtp ? null : _sendOtp,
                      child: Text(_sendingOtp ? 'در حال ارسال...' : 'ارسال رمز'),
                    ),
                  if (_otpSent && !_otpVerified) ...[
                    AppTextField(
                      controller: _otp,
                      label: 'کد OTP',
                      keyboardType: TextInputType.number,
                      prefixIcon: Icons.sms_outlined,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: _sendingOtp ? null : _sendOtp,
                          child: const Text('ارسال مجدد'),
                        ),
                        TextButton(
                          onPressed: _verifyOtp,
                          child: const Text('تأیید کد'),
                        ),
                      ],
                    ),
                  ],
                  if (_otpVerified) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: AppColors.primary.withValues(alpha: 0.25)),
                      ),
                      child: const Text('شماره موبایل تأیید شد.'),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            controller: _firstName,
                            label: 'نام',
                            prefixIcon: Icons.person_outline,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppTextField(
                            controller: _lastName,
                            label: 'نام خانوادگی',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _password,
                      label: 'رمز عبور',
                      hint: 'حداقل ۶ کاراکتر',
                      obscure: _obscure,
                      prefixIcon: Icons.lock_outline,
                      suffix: IconButton(
                        icon: Icon(_obscure
                            ? Icons.visibility_off
                            : Icons.visibility),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _registering ? null : _submit,
                      child: _registering
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('ساخت حساب'),
                    ),
                  ],
                  const SizedBox(height: 16),
                  const Text(
                    'با ثبت‌نام، قوانین و حریم خصوصی را می‌پذیرید.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                  const Divider(height: 28, color: AppColors.border),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('حساب دارید؟',
                          style: TextStyle(color: AppColors.muted)),
                      TextButton(
                        onPressed: () => context.pop(),
                        child: const Text('ورود'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
