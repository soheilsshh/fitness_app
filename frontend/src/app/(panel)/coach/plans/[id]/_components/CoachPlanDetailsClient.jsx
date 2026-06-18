"use client";

import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PlanForm from "@/app/(panel)/admin/plans/_components/PlanForm";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoachPlanDetailsClient({ id }) {
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/coach/plans/${id}`);
        if (!cancelled) setPlan(res.data);
      } catch {
        if (!cancelled) setPlan(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSubmit = async (values) => {
    try {
      const res = await api.patch(`/coach/plans/${id}`, values);
      setPlan(res.data);
      toastSuccess("ذخیره شد", "پلن به‌روزرسانی شد");
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ذخیره ناموفق بود");
    }
  };

  const onDelete = async () => {
    if (!window.confirm("این پلن حذف شود؟")) return;
    try {
      await api.delete(`/coach/plans/${id}`);
      toastSuccess("حذف شد", "پلن حذف شد");
      router.push("/coach/plans");
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "حذف ناموفق بود");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Card dir="rtl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          پلن یافت نشد.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/coach/plans">
              <ChevronLeft data-icon="inline-start" />
              بازگشت
            </Link>
          </Button>
          <h2 className="text-lg font-semibold">ویرایش پلن</h2>
        </div>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 data-icon="inline-start" />
          حذف پلن
        </Button>
      </div>
      <PlanForm mode="edit" initialValue={plan} onSubmit={onSubmit} />
    </div>
  );
}
