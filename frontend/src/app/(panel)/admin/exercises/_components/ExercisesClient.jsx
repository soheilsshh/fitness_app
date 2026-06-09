"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiSearch, FiActivity } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ExercisesClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/exercises", {
          params: {
            page,
            pageSize,
            query,
            category: category || undefined,
            bodyPart: bodyPart || undefined,
            equipment: equipment || undefined,
          },
        });
        if (cancelled) return;
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, query, category, bodyPart, equipment]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">تمرین‌ها</div>
          <div className="mt-1 text-sm text-zinc-300">
            مدیریت دیتاست حرکات ورزشی
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
            <FiActivity className="text-emerald-200" />
            تعداد: <span className="font-bold text-white">{total}</span>
          </div>
          <Link
            href="/admin/exercises/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-emerald-400"
          >
            <FiPlus />
            تمرین جدید
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2 xl:col-span-1">
          <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو (نام، شناسه، عضله هدف)..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-3 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
          />
        </div>
        <input
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          placeholder="فیلتر دسته‌بندی"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
        />
        <input
          value={bodyPart}
          onChange={(e) => {
            setBodyPart(e.target.value);
            setPage(1);
          }}
          placeholder="فیلتر ناحیه بدن"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
        />
        <input
          value={equipment}
          onChange={(e) => {
            setEquipment(e.target.value);
            setPage(1);
          }}
          placeholder="فیلتر تجهیزات"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
        />
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5">
        {loading ? (
          <div className="p-6 text-sm text-zinc-400">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-zinc-400">تمرینی یافت نشد.</div>
        ) : (
          items.map((exercise) => (
            <Link
              key={exercise.id}
              href={`/admin/exercises/${exercise.id}`}
              className="block border-b border-white/5 px-4 py-4 last:border-b-0 hover:bg-white/10"
            >
              <div className="flex items-center gap-4">
                {exercise.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={exercise.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 bg-zinc-900 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/40 text-zinc-500">
                    <FiActivity />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="truncate text-sm font-extrabold text-white">
                      {exercise.name}
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-bold",
                        exercise.isActive
                          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                          : "border-rose-400/25 bg-rose-400/10 text-rose-200"
                      )}
                    >
                      {exercise.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {exercise.externalId}
                    {exercise.category ? ` • ${exercise.category}` : ""}
                    {exercise.bodyPart ? ` • ${exercise.bodyPart}` : ""}
                    {exercise.equipment ? ` • ${exercise.equipment}` : ""}
                  </div>
                  {exercise.target ? (
                    <div className="mt-1 text-[11px] text-zinc-500">
                      هدف: {exercise.target}
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
          >
            قبلی
          </button>
          <span className="px-3 py-2 text-sm text-zinc-400">
            صفحه {page} از {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      ) : null}
    </div>
  );
}
