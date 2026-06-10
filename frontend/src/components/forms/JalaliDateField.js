"use client";

import { useMemo } from "react";
import {
  getJalaliMonthLength,
  getJalaliYearOptions,
  JALALI_MONTHS,
} from "@/lib/date/jalali";

export default function JalaliDateField({ label, year, month, day, onChange }) {
  const years = useMemo(() => getJalaliYearOptions(), []);
  const daysInMonth = useMemo(
    () => getJalaliMonthLength(year, month),
    [year, month]
  );

  const dayOptions = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d += 1) list.push(d);
    return list;
  }, [daysInMonth]);

  const setPart = (part, value) => {
    const next = { year, month, day, [part]: value };
    if (part === "year" || part === "month") {
      const maxDay = getJalaliMonthLength(next.year, next.month);
      if (next.day && Number(next.day) > maxDay) {
        next.day = String(maxDay);
      }
    }
    onChange?.(next);
  };

  return (
    <div>
      <div className="mb-2 text-xs font-bold text-zinc-300">{label}</div>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={year}
          onChange={(e) => setPart("year", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-3 text-sm text-white outline-none focus:border-white/20"
        >
          <option value="">سال</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setPart("month", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-3 text-sm text-white outline-none focus:border-white/20"
        >
          <option value="">ماه</option>
          {JALALI_MONTHS.map((name, i) => (
            <option key={name} value={String(i + 1)}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={day}
          onChange={(e) => setPart("day", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-3 text-sm text-white outline-none focus:border-white/20"
        >
          <option value="">روز</option>
          {dayOptions.map((d) => (
            <option key={d} value={String(d)}>
              {d}
            </option>
          ))}
        </select>
      </div>
      {year && month && day && (
        <div className="mt-2 text-[11px] text-zinc-500">
          تاریخ انتخاب‌شده: {year}/{month}/{day}
        </div>
      )}
    </div>
  );
}
