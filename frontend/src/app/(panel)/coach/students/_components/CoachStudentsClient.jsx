"use client";

import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

function planTypeLabel(type) {
  if (type === "both") return "تمرین + تغذیه";
  if (type === "workout") return "تمرین";
  return "تغذیه";
}

export default function CoachStudentsClient() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = { page, pageSize: PAGE_SIZE, query: q };
        if (filter !== "all") params.status = filter;
        const res = await api.get("/coach/students", { params });
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
  }, [filter, q, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">دانشجویان من</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            دانشجویانی که از شما پلن خریده‌اند
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <UserCheck className="size-3.5 text-primary" />
          تعداد:
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString("fa-IR")}
          </span>
        </Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(next) => {
              if (next) {
                setFilter(next);
                setPage(1);
              }
            }}
            variant="outline"
            size="sm"
            spacing={2}
          >
            <ToggleGroupItem value="all">همه</ToggleGroupItem>
            <ToggleGroupItem value="active">فعال</ToggleGroupItem>
            <ToggleGroupItem value="pending">در انتظار برنامه</ToggleGroupItem>
          </ToggleGroup>
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو (نام/موبایل)..."
            className="md:max-w-md"
          />
        </CardContent>
      </Card>

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
              موردی یافت نشد.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>دانشجو</TableHead>
                  <TableHead>پلن</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-end">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <p className="text-sm font-semibold">{student.fullName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {student.phone}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {student.planTitle || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {planTypeLabel(student.planType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          student.status === "active"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : undefined
                        )}
                      >
                        {student.status === "active" ? "فعال" : "در انتظار برنامه"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions viewHref={`/coach/students/detail?id=${encodeURIComponent(student.id)}`} />
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
