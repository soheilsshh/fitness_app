"use client";

import { FiList, FiPlus, FiTrash2 } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function FeatureBulletsEditor({ value, onChange }) {
  const title = value?.title ?? "بخش";
  const items = Array.isArray(value?.items) ? value.items : [];

  const setTitle = (t) => onChange?.({ ...value, title: t });
  const setItem = (idx, text) => {
    const next = [...items];
    next[idx] = text;
    onChange?.({ ...value, items: next });
  };

  const addItem = () => {
    const next = [...items, ""];
    onChange?.({ ...value, items: next });
  };

  const removeItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    onChange?.({ ...value, items: next });
  };

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">بخش ویژگی‌ها</div>
          <div className="mt-1 text-sm text-zinc-300">
            مواردی که در صفحه اصلی کنار هم نمایش داده می‌شوند
          </div>
        </div>

        <button
          onClick={addItem}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
        >
          <FiPlus />
          افزودن مورد
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="md:col-span-2 block">
          <div className="mb-2 text-[11px] font-bold text-zinc-400">عنوان بخش</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
            placeholder="مثال: بخش"
          />
        </label>

        {items.map((it, idx) => (
          <div key={idx} className="rounded-3xl border border-white/10 bg-zinc-950/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold text-zinc-400">
                <FiList />
                مورد {idx + 1}
              </div>

              <button
                onClick={() => removeItem(idx)}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-3 py-1.5 text-[11px] font-bold text-rose-100 hover:bg-rose-400/15"
              >
                <FiTrash2 />
                حذف
              </button>
            </div>

            <input
              value={it}
              onChange={(e) => setItem(idx, e.target.value)}
              className={cn(
                "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
              )}
              placeholder="مثال: برنامه شخصی‌سازی‌شده"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-zinc-500">
        بهتره متن هر مورد کوتاه و یک‌خطی باشد.
      </div>
    </div>
  );
}
