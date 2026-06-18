"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const PAGE_SIZE = 8;

function faDate(d) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(d));
  } catch {
    return "";
  }
}

function statusLabel(status) {
  switch (status) {
    case "pending":
    case "in_review":
      return { label: "در حال بررسی", variant: "secondary" };
    case "answered":
      return { label: "پاسخ داده شده", variant: "default" };
    case "closed":
      return { label: "بسته شده", variant: "outline" };
    default:
      return { label: status || "نامشخص", variant: "outline" };
  }
}

function priorityLabel(priority) {
  switch (priority) {
    case "low":
      return { label: "کم", variant: "outline" };
    case "high":
      return { label: "بالا", variant: "destructive" };
    default:
      return { label: "معمولی", variant: "secondary" };
  }
}

function RowSkeleton() {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3 pt-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardContent>
    </Card>
  );
}

export default function CoachTicketsClient() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = { page, pageSize: PAGE_SIZE };
        if (filter !== "all") params.status = filter;
        const res = await api.get("/coach/tickets", { params });
        if (cancelled) return;
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          setError(err?.response?.data?.error || "بارگذاری تیکت‌ها ناموفق بود.");
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

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">تیکت‌های دانشجویان</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            پیام‌ها و درخواست‌های دانشجویان خود را مدیریت کنید.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <MessageSquare className="size-3.5 text-primary" />
          تعداد:
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString("fa-IR")}
          </span>
        </Badge>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => {
              if (!v) return;
              setFilter(v);
              setPage(1);
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all">همه</ToggleGroupItem>
            <ToggleGroupItem value="pending">در انتظار</ToggleGroupItem>
            <ToggleGroupItem value="in_review">در حال بررسی</ToggleGroupItem>
            <ToggleGroupItem value="answered">پاسخ داده شده</ToggleGroupItem>
            <ToggleGroupItem value="closed">بسته شده</ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            تیکتی برای نمایش وجود ندارد.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((t) => {
            const st = statusLabel(t.status);
            const pr = priorityLabel(t.priority);
            return (
              <Card key={t.id} size="sm" className="transition-colors hover:bg-muted/20">
                <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-start">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t.studentName || "دانشجو"} • {faDate(t.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <Badge variant={pr.variant}>{pr.label}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/coach/tickets/${t.id}`}>مشاهده</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PanelPagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
