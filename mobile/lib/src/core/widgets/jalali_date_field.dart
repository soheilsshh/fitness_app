import 'package:flutter/material.dart';

import '../utils/jalali.dart';

/// Three-dropdown Jalali (Persian) date picker — the mobile counterpart of the
/// web app's `JalaliDateField` (year / month / day selects).
class JalaliDateField extends StatelessWidget {
  const JalaliDateField({
    super.key,
    required this.label,
    required this.year,
    required this.month,
    required this.day,
    required this.onChanged,
  });

  final String label;
  final int? year;
  final int? month;
  final int? day;

  /// Emits the new (year, month, day). Day is clamped to the month length when
  /// the year or month changes, matching the web behaviour.
  final void Function(int? year, int? month, int? day) onChanged;

  void _setYear(int? value) {
    final maxDay = JalaliDates.monthLength(value, month);
    final nextDay = (day != null && day! > maxDay) ? maxDay : day;
    onChanged(value, month, nextDay);
  }

  void _setMonth(int? value) {
    final maxDay = JalaliDates.monthLength(year, value);
    final nextDay = (day != null && day! > maxDay) ? maxDay : day;
    onChanged(year, value, nextDay);
  }

  @override
  Widget build(BuildContext context) {
    final years = JalaliDates.yearOptions();
    final daysInMonth = JalaliDates.monthLength(year, month);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 6, right: 2),
          child: Text(label, style: const TextStyle(fontSize: 13)),
        ),
        Row(
          children: [
            Expanded(
              child: _Dropdown<int>(
                hint: 'سال',
                value: year,
                items: [
                  for (final y in years)
                    DropdownMenuItem(value: y, child: Text('$y')),
                ],
                onChanged: _setYear,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _Dropdown<int>(
                hint: 'ماه',
                value: month,
                items: [
                  for (var i = 0; i < JalaliDates.months.length; i++)
                    DropdownMenuItem(
                      value: i + 1,
                      child: Text(JalaliDates.months[i]),
                    ),
                ],
                onChanged: _setMonth,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _Dropdown<int>(
                hint: 'روز',
                value: day,
                items: [
                  for (var d = 1; d <= daysInMonth; d++)
                    DropdownMenuItem(value: d, child: Text('$d')),
                ],
                onChanged: (v) => onChanged(year, month, v),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Dropdown<T> extends StatelessWidget {
  const _Dropdown({
    required this.hint,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String hint;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<T>(
      initialValue: value,
      isExpanded: true,
      hint: Text(hint),
      items: items,
      onChanged: onChanged,
    );
  }
}
