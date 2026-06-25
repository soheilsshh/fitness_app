import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/utils/validators.dart';
import '../application/auth_controller.dart';
import '../data/auth_repository.dart';

enum _Mode { password, otp }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _otp = TextEditingController();

  _Mode _mode = _Mode.password;
  bool _otpSent = false;
  bool _obscure = true;
  bool _busy = false;

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    _phone.dispose();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      if (_mode == _Mode.password) {
        await ref
            .read(authControllerProvider.notifier)
            .loginWithPassword(_identifier.text.trim(), _password.text);
      } else if (!_otpSent) {
        await ref.read(authRepositoryProvider).requestOtp(_phone.text.trim());
        setState(() => _otpSent = true);
        _toast('کد تأیید ارسال شد.');
      } else {
        await ref
            .read(authControllerProvider.notifier)
            .verifyOtp(_phone.text.trim(), _otp.text.trim());
      }
      // On success the router redirect takes over automatically.
    } catch (e) {
      _toast(_msg(e));
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

  String _msg(Object e) {
    final s = e.toString();
    return s.replaceFirst('ApiException', '').replaceAll(RegExp(r'^\(\d*\):?\s*'), '').trim();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(Icons.fitness_center,
                        size: 56, color: AppColors.primary),
                    const SizedBox(height: 12),
                    const Text(
                      'ورود به حساب',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 24),
                    _modeToggle(),
                    const SizedBox(height: 20),
                    if (_mode == _Mode.password) ...[
                      AppTextField(
                        controller: _identifier,
                        label: 'ایمیل یا شماره موبایل',
                        prefixIcon: Icons.person_outline,
                        validator: (v) => Validators.required(v, field: 'این فیلد'),
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        controller: _password,
                        label: 'گذرواژه',
                        obscure: _obscure,
                        prefixIcon: Icons.lock_outline,
                        validator: (v) => Validators.password(v, min: 1),
                        suffix: IconButton(
                          icon: Icon(
                              _obscure ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                    ] else ...[
                      AppTextField(
                        controller: _phone,
                        label: 'شماره موبایل',
                        keyboardType: TextInputType.phone,
                        prefixIcon: Icons.phone_iphone,
                        validator: Validators.phone,
                      ),
                      if (_otpSent) ...[
                        const SizedBox(height: 16),
                        AppTextField(
                          controller: _otp,
                          label: 'کد تأیید',
                          keyboardType: TextInputType.number,
                          prefixIcon: Icons.sms_outlined,
                          validator: (v) =>
                              Validators.required(v, field: 'کد تأیید'),
                        ),
                      ],
                    ],
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : Text(_primaryLabel()),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.push('/auth/forgot'),
                      child: const Text('گذرواژه را فراموش کرده‌اید؟'),
                    ),
                    const Divider(height: 28, color: AppColors.border),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('حساب ندارید؟',
                            style: TextStyle(color: AppColors.muted)),
                        TextButton(
                          onPressed: () => context.push('/auth/register'),
                          child: const Text('ثبت‌نام'),
                        ),
                      ],
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

  String _primaryLabel() {
    if (_mode == _Mode.password) return 'ورود';
    return _otpSent ? 'تأیید کد' : 'ارسال کد';
  }

  Widget _modeToggle() {
    return SegmentedButton<_Mode>(
      segments: const [
        ButtonSegment(value: _Mode.password, label: Text('گذرواژه')),
        ButtonSegment(value: _Mode.otp, label: Text('کد یک‌بارمصرف')),
      ],
      selected: {_mode},
      onSelectionChanged: (s) => setState(() {
        _mode = s.first;
        _otpSent = false;
      }),
    );
  }
}
