"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiPhone, FiClipboard, FiActivity, FiCoffee } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import WorkoutProgramPreview from "./WorkoutProgramPreview";
import WorkoutEditorClient from "../workout/_components/WorkoutEditorClient";

export default function CoachStudentDetailsClient({ id }) {
  const [student, setStudent] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/coach/students/${id}`);
      setStudent(res.data);

      if (res.data?.hasWorkoutProgram) {
        try {
          const progRes = await api.get(`/coach/students/${id}/programs`);
          setPrograms(progRes.data);
        } catch {
          setPrograms(null);
        }
      } else {
        setPrograms(null);
      }
    } catch {
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  if (loading) {
    return <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">در حال بارگذاری...</div>;
  }

  if (!student) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        دانشجو پیدا نشد.
      </div>
    );
  }

  const isPending = student.status === "pending";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/coach/students"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
        >
          <FiChevronLeft />
          بازگشت
        </Link>
        <div className="text-lg font-extrabold text-white">{student.fullName}</div>
        <span
          className={[
            "rounded-full border px-3 py-1 text-[11px] font-bold",
            isPending
              ? "border-amber-400/25 bg-amber-400/10 text-amber-200"
              : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
          ].join(" ")}
        >
          {isPending ? "در انتظار" : "فعال"}
        </span>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoRow icon={FiPhone} label="موبایل" value={student.phone} />
          <InfoRow icon={FiClipboard} label="پلن" value={student.planTitle || "—"} />
          <InfoRow label="نوع پلن" value={
            student.planType === "both" ? "تمرین + تغذیه" : student.planType === "workout" ? "تمرین" : "تغذیه"
          } />
          {student.heightCm ? <InfoRow label="قد" value={`${student.heightCm} cm`} /> : null}
          {student.weightKg ? <InfoRow label="وزن" value={`${student.weightKg} kg`} /> : null}
          {student.remainingDays > 0 ? (
            <InfoRow label="روز باقی‌مانده" value={`${student.remainingDays} روز`} />
          ) : null}
        </div>
      </div>

      {isPending ? (
        <div className="rounded-[26px] border border-amber-400/20 bg-amber-400/5 p-5 md:p-6">
          <div className="mb-4 text-sm text-zinc-300">
            این دانشجو پلن را خریداری کرده اما هنوز برنامه تمرینی دریافت نکرده.
            حرکات را از دیتاست انتخاب کنید و برنامه را ارسال نمایید.
          </div>
          <WorkoutEditorClient
            studentId={id}
            embedded
            onSaved={loadStudent}
          />
        </div>
      ) : (
        <WorkoutProgramPreview studentId={id} programs={programs} />
      )}

      {!isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href={`/coach/students/${id}/workout`}
            className="flex items-center gap-3 rounded-[26px] border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10">
              <FiActivity className="text-xl text-emerald-200" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-white">ویرایش برنامه تمرین</div>
              <div className="mt-1 text-[11px] text-zinc-400">تغییر حرکات و روزهای تمرین</div>
            </div>
          </Link>

          <Link
            href={`/coach/students/${id}/nutrition`}
            className="flex items-center gap-3 rounded-[26px] border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
              <FiCoffee className="text-xl text-cyan-200" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-white">برنامه غذایی</div>
              <div className="mt-1 text-[11px] text-zinc-400">
                {student.hasNutritionProgram ? "ویرایش برنامه فعلی" : "تخصیص برنامه جدید"}
              </div>
            </div>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
        {Icon ? <Icon /> : null}
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  );
}
