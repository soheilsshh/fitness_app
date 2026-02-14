"use client";

import { useMemo, useState } from "react";
import { FiShoppingBag } from "react-icons/fi";
import { mockOrders } from "./ordersMock";
import OrdersFilterChips from "./OrdersFilterChips";
import Pagination from "../../_components/Pagination";
import OrderCardLink from "./OrderCardLink";

export default function OrdersListClient() {
  const [filter, setFilter] = useState("all"); // all|paid|pending|failed|refunded
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(() => {
    if (filter === "all") return mockOrders;
    return mockOrders.filter((o) => o.status === filter);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paged = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, totalPages]);

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
          تعداد کل: <span className="text-white font-bold">{filtered.length}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <OrdersFilterChips value={filter} onChange={onChangeFilter} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          سفارشی برای نمایش وجود ندارد.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((o) => (
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
