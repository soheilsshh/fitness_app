"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

function exercisePreviewUrl(ex) {
  return mediaUrl(ex?.gifUrl || ex?.imageUrl);
}

export default function ExercisePickerModal({ open, onClose, onAdd, dayLabel }) {
  const [mounted, setMounted] = useState(false);
  const [source, setSource] = useState("dataset");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");

  useEffect(() => setMounted(true), []);

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
    if (!open) return;
    let cancelled = false;
    api.get("/coach/exercises/categories", { params: { source } })
      .then((res) => {
        if (!cancelled) setCategories(res.data?.categories || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => { cancelled = true; };
  }, [open, source]);

  useEffect(() => {
    if (!open) {
      setSource("dataset");
      setQuery("");
      setCategory("");
      setItems([]);
      setSelected(null);
      setSets("3");
      setReps("12");
      setError("");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/coach/exercises", {
          params: {
            source,
            query: query.trim() || undefined,
            category: category || undefined,
            pageSize: 48,
          },
        });
        if (!cancelled) setItems(res.data?.items || []);
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(
            err?.response?.data?.error ||
              "بارگذاری حرکات ناموفق بود."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, source, query, category]);

  const resetSelection = () => {
    setSelected(null);
    setSets("3");
    setReps("12");
  };

  const handleAdd = (andContinue) => {
    if (!selected) return;
    onAdd?.({
      exerciseId: selected.id,
      name: selected.name,
      imageUrl: selected.gifUrl || selected.imageUrl || "",
      sets,
      reps,
    });
    if (andContinue) {
      resetSelection();
    } else {
      onClose?.();
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="بستن"
      />
      <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6">
        <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-base font-extrabold text-white">انتخاب حرکت</div>
              {dayLabel ? (
                <div className="mt-0.5 text-xs text-zinc-400">برنامه {dayLabel}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
            >
              <FiX />
            </button>
          </div>

          <div className="space-y-3 border-b border-white/10 px-5 py-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSource("dataset");
                  setCategory("");
                  setSelected(null);
                }}
                className={cn(
                  "flex-1 rounded-2xl border px-3 py-2 text-xs font-bold transition",
                  source === "dataset"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-zinc-950/30 text-zinc-300 hover:bg-white/10"
                )}
              >
                دیتاست
              </button>
              <button
                type="button"
                onClick={() => {
                  setSource("mine");
                  setCategory("");
                  setSelected(null);
                }}
                className={cn(
                  "flex-1 rounded-2xl border px-3 py-2 text-xs font-bold transition",
                  source === "mine"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-zinc-950/30 text-zinc-300 hover:bg-white/10"
                )}
              >
                حرکات من
              </button>
            </div>
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی نام حرکت..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-4 text-sm text-white outline-none focus:border-emerald-400/40"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory("")}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-[11px] font-bold transition",
                  !category
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-zinc-950/30 text-zinc-300 hover:bg-white/10"
                )}
              >
                همه
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-[11px] font-bold transition",
                    category === cat
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : "border-white/10 bg-zinc-950/30 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="py-8 text-center text-sm text-zinc-400">در حال بارگذاری حرکات...</div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                {source === "mine"
                  ? "هنوز حرکتی ثبت نکرده‌اید. از «افزودن حرکت دستی» استفاده کنید."
                  : "حرکتی یافت نشد."}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setSelected(ex)}
                    className={cn(
                      "flex flex-col overflow-hidden rounded-2xl border text-right transition",
                      selected?.id === ex.id
                        ? "border-emerald-400/50 bg-emerald-400/10 ring-1 ring-emerald-400/30"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="aspect-square w-full bg-zinc-900">
                      {exercisePreviewUrl(ex) ? (
                        <img
                          src={exercisePreviewUrl(ex)}
                          alt={ex.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                          بدون تصویر
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="line-clamp-2 text-xs font-bold text-white">
                        {ex.name}
                      </div>
                      {ex.category ? (
                        <div className="mt-1 truncate text-[10px] text-zinc-500">
                          {ex.category}
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected ? (
            <div className="border-t border-white/10 bg-zinc-950/80 px-5 py-4">
              <div className="flex items-center gap-3">
                {exercisePreviewUrl(selected) ? (
                  <img
                    src={exercisePreviewUrl(selected)}
                    alt={selected.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white">{selected.name}</div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                      تعداد ست
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
                        placeholder="۱۲"
                        className="w-20 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-white outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAdd(true)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-zinc-100 hover:bg-white/10"
                >
                  افزودن و ادامه
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd(false)}
                  className="flex-1 rounded-2xl bg-white py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
                >
                  افزودن حرکت
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10 px-5 py-3 text-center text-xs text-zinc-500">
              یک حرکت را انتخاب کنید، سپس ست و تکرار را مشخص کنید
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
