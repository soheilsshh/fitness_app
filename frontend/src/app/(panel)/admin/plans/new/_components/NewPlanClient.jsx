"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiChevronLeft } from "react-icons/fi";
import PlanForm from "../../_components/PlanForm";
import { buildEmptyPlan } from "../../_components/planModel";

export default function NewPlanClient() {
  const router = useRouter();

  const onSubmit = async (values) => {
    // ✅ later: call your API here
    // await fetch("/api/admin/plans", { method: "POST", body: JSON.stringify(values) })

    await Swal.fire({
      icon: "success",
      title: "آماده اتصال به API",
      text: "فعلاً ذخیره‌سازی نداریم. بعداً اینجا به API وصل می‌شود.",
      confirmButtonText: "باشه",
      background: "#0a0a0a",
      color: "#fff",
    });

    // ✅ later: navigate to created plan id
    router.push("/admin/plans");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/plans"
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
