"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiCopy, FiSend } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import {
  ACTIVITY_LEVELS,
  CALORIE_GOALS,
  calculateCaloriePlan,
} from "@/lib/tools/calorieCalculator";

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

export default function CalorieCalculatorClient() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [goal, setGoal] = useState("maintain");
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadStudents() {
      try {
        const res = await api.get("/coach/students", {
          params: { page: 1, pageSize: 100, status: "active" },
        });
        if (!cancelled) setStudents(res.data?.items || []);
      } catch {
        if (!cancelled) setStudents([]);
      }
    }
    loadStudents();
    return () => {
      cancelled = true;
    };
  }, []);

  const result = useMemo(() => {
    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);
    if (!ageNum || !heightNum || !weightNum) return null;
    return calculateCaloriePlan({
      age: ageNum,
      gender,
      heightCm: heightNum,
      weightKg: weightNum,
      activityLevel,
      goal,
    });
  }, [age, gender, heightCm, weightKg, activityLevel, goal]);

  const summaryText = result?.recommended
    ? `BMR: ${result.bmr?.toLocaleString("fa-IR")} | TDEE: ${result.tdee?.toLocaleString("fa-IR")} | کالری پیشنهادی: ${result.recommended.toLocaleString("fa-IR")} kcal`
    : "";

  const handleCopy = async () => {
    if (!result?.recommended) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  };

  const handleApplyToNutrition = () => {
    if (!selectedStudentId || !result?.recommended) return;
    router.push(
      `/coach/students/${selectedStudentId}/nutrition?calories=${result.recommended}`,
    );
  };

  const selectedActivity = ACTIVITY_LEVELS.find((l) => l.id === activityLevel);
  const selectedGoal = CALORIE_GOALS.find((g) => g.id === goal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white">محاسبه‌گر کالری</h1>
        <p className="mt-1 text-sm text-zinc-400">
          تخمین BMR و TDEE با فرمول Mifflin–St Jeor برای برنامه‌ریزی تغذیه شاگرد
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="سن (سال)">
              <input
                type="number"
                min={10}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="مثلاً ۲۸"
                className={inputClass}
              />
            </Field>

            <Field label="جنسیت">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              >
                <option value="male">مرد</option>
                <option value="female">زن</option>
              </select>
            </Field>

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

          <Field label="سطح فعالیت">
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className={inputClass}
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
            {selectedActivity ? (
              <p className="text-[11px] text-zinc-500">{selectedActivity.hint}</p>
            ) : null}
          </Field>

          <Field label="هدف">
            <div className="flex flex-wrap gap-2">
              {CALORIE_GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={cn(
                    "rounded-2xl border px-4 py-2 text-sm font-bold transition",
                    goal === g.id
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : "border-white/10 bg-zinc-950/30 text-zinc-300 hover:bg-white/5",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {selectedGoal && selectedGoal.adjustment !== 0 ? (
              <p className="text-[11px] text-zinc-500">
                {selectedGoal.adjustment > 0
                  ? `+${selectedGoal.adjustment} kcal نسبت به TDEE`
                  : `${selectedGoal.adjustment} kcal نسبت به TDEE`}
              </p>
            ) : null}
          </Field>
        </div>

        <div className="space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-linear-to-br from-emerald-400/10 to-cyan-400/5 p-5">
            <div className="text-sm font-bold text-zinc-400">نتیجه محاسبه</div>

            {result ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
                    <div className="text-[11px] text-zinc-500">BMR (متابولیسم پایه)</div>
                    <div className="mt-1 text-2xl font-extrabold text-white">
                      {result.bmr?.toLocaleString("fa-IR")}
                      <span className="mr-1 text-sm font-normal text-zinc-400">kcal</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
                    <div className="text-[11px] text-zinc-500">TDEE (مصرف روزانه)</div>
                    <div className="mt-1 text-2xl font-extrabold text-white">
                      {result.tdee?.toLocaleString("fa-IR")}
                      <span className="mr-1 text-sm font-normal text-zinc-400">kcal</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                  <div className="text-sm font-bold text-emerald-200/80">کالری پیشنهادی روزانه</div>
                  <div className="mt-2 text-4xl font-extrabold text-emerald-100">
                    {result.recommended.toLocaleString("fa-IR")}
                    <span className="mr-2 text-lg font-normal text-emerald-200/70">kcal</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
                  >
                    <FiCopy />
                    {copyDone ? "کپی شد" : "کپی نتیجه"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                سن، قد و وزن را وارد کنید تا نتیجه نمایش داده شود.
              </p>
            )}
          </div>

          {result?.recommended ? (
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="text-sm font-extrabold text-white">اعمال به برنامه غذایی شاگرد</div>
              <p className="text-[11px] text-zinc-500">
                کالری پیشنهادی در ویرایشگر برنامه غذایی شاگرد پیش‌پر می‌شود.
              </p>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className={inputClass}
              >
                <option value="">انتخاب شاگرد...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName || s.name || `شاگرد #${s.id}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplyToNutrition}
                disabled={!selectedStudentId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200 disabled:opacity-40"
              >
                <FiSend />
                باز کردن ویرایشگر غذا با این کالری
              </button>
              {students.length === 0 ? (
                <p className="text-[11px] text-zinc-500">
                  شاگرد فعالی یافت نشد.{" "}
                  <Link href="/coach/students" className="text-emerald-300 hover:underline">
                    مشاهده دانشجویان
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
