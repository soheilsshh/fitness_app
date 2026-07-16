import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../application/auth_controller.dart';
import '../data/auth_repository.dart';

enum _AuthStep { phone, login, register }
enum _LoginTab { password, otp }

/// Phone-first unified auth — mirrors web `UnifiedAuthForm`.
class UnifiedAuthScreen extends ConsumerStatefulWidget {
  const UnifiedAuthScreen({super.key});

  @override
  ConsumerState<UnifiedAuthScreen> createState() => _UnifiedAuthScreenState();
}

class _UnifiedAuthScreenState extends ConsumerState<UnifiedAuthScreen> {
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _otp = TextEditingController();

  _AuthStep _step = _AuthStep.phone;
  _LoginTab _loginTab = _LoginTab.password;
  bool _otpSent = false;
  bool _obscure = true;
  bool _busy = false;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    _otp.dispose();
    super.dispose();
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  String _msg(Object e) {
    final s = e.toString();
    return s
        .replaceFirst('ApiException', '')
        .replaceAll(RegExp(r'^\(\d*\):?\s*'), '')
        .trim();
  }

  Future<void> _continueWithPhone() async {
    final phone = _phone.text.trim();
    if (Validators.phone(phone) != null) {
      _toast('شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.');
      return;
    }
    setState(() => _busy = true);
    try {
      final exists =
          await ref.read(authRepositoryProvider).checkPhone(phone);
      setState(() {
        _step = exists ? _AuthStep.login : _AuthStep.register;
        _otpSent = false;
        _otp.clear();
        _password.clear();
        _loginTab = _LoginTab.password;
      });
    } catch (e) {
      _toast(_msg(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendOtp() async {
    final phone = _phone.text.trim();
    if (Validators.phone(phone) != null) {
      _toast('شماره موبایل را درست وارد کنید.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).requestOtp(phone);
      setState(() {
        _otpSent = true;
        _otp.clear();
      });
      _toast('کد یکبار مصرف پیامک شد.');
    } catch (e) {
      _toast(_msg(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _loginPassword() async {
    if (Validators.password(_password.text) != null) {
      _toast('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(authControllerProvider.notifier).loginWithPassword(
            _phone.text.trim(),
            _password.text,
          );
    } catch (e) {
      _toast(_msg(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _loginOtp() async {
    if (!_otpSent) {
      _toast('ابتدا کد را دریافت کنید.');
      return;
    }
    if (!RegExp(r'^\d{4,6}$').hasMatch(_otp.text.trim())) {
      _toast('کد را صحیح وارد کنید.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(
            _phone.text.trim(),
            _otp.text.trim(),
          );
    } catch (e) {
      _toast(_msg(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _register() async {
    if (!_otpSent) {
      _toast('ابتدا کد تایید را دریافت کنید.');
      return;
    }
    if (!RegExp(r'^\d{4,6}$').hasMatch(_otp.text.trim())) {
      _toast('کد تایید را صحیح وارد کنید.');
      return;
    }
    if (Validators.password(_password.text) != null) {
      _toast('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(authControllerProvider.notifier).register(
            phone: _phone.text.trim(),
            password: _password.text,
            code: _otp.text.trim(),
          );
    } catch (e) {
      _toast(_msg(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = switch (_step) {
      _AuthStep.phone => 'ورود یا ثبت‌نام',
      _AuthStep.login => 'خوش برگشتید',
      _AuthStep.register => 'ساخت حساب جدید',
    };
    final subtitle = switch (_step) {
      _AuthStep.phone =>
        'فقط شماره موبایل کافی است؛ بقیه مسیر خودکار تنظیم می‌شود.',
      _AuthStep.login => 'با رمز عبور یا کد پیامکی وارد حساب شوید.',
      _AuthStep.register =>
        'شماره را با کد پیامکی تایید کنید و یک رمز بگذارید.',
    };

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF5FBFA),
              Colors.white,
              Color(0xFFE8F8F5),
            ],
          ),
        ),
        child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: Image.asset(
                        'assets/branding/fitino-logo.png',
                        width: 72,
                        height: 72,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            gradient: AppColors.brandGradient,
                          ),
                          child: const Icon(Icons.fitness_center,
                              size: 36, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'فیتینو',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.brandDeep,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.muted),
                  ),
                  const SizedBox(height: 28),
                  if (_step == _AuthStep.phone) ...[
                    AppTextField(
                      controller: _phone,
                      label: 'شماره موبایل',
                      keyboardType: TextInputType.phone,
                      validator: Validators.phone,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _busy ? null : _continueWithPhone,
                      child: Text(_busy ? 'در حال بررسی…' : 'ادامه'),
                    ),
                  ],
                  if (_step != _AuthStep.phone) ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(_phone.text,
                          textDirection: TextDirection.ltr),
                      trailing: TextButton(
                        onPressed: _busy
                            ? null
                            : () => setState(() {
                                  _step = _AuthStep.phone;
                                  _otpSent = false;
                                }),
                        child: const Text('تغییر شماره'),
                      ),
                    ),
                  ],
                    if (_step == _AuthStep.login) ...[
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          FitinoChoiceChip(
                            label: 'با رمز عبور',
                            icon: Icons.lock_outline,
                            selected: _loginTab == _LoginTab.password,
                            onSelected: (_) => setState(
                                () => _loginTab = _LoginTab.password),
                          ),
                          FitinoChoiceChip(
                            label: 'با کد پیامکی',
                            icon: Icons.sms_outlined,
                            selected: _loginTab == _LoginTab.otp,
                            onSelected: (_) =>
                                setState(() => _loginTab = _LoginTab.otp),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (_loginTab == _LoginTab.password) ...[
                      AppTextField(
                        controller: _password,
                        label: 'رمز عبور',
                        obscure: _obscure,
                        suffix: IconButton(
                          icon: Icon(_obscure
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined),
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                        ),
                      ),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton(
                          onPressed: () => context.push('/auth/forgot'),
                          child: const Text('فراموشی رمز'),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _busy ? null : _loginPassword,
                        child: Text(_busy ? '...' : 'ورود'),
                      ),
                    ] else ...[
                      if (!_otpSent)
                        OutlinedButton(
                          onPressed: _busy ? null : _sendOtp,
                          child: Text(
                              _busy ? 'در حال ارسال…' : 'ارسال کد پیامکی'),
                        )
                      else ...[
                        AppTextField(
                          controller: _otp,
                          label: 'کد تایید',
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: _busy ? null : _sendOtp,
                          child: const Text('ارسال مجدد کد'),
                        ),
                        ElevatedButton(
                          onPressed: _busy ? null : _loginOtp,
                          child: Text(_busy ? '...' : 'ورود با کد'),
                        ),
                      ],
                    ],
                  ],
                  if (_step == _AuthStep.register) ...[
                    if (!_otpSent)
                      OutlinedButton(
                        onPressed: _busy ? null : _sendOtp,
                        child:
                            Text(_busy ? 'در حال ارسال…' : 'ارسال کد تایید'),
                      )
                    else ...[
                      AppTextField(
                        controller: _otp,
                        label: 'کد تایید',
                        keyboardType: TextInputType.number,
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
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _busy ? null : _sendOtp,
                        child: const Text('ارسال مجدد کد'),
                      ),
                      ElevatedButton(
                        onPressed: _busy ? null : _register,
                        child: Text(_busy ? '...' : 'ثبت‌نام'),
                      ),
                    ],
                  ],
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => context.push('/auth/forgot'),
                    child: const Text('فراموشی رمز عبور'),
                  ),
                  TextButton(
                    onPressed: () => context.push('/auth/register/coach'),
                    child: const Text('ثبت‌نام به‌عنوان مربی'),
                  ),
                ],
              ),
            ),
          ),
        ),
        ),
      ),
    );
  }
}
