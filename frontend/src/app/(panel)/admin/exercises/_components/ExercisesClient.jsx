"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiActivity, FiPlus, FiSearch } from "react-icons/fi";
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

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function ExercisesClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/exercises", {
          params: {
            page,
            pageSize,
            query,
            category: category || undefined,
            bodyPart: bodyPart || undefined,
            equipment: equipment || undefined,
          },
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
  }, [page, pageSize, query, category, bodyPart, equipment, refreshKey]);

  async function handleDelete(id) {
    await api.delete(`/admin/exercises/${id}`);
    setRefreshKey((k) => k + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div dir="rtl" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>تمرین‌ها</CardTitle>
            <p className="text-sm text-muted-foreground">مدیریت دیتاست حرکات ورزشی</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <FiActivity className="text-emerald-500" />
              تعداد: <span className="font-bold">{faNum(total)}</span>
            </div>
            <Button asChild>
              <Link href="/admin/exercises/new">
                <FiPlus />
                تمرین جدید
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو (نام، شناسه، عضله هدف)..."
              className="pr-9"
            />
          </div>
          <Input
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            placeholder="فیلتر دسته‌بندی"
          />
          <Input
            value={bodyPart}
            onChange={(e) => {
              setBodyPart(e.target.value);
              setPage(1);
            }}
            placeholder="فیلتر ناحیه بدن"
          />
          <Input
            value={equipment}
            onChange={(e) => {
              setEquipment(e.target.value);
              setPage(1);
            }}
            placeholder="فیلتر تجهیزات"
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
              تمرینی یافت نشد.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تمرین</TableHead>
                  <TableHead>دسته / ناحیه</TableHead>
                  <TableHead>تجهیزات</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-end">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {exercise.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={exercise.imageUrl}
                            alt=""
                            className="size-10 shrink-0 rounded-lg border bg-muted object-cover"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                            <FiActivity />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {exercise.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {exercise.externalId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {exercise.category || "—"}
                      {exercise.bodyPart ? ` • ${exercise.bodyPart}` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {exercise.equipment || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium",
                          exercise.isActive
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                            : "border-rose-500/40 bg-rose-500/10 text-rose-600"
                        )}
                      >
                        {exercise.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        viewHref={`/admin/exercises/${exercise.id}`}
                        editHref={`/admin/exercises/${exercise.id}`}
                        editLabel="ویرایش"
                        onDelete={() => handleDelete(exercise.id)}
                        deleteTitle="حذف تمرین"
                        deleteDescription={`آیا از حذف تمرین «${exercise.name || ""}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            قبلی
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            صفحه {faNum(page)} از {faNum(totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            بعدی
          </Button>
        </div>
      ) : null}
    </div>
  );
}
