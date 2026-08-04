"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PlanForm from "../../_components/PlanForm";

export default function PlanDetailsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/plans/${id}`);
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
    setSaving(true);
    try {
      const res = await api.patch(`/admin/plans/${id}`, values);
      setPlan(res.data);
      await toastSuccess("موفق", "پلن ذخیره شد.");
    } catch (e) {
      toastError("خطا", e?.response?.data?.error || "ذخیره ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("این پلن حذف شود؟")) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      await toastSuccess("موفق", "پلن حذف شد.");
      router.push("/admin/plans");
    } catch (e) {
      toastError("خطا", e?.response?.data?.error || "حذف ناموفق بود.");
    }
  };

  if (loading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>در حال بارگذاری...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          پلن پیدا نشد.
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/plans" className="inline-flex items-center gap-2">
              <ChevronLeft className="size-4" />
              بازگشت
            </Link>
          </Button>
          <h1 className="text-lg font-extrabold">ویرایش پلن</h1>
        </div>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
          حذف پلن
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فرم ویرایش</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            mode="edit"
            initialValue={plan}
            onSubmit={onSubmit}
            submitText={saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
