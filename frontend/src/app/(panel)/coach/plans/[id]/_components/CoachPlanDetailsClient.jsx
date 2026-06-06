"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiTrash2 } from "react-icons/fi";
import PlanForm from "@/app/(panel)/admin/plans/_components/PlanForm";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";

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
    return <div className="text-sm text-zinc-400">در حال بارگذاری...</div>;
  }

  if (!plan) {
    return <div className="text-sm text-zinc-400">پلن یافت نشد.</div>;
  }

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
          <div className="text-lg font-extrabold text-white">ویرایش پلن</div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200 hover:bg-rose-400/15"
        >
          <FiTrash2 />
          حذف
        </button>
      </div>
      <PlanForm mode="edit" initialValue={plan} onSubmit={onSubmit} submitText="ذخیره تغییرات" />
    </div>
  );
}
