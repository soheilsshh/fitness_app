"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ClipboardList, Phone } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDetailsClient({ id }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/students/${id}`);
        if (!cancelled) setStudent(res.data);
      } catch {
        if (!cancelled) setStudent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>در حال بارگذاری...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-6 text-sm text-muted-foreground">شاگرد پیدا نشد.</CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/students" className="inline-flex items-center gap-2">
            <ChevronLeft className="size-4" />
            بازگشت
          </Link>
        </Button>
        <h1 className="text-lg font-extrabold">{student.fullName}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جزئیات شاگرد</CardTitle>
          <CardDescription>تخصیص برنامه توسط مربی در پنل مربی انجام می‌شود.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow icon={Phone} label="موبایل" value={student.phone} />
            <InfoRow icon={ClipboardList} label="پلن" value={student.planTitle || "—"} />
            <InfoRow label="وضعیت" value={student.status === "active" ? "فعال" : "در انتظار"} />
            <InfoRow
              label="نوع پلن"
              value={
                student.planType === "both"
                  ? "تمرین + تغذیه"
                  : student.planType === "workout"
                    ? "تمرین"
                    : "تغذیه"
              }
            />
            {student.durationDays ? <InfoRow label="مدت پلن" value={`${student.durationDays} روز`} /> : null}
          {student.remainingDays > 0 ? (
            <InfoRow label="روز باقی‌مانده" value={`${student.remainingDays} روز`} />
          ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {Icon ? <Icon /> : null}
        {label}
      </div>
        <div className="mt-1 text-sm font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
