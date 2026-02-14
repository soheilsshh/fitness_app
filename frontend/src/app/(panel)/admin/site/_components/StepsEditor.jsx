"use client";

import { FiClipboard } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function StepsEditor({ value, onChange }) {
  const steps = Array.isArray(value) ? value : [];

  const setField = (id, key, val) => {
    const next = steps.map((s) => (s.id === id ? { ...s, [key]: val } : s));
    onChange?.(next);
  };

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">کارت‌های توضیحی</div>
          <div className="mt-1 text-sm text-zinc-300">
            عنوان + متن کوتاه (سه کارت)
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-200">
          <FiClipboard className="text-cyan-200" />
          {steps.length} کارت
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {steps.map((c) => (
          <div key={c.id} className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
            <div className="mb-2 text-[11px] font-bold text-zinc-400">عنوان</div>
            <input
              value={c.title ?? ""}
              onChange={(e) => setField(c.id, "title", e.target.value)}
              className={cn(
                "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
              )}
              placeholder="مثال: ثبت پیشرفت"
            />

            <div className="mt-3 mb-2 text-[11px] font-bold text-zinc-400">متن</div>
            <textarea
              value={c.text ?? ""}
              onChange={(e) => setField(c.id, "text", e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
              placeholder="توضیح کوتاه کارت..."
            />
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-zinc-500">
        {/* English comment: Keep texts concise to avoid layout overflow on small screens. */}
        متن‌ها کوتاه باشند تا در موبایل به‌هم نریزد.
      </div>
    </div>
  );
}
