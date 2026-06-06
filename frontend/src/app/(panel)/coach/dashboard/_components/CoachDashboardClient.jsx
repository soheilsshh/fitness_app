"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios/client";
import StatCard from "@/app/(panel)/admin/dashboard/_components/StatCard";

function formatToman(n) {
  return `${Number(n || 0).toLocaleString("fa-IR")} تومان`;
}

export default function CoachDashboardClient() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/coach/dashboard/stats");
        if (!cancelled) setStats(res.data);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="text-sm text-zinc-400">در حال بارگذاری آمار...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-white">داشبورد مربی</h1>
        <p className="mt-1 text-sm text-zinc-400">خلاصه وضعیت دانشجویان و فروش</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="تعداد دانشجویان"
          value={stats?.totalStudents ?? 0}
          hint="همه دانشجویان مرتبط با شما"
        />
        <StatCard
          title="اشتراک فعال"
          value={stats?.activeSubscriptions ?? 0}
          hint="اشتراک‌های جاری"
        />
        <StatCard
          title="فروش این ماه"
          value={formatToman(stats?.monthlySales)}
          hint="سفارش‌های پرداخت‌شده"
        />
      </div>
    </div>
  );
}
