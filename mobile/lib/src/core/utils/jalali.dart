import 'package:shamsi_date/shamsi_date.dart';

/// Persian (Jalali) date helpers — mobile counterpart of the web app's
/// `jalaali-js` usage.
class JalaliDates {
  const JalaliDates._();

  static const _months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];

  /// `1403/03/05` style for the given Gregorian date.
  static String shortFromDate(DateTime date) {
    final j = Jalali.fromDateTime(date);
    final m = j.month.toString().padLeft(2, '0');
    final d = j.day.toString().padLeft(2, '0');
    return '${j.year}/$m/$d';
  }

  /// `۵ خرداد ۱۴۰۳` style.
  static String longFromDate(DateTime date) {
    final j = Jalali.fromDateTime(date);
    return '${j.day} ${_months[j.month - 1]} ${j.year}';
  }

  /// ISO `yyyy-MM-dd` for the Gregorian date — the format the food-log API
  /// expects in its `date` query param.
  static String isoDate(DateTime date) {
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '${date.year}-$m-$d';
  }

  /// Today's [DateTime] truncated to midnight.
  static DateTime todayDate() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }
}
