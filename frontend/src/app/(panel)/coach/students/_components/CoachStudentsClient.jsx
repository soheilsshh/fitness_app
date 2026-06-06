"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiUserCheck } from "react-icons/fi";
import { api } from "@/lib/axios/client";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function CoachStudentsClient() {
  const [filter, setFilter] = useState("active");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/coach/students", {
          params: { page, pageSize, status: filter, query: q },
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
  }, [filter, q, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">دانشجویان من</div>
          <div className="mt-1 text-sm text-zinc-300">
            دانشجویانی که از شما پلن خریده‌اند
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
          <FiUserCheck className="text-emerald-200" />
          تعداد: <span className="font-bold text-white">{total}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/5 p-2">
          <Tab active={filter === "active"} onClick={() => { setFilter("active"); setPage(1); }}>
            فعال
          </Tab>
          <Tab active={filter === "pending"} onClick={() => { setFilter("pending"); setPage(1); }}>
            در انتظار
          </Tab>
        </div>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="جستجو (نام/موبایل)..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40 md:max-w-md"
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
            در حال بارگذاری...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
            موردی یافت نشد.
          </div>
        ) : (
          items.map((s) => (
            <Link
              key={s.id}
              href={`/coach/students/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-white">{s.fullName}</div>
                <div className="mt-1 text-[11px] text-zinc-400">{s.phone}</div>
                <div className="mt-2 text-[11px] text-zinc-300">
                  پلن: <span className="font-bold text-white">{s.planTitle || "—"}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-bold",
                    s.status === "active"
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-zinc-950/30 text-zinc-200"
                  )}
                >
                  {s.status === "active" ? "فعال" : "در انتظار"}
                </span>
                <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-200">
                  {s.planType === "both" ? "تمرین + تغذیه" : s.planType === "workout" ? "تمرین" : "تغذیه"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {total > pageSize ? (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
          >
            قبلی
          </button>
          <span className="px-3 py-2 text-sm text-zinc-400">صفحه {page}</span>
          <button
            disabled={page * pageSize >= total}
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

function Tab({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
        active ? "bg-white text-zinc-950" : "border border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}
