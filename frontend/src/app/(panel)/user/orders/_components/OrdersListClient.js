"use client";

import { useEffect, useState } from "react";
import { FiShoppingBag } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import OrdersFilterChips from "./OrdersFilterChips";
import Pagination from "../../_components/Pagination";
import OrderCardLink from "./OrderCardLink";

export default function OrdersListClient() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 6;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/me/orders", {
          params: { page, pageSize, status: filter },
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
    return () => { cancelled = true; };
  }, [filter, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onChangeFilter = (next) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">سفارش‌های من</div>
          <div className="mt-1 text-sm text-zinc-300">
            وضعیت پرداخت‌ها و جزئیات هر سفارش را اینجا ببینید.
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
          <FiShoppingBag className="text-emerald-300" />
          تعداد کل: <span className="text-white font-bold">{total}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <OrdersFilterChips value={filter} onChange={onChangeFilter} />
      </div>

      {loading ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
          در حال بارگذاری...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          سفارشی برای نمایش وجود ندارد.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((o) => (
            <div key={o.id} className="h-full">
              <OrderCardLink order={o} />
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
