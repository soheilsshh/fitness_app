"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronLeft,
  ClipboardList,
  Coffee,
  Phone,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import WorkoutProgramPreview from "./WorkoutProgramPreview";
import WorkoutEditorClient from "../workout/_components/WorkoutEditorClient";

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
      ) : (
        <WorkoutProgramPreview studentId={id} programs={programs} />
      )}

      {!isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Link href={`/coach/students/${id}/workout`} className="block">
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

          <Link href={`/coach/students/${id}/nutrition`} className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center gap-3 pt-6">
                <span className="inline-flex size-12 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10">
                  <Coffee className="size-5 text-sky-700 dark:text-sky-300" />
                </span>
                <div className="text-start">
                  <p className="text-sm font-semibold">برنامه غذایی</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {student.hasNutritionProgram
                      ? "ویرایش برنامه فعلی"
                      : "تخصیص برنامه جدید"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
