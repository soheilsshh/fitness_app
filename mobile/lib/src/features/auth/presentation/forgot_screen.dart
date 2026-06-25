import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_text_field.dart';
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
  bool _sent = false;
  bool _busy = false;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    _newPassword.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    final repo = ref.read(authRepositoryProvider);
    try {
      if (!_sent) {
        await repo.forgotSendOtp(_phone.text.trim());
        setState(() => _sent = true);
        _toast('کد بازیابی ارسال شد.');
      } else {
        await repo.resetPassword(
          phone: _phone.text.trim(),
          code: _code.text.trim(),
          newPassword: _newPassword.text,
        );
        _toast('گذرواژه با موفقیت تغییر کرد.');
        if (mounted) context.go('/auth/login');
      }
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
    return Scaffold(
      appBar: AppBar(title: const Text('بازیابی گذرواژه')),
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
