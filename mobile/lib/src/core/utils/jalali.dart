import 'package:shamsi_date/shamsi_date.dart';

/// Persian (Jalali) date helpers — mobile counterpart of the web app's
/// `jalaali-js` usage.
class JalaliDates {
  const JalaliDates._();

  static const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];

  static const _months = months;

  /// Descending list of selectable Jalali years — mirrors the web app's
  /// `getJalaliYearOptions` (1300..1405).
  static List<int> yearOptions({int minYear = 1300, int maxYear = 1405}) {
    return [for (var y = maxYear; y >= minYear; y--) y];
  }

  /// Number of days in a Jalali month. Falls back to 31 on invalid input,
  /// matching `getJalaliMonthLength` on the web.
  static int monthLength(int? year, int? month) {
    if (year == null || month == null || month < 1 || month > 12) return 31;
    try {
      return Jalali(year, month, 1).monthLength;
    } catch (_) {
      return 31;
    }
  }

  /// Jalali parts -> Gregorian ISO (`yyyy-MM-dd`) for the API.
  /// Returns null when the date is invalid (web returns '').
  static String? jalaliToGregorianIso(int? year, int? month, int? day) {
    if (year == null || month == null || day == null) return null;
    try {
      final g = Jalali(year, month, day).toGregorian();
      final m = g.month.toString().padLeft(2, '0');
      final d = g.day.toString().padLeft(2, '0');
      return '${g.year}-$m-$d';
    } catch (_) {
      return null;
    }
  }

  /// Gregorian ISO (`yyyy-MM-dd`, optionally with time) -> Jalali parts.
  static ({int? year, int? month, int? day}) gregorianIsoToJalali(String? iso) {
    if (iso == null || iso.isEmpty) return (year: null, month: null, day: null);
    final datePart = iso.split('T').first;
    final parts = datePart.split('-');
    if (parts.length < 3) return (year: null, month: null, day: null);
    final gy = int.tryParse(parts[0]);
    final gm = int.tryParse(parts[1]);
    final gd = int.tryParse(parts[2]);
    if (gy == null || gm == null || gd == null) {
      return (year: null, month: null, day: null);
    }
    try {
      final j = Gregorian(gy, gm, gd).toJalali();
      return (year: j.year, month: j.month, day: j.day);
    } catch (_) {
      return (year: null, month: null, day: null);
    }
  }

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
