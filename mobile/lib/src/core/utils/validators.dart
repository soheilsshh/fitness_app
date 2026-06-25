/// Simple form validators returning a Persian error or null when valid.
class Validators {
  const Validators._();

  static String? required(String? v, {String field = 'این فیلد'}) {
    if (v == null || v.trim().isEmpty) return '$field الزامی است.';
    return null;
  }

  static String? email(String? v) {
    if (v == null || v.trim().isEmpty) return 'ایمیل الزامی است.';
    final re = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!re.hasMatch(v.trim())) return 'ایمیل نامعتبر است.';
    return null;
  }

  static String? phone(String? v) {
    if (v == null || v.trim().isEmpty) return 'شماره موبایل الزامی است.';
    final re = RegExp(r'^09\d{9}$');
    if (!re.hasMatch(v.trim())) return 'شماره موبایل نامعتبر است (۰۹xxxxxxxxx).';
    return null;
  }

  static String? password(String? v, {int min = 6}) {
    if (v == null || v.isEmpty) return 'گذرواژه الزامی است.';
    if (v.length < min) return 'گذرواژه باید حداقل $min کاراکتر باشد.';
    return null;
  }
}
