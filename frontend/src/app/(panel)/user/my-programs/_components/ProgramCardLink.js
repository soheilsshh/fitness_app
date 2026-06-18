"use client";

import Link from "next/link";
import { ChevronLeft, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function getAnyPlan(program) {
  const plan = program.planByDay || {};
  const firstKey = Object.keys(plan)[0];
  return firstKey ? plan[firstKey] : null;
}

function statusBadgeProps(timeline) {
  if (timeline.isExpired) {
    return {
      label: "پایان‌یافته",
      className: "border-border bg-muted text-muted-foreground",
    };
  }
  if (timeline.isActive) {
    return {
      label: "فعال",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }
  return {
    label: "شروع نشده",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
}

export default function ProgramCardLink({ program, timeline }) {
  const status = statusBadgeProps(timeline);
  const href = `/user/my-programs/${encodeURIComponent(String(program.id))}`;

  const anyPlan = getAnyPlan(program);
  const hasWorkout = !!anyPlan?.workout;
  const hasNutrition = !!anyPlan?.nutrition;

  const planTypeLabel = hasWorkout && hasNutrition
    ? "تمرین + تغذیه"
    : hasWorkout
      ? "فقط تمرین"
      : hasNutrition
        ? "فقط تغذیه"
        : "—";

  return (
    <Link href={href} className="group block h-full">
      <Card
        className={cn(
          "h-full bg-gradient-to-t from-primary/5 to-card shadow-xs transition-colors",
          "hover:bg-muted/40 dark:bg-card"
        )}
      >
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>

            <Badge variant="outline">
              <Clock data-icon="inline-start" />
              {timeline.remainingDays <= 0
                ? "اتمام"
                : `${timeline.remainingDays} روز`}
            </Badge>

            <Badge variant="secondary">{planTypeLabel}</Badge>
          </div>

          <CardTitle className="mt-3 truncate text-start text-base font-semibold">
            {program.title}
          </CardTitle>

          <CardDescription className="text-start">{program.goal}</CardDescription>

          {program.coachName ? (
            <p className="text-start text-xs text-emerald-700 dark:text-emerald-300">
              مربی: {program.coachName}
            </p>
          ) : null}

          <CardAction>
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg border border-border",
                "bg-muted/50 text-muted-foreground transition-colors",
                "group-hover:bg-muted group-hover:text-foreground"
              )}
            >
              <ChevronLeft className="size-4" />
            </span>
          </CardAction>
        </CardHeader>

        {program.tags?.length ? (
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {program.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline">
                  <Tag data-icon="inline-start" />
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
