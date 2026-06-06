"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import PlanForm from "@/app/(panel)/admin/plans/_components/PlanForm";
import { buildEmptyPlan } from "@/app/(panel)/admin/plans/_components/planModel";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";

export default function NewCoachPlanClient() {
  const router = useRouter();

  const onSubmit = async (values) => {
    try {
      const res = await api.post("/coach/plans", values);
      toastSuccess("ذخیره شد", "پلن جدید ساخته شد");
      router.push(`/coach/plans/${res.data.id}`);
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ساخت پلن ناموفق بود");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/coach/plans"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiChevronLeft />
            بازگشت
          </Link>
          <div className="text-lg font-extrabold text-white">ساخت پلن جدید</div>
        </div>
      </div>
      <PlanForm mode="create" initialValue={buildEmptyPlan()} onSubmit={onSubmit} />
    </div>
  );
}
