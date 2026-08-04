"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlanForm from "../../_components/PlanForm";
import { buildEmptyPlan } from "../../_components/planModel";

export default function NewPlanClient() {
  const router = useRouter();

  const onSubmit = async (values) => {
    try {
      const res = await api.post("/admin/plans", values);
      await toastSuccess("موفق", "پلن ساخته شد.");
      router.push(
        `/admin/plans/detail?id=${encodeURIComponent(res.data?.id || "")}`,
      );
    } catch (e) {
      toastError("خطا", e?.response?.data?.error || "ساخت پلن ناموفق بود.");
    }
  };

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
          <h1 className="text-lg font-extrabold">ساخت پلن جدید</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فرم ساخت پلن</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            mode="create"
            initialValue={buildEmptyPlan()}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
