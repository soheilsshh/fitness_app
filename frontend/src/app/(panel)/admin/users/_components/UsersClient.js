"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { api } from "@/lib/axios/client";
import FilterChip from "@/app/(panel)/admin/plans/_components/FilterChip";
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

function formatDateFa(iso) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

export default function UsersClient() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | active | inactive
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await api.get("/admin/users", {
          params: {
            page,
            pageSize,
            query,
            status,
          },
        });
        if (cancelled) return;
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      } catch (error) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error("Failed to load admin users", error);
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, query, status]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">کاربران</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            کاربران ثبت‌نام‌شده را مدیریت کنید
          </p>
        </div>

        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <Users className="size-3.5 text-primary" />
          تعداد نتایج:
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString("fa-IR")}
          </span>
        </Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو با نام یا شماره موبایل..."
              className="ps-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={status === "all"}
              onClick={() => {
                setStatus("all");
                setPage(1);
              }}
            >
              همه
            </FilterChip>
            <FilterChip
              active={status === "active"}
              onClick={() => {
                setStatus("active");
                setPage(1);
              }}
            >
              فعال‌ها
            </FilterChip>
            <FilterChip
              active={status === "inactive"}
              onClick={() => {
                setStatus("inactive");
                setPage(1);
              }}
            >
              غیرفعال‌ها
            </FilterChip>
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
              کاربری پیدا نشد.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کاربر</TableHead>
                  <TableHead>شماره</TableHead>
                  <TableHead className="text-center">دوره‌ها</TableHead>
                  <TableHead className="text-center">سفارش‌ها</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-end">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id} className="group cursor-pointer">
                    <TableCell>
                      <Link href={`/admin/users/${u.id}`} className="block min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          عضویت: {formatDateFa(u.createdAt)}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell className="text-center tabular-nums">
                      {Number(u.programsCount || 0).toLocaleString("fa-IR")}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {Number(u.ordersCount || 0).toLocaleString("fa-IR")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          u.activeProgram
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {u.activeProgram ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions viewHref={`/admin/users/${u.id}`} />
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
