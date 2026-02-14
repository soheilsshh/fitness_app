"use client";

import { FiBarChart2 } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function StatsEditor({ value, onChange }) {
  const stats = Array.isArray(value) ? value : [];

  const setField = (id, key, val) => {
    const next = stats.map((s) => (s.id === id ? { ...s, [key]: val } : s));
    onChange?.(next);
  };

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">آمار صفحه اصلی</div>
          <div className="mt-1 text-sm text-zinc-300">
            مقادیر کوتاه + عنوان زیرش
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-200">
          <FiBarChart2 className="text-emerald-200" />
          {stats.length} آیتم
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.id} className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
            <div className="mb-2 text-[11px] font-bold text-zinc-400">عنوان</div>
            <input
              value={s.label ?? ""}
              onChange={(e) => setField(s.id, "label", e.target.value)}
              className={cn(
                "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
              )}
              placeholder="مثال: کاربر فعال"
            />

            <div className="mb-2 mt-3 text-[11px] font-bold text-zinc-400">مقدار</div>
            <input
              value={s.value ?? ""}
              onChange={(e) => setField(s.id, "value", e.target.value)}
              className={cn(
                "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
              )}
              placeholder="مثال: 12,500+"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-zinc-500">
        {/* English comment: Keep values short for hero stats layout. */}
        پیشنهاد: مقدارها کوتاه و قابل خواندن باشند.
      </div>
    </div>
  );
}
