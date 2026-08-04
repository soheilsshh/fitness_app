"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiSearch } from "react-icons/fi";
import { ClipboardList } from "lucide-react";
import { api } from "@/lib/axios/client";
import RowActions from "@/app/(panel)/_shared/RowActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function TemplatesClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/workout-templates", {
          params: { page, pageSize, query: query || undefined },
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
  }, [page, query, refreshKey]);

  async function handleDelete(id) {
    if (!window.confirm("این تمپلیت حذف شود؟")) return;
    await api.delete(`/admin/workout-templates/${id}`);
    setRefreshKey((k) => k + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">تمپلیت‌های آماده برنامه</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت برنامه‌های تمرینی آماده — افزودن، ویرایش حرکات و انیمیشن‌ها
          </p>
        </div>
        <Link href="/admin/templates/new">
          <Button>
            <FiPlus className="ms-1" /> تمپلیت جدید
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-primary" />
            لیست تمپلیت‌ها ({faNum(total)})
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pe-9"
              placeholder="جستجو عنوان، هدف، سطح…"
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان</TableHead>
                  <TableHead>جنسیت</TableHead>
                  <TableHead>سطح</TableHead>
                  <TableHead>هدف</TableHead>
                  <TableHead>روز</TableHead>
                  <TableHead>حرکات</TableHead>
                  <TableHead className="w-28">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      تمپلیتی پیدا نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell>{t.gender || "—"}</TableCell>
                      <TableCell>{t.level || "—"}</TableCell>
                      <TableCell>{t.target || "—"}</TableCell>
                      <TableCell>{faNum(t.dayCount)}</TableCell>
                      <TableCell>{faNum(t.itemCount)}</TableCell>
                      <TableCell>
                        <RowActions
                          viewHref={`/admin/templates/detail?id=${encodeURIComponent(t.id)}`}
                          editHref={`/admin/templates/detail?id=${encodeURIComponent(t.id)}`}
                          onDelete={() => handleDelete(t.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </Button>
              <span className="text-sm text-muted-foreground">
                {faNum(page)} / {faNum(totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                بعدی
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
