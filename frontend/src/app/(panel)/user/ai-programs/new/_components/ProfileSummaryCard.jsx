"use client";

import Link from "next/link";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ageFromBirthDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)));
}

const GENDER_LABEL = { male: "مرد", female: "زن" };

export default function ProfileSummaryCard({ profile, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const rows = [
    { label: "سن", value: profile?.birthDate ? `${ageFromBirthDate(profile.birthDate).toLocaleString("fa-IR")} سال` : "—" },
    { label: "وزن", value: profile?.weightKg ? `${profile.weightKg.toLocaleString("fa-IR")} کیلوگرم` : "—" },
    { label: "قد", value: profile?.heightCm ? `${profile.heightCm.toLocaleString("fa-IR")} سانتی‌متر` : "—" },
    { label: "جنسیت", value: GENDER_LABEL[profile?.gender] || "—" },
    { label: "هدف", value: profile?.primaryGoal || "—" },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="size-4" />
          </span>
          <p className="font-iranianSansDemiBold text-foreground">خلاصه پروفایل شما</p>
        </div>
        <dl className="space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-iranianSansMedium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/user/profile">ویرایش پروفایل</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
