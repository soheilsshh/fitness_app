"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Pencil } from "lucide-react";
import WorkoutExerciseCards from "@/components/workout/WorkoutExerciseCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DAY_KEYS, DAY_LABELS } from "../../_components/programDays";

export default function WorkoutProgramPreview({ studentId, programs }) {
  const [selectedDay, setSelectedDay] = useState(
    programs?.schedule?.weekly?.[0] || "sat"
  );

  if (!programs?.workoutProgramId) return null;

  const restDays = new Set(programs?.schedule?.restDays || []);
  const workout = programs?.planByDay?.[selectedDay]?.workout;

  const visibleDays = DAY_KEYS.filter((key) => {
    const isRest = restDays.has(key);
    const hasExercises =
      (programs?.planByDay?.[key]?.workout?.exercises?.length || 0) > 0 ||
      (programs?.planByDay?.[key]?.workout?.steps?.length || 0) > 0;
    return !isRest || hasExercises;
  });

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex size-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <Activity className="size-4 text-emerald-700 dark:text-emerald-300" />
            </span>
            <span>
              برنامه تمرین اختصاصی
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                برنامه فعال دانشجو
              </span>
            </span>
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/coach/students/workout?id=${encodeURIComponent(studentId)}`}>
              <Pencil data-icon="inline-start" />
              ویرایش
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleGroup
          type="single"
          value={selectedDay}
          onValueChange={(next) => next && setSelectedDay(next)}
          variant="outline"
          size="sm"
          className="flex flex-wrap justify-start gap-2"
        >
          {visibleDays.map((key) => {
            const isRest = restDays.has(key);
            return (
              <ToggleGroupItem
                key={key}
                value={key}
                className={isRest ? "opacity-50" : undefined}
              >
                {DAY_LABELS[key]}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        {restDays.has(selectedDay) ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            روز استراحت
          </p>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted-foreground">
              برای مشاهده انیمیشن و طرز انجام، روی هر حرکت کلیک کنید
            </p>
            <WorkoutExerciseCards
              workout={workout}
              dayKey={selectedDay}
              clickable
              variant="cards"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
