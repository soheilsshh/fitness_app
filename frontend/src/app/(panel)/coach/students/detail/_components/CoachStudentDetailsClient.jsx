"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Apple,
  ChevronLeft,
  ClipboardList,
  Phone,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import NutritionProgramPreview from "./NutritionProgramPreview";
import WorkoutProgramPreview from "./WorkoutProgramPreview";
import WorkoutEditorClient from "../../workout/_components/WorkoutEditorClient";

function InfoCard({ icon: Icon, label, value }) {
  return (
    <Card size="sm">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {Icon ? <Icon className="size-3.5" /> : null}
          {label}
        </div>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProgramQuickActions({ studentId, student, isPending }) {
  return (
    <div className="flex flex-wrap gap-2">
      {!isPending ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/coach/students/workout?id=${encodeURIComponent(studentId)}`}>
            <Activity data-icon="inline-start" />
            برنامه تمرین
          </Link>
        </Button>
      ) : null}
      <Button size="sm" asChild>
        <Link href={`/coach/students/nutrition?id=${encodeURIComponent(studentId)}`}>
          <UtensilsCrossed data-icon="inline-start" />
          {student.hasNutritionProgram ? "ویرایش تغذیه" : "برنامه غذایی"}
        </Link>
      </Button>
    </div>
  );
}

export default function CoachStudentDetailsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [student, setStudent] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/coach/students/${id}`);
      setStudent(res.data);

      try {
        const progRes = await api.get(`/coach/students/${id}/programs`);
        setPrograms(progRes.data);
      } catch {
        setPrograms(null);
      }
    } catch {
      setStudent(null);
      setPrograms(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <Card dir="rtl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          دانشجو پیدا نشد.
        </CardContent>
      </Card>
    );
  }

  const isPending = student.status === "pending";

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/coach/students">
              <ChevronLeft data-icon="inline-start" />
              بازگشت
            </Link>
          </Button>
          <h2 className="text-lg font-semibold">{student.fullName}</h2>
          <Badge
            variant="outline"
            className={cn(
              isPending
                ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            )}
          >
            {isPending ? "در انتظار" : "فعال"}
          </Badge>
        </div>
        <ProgramQuickActions studentId={id} student={student} isPending={isPending} />
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2">
          <InfoCard icon={Phone} label="موبایل" value={student.phone} />
          <InfoCard
            icon={ClipboardList}
            label="پلن"
            value={student.planTitle || "—"}
          />
          <InfoCard
            label="نوع پلن"
            value={
              student.planType === "both"
                ? "تمرین + تغذیه"
                : student.planType === "workout"
                  ? "تمرین"
                  : "تغذیه"
            }
          />
          {student.heightCm ? (
            <InfoCard label="قد" value={`${student.heightCm} cm`} />
          ) : null}
          {student.weightKg ? (
            <InfoCard label="وزن" value={`${student.weightKg} kg`} />
          ) : null}
          {student.remainingDays > 0 ? (
            <InfoCard
              label="روز باقی‌مانده"
              value={`${student.remainingDays.toLocaleString("fa-IR")} روز`}
            />
          ) : null}
        </CardContent>
      </Card>

      {isPending ? (
        <>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base">ساخت برنامه اولیه</CardTitle>
              <p className="text-sm text-muted-foreground">
                این دانشجو پلن را خریداری کرده اما هنوز برنامه تمرینی دریافت نکرده.
                حرکات را از دیتاست انتخاب کنید و برنامه را ارسال نمایید.
              </p>
            </CardHeader>
            <CardContent>
              <WorkoutEditorClient studentId={id} embedded onSaved={loadStudent} />
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-start">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
                  <Apple className="size-5 text-orange-700 dark:text-orange-300" />
                </span>
                <div>
                  <p className="text-sm font-semibold">برنامه غذایی</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    می‌توانید همزمان یا پس از تمرین، برنامه غذایی را از کاتالوگ
                    تخصیص دهید.
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link href={`/coach/students/nutrition?id=${encodeURIComponent(id)}`}>
                  <UtensilsCrossed data-icon="inline-start" />
                  ساخت برنامه غذایی
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <WorkoutProgramPreview studentId={id} programs={programs} />
          <NutritionProgramPreview
            studentId={id}
            programs={programs}
            hasNutritionProgram={student.hasNutritionProgram}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Link href={`/coach/students/workout?id=${encodeURIComponent(id)}`} className="block">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 pt-6">
                  <span className="inline-flex size-12 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                    <Activity className="size-5 text-emerald-700 dark:text-emerald-300" />
                  </span>
                  <div className="text-start">
                    <p className="text-sm font-semibold">ویرایش برنامه تمرین</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      تغییر حرکات و روزهای تمرین
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/coach/students/nutrition?id=${encodeURIComponent(id)}`} className="block">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 pt-6">
                  <span className="inline-flex size-12 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
                    <UtensilsCrossed className="size-5 text-orange-700 dark:text-orange-300" />
                  </span>
                  <div className="text-start">
                    <p className="text-sm font-semibold">ویرایش برنامه غذایی</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {student.hasNutritionProgram
                        ? "ویرایش برنامه فعلی با کاتالوگ غذا"
                        : "تخصیص برنامه جدید از کاتالوگ"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
