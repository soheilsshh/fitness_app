"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiSearch, FiClipboard, FiPlus } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import PlanRow from "@/app/(panel)/admin/plans/_components/PlanRow";
import FilterChip from "@/app/(panel)/admin/plans/_components/FilterChip";
import Pagination from "@/app/(panel)/admin/plans/_components/Pagination";

export default function CoachPlansClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/coach/plans", {
          params: { page, pageSize, query, tag },
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
  }, [page, pageSize, query, tag]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">پلن‌های من</div>
          <div className="mt-1 text-sm text-zinc-300">
            پلن‌های فروش خود را مدیریت کنید
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
            <FiClipboard className="text-emerald-200" />
            تعداد: <span className="font-bold text-white">{total}</span>
          </div>
          <Link
            href="/coach/plans/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
          >
            <FiPlus />
            ساخت پلن
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-3 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={tag === "all"} onClick={() => { setTag("all"); setPage(1); }}>همه</FilterChip>
          <FilterChip active={tag === "discounted"} onClick={() => { setTag("discounted"); setPage(1); }}>تخفیف‌دار</FilterChip>
          <FilterChip active={tag === "popular"} onClick={() => { setTag("popular"); setPage(1); }}>محبوب</FilterChip>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5">
        {loading ? (
          <div className="p-6 text-sm text-zinc-400">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-zinc-400">پلنی یافت نشد.</div>
        ) : (
          items.map((plan) => <PlanRow key={plan.id} plan={plan} basePath="/coach/plans" />)
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
