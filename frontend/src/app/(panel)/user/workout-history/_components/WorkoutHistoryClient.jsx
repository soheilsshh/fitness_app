"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Dumbbell, History } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

      {loading ? (
        <Card>
          <CardContent className="space-y-2 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md" />
            ))}
          </CardContent>
        </Card>
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
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>برنامه</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>روز</TableHead>
                  <TableHead>مربی</TableHead>
                  <TableHead className="text-center">حرکت‌ها</TableHead>
                  <TableHead className="text-end">مدت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="text-sm font-semibold">
                        {item.programTitle || "برنامه تمرین"}
                      </p>
                      {item.notes ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                          {item.notes}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(item.completedAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.dayLabel || item.dayKey}
                    </TableCell>
                    <TableCell className="text-sm">{item.coachName || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {Number(item.exerciseCount || 0).toLocaleString("fa-IR")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      {item.durationMin > 0 ? (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="size-3" />
                          {Number(item.durationMin).toLocaleString("fa-IR")} دقیقه
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <PanelPagination page={page} totalPages={totalPages} onPage={setPage} />
      )}
    </div>
  );
}
