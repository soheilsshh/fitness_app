"use client";

import { useId, useMemo } from "react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  dailyNutritionInsight,
  deriveMacroGramTargets,
  macroToKcal,
  parseProteinTargetGrams,
  rawTargetPercent,
} from "@/lib/nutrition/display";

const COLORS = {
  teal: "#2DD4BF",
  pink: "#FF00FF",
  orange: "#FB923C",
  green: "#4ADE80",
  purple: "#A855F7",
  cyan: "#22D3EE",
};

const NEON_SRC = "/nutrition/neon-icons.jpg";

const chartConfig = {
  calories: { label: "کالری", color: COLORS.green },
};

function faInt(value) {
  return Math.round(Number(value) || 0).toLocaleString("fa-IR");
}

function faPct(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("fa-IR")}٪`;
}

function jalaliDate(date) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function NeonIcon({ index, size = 40, label, className }) {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return (
    <span
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block shrink-0 bg-no-repeat", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${NEON_SRC})`,
        backgroundSize: "400% 300%",
        backgroundPosition: `${(col / 3) * 100}% ${(row / 2) * 100}%`,
        mixBlendMode: "screen",
      }}
    />
  );
}

function LastCalorieLabel({ x, y, index, value, lastIndex }) {
  if (Number(index) !== Number(lastIndex) || x == null || y == null) return null;
  const text = `${faInt(value)}`;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        x={-22}
        y={-26}
        width={44}
        height={18}
        rx={6}
        fill="#0B1220"
        stroke={COLORS.green}
        strokeWidth={1}
      />
      <text
        x={0}
        y={-13}
        textAnchor="middle"
        fill="#F8FAFC"
        fontSize={9}
        fontFamily="inherit"
      >
        {text}
      </text>
    </g>
  );
}

function CalorieRing({ percent }) {
  const size = 156;
  const stroke = 12;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const dash = (pct / 100) * c;
  const uid = useId();

  return (
    <div className="relative aspect-square w-27 @min-[420px]/main:w-34 @min-[640px]/main:w-39">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`${uid}-ring`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor={COLORS.teal} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(45,212,191,0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${uid}-ring)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="motion-reduce:transition-none"
          style={{
            transition: "stroke-dasharray 300ms ease-out",
            filter: "drop-shadow(0 0 10px rgba(45,212,191,0.75))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <p
          className="text-xl font-iranianSansBlack leading-none tabular-nums @min-[420px]/main:text-[28px] @min-[640px]/main:text-[32px]"
          style={{ color: COLORS.teal, textShadow: `0 0 12px ${COLORS.teal}88` }}
        >
          {faPct(pct)}
        </p>
        <p className="mt-0.5 text-[10px] text-white/55 @min-[420px]/main:mt-1 @min-[420px]/main:text-[11px]">
          از هدف
        </p>
      </div>
    </div>
  );
}

function MacroDonut({ carbsKcal, proteinKcal, fatKcal, totalKcal }) {
  const parts = [
    { key: "carbs", value: Math.max(0, carbsKcal), color: COLORS.purple },
    { key: "protein", value: Math.max(0, proteinKcal), color: COLORS.green },
    { key: "fat", value: Math.max(0, fatKcal), color: COLORS.orange },
  ];
  const sum = parts.reduce((acc, p) => acc + p.value, 0);
  const size = 168;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative mx-auto aspect-square w-32 @min-[640px]/main:w-42">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {sum > 0
          ? parts.map((p) => {
              const len = (p.value / sum) * c;
              const node = (
                <circle
                  key={p.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                  strokeDasharray={`${len} ${c}`}
                  strokeDashoffset={-offset}
                  style={{ filter: `drop-shadow(0 0 6px ${p.color})` }}
                />
              );
              offset += len;
              return node;
            })
          : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-lg font-iranianSansBlack tabular-nums text-white">
          {faInt(totalKcal)}
        </p>
        <p className="text-[10px] text-white/50">kcal</p>
      </div>
    </div>
  );
}

function MacroCard({ title, iconIndex, color, grams, kcal, targetG }) {
  const pct = rawTargetPercent(grams, targetG) ?? 0;
  const bar = Math.min(100, Math.max(0, pct));

  return (
    <div className="rounded-2xl border border-white/8 bg-[#121A2C] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <NeonIcon index={iconIndex} size={20} />
          <p className="truncate text-xs font-iranianSansDemiBold" style={{ color }}>
            {title}
          </p>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color }}>
          {targetG > 0 ? faPct(pct) : "—"}
        </span>
      </div>
      <p className="mt-1.5 text-xl font-iranianSansBlack leading-none tabular-nums text-white">
        {faInt(grams)}
        <span className="ms-1 text-xs font-iranianSansMedium text-white/50">g</span>
        <span className="ms-2 text-[11px] font-iranianSansMedium text-white/45">
          {faInt(kcal)} kcal
        </span>
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full motion-reduce:transition-none"
          style={{
            width: `${bar}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            transition: "width 300ms ease-out",
          }}
        />
      </div>
      <p className="mt-1 text-[10px] text-white/45">
        {targetG > 0 ? `از ${faInt(targetG)} گرم` : "هدف ثبت نشده"}
      </p>
    </div>
  );
}

export default function NutritionAnalysisDashboard({
  date,
  totals,
  targets,
  weekSeries = [],
  loading,
}) {
  const proteinTargetG = parseProteinTargetGrams(targets?.proteinTarget);
  const derived = deriveMacroGramTargets(targets?.caloriesTarget, proteinTargetG);
  const calories = Number(totals?.calories) || 0;
  const protein = Number(totals?.protein) || 0;
  const carbs = Number(totals?.carbs) || 0;
  const fat = Number(totals?.fat) || 0;
  const caloriePct = rawTargetPercent(calories, derived.calories) ?? 0;
  const carbsKcal = macroToKcal(carbs, "carbs");
  const proteinKcal = macroToKcal(protein, "protein");
  const fatKcal = macroToKcal(fat, "fat");
  const macroKcalTotal = carbsKcal + proteinKcal + fatKcal;
  const insight = dailyNutritionInsight({
    calories,
    protein,
    targets: derived,
  });

  const donutLegend = useMemo(() => {
    const total = macroKcalTotal || 1;
    return [
      { label: "کربوهیدرات", color: COLORS.purple, pct: Math.round((carbsKcal / total) * 100) },
      { label: "پروتئین", color: COLORS.green, pct: Math.round((proteinKcal / total) * 100) },
      { label: "چربی", color: COLORS.orange, pct: Math.round((fatKcal / total) * 100) },
    ];
  }, [carbsKcal, proteinKcal, fatKcal, macroKcalTotal]);

  const yMax = useMemo(() => {
    const peak = Math.max(
      derived.calories || 0,
      ...weekSeries.map((row) => Number(row.calories) || 0),
      400
    );
    return Math.ceil(peak / 400) * 400;
  }, [derived.calories, weekSeries]);

  const lastWeekIndex = Math.max(0, weekSeries.length - 1);

  if (loading) {
    return (
      <div className="space-y-4 rounded-[24px] border border-white/10 bg-[#0B1220] p-5 md:p-6">
        <Skeleton className="h-16 w-full rounded-2xl bg-white/10" />
        <Skeleton className="h-40 w-full rounded-2xl bg-white/10" />
        <Skeleton className="h-28 w-full rounded-2xl bg-white/10" />
      </div>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-white/8 bg-[#0B1220] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-6"
      dir="rtl"
      aria-label="آنالیز تغذیه"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-start">
          <h3 className="flex items-center justify-start gap-2 text-xl font-iranianSansBlack leading-none md:text-2xl">
            <NeonIcon index={7} size={22} />
            آنالیز تغذیه
          </h3>
          <p className="mt-2 flex items-center justify-start gap-1.5 text-sm text-white/55">
            <NeonIcon index={3} size={16} />
            <span className="tabular-nums">{jalaliDate(date)}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#2DD4BF]/70 px-3 py-0.5 text-[10px] font-iranianSansDemiBold tracking-[0.18em] text-[#2DD4BF] shadow-[0_0_12px_rgba(45,212,191,0.35)]">
          NUTRITION
        </span>
      </header>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 @min-[480px]/main:gap-x-4">
        <div className="min-w-0 text-center @min-[480px]/main:text-start">
          <p className="flex items-center justify-center gap-1 text-[10px] leading-none text-white/50 @min-[480px]/main:justify-start @min-[480px]/main:gap-1.5 @min-[480px]/main:text-xs">
            <NeonIcon index={1} size={16} />
            هدف روزانه
          </p>
          <p className="mt-1.5 @min-[480px]/main:mt-1">
            <span className="block text-lg font-iranianSansBlack leading-none tabular-nums @min-[480px]/main:inline @min-[480px]/main:text-2xl @min-[768px]/main:text-[32px]">
              {derived.calories > 0 ? faInt(derived.calories) : "—"}
            </span>
            <span className="mt-0.5 inline-block text-[10px] font-iranianSansMedium text-white/45 @min-[480px]/main:ms-1 @min-[480px]/main:mt-0 @min-[480px]/main:text-sm">
              kcal
            </span>
          </p>
        </div>
        <div className="flex shrink-0 justify-center px-0.5 @min-[480px]/main:px-1">
          <CalorieRing percent={derived.calories > 0 ? Math.min(100, caloriePct) : 0} />
        </div>
        <div className="min-w-0 text-center @min-[480px]/main:text-end">
          <p className="flex items-center justify-center gap-1 text-[10px] leading-none text-white/50 @min-[480px]/main:justify-end @min-[480px]/main:gap-1.5 @min-[480px]/main:text-xs">
            <NeonIcon index={2} size={16} />
            مصرف شده
          </p>
          <p className="mt-1.5 @min-[480px]/main:mt-1">
            <span className="block text-lg font-iranianSansBlack leading-none tabular-nums @min-[480px]/main:inline @min-[480px]/main:text-2xl @min-[768px]/main:text-[32px]">
              {faInt(calories)}
            </span>
            <span className="mt-0.5 inline-block text-[10px] font-iranianSansMedium text-white/45 @min-[480px]/main:ms-1 @min-[480px]/main:mt-0 @min-[480px]/main:text-sm">
              kcal
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 @min-[560px]/main:grid-cols-3 @min-[560px]/main:gap-3">
        <MacroCard
          title="کربوهیدرات"
          iconIndex={4}
          color={COLORS.purple}
          grams={carbs}
          kcal={carbsKcal}
          targetG={derived.carbsG}
        />
        <MacroCard
          title="پروتئین"
          iconIndex={5}
          color={COLORS.green}
          grams={protein}
          kcal={proteinKcal}
          targetG={derived.proteinG}
        />
        <MacroCard
          title="چربی"
          iconIndex={6}
          color={COLORS.orange}
          grams={fat}
          kcal={fatKcal}
          targetG={derived.fatG}
        />
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-4 py-3">
        <NeonIcon index={10} size={28} className="mt-0.5 shrink-0" />
        <div className="min-w-0 text-start">
          <p className="text-sm font-iranianSansDemiBold text-[#86EFAC]">
            {insight.headline}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">{insight.detail}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-[#101827] px-4 py-4 md:px-5">
        <h4 className="text-start text-sm font-iranianSansDemiBold">تحلیل تغذیه</h4>
        <div className="mt-4 grid gap-6 @min-[640px]/main:grid-cols-2">
          <div>
            <div className="flex flex-col items-center justify-center gap-4">
              <MacroDonut
                carbsKcal={carbsKcal}
                proteinKcal={proteinKcal}
                fatKcal={fatKcal}
                totalKcal={calories}
              />
              <ul className="flex flex-col items-center gap-2 text-xs">
                {donutLegend.map((row) => (
                  <li key={row.label} className="flex items-center justify-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: row.color, boxShadow: `0 0 8px ${row.color}` }}
                    />
                    <span className="text-white/70">{row.label}</span>
                    <span className="tabular-nums text-white/90">
                      {macroKcalTotal > 0 ? faPct(row.pct) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <table className="sr-only">
              <caption>توزیع کالری درشت‌مغذی‌ها</caption>
              <tbody>
                {donutLegend.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{macroKcalTotal > 0 ? faPct(row.pct) : "صفر"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mb-2 flex items-center justify-center gap-2 text-[11px] text-white/50">
              <NeonIcon index={9} size={16} />
              روند ۷ روز
            </p>
            {derived.calories > 0 ? (
              <p className="mb-2 text-center text-[10px] tabular-nums text-white/45">
                خط‌چین = هدف {faInt(derived.calories)} kcal
              </p>
            ) : null}
            {weekSeries.length ? (
              <ChartContainer
                config={chartConfig}
                className="h-36 w-full overflow-hidden @min-[640px]/main:h-50 [&_.recharts-cartesian-axis-tick_text]:fill-white/45"
                dir="ltr"
              >
                <LineChart
                  data={weekSeries}
                  margin={{ top: 22, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  />
                  <YAxis hide domain={[0, yMax]} />
                  {derived.calories > 0 ? (
                    <ReferenceLine
                      y={derived.calories}
                      stroke={COLORS.teal}
                      strokeDasharray="6 4"
                    />
                  ) : null}
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`${faInt(value)} kcal`, "کالری"]}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: COLORS.green,
                      stroke: "#0B1220",
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 5, fill: COLORS.green }}
                  >
                    <LabelList
                      dataKey="calories"
                      content={(props) => (
                        <LastCalorieLabel {...props} lastIndex={lastWeekIndex} />
                      )}
                    />
                  </Line>
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-xs text-white/55">
                داده‌ای برای روند هفتگی نیست.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-white/55">
        اطلاعات بر اساس ورودی‌های شما محاسبه شده است.
      </p>
    </section>
  );
}
