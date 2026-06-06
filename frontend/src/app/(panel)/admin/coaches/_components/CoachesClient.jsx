"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiSearch, FiUsers } from "react-icons/fi";
import { api } from "@/lib/axios/client";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function CoachesClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/coaches", {
          params: { page, pageSize, query },
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
  }, [page, pageSize, query]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">مربی‌ها</div>
          <div className="mt-1 text-sm text-zinc-300">
            مدیریت مربی‌های پلتفرم
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
          <FiUsers className="text-emerald-200" />
          تعداد: <span className="font-bold text-white">{total}</span>
        </div>
      </div>

      <div className="relative w-full md:max-w-md">
        <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="جستجو (نام، اسلاگ، عنوان)..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-3 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
        />
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5">
        {loading ? (
          <div className="p-6 text-sm text-zinc-400">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-zinc-400">مربی‌ای یافت نشد.</div>
        ) : (
          items.map((coach) => (
            <Link
              key={coach.id}
              href={`/admin/coaches/${coach.id}`}
              className="block border-b border-white/5 px-4 py-4 last:border-b-0 hover:bg-white/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-white">
                    {coach.displayName || "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {coach.title || "—"} • /{coach.slug}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-200">
                    {coach.studentCount} دانشجو
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-bold",
                      coach.isPublished
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-zinc-950/30 text-zinc-300"
                    )}
                  >
                    {coach.isPublished ? "منتشر شده" : "پیش‌نویس"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-bold",
                      coach.isActive
                        ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
                        : "border-rose-400/25 bg-rose-400/10 text-rose-200"
                    )}
                  >
                    {coach.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <button
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
