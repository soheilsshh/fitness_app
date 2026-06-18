"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, Clock, Dumbbell, History } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 15;

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function HistoryRowSkeleton() {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3 pt-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardContent>
    </Card>
  );
}

export default function WorkoutHistoryClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/me/workout-history", {
          params: { page, pageSize: PAGE_SIZE },
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
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">تاریخچه تمرینات</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            سوابق تمرینات انجام‌شده شما
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <History className="size-3.5 text-primary" />
          تعداد:
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString("fa-IR")}
          </span>
        </Badge>
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <HistoryRowSkeleton key={i} />)
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <Dumbbell className="mx-auto mb-3 size-8 text-muted-foreground opacity-60" />
              <p className="text-sm font-medium">هنوز تمرینی ثبت نشده</p>
              <p className="mt-2 text-sm text-muted-foreground">
                پس از اتمام هر جلسه تمرین، از صفحه برنامه‌های من آن را ثبت کنید.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/user/my-programs">رفتن به برنامه‌های من</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="transition-colors hover:bg-muted/30">
              <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-start">
                  <p className="truncate text-sm font-semibold">
                    {item.programTitle || "برنامه تمرین"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDateTime(item.completedAt)}
                    </span>
                    <span>•</span>
                    <span>روز: {item.dayLabel || item.dayKey}</span>
                    {item.coachName ? (
                      <>
                        <span>•</span>
                        <span>مربی: {item.coachName}</span>
                      </>
                    ) : null}
                  </div>
                  {item.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {Number(item.exerciseCount || 0).toLocaleString("fa-IR")} حرکت
                  </Badge>
                  {item.durationMin > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="size-3" />
                      {Number(item.durationMin).toLocaleString("fa-IR")} دقیقه
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <PanelPagination page={page} totalPages={totalPages} onPage={setPage} />
      )}
    </div>
  );
}
