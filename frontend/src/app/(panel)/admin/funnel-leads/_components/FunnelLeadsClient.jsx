"use client";

import { useEffect, useState } from "react";
import { Phone, UserCheck } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import FilterChip from "@/app/(panel)/admin/plans/_components/FilterChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  GOAL_LABELS,
  STATUS_LABELS,
} from "@/app/(site)/leadfunnel/_lib/funnelConfig";

function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function FunnelLeadsClient() {
  const [filter, setFilter] = useState("paid");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [markingId, setMarkingId] = useState(null);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function fetchLeads() {
      setLoading(true);
      try {
        const res = await api.get("/admin/funnel-leads", {
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
    fetchLeads();
    return () => {
      cancelled = true;
    };
  }, [filter, q, page]);

  const markContacted = async (id) => {
    setMarkingId(id);
    try {
      await api.patch(`/admin/funnel-leads/${id}`, { status: "contacted" });
      const res = await api.get("/admin/funnel-leads", {
        params: { page, pageSize, status: filter, query: q },
      });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } finally {
      setMarkingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div>
        <h1 className="text-xl font-extrabold md:text-2xl">خریداران قیف فروش</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          لیست افرادی که از /leadfunnel پرداخت کرده‌اند — برای تماس دستی
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "paid"} onClick={() => setFilter("paid")}>
          پرداخت شده
        </FilterChip>
        <FilterChip active={filter === "contacted"} onClick={() => setFilter("contacted")}>
          تماس گرفته شد
        </FilterChip>
        <FilterChip active={filter === "pending_payment"} onClick={() => setFilter("pending_payment")}>
          پرداخت نشده
        </FilterChip>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          همه
        </FilterChip>
      </div>

      <Input
        placeholder="جستجو نام یا شماره..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            موردی یافت نشد.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((lead) => (
            <Card key={lead.id} className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold">{lead.fullName}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        lead.status === "paid" &&
                          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                        lead.status === "contacted" &&
                          "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                        lead.status === "pending_payment" &&
                          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      )}
                    >
                      {STATUS_LABELS[lead.status] || lead.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span dir="ltr">{lead.phone}</span>
                    <span>{GOAL_LABELS[lead.primaryGoal] || lead.primaryGoal}</span>
                    <span>{formatToman(lead.amount)}</span>
                    {lead.paidAt && <span>{formatDate(lead.paidAt)}</span>}
                  </div>
                  {lead.trackingCode && (
                    <p className="text-xs text-muted-foreground">
                      کد پیگیری: <span className="font-mono font-medium">{lead.trackingCode}</span>
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="size-4" />
                      تماس
                    </a>
                  </Button>
                  {lead.status === "paid" && (
                    <Button
                      size="sm"
                      disabled={markingId === lead.id}
                      onClick={() => markContacted(lead.id)}
                    >
                      <UserCheck className="size-4" />
                      تماس گرفته شد
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <PanelPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
