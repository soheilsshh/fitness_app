"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiChevronLeft, FiTrash2 } from "react-icons/fi";
import PlanForm from "../../_components/PlanForm";
import { mockPlans } from "../../_components/plansMock";

export default function PlanDetailsClient({ id }) {
  const router = useRouter();

  const plan = useMemo(() => mockPlans.find((p) => String(p.id) === String(id)) || null, [id]);

  // ✅ for edit screen, keep local state (later replace with API data)
  const [localPlan, setLocalPlan] = useState(plan);

  if (!plan) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        پلن پیدا نشد.
      </div>
    );
  }

  const onSubmit = async (values) => {
    // ✅ later: call your API here (PATCH/PUT)
    // await fetch(`/api/admin/plans/${id}`, { method: "PATCH", body: JSON.stringify(values) })

    setLocalPlan(values);

    await Swal.fire({
      icon: "success",
      title: "آماده اتصال به API",
      text: "فعلاً ذخیره‌سازی نداریم. بعداً اینجا به API وصل می‌شود.",
      confirmButtonText: "باشه",
      background: "#0a0a0a",
      color: "#fff",
    });
  };

  const onDelete = async () => {
    const res = await Swal.fire({
      icon: "warning",
      title: "حذف پلن",
      text: "آیا مطمئن هستید؟ (فعلاً فقط نمایشی است)",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "لغو",
      background: "#0a0a0a",
      color: "#fff",
    });

    if (!res.isConfirmed) return;

    // ✅ later: call your API here (DELETE)
    // await fetch(`/api/admin/plans/${id}`, { method: "DELETE" })

    await Swal.fire({
      icon: "success",
      title: "آماده اتصال به API",
      text: "فعلاً حذف واقعی نداریم. بعداً اینجا به API وصل می‌شود.",
      confirmButtonText: "باشه",
      background: "#0a0a0a",
      color: "#fff",
    });

    router.push("/admin/plans");
  };

  return (
    <div className="space-y-4">
      {/* Top */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/plans"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiChevronLeft />
            بازگشت
          </Link>

          <div className="text-lg font-extrabold text-white">جزئیات پلن</div>
        </div>

        <button
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-2 text-sm font-extrabold text-rose-100 hover:bg-rose-400/15"
        >
          <FiTrash2 />
          حذف پلن
        </button>
      </div>

      {/* Header card */}
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">تیتر</div>
            <div className="mt-1 truncate text-xl font-extrabold text-white">
              {localPlan.title || "—"}
            </div>

            <div className="mt-2 text-sm text-zinc-300">{localPlan.subtitle || "—"}</div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-300">
              <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1">
                نام دوره: <span className="text-white font-bold">{localPlan.courseName || "—"}</span>
              </span>

              {localPlan.isPopular ? (
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 font-bold text-amber-100">
                  محبوب
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4 text-[11px] text-zinc-400">
            <div>Plan ID:</div>
            <div className="mt-1 font-bold text-zinc-200">{plan.id}</div>
            <div className="mt-3">
              آخرین بروزرسانی:
              <div className="mt-1 text-zinc-200">
                {(plan.updatedAt ? new Date(plan.updatedAt) : new Date()).toLocaleString("fa-IR")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <PlanForm
        key={plan.id}
        mode="edit"
        initialValue={localPlan}
        onSubmit={onSubmit}
        submitText="ذخیره تغییرات"
      />
    </div>
  );
}
