"use client";

import { useEffect, useState } from "react";
import { Clock, Dumbbell, History } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import MetaBadge from "@/app/(panel)/user/_components/ui/MetaBadge";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import PanelEmptyState from "@/app/(panel)/user/_components/ui/PanelEmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PersonalRecordsTab from "./PersonalRecordsTab";

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
      <PageHeader
        title="تاریخچه تمرینات"
        description="گزارش کامل سوابق و روند اجرای تمرینات شما"
        meta={
          <MetaBadge
            icon={History}
            label="تعداد جلسات:"
            value={total.toLocaleString("fa-IR")}
          />
        }
      />

      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">تاریخچه تمرینات</TabsTrigger>
          <TabsTrigger value="records">رکوردهای شخصی</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4 flex flex-col gap-4">
          {loading ? (
            <Card>
              <CardContent className="space-y-2 pt-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-md" />
                ))}
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <PanelEmptyState
              icon={Dumbbell}
              title="هنوز هیچ تمرینی ثبت نکرده‌اید!"
              description="سفر تحول بدنی شما با استارت اولین تمرین آغاز می‌شود. پس از اتمام هر جلسه، گزارش تمرین را از بخش برنامه‌های من ثبت کنید — وزنه، تعداد تکرار یا ثانیه‌های نگه‌داشتن — تا روند پیشرفت‌تان رسم شود."
              actionHref="/user/my-programs"
              actionLabel="مشاهده برنامه‌ها و ثبت اولین تمرین 🏋️"
            />
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
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <PersonalRecordsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
