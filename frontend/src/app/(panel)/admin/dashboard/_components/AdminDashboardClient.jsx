// src/app/(panel)/admin/dashboard/_components/AdminDashboardClient.jsx
"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import DashboardShell from "./DashboardShell";
import StatsGrid from "./StatsGrid";
import SalesChart from "./SalesChart";
import { getDashboardStats, getAvailableYears, getMonthlySales } from "./dashboardData";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function AdminDashboardClient() {
  const isClient = useIsClient();

  const years = useMemo(() => getAvailableYears(), []);
  const [year, setYear] = useState(years[0]);

  const stats = useMemo(() => {
    if (!isClient) return { purchasedCourses: 0, totalUsers: 0, activeUsers: 0 };
    return getDashboardStats({ year });
  }, [isClient, year]);

  const monthly = useMemo(() => {
    if (!isClient) return [];
    return getMonthlySales({ year });
  }, [isClient, year]);

  return (
    <DashboardShell >
      <StatsGrid
        items={[
          { title: "تعداد دوره‌های خریداری شده", value: stats.purchasedCourses, hint: "جمع کل" },
          { title: "تعداد کاربران", value: stats.totalUsers, hint: "ثبت‌شده" },
          { title: "تعداد کاربران فعال", value: stats.activeUsers, hint: "وضعیت Active" },
        ]}
      />

      <SalesChart
        year={year}
        years={years}
        onYearChange={setYear}
        data={monthly}
      />
    </DashboardShell>
  );
}
