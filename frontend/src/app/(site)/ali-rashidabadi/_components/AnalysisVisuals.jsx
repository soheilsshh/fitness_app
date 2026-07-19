"use client";

import { motion } from "framer-motion";
import { Flame, Gauge, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const faNum = new Intl.NumberFormat("fa-IR");

/* -------------------------------------------------------------------------- */
/*  Body-type showcase (Ectomorph / Mesomorph / Endomorph) — mock colors       */
/* -------------------------------------------------------------------------- */

const BODY_TYPES = [
  {
    key: "ectomorph",
    en: "ECTOMORPH",
    fa: "اکتومورف",
    desc: "ساختار بلند و باریک",
    metaLabel: "متابولیسم",
    metaValue: "سریع",
    chartLabel: "Fuel efficiency",
    color: "#3cc9f5",
    image: "/body-types/ectomorph.png",
    trend: [8, 16, 22, 30, 34, 46, 52, 66, 82],
  },
  {
    key: "mesomorph",
    en: "MESOMORPH",
    fa: "مزومورف",
    desc: "ساختار عضلانی و شکل V",
    metaLabel: "ساختار",
    metaValue: "عضله‌سازی کارآمد",
    chartLabel: "Anabolic rate",
    color: "#3ee27f",
    image: "/body-types/mesomorph.png",
    trend: [14, 26, 40, 48, 60, 66, 74, 80, 86],
  },
  {
    key: "endomorph",
    en: "ENDOMORPH",
    fa: "اندومورف",
    desc: "ساختار پهن و نرم",
    metaLabel: "متابولیسم",
    metaValue: "آهسته‌تر",
    chartLabel: "Storage potential",
    color: "#ff8a3c",
    image: "/body-types/endomorph.png",
    trend: [30, 52, 66, 74, 79, 82, 84, 85, 86],
  },
];

export function resolveBodyTypeKey(bodyType = "") {
  if (bodyType.includes("اکتومورف")) return "ectomorph";
  if (bodyType.includes("اندومورف")) return "endomorph";
  if (bodyType.includes("مزومورف")) return "mesomorph";
  return "mesomorph";
}

function BodyFigure({ type, active }) {
  const glow = active
    ? `drop-shadow(0 0 8px ${type.color}) drop-shadow(0 0 18px ${type.color}66)`
    : "none";

  return (
    <div
      className="relative mx-auto mt-2 flex h-44 w-full items-end justify-center md:h-52"
      style={{ filter: glow, opacity: active ? 1 : 0.42, transition: "all .35s ease" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={type.image}
        alt={type.fa}
        className={cn(
          "h-full w-auto max-w-full object-contain object-bottom transition duration-300",
          !active && "grayscale"
        )}
        draggable={false}
      />
    </div>
  );
}

function Sparkline({ trend, color, active }) {
  const w = 120;
  const h = 46;
  const max = Math.max(...trend);
  const min = Math.min(...trend);
  const span = max - min || 1;
  const pts = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * (w - 10) + 5;
    const y = h - 6 - ((v - min) / span) * (h - 14);
    return [x, y];
  });
  const line = pts
    .map((pt, i) => `${i ? "L" : "M"} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`;
  const stroke = active ? color : "#5b6472";
  const [ex, ey] = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-full" fill="none">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={active ? 0.3 : 0.1} />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${color.replace("#", "")})`} />
      <path
        d={line}
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: active ? `drop-shadow(0 0 4px ${color}aa)` : "none" }}
      />
      <circle
        cx={ex}
        cy={ey}
        r={3}
        fill={stroke}
        style={{ filter: active ? `drop-shadow(0 0 5px ${color})` : "none" }}
      />
    </svg>
  );
}

function BodyTypeShowcase({ selectedKey }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 md:p-5">
      <p className="mb-4 text-center text-sm font-bold text-white/85">تیپ‌های بدنی اصلی</p>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {BODY_TYPES.map((type, i) => {
          const active = type.key === selectedKey;
          return (
            <motion.div
              key={type.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={cn(
                "relative flex flex-col items-center rounded-2xl border px-1.5 py-3 text-center transition md:px-2",
                active ? "border-white/25 bg-white/[0.06]" : "border-white/[0.06] bg-transparent"
              )}
              style={
                active
                  ? {
                      boxShadow: `0 0 30px -14px ${type.color}, inset 0 0 22px -18px ${type.color}`,
                    }
                  : undefined
              }
            >
              {active && (
                <span
                  className="absolute -top-2 right-1/2 translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-black"
                  style={{ background: type.color }}
                >
                  تحلیل شما
                </span>
              )}
              <span
                className="text-[10px] font-black tracking-[0.12em] md:text-xs"
                style={{ color: active ? type.color : "#7a828e" }}
              >
                {type.en}
              </span>

              <BodyFigure type={type} active={active} />

              <span
                className="mt-1 inline-block size-1.5 rounded-full"
                style={{ background: active ? type.color : "#5b6472" }}
              />

              <span className={cn("mt-1 text-sm font-extrabold", active ? "text-white" : "text-white/45")}>
                {type.fa}
              </span>
              <span className={cn("mt-0.5 text-[10px] leading-4", active ? "text-white/65" : "text-white/30")}>
                {type.desc}
              </span>
              <span className={cn("mt-1 text-[9px]", active ? "text-white/45" : "text-white/25")}>
                {type.metaLabel}: {type.metaValue}
              </span>

              <div
                className="mt-2 w-full rounded-lg border bg-black/40 px-1.5 pt-1.5"
                style={{ borderColor: active ? `${type.color}44` : "rgba(255,255,255,0.08)" }}
              >
                <span
                  dir="ltr"
                  className="block text-[9px] font-medium"
                  style={{ color: active ? type.color : "#7a828e" }}
                >
                  {type.chartLabel}
                </span>
                <Sparkline trend={type.trend} color={type.color} active={active} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  12-week trend chart (mock: green declining area, weeks, % axis, target)    */
/* -------------------------------------------------------------------------- */

const GREEN = "#3ee27f";

const TREND_BY_SCENARIO = {
  // A: weight loss — excess fat % falling toward target
  A: {
    title: "پیش‌بینی روند ۱۲ هفته کاهش چربی فعال (چربی‌سوزی فعال)",
    yLabel: "درصد چربی تخمینی بدن (وزن)",
    values: [40, 34, 30, 27, 24, 21, 19, 16, 13, 10, 6, 2],
    yMax: 40,
  },
  // B: muscle gain — lean mass progress rising
  B: {
    title: "پیش‌بینی روند ۱۲ هفته عضله‌سازی فعال (هایپرتروفی)",
    yLabel: "پیشرفت حجم عضلانی (٪)",
    values: [4, 9, 14, 18, 22, 26, 29, 32, 35, 37, 39, 40],
    yMax: 40,
  },
  // C: fitness — conditioning score rising
  C: {
    title: "پیش‌بینی روند ۱۲ هفته فرم‌دهی و آمادگی بدنی",
    yLabel: "امتیاز فرم و آمادگی (٪)",
    values: [6, 11, 16, 20, 24, 27, 30, 33, 35, 37, 39, 40],
    yMax: 40,
  },
};

function TrendChart({ scenario }) {
  const conf = TREND_BY_SCENARIO[scenario] || TREND_BY_SCENARIO.A;
  const W = 340;
  const H = 168;
  const plot = { x0: 36, x1: 330, y0: 10, y1: 128 };
  const n = conf.values.length;

  const pts = conf.values.map((v, i) => {
    const x = plot.x0 + (i / (n - 1)) * (plot.x1 - plot.x0);
    const y = plot.y1 - (v / conf.yMax) * (plot.y1 - plot.y0);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[n - 1][0].toFixed(1)} ${plot.y1} L ${pts[0][0].toFixed(1)} ${plot.y1} Z`;
  const ticks = [0, 5, 10, 15, 20, 25, 30, 35, 40];
  const [tx, ty] = pts[n - 1];
  const badgeAbove = ty > 46;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-white/70">{conf.title}</p>
      <div className="rounded-2xl border border-white/10 bg-black/35 p-2">
        <svg dir="ltr" viewBox={`0 0 ${W} ${H}`} className="w-full" fill="none">
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity="0.45" />
              <stop offset="100%" stopColor={GREEN} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* grid + y ticks */}
          {ticks.map((t) => {
            const y = plot.y1 - (t / conf.yMax) * (plot.y1 - plot.y0);
            return (
              <g key={t}>
                <line
                  x1={plot.x0}
                  y1={y}
                  x2={plot.x1}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />
                <text
                  x={plot.x0 - 4}
                  y={y + 2.5}
                  textAnchor="end"
                  fontSize="7"
                  fill="rgba(255,255,255,0.45)"
                >
                  {t}%
                </text>
              </g>
            );
          })}

          {/* y-axis label (vertical) */}
          <text
            x={8}
            y={(plot.y0 + plot.y1) / 2}
            fontSize="7"
            fill="rgba(255,255,255,0.4)"
            transform={`rotate(-90 8 ${(plot.y0 + plot.y1) / 2})`}
            textAnchor="middle"
          >
            {conf.yLabel}
          </text>

          {/* area + line */}
          <path d={area} fill="url(#trend-fill)" />
          <path
            d={line}
            stroke={GREEN}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 5px ${GREEN}88)` }}
          />

          {/* dots */}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={i === n - 1 ? 4 : 2.6}
              fill={GREEN}
              stroke="#0e0e0e"
              strokeWidth="1"
              style={i === n - 1 ? { filter: `drop-shadow(0 0 6px ${GREEN})` } : undefined}
            />
          ))}

          {/* Target Achieve badge near the last point */}
          <g transform={`translate(${Math.min(tx - 66, W - 78)} ${badgeAbove ? ty - 36 : ty - 46})`}>
            <rect
              width="64"
              height="15"
              rx="7.5"
              fill="#0e0e0e"
              stroke={GREEN}
              strokeWidth="1"
            />
            <text x="32" y="10.5" textAnchor="middle" fontSize="8" fontWeight="700" fill={GREEN}>
              Target Achieve
            </text>
          </g>

          {/* target ring around last point */}
          <circle cx={tx} cy={ty} r="9" stroke={GREEN} strokeWidth="1.4" opacity="0.8" />
          <circle cx={tx} cy={ty} r="13" stroke={GREEN} strokeWidth="1" opacity="0.35" />

          {/* x labels */}
          {conf.values.map((_, i) => {
            const x = plot.x0 + (i / (n - 1)) * (plot.x1 - plot.x0);
            return (
              <text
                key={i}
                x={x}
                y={H - 26}
                textAnchor="middle"
                fontSize="6.5"
                fill="rgba(255,255,255,0.45)"
              >
                {`Week ${i + 1}`}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pentagon radar — "پروفیل بیومکانیک بدن (مقایسه نسبی)"                       */
/* -------------------------------------------------------------------------- */

function RadarChart({ bars }) {
  const data = (bars || []).slice(0, 5);
  const count = data.length;
  if (count < 3) return null;

  const W = 340;
  const H = 260;
  const cx = W / 2;
  const cy = H / 2 + 4;
  const R = 88;
  const levels = [0.25, 0.5, 0.75, 1];

  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / count;
  const point = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  const ring = (f) =>
    data.map((_, i) => point(i, R * f).map((v) => v.toFixed(1)).join(",")).join(" ");

  const valuePoly = data
    .map((d, i) => point(i, (d.value / 100) * R).map((v) => v.toFixed(1)).join(","))
    .join(" ");

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-white/70">پروفیل بیومکانیک بدن (مقایسه نسبی)</p>
      <div className="rounded-2xl border border-white/10 bg-black/35 p-2">
        <svg dir="ltr" viewBox={`0 0 ${W} ${H}`} className="w-full" fill="none">
          {/* grid rings */}
          {levels.map((f) => (
            <polygon key={f} points={ring(f)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          ))}
          {/* spokes */}
          {data.map((_, i) => {
            const [x, y] = point(i, R);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            );
          })}

          {/* value polygon */}
          <polygon
            points={valuePoly}
            fill={`${GREEN}2e`}
            stroke={GREEN}
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${GREEN}77)` }}
          />
          {data.map((d, i) => {
            const [x, y] = point(i, (d.value / 100) * R);
            return (
              <circle
                key={d.label}
                cx={x}
                cy={y}
                r="3.4"
                fill={GREEN}
                stroke="#0e0e0e"
                strokeWidth="1"
                style={{ filter: `drop-shadow(0 0 4px ${GREEN})` }}
              />
            );
          })}

          {/* labels + % */}
          {data.map((d, i) => {
            const [x, y] = point(i, R + 24);
            return (
              <g key={d.label}>
                <text
                  x={x}
                  y={y - 3}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="rgba(255,255,255,0.85)"
                >
                  {d.label}
                </text>
                <text x={x} y={y + 9} textAnchor="middle" fontSize="9" fill={GREEN}>
                  {faNum.format(d.value)}٪
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Metric cards with fixed dedicated icons                                    */
/* -------------------------------------------------------------------------- */

const METRIC_ICONS = {
  flame: { Icon: Flame, color: "#fb923c", ring: "border-orange-400/30", bg: "bg-orange-500/10" },
  chart: { Icon: Gauge, color: "#3cc9f5", ring: "border-sky-400/30", bg: "bg-sky-500/10" },
  target: { Icon: Target, color: "#3ee27f", ring: "border-emerald-400/30", bg: "bg-emerald-500/10" },
};

function MetricCards({ highlights }) {
  const metrics = highlights.filter((h) => h.icon !== "body");
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {metrics.map((h, i) => {
        const conf = METRIC_ICONS[h.icon] || METRIC_ICONS.chart;
        const { Icon } = conf;
        return (
          <motion.div
            key={h.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/30 p-3 text-center"
          >
            <span
              className={cn(
                "mb-2 inline-flex size-9 items-center justify-center rounded-xl border",
                conf.ring,
                conf.bg
              )}
            >
              <Icon className="size-[18px]" style={{ color: conf.color }} />
            </span>
            <span className="text-[10px] leading-4 text-white/45">{h.label}</span>
            <span className="mt-1 text-sm font-extrabold text-white">{h.value}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function AnalysisVisuals({ analysis }) {
  const selectedKey = resolveBodyTypeKey(analysis?.bodyType || "");
  return (
    <div className="space-y-5">
      <MetricCards highlights={analysis.highlights} />
      <BodyTypeShowcase selectedKey={selectedKey} />
      <TrendChart scenario={analysis.scenario} />
      <RadarChart bars={analysis.chartBars} />
    </div>
  );
}
