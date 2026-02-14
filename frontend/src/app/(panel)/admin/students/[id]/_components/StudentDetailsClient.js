"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  FiChevronLeft,
  FiPhone,
  FiClipboard,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiSave,
  FiMoon,
  FiPlus,
  FiX,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";
import { mockStudents } from "../../_components/studentsMock";
import { loadStudentPlan, saveStudentPlan } from "./storage";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

const DAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

export default function StudentDetailsClient({ id }) {
  const student = useMemo(() => mockStudents.find((s) => s.id === id), [id]);

  const [selectedDay, setSelectedDay] = useState("شنبه");
  const [saving, setSaving] = useState(false);

  const [restDays, setRestDays] = useState([]);

  const [workoutInput, setWorkoutInput] = useState("");
  const [workoutSteps, setWorkoutSteps] = useState([]);

  const [nutritionInput, setNutritionInput] = useState("");
  const [nutritionItems, setNutritionItems] = useState([]);

  // Nutrition targets per day
  const [caloriesTarget, setCaloriesTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");

  // NEW: student status (pending=در انتظار | active=موفق)
  const [studentStatus, setStudentStatus] = useState("pending");

  const canWriteWorkout = true;
  const canWriteNutrition = true;

  const isRestDay = (day) => restDays.includes(day);

  useEffect(() => {
    if (!id || !student) return;

    const saved = loadStudentPlan(id);

    const baseRest = Array.isArray(student.restDays) ? student.restDays : [];
    const savedRest = Array.isArray(saved?.restDays) ? saved.restDays : null;
    const mergedRest = savedRest ?? baseRest;

    setRestDays(mergedRest);

    const day = saved?.selectedDay || "شنبه";
    setSelectedDay(day);

    const perDay = saved?.days?.[day] || {};
    setWorkoutSteps(
      Array.isArray(perDay.workoutSteps) ? perDay.workoutSteps : [],
    );
    setNutritionItems(
      Array.isArray(perDay.nutritionItems) ? perDay.nutritionItems : [],
    );

    setCaloriesTarget(perDay.caloriesTarget ?? "");
    setProteinTarget(perDay.proteinTarget ?? "");

    // NEW: status from saved plan (fallback to mock student)
    setStudentStatus(saved?.status || student.status || "pending");
  }, [id, student]);

  useEffect(() => {
    if (!id) return;

    const saved = loadStudentPlan(id);
    const perDay = saved?.days?.[selectedDay] || {};

    setWorkoutInput("");
    setNutritionInput("");

    setWorkoutSteps(
      Array.isArray(perDay.workoutSteps) ? perDay.workoutSteps : [],
    );
    setNutritionItems(
      Array.isArray(perDay.nutritionItems) ? perDay.nutritionItems : [],
    );

    setCaloriesTarget(perDay.caloriesTarget ?? "");
    setProteinTarget(perDay.proteinTarget ?? "");
  }, [id, selectedDay]);

  if (!student) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        شاگرد پیدا نشد.
      </div>
    );
  }

  const handleAddWorkout = () => {
    const v = workoutInput.trim();
    if (!v) return;
    setWorkoutSteps((arr) => [...arr, v]);
    setWorkoutInput("");
  };

  const handleAddNutrition = () => {
    const v = nutritionInput.trim();
    if (!v) return;
    setNutritionItems((arr) => [...arr, v]);
    setNutritionInput("");
  };

  const handleToggleRestDay = async (day) => {
    const willRest = !restDays.includes(day);

    const current = loadStudentPlan(id) || { days: {} };
    const daysObj = { ...(current.days || {}) };

    if (willRest) {
      daysObj[day] = {
        workoutSteps: [],
        nutritionItems: [],
        caloriesTarget: "",
        proteinTarget: "",
      };
    }

    const nextRest = willRest
      ? [...restDays, day]
      : restDays.filter((d) => d !== day);

    const selectable = DAYS.filter((d) => !nextRest.includes(d));
    if (selectable.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "امکان‌پذیر نیست",
        text: "حداقل یک روز باید غیر استراحت باشد.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
      return;
    }

    let nextSelected = selectedDay;
    if (nextRest.includes(nextSelected)) nextSelected = selectable[0];

    setRestDays(nextRest);
    setSelectedDay(nextSelected);

    saveStudentPlan(id, {
      ...current,
      planType: student.planType,
      planTitle: student.planTitle,
      selectedDay: nextSelected,
      restDays: nextRest,
      days: daysObj,
      updatedAt: new Date().toISOString(),
      status: current?.status || studentStatus || "pending",
    });

    await Swal.fire({
      icon: "success",
      title: "ذخیره شد",
      text: willRest
        ? `روز ${day} استراحت شد.`
        : `روز ${day} از استراحت خارج شد.`,
      confirmButtonText: "باشه",
      background: "#0a0a0a",
      color: "#fff",
    });
  };

  // NEW: toggle status pending <-> active (در انتظار <-> موفق)
  const onToggleStatus = async () => {
    try {
      const nextStatus = studentStatus === "active" ? "pending" : "active";

      const res = await Swal.fire({
        icon: "question",
        title: "تغییر وضعیت شاگرد",
        text:
          nextStatus === "active"
            ? "وضعیت این شاگرد به «موفق» تغییر می‌کند."
            : "وضعیت این شاگرد به «در انتظار» تغییر می‌کند.",
        showCancelButton: true,
        confirmButtonText: "تایید",
        cancelButtonText: "لغو",
        background: "#0a0a0a",
        color: "#fff",
      });

      if (!res.isConfirmed) return;

      const current = loadStudentPlan(id) || { days: {} };

      saveStudentPlan(id, {
        ...current,
        status: nextStatus,
        planType: current.planType || student.planType,
        planTitle: current.planTitle || student.planTitle,
        updatedAt: new Date().toISOString(),
      });

      setStudentStatus(nextStatus);

      await Swal.fire({
        icon: "success",
        title: "انجام شد",
        text:
          nextStatus === "active"
            ? "وضعیت شاگرد: موفق"
            : "وضعیت شاگرد: در انتظار",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } catch {
      await Swal.fire({
        icon: "error",
        title: "خطا",
        text: "تغییر وضعیت ناموفق بود.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    }
  };

  const onSave = async () => {
    try {
      if (isRestDay(selectedDay)) return;

      setSaving(true);

      const current = loadStudentPlan(id) || { days: {} };

      const next = {
        ...current,
        selectedDay,
        // IMPORTANT: keep current status (do NOT force active)
        status: current?.status || studentStatus || "pending",
        planType: student.planType,
        planTitle: student.planTitle,
        restDays,
        days: {
          ...(current.days || {}),
          [selectedDay]: {
            workoutSteps,
            nutritionItems,
            caloriesTarget,
            proteinTarget,
          },
        },
        updatedAt: new Date().toISOString(),
      };

      saveStudentPlan(id, next);

      await Swal.fire({
        icon: "success",
        title: "ذخیره شد",
        text: "برنامه این روز با موفقیت ذخیره شد.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } catch {
      await Swal.fire({
        icon: "error",
        title: "خطا",
        text: "ذخیره برنامه ناموفق بود.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiChevronLeft />
            بازگشت
          </Link>

          <div className="text-lg font-extrabold text-white">جزئیات شاگرد</div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View user details */}
          <Link
            href={`/admin/users/${id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-zinc-100 hover:bg-white/10"
          >
            <FiUser />
            مشخصات شاگرد
          </Link>

          {/* Toggle status */}
          <button
            onClick={onToggleStatus}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-extrabold transition",
              studentStatus === "active"
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                : "border-amber-400/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15",
            )}
          >
            <FiRefreshCw />
            {studentStatus === "active" ? "موفق" : "در انتظار"}
          </button>

          {/* Save plan */}
          <button
            onClick={onSave}
            disabled={saving || isRestDay(selectedDay)}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200",
              saving || isRestDay(selectedDay)
                ? "pointer-events-none opacity-60"
                : "",
            )}
          >
            <FiSave />
            {saving ? "در حال ذخیره..." : "ذخیره برنامه"}
          </button>
        </div>
      </div>

      {/* Student card */}
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">نام</div>
            <div className="mt-1 truncate text-xl font-extrabold text-white">
              {student.fullName}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge icon={FiPhone} text={student.phone} />
              <Badge icon={FiClipboard} text={`پلن: ${student.planTitle}`} />
              <Badge
                icon={studentStatus === "active" ? FiCheckCircle : FiXCircle}
                text={
                  studentStatus === "active"
                    ? "وضعیت: موفق"
                    : "وضعیت: در انتظار"
                }
                tone={studentStatus === "active" ? "success" : "neutral"}
              />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <MiniCard
              title="تاریخ شروع"
              value={student.startDate ? formatDateFa(student.startDate) : "—"}
            />

            <MiniCard
              title="مدت زمان دوره"
              value={student.durationDays ? `${student.durationDays} روز` : "—"}
            />

            <MiniCard
              title="زمان باقی‌مانده"
              value={
                student.startDate && student.durationDays
                  ? `${calcRemainingDays(student.startDate, student.durationDays)} روز`
                  : "—"
              }
            />
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-base font-extrabold text-white">
              روزهای هفته
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              روز را انتخاب کن. با دکمه استراحت، روز قفل می‌شود.
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-200">
            <FiCalendar className="text-emerald-200" />
            {selectedDay}
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-7">
          {DAYS.map((d) => {
            const rest = isRestDay(d);
            const active = selectedDay === d;

            return (
              <div
                key={d}
                className="rounded-3xl border border-white/10 bg-zinc-950/25 p-2"
              >
                <button
                  onClick={() => !rest && setSelectedDay(d)}
                  className={cn(
                    "w-full rounded-2xl px-3 py-2 text-sm font-extrabold transition",
                    rest
                      ? "cursor-not-allowed bg-zinc-950/40 text-zinc-500"
                      : active
                        ? "bg-white text-zinc-950"
                        : "bg-white/5 text-zinc-200 hover:bg-white/10",
                  )}
                >
                  {d}
                </button>

                <button
                  onClick={() => handleToggleRestDay(d)}
                  className={cn(
                    "mt-2 inline-flex w-full items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-xs font-bold transition",
                    rest
                      ? "border-amber-400/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15"
                      : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                  )}
                >
                  <FiMoon className="text-[16px]" />
                  {rest ? "استراحت: روشن" : "استراحت: خاموش"}
                </button>
              </div>
            );
          })}
        </div>

        {isRestDay(selectedDay) && (
          <div className="mt-4 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            این روز استراحت است؛ امکان ثبت برنامه وجود ندارد.
          </div>
        )}
      </div>

      {/* Editors */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ListEditor
          title="برنامه تمرینی"
          subtitle="هر مورد را بنویس و Enter بزن تا اضافه شود."
          disabled={isRestDay(selectedDay)}
          emptyText={"هنوز موردی اضافه نشده."}
          inputValue={workoutInput}
          onInputChange={setWorkoutInput}
          onAdd={handleAddWorkout}
          items={workoutSteps}
          setItems={setWorkoutSteps}
          placeholder="مثال: اسکوات ۴×۱۰"
          accent="emerald"
        />

        <ListEditor
          title="برنامه تغذیه"
          subtitle="هر مورد را بنویس و Enter بزن تا اضافه شود."
          disabled={isRestDay(selectedDay)}
          emptyText={"هنوز موردی اضافه نشده."}
          inputValue={nutritionInput}
          onInputChange={setNutritionInput}
          onAdd={handleAddNutrition}
          items={nutritionItems}
          setItems={setNutritionItems}
          placeholder="مثال: صبحانه: جو دوسر + موز"
          accent="cyan"
          showTargets={true}
          caloriesTarget={caloriesTarget}
          setCaloriesTarget={setCaloriesTarget}
          proteinTarget={proteinTarget}
          setProteinTarget={setProteinTarget}
        />
      </div>
    </div>
  );
}

function ListEditor({
  title,
  subtitle,
  disabled,
  emptyText,
  inputValue,
  onInputChange,
  onAdd,
  items,
  setItems,
  placeholder,
  accent,
  showTargets = false,
  caloriesTarget = "",
  setCaloriesTarget = () => {},
  proteinTarget = "",
  setProteinTarget = () => {},
}) {
  const onKeyDown = (e) => {
    // Enter adds item (Shift+Enter in textarea creates newline)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) onAdd();
    }
  };

  const removeAt = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="text-base font-extrabold text-white">{title}</div>
      <div className="mt-1 text-sm text-zinc-300">{subtitle}</div>

      {showTargets && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            type="number"
            inputMode="numeric"
            value={caloriesTarget}
            onChange={(e) => setCaloriesTarget(e.target.value)}
            disabled={disabled}
            placeholder="کالری هدف (مثال: 2200)"
            className={cn(
              "w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none",
              disabled ? "opacity-60" : "focus:border-cyan-400/40",
            )}
          />

          <input
            type="text"
            value={proteinTarget}
            onChange={(e) => setProteinTarget(e.target.value)}
            disabled={disabled}
            placeholder="پروتئین هدف (مثال: 140g)"
            className={cn(
              "w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none",
              disabled ? "opacity-60" : "focus:border-cyan-400/40",
            )}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        {/* Desktop input */}
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "hidden w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none sm:block",
            disabled ? "opacity-60" : "focus:border-emerald-400/40",
          )}
        />

        {/* Mobile textarea */}
        <textarea
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={2}
          className={cn(
            "block w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none sm:hidden",
            disabled ? "opacity-60" : "focus:border-emerald-400/40",
          )}
        />

        <button
          onClick={onAdd}
          disabled={disabled}
          className={cn(
            "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-zinc-100 hover:bg-white/10 sm:py-2.5",
            disabled ? "pointer-events-none opacity-50" : "",
          )}
          aria-label="Add"
        >
          <FiPlus />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-zinc-300">
            {emptyText}
          </div>
        ) : (
          items.map((t, idx) => (
            <div
              key={`${t}-${idx}`}
              className="rounded-3xl border border-white/10 bg-zinc-950/30 md:p-2"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3 md:items-center">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-extrabold",
                      accent === "emerald"
                        ? "text-emerald-200"
                        : "text-cyan-200",
                    )}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-zinc-100">
                    {t}
                  </div>
                </div>

                <button
                  onClick={() => removeAt(idx)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 sm:shrink-0"
                  aria-label="Remove"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Badge({ icon: Icon, text, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : "border-white/10 bg-white/5 text-zinc-200";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs",
        toneClass,
      )}
    >
      <Icon className="text-[16px]" />
      <span>{text}</span>
    </div>
  );
}

function MiniCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
      <div className="text-[11px] text-zinc-400">{title}</div>
      <div className="mt-1 text-sm font-extrabold text-white">{value}</div>
    </div>
  );
}

function formatDateFa(iso) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

function calcRemainingDays(startDate, durationDays) {
  try {
    if (!startDate || !durationDays) return "—";
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(durationDays || 0));

    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "0";
    return String(diffDays);
  } catch {
    return "—";
  }
}
