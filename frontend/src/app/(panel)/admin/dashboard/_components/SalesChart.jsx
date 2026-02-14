"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import YearSelect from "./YearSelect";

function formatNumber(v) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(v) || 0);
  } catch {
    return String(v ?? 0);
  }
}

function TooltipBox({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const sales = payload.find((p) => p.dataKey === "sales")?.value ?? 0;
  const courses = payload.find((p) => p.dataKey === "courses")?.value ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-100 shadow-lg">
      <div className="font-extrabold">{label}</div>
      <div className="mt-1 text-zinc-300">فروش: {formatNumber(sales)}</div>
      <div className="text-zinc-300">تعداد خرید: {formatNumber(courses)}</div>
    </div>
  );
}

export default function SalesChart({ year, years, onYearChange, data }) {
  const totalSales = (data || []).reduce((acc, x) => acc + (Number(x.sales) || 0), 0);
  const totalCourses = (data || []).reduce((acc, x) => acc + (Number(x.courses) || 0), 0);

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">فروش دوره‌ها در ماه‌های سال</div>
          <div className="mt-1 text-sm text-zinc-300">سال انتخاب‌شده: {year}</div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-300">
            <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1">
              مجموع فروش: {formatNumber(totalSales)}
            </span>
            <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1">
              مجموع خرید: {formatNumber(totalCourses)}
            </span>
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-300">
          نمودار ماهانه
        </span>
      </div>

      {/* Chart wrapper: horizontal scroll on small screens */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
        <div className="relative max-md:overflow-x-auto">
          {/* The inner chart gets a min width; on mobile it will scroll */}
          <div className="relative h-75 min-w-180  ">
            {/* YearSelect positioned over the chart area */}
            <div className="absolute right-3 top-3 z-20">
              <YearSelect years={years} value={year} onChange={onYearChange} />
            </div>

            {!data || data.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                داده‌ای برای نمایش وجود ندارد.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{
                    top: 16,
                    right: 8, 
                    left: 28,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickMargin={8}
                  />

                  {/* ✅ YAxis right side with spacing */}
                  <YAxis
         
                    width={56}        
                    tickMargin={-10}   
                    mirror={true}     
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip content={<TooltipBox />} />

                  <Area type="monotone" dataKey="sales" strokeWidth={2}  />
                  <Area type="monotone" dataKey="courses" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="mt-3 text-[11px] text-zinc-500">
          در موبایل می‌توانید نمودار را افقی اسکرول کنید.
        </div>
      </div>
    </div>
  );
}
