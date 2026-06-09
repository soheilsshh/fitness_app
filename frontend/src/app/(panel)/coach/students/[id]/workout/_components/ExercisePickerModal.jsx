"use client";

import { useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { api } from "@/lib/axios/client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export default function ExercisePickerModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setItems([]);
      setSelected(null);
      setSets("3");
      setReps("10");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/coach/exercises", {
          params: { query: query.trim(), pageSize: 30 },
        });
        if (!cancelled) setItems(res.data?.items || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  const handleConfirm = () => {
    if (!selected) return;
    const parts = [selected.name];
    const setsNum = parseInt(sets, 10);
    if (setsNum > 0) parts.push(`${setsNum} ست`);
    if (reps.trim()) parts.push(`${reps.trim()} تکرار`);
    onSelect?.(parts.join(" — "));
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="بستن"
      />
      <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="text-base font-extrabold text-white">
              انتخاب حرکت از دیتاست
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
            >
              <FiX />
            </button>
          </div>

          <div className="border-b border-white/10 px-5 py-3">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی حرکت (نام، عضله هدف)..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-4 text-sm text-white outline-none focus:border-emerald-400/40"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="p-4 text-sm text-zinc-400">در حال جستجو...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-zinc-400">
                {query.trim() ? "حرکتی یافت نشد." : "نام حرکت را جستجو کنید."}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setSelected(ex)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition",
                      selected?.id === ex.id
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {ex.imageUrl ? (
                      <img
                        src={mediaUrl(ex.imageUrl)}
                        alt={ex.name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/30 text-[10px] text-zinc-500">
                        بدون تصویر
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">
                        {ex.name}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-zinc-400">
                        {[ex.bodyPart, ex.equipment, ex.target]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected ? (
            <div className="border-t border-white/10 px-5 py-4">
              <div className="mb-3 text-sm font-bold text-white">
                {selected.name}
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  ست
                  <input
                    type="number"
                    min="1"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    className="w-16 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-white outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  تکرار
                  <input
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="۱۰"
                    className="w-20 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-white outline-none"
                  />
                </label>
              </div>
              <button
                onClick={handleConfirm}
                className="mt-4 w-full rounded-2xl bg-white py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
              >
                افزودن به برنامه
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
