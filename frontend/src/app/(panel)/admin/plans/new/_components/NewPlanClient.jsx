"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <PlanForm mode="create" initialValue={buildEmptyPlan()} onSubmit={onSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
