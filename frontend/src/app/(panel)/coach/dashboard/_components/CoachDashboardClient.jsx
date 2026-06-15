"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/axios/client";
import { SectionCards } from "@/components/section-cards";

function formatToman(value) {
  try {
    return `${new Intl.NumberFormat("fa-IR").format(Number(value) || 0)} تومان`;
  } catch {
    return `${value ?? 0} تومان`;
  }
}

export default function CoachDashboardClient() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
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
    return () => {
      cancelled = true;
    };
  }, []);

  const statItems = useMemo(
    () => [
      {
        title: "تعداد دانشجویان",
        value: stats?.totalStudents ?? 0,
        hint: "همه دانشجویان مرتبط با شما",
      },
      {
        title: "اشتراک فعال",
        value: stats?.activeSubscriptions ?? 0,
        hint: "اشتراک‌های جاری",
      },
      {
        title: "فروش این ماه",
        value: stats?.monthlySales ?? 0,
        displayValue: formatToman(stats?.monthlySales),
        hint: "سفارش‌های پرداخت‌شده",
      },
    ],
    [stats]
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards
        items={statItems}
        loading={loading}
        className="@3xl/main:grid-cols-3"
      />
    </div>
  );
}
