"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { computeTimeline, mapApiProgramDetail } from "./helpers";
import ProgramDetailsPanel from "./ProgramDetailsPanel";

function ProgramDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <Skeleton className="h-9 w-40" />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

function BackLink({ href, children }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>
        <ChevronRight data-icon="inline-start" />
        {children}
      </Link>
    </Button>
  );
}

function EmptyState({ href, backLabel, message }) {
  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <BackLink href={href}>{backLabel}</BackLink>
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {message}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgramDetailsClient() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const normalizedId = decodeURIComponent(String(rawId || "")).trim();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!normalizedId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/me/programs/${normalizedId}`);
        if (!cancelled) setProgram(mapApiProgramDetail(res.data));
      } catch {
        if (!cancelled) setProgram(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [normalizedId]);

  if (!rawId) {
    return (
      <EmptyState
        href="/user/my-programs"
        backLabel="برگشت به برنامه‌ها"
        message="پارامتر آیدی دریافت نشد."
      />
    );
  }

  if (loading) {
    return <ProgramDetailsSkeleton />;
  }

  if (!program) {
    return (
      <EmptyState
        href="/user/my-programs"
        backLabel="برگشت به برنامه‌ها"
        message="برنامه پیدا نشد."
      />
    );
  }

  const timeline = computeTimeline(
    program.startDate,
    program.durationDays,
    program.status,
    program.remainingDays
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <BackLink href="/user/my-programs">برگشت به برنامه‌ها</BackLink>
      <ProgramDetailsPanel program={program} timeline={timeline} />
    </div>
  );
}
