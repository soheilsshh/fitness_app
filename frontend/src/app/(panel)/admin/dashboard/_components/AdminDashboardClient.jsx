"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/axios/client";
import DashboardShell from "./DashboardShell";
import StatsGrid from "./StatsGrid";
import SalesChart from "./SalesChart";

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

  const statItems = [
    { title: "تعداد دوره‌های خریداری شده", value: stats?.purchasedCourses ?? 0, hint: `سال ${year}` },
    { title: "تعداد کاربران", value: stats?.totalUsers ?? 0, hint: "ثبت‌شده" },
    { title: "کاربران فعال", value: stats?.activeUsers ?? 0, hint: "اشتراک فعال" },
    { title: "تعداد مربی‌ها", value: stats?.totalCoaches ?? 0, hint: "کل مربی‌ها" },
    { title: "مربی‌های فعال", value: stats?.activeCoaches ?? 0, hint: "وضعیت فعال" },
  ];

  return (
    <DashboardShell>
      {loading ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
          در حال بارگذاری آمار...
        </div>
      ) : (
        <StatsGrid items={statItems} />
      )}

      <SalesChart
        year={year}
        years={years}
        onYearChange={setYear}
        data={monthly}
      />
    </DashboardShell>
  );
}
