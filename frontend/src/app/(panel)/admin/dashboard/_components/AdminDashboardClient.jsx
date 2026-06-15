"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/axios/client";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

const CURRENT_YEAR = new Date().getFullYear();

export default function AdminDashboardClient() {
  const years = useMemo(() => {
    const y = CURRENT_YEAR;
    return [y, y - 1, y - 2];
  }, []);

  const [year, setYear] = useState(CURRENT_YEAR);
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [statsRes, monthlyRes] = await Promise.all([
          api.get("/admin/dashboard/stats", { params: { year } }),
          api.get("/admin/dashboard/monthly-sales", { params: { year } }),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setMonthly(monthlyRes.data || []);
      } catch {
        if (!cancelled) {
          setStats(null);
          setMonthly([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const statItems = useMemo(
    () => [
      {
        title: "تعداد دوره‌های خریداری شده",
        value: stats?.purchasedCourses ?? 0,
        hint: `سال ${year}`,
      },
      {
        title: "تعداد کاربران",
        value: stats?.totalUsers ?? 0,
        hint: "ثبت‌شده",
      },
      {
        title: "کاربران فعال",
        value: stats?.activeUsers ?? 0,
        hint: "اشتراک فعال",
      },
      {
        title: "تعداد مربی‌ها",
        value: stats?.totalCoaches ?? 0,
        hint: "کل مربی‌ها",
      },
      {
        title: "مربی‌های فعال",
        value: stats?.activeCoaches ?? 0,
        hint: "وضعیت فعال",
      },
    ],
    [stats, year]
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards items={statItems} loading={loading} />

      <ChartAreaInteractive
        data={monthly}
        loading={loading}
        year={year}
        years={years}
        onYearChange={setYear}
      />
    </div>
  );
}
