"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MetaBadge from "../../_components/ui/MetaBadge";
import PageHeader from "../../_components/ui/PageHeader";
import PanelEmptyState from "../../_components/ui/PanelEmptyState";
import OrdersFilterChips from "./OrdersFilterChips";
import Pagination from "../../_components/Pagination";
import OrderCardLink from "./OrderCardLink";

const PAGE_SIZE = 6;

function OrderCardSkeleton() {
  return (
    <Card className="h-full bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <div className="flex flex-col gap-4 px-(--card-spacing) py-(--card-spacing)">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <Skeleton className="h-3 w-12" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function OrdersListClient() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/me/orders", {
          params: { page, pageSize: PAGE_SIZE, status: filter },
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
  }, [filter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onChangeFilter = (next) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="سفارش‌های من"
        description="وضعیت پرداخت‌ها و جزئیات هر سفارش را اینجا ببینید."
        meta={
          <MetaBadge
            icon={ShoppingBag}
            label="تعداد کل:"
            value={total.toLocaleString("fa-IR")}
          />
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <OrdersFilterChips value={filter} onChange={onChangeFilter} />
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <PanelEmptyState
          icon={ShoppingBag}
          title="سفارشی برای نمایش وجود ندارد"
          description="پس از ثبت سفارش، وضعیت پرداخت و جزئیات اینجا دیده می‌شود."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-1">
          {items.map((order) => (
            <div key={order.id} className="h-full">
              <OrderCardLink order={order} />
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
