"use client";

import { useEffect, useState } from "react";
import { Search, UserCog } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import RowActions from "@/app/(panel)/_shared/RowActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function CoachesClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/coaches", {
          params: { page, pageSize, query },
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
  }, [page, pageSize, query]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">مربی‌ها</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت مربی‌های پلتفرم
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <UserCog className="size-3.5 text-primary" />
          تعداد:
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString("fa-IR")}
          </span>
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو (نام، اسلاگ، عنوان)..."
              className="ps-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-11 w-full rounded-md" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              مربی‌ای یافت نشد.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مربی</TableHead>
                  <TableHead className="text-center">دانشجو</TableHead>
                  <TableHead>انتشار</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-end">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((coach) => (
                  <TableRow key={coach.id}>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm font-semibold">
                        {coach.displayName || "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {coach.title || "—"} • /{coach.slug}
                      </p>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {Number(coach.studentCount || 0).toLocaleString("fa-IR")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          coach.isPublished
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {coach.isPublished ? "منتشر شده" : "پیش‌نویس"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          coach.isActive
                            ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                        )}
                      >
                        {coach.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        viewHref={`/admin/coaches/detail?id=${encodeURIComponent(coach.id)}`}
                        editHref={`/admin/coaches/detail?id=${encodeURIComponent(coach.id)}`}
                        editLabel="ویرایش"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PanelPagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
