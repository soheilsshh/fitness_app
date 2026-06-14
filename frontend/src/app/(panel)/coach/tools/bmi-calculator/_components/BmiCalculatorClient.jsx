"use client";

import { useMemo, useState } from "react";
import { FiCopy } from "react-icons/fi";
import {
  BMI_CATEGORIES,
  BMI_SCALE_MAX,
  BMI_SCALE_MIN,
  calculateBmiResult,
} from "@/lib/tools/bmiCalculator";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40";

const SEGMENT_COLORS = {
  underweight: "bg-sky-400/80",
  normal: "bg-emerald-400/80",
  overweight: "bg-amber-400/80",
  obese: "bg-rose-400/80",
};

const BADGE_COLORS = {
  underweight: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  normal: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  overweight: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  obese: "border-rose-400/40 bg-rose-400/10 text-rose-100",
};

function segmentWidth(min, max) {
  const range = BMI_SCALE_MAX - BMI_SCALE_MIN;
  const start = Math.max(min, BMI_SCALE_MIN);
  const end = Math.min(max === Infinity ? BMI_SCALE_MAX : max, BMI_SCALE_MAX);
  return ((end - start) / range) * 100;
}

function segmentOffset(min) {
  const range = BMI_SCALE_MAX - BMI_SCALE_MIN;
  const start = Math.max(min, BMI_SCALE_MIN);
  return ((start - BMI_SCALE_MIN) / range) * 100;
}

function BmiScaleBar({ bmi, scalePosition, activeCategoryId }) {
  return (
    <div className="space-y-3">
      <div className="relative h-4 overflow-hidden rounded-full border border-white/10 bg-zinc-950/50">
        {BMI_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              "absolute top-0 h-full",
              SEGMENT_COLORS[cat.id],
              activeCategoryId === cat.id ? "opacity-100" : "opacity-70",
            )}
            style={{
              left: `${segmentOffset(cat.min)}%`,
              width: `${segmentWidth(cat.min, cat.max)}%`,
            }}
          />
        ))}

        {scalePosition != null ? (
          <div
            className="absolute top-1/2 z-10 h-6 w-1 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
            style={{ left: `calc(${scalePosition}% - 2px)` }}
            title={`BMI: ${bmi}`}
          />
        ) : null}
      </div>

      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>{BMI_SCALE_MIN}</span>
        <span>۱۸.۵</span>
        <span>۲۵</span>
        <span>۳۰</span>
        <span>{BMI_SCALE_MAX}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BMI_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              "rounded-xl border px-2 py-2 text-center text-[11px] font-bold transition",
              activeCategoryId === cat.id
                ? BADGE_COLORS[cat.id]
                : "border-white/5 bg-zinc-950/20 text-zinc-500",
            )}
          >
            <span
              className={cn(
                "mx-auto mb-1 block h-2 w-2 rounded-full",
                SEGMENT_COLORS[cat.id],
              )}
            />
            {cat.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BmiCalculatorClient() {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [copyDone, setCopyDone] = useState(false);

  const result = useMemo(() => {
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);
    if (!heightNum || !weightNum) return null;
    return calculateBmiResult(weightNum, heightNum);
  }, [heightCm, weightKg]);

  const summaryText = result
    ? `BMI: ${result.bmi.toLocaleString("fa-IR")} — ${result.category?.label || ""}`
    : "";

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white">محاسبه‌گر BMI</h1>
        <p className="mt-1 text-sm text-zinc-400">
          شاخص توده بدنی (وزن ÷ قد²) برای ارزیابی سریع وضعیت وزنی شاگرد
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="قد (سانتی‌متر)">
              <input
                type="number"
                min={100}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="مثلاً ۱۷۵"
                className={inputClass}
              />
            </Field>

            <Field label="وزن (کیلوگرم)">
              <input
                type="number"
                min={30}
                max={300}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="مثلاً ۷۵"
                className={inputClass}
              />
            </Field>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-500">
            فرمول: BMI = وزن (kg) ÷ [قد (m)]² — دسته‌بندی بر اساس استاندارد WHO برای
            بزرگسالان.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-linear-to-br from-cyan-400/10 to-emerald-400/5 p-5">
            <div className="text-sm font-bold text-zinc-400">نتیجه محاسبه</div>

            {result ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <div className="text-[11px] text-zinc-500">شاخص BMI</div>
                    <div className="text-5xl font-extrabold text-white">
                      {result.bmi.toLocaleString("fa-IR")}
                    </div>
                  </div>

                  {result.category ? (
                    <span
                      className={cn(
                        "rounded-2xl border px-4 py-2 text-sm font-extrabold",
                        BADGE_COLORS[result.category.id],
                      )}
                    >
                      {result.category.label}
                    </span>
                  ) : null}
                </div>

                {result.category?.hint ? (
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {result.category.hint}
                  </p>
                ) : null}

                <BmiScaleBar
                  bmi={result.bmi}
                  scalePosition={result.scalePosition}
                  activeCategoryId={result.category?.id}
                />

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
                >
                  <FiCopy />
                  {copyDone ? "کپی شد" : "کپی نتیجه"}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                قد و وزن را وارد کنید تا BMI و وضعیت نمایش داده شود.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
