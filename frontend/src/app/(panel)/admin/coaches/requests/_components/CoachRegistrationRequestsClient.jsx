"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Eye, UserCheck } from "lucide-react";
import { getPendingCoaches } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { toastError } from "@/app/(site)/auth/_components/helpers";
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
import CoachReviewDetailsSheet from "./CoachReviewDetailsSheet";

export default function CoachRegistrationRequestsClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingCoaches();
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch (error) {
      setItems([]);
      setTotal(0);
      toastError("خطا", getApiErrorMessage(error, "بارگذاری درخواست‌ها ناموفق بود"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openDetails = (coachId) => {
    setSelectedCoachId(coachId);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">درخواست‌های ثبت‌نام مربی</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            بررسی و تأیید پروفایل‌های ارسال‌شده توسط مربیان
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <ClipboardList className="size-3.5 text-primary" />
          در انتظار بررسی:
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString("fa-IR")}
          </span>
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-11 w-full rounded-md" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <UserCheck className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">درخواستی در انتظار بررسی نیست</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  وقتی مربی درخواست خود را ثبت کند، اینجا نمایش داده می‌شود.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام و نام خانوادگی</TableHead>
                    <TableHead>شماره تماس</TableHead>
                    <TableHead>شهر</TableHead>
                    <TableHead className="text-end">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((coach) => (
                    <TableRow key={coach.id}>
                      <TableCell>
                        <div className="min-w-[10rem]">
                          <p className="text-sm font-semibold">{coach.displayName || "—"}</p>
                          {coach.title ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{coach.title}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm" dir="ltr">
                        {coach.phone || "—"}
                      </TableCell>
                      <TableCell>{coach.city || "—"}</TableCell>
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openDetails(coach.id)}
                        >
                          <Eye data-icon="inline-start" />
                          دیدن جزئیات
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CoachReviewDetailsSheet
        coachId={selectedCoachId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onApproved={loadRequests}
      />
    </div>
  );
}
