"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import PlanForm from "@/app/(panel)/admin/plans/_components/PlanForm";
import { buildEmptyPlan } from "@/app/(panel)/admin/plans/_components/planModel";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Button } from "@/components/ui/button";

export default function NewCoachPlanClient() {
  const router = useRouter();

  const onSubmit = async (values) => {
    try {
      const res = await api.post("/coach/plans", values);
      toastSuccess("ذخیره شد", "پلن جدید ساخته شد");
      router.push(`/coach/plans/detail?id=${encodeURIComponent(res.data.id)}`);
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ساخت پلن ناموفق بود");
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/coach/plans">
            <ChevronLeft data-icon="inline-start" />
            بازگشت
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">ساخت پلن جدید</h2>
      </div>
      <PlanForm mode="create" initialValue={buildEmptyPlan()} onSubmit={onSubmit} />
    </div>
  );
}
