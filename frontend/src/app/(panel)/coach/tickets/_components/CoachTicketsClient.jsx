"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import RowActions from "@/app/(panel)/_shared/RowActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              تیکتی برای نمایش وجود ندارد.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان</TableHead>
                  <TableHead>دانشجو</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>اولویت</TableHead>
                  <TableHead className="text-end">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => {
                  const st = statusLabel(t.status);
                  const pr = priorityLabel(t.priority);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="max-w-xs">
                        <span className="block truncate text-sm font-medium">
                          {t.title}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.studentName || "دانشجو"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {faDate(t.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pr.variant}>{pr.label}</Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <RowActions viewHref={`/coach/tickets/${t.id}`} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PanelPagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
