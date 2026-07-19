import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../../../core/utils/validators.dart';
import '../data/auth_repository.dart';

class ForgotScreen extends ConsumerStatefulWidget {
  const ForgotScreen({super.key});

  @override
  ConsumerState<ForgotScreen> createState() => _ForgotScreenState();
}

class _ForgotScreenState extends ConsumerState<ForgotScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _sent = false;
  bool _busy = false;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _phone.dispose();
    _code.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  void _startCooldown([int seconds = 60]) {
    _timer?.cancel();
    setState(() => _cooldown = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_cooldown <= 1) {
        t.cancel();
        setState(() => _cooldown = 0);
      } else {
        setState(() => _cooldown--);
      }
    });
  }

  Future<void> _sendOtp({bool resend = false}) async {
    if (!resend && !_formKey.currentState!.validate()) return;
    if (_cooldown > 0) return;
    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).forgotSendOtp(_phone.text.trim());
      setState(() => _sent = true);
      _startCooldown();
      _toast(resend ? 'کد دوباره ارسال شد.' : 'کد بازیابی ارسال شد.');
    } catch (e) {
      _toast(e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reset() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).resetPassword(
            phone: _phone.text.trim(),
            code: _code.text.trim(),
            newPassword: _newPassword.text,
          );
      _toast('گذرواژه با موفقیت تغییر کرد.');
      if (mounted) context.go('/auth/login');
    } catch (e) {
      _toast(e.toString());
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
      title: 'بازیابی گذرواژه',
      description: 'با کد پیامکی رمز جدید بگذارید',
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppTextField(
                  controller: _phone,
                  label: 'شماره موبایل',
                  keyboardType: TextInputType.phone,
                  validator: Validators.phone,
                  enabled: !_sent,
                ),
                if (_sent) ...[
                  const SizedBox(height: 16),
                  AppTextField(
                    controller: _code,
                    label: 'کد بازیابی',
                    keyboardType: TextInputType.number,
                    validator: (v) => Validators.required(v, field: 'کد'),
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    controller: _newPassword,
                    label: 'گذرواژه جدید',
                    obscure: true,
                    validator: (v) => Validators.password(v, min: 8),
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    controller: _confirmPassword,
                    label: 'تکرار گذرواژه',
                    obscure: true,
                    validator: (v) {
                      if (v != _newPassword.text) {
                        return 'تکرار گذرواژه مطابقت ندارد.';
                      }
                      return Validators.password(v, min: 8);
                    },
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: (_busy || _cooldown > 0)
                          ? null
                          : () => _sendOtp(resend: true),
                      child: Text(
                        _cooldown > 0
                            ? 'ارسال مجدد (${_cooldown})'
                            : 'ارسال مجدد کد',
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _busy
                      ? null
                      : () => _sent ? _reset() : _sendOtp(),
                  child: _busy
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : Text(_sent ? 'تغییر گذرواژه' : 'ارسال کد'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
