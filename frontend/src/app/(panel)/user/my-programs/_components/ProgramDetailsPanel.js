"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ClipboardList, Coffee, Dumbbell, Info } from "lucide-react";
import WorkoutExerciseCards from "@/components/workout/WorkoutExerciseCards";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { formatDateFa, shortRemaining } from "./helpers";

const DAYS = [
  { key: "sat", label: "شنبه" },
  { key: "sun", label: "یکشنبه" },
  { key: "mon", label: "دوشنبه" },
  { key: "tue", label: "سه‌شنبه" },
  { key: "wed", label: "چهارشنبه" },
  { key: "thu", label: "پنجشنبه" },
  { key: "fri", label: "جمعه" },
];

function jsDayToKey(jsDay) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[jsDay] || "sat";
}

function statusBadgeProps(timeline) {
  if (timeline?.isExpired) {
    return {
      label: "پایان‌یافته",
      className: "border-border bg-muted text-muted-foreground",
    };
  }
  if (timeline?.isActive) {
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

export default function ProgramDetailsPanel({ program, timeline }) {
  const restSet = useMemo(
    () => new Set(program?.schedule?.restDays || []),
    [program?.id, program?.schedule?.restDays]
  );
  const activeSet = useMemo(
    () => new Set(program?.schedule?.weekly || []),
    [program?.id, program?.schedule?.weekly]
  );

  const defaultDay = useMemo(() => {
    if (!program) return "sat";

    const todayKey = jsDayToKey(new Date().getDay());
    if (!restSet.has(todayKey) && program.planByDay?.[todayKey]) return todayKey;

    const firstSelectable = DAYS.find(
      (d) => !restSet.has(d.key) && program.planByDay?.[d.key]
    );
    return firstSelectable?.key || "sat";
  }, [program, restSet]);

  const [selectedDay, setSelectedDay] = useState(defaultDay);

  useEffect(() => {
    setSelectedDay(defaultDay);
  }, [defaultDay]);

  if (!program) {
    return (
      <Card dir="rtl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          یک برنامه را انتخاب کنید.
        </CardContent>
      </Card>
    );
  }

  const dayPlan = program.planByDay?.[selectedDay] || {};
  const workout = dayPlan.workout || null;
  const nutrition = dayPlan.nutrition || null;
  const status = statusBadgeProps(timeline);
  const selectedDayLabel = DAYS.find((x) => x.key === selectedDay)?.label;

  const canSelectDay = (key) => {
    if (restSet.has(key)) return false;
    if (!program.planByDay?.[key]) return false;
    return true;
  };

  const dayHint = (key) => {
    if (restSet.has(key)) return "استراحت";
    if (activeSet.has(key)) return "فعال";
    return "—";
  };

  return (
    <Card
      className="bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card"
      dir="rtl"
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
          <Badge variant="outline">
            <Calendar data-icon="inline-start" />
            شروع: {formatDateFa(program.startDate)}
          </Badge>
          <Badge variant="secondary">
            مدت: {Number(program.durationDays).toLocaleString("fa-IR")} روز
          </Badge>
          <Badge variant="outline">{shortRemaining(timeline.remainingDays)}</Badge>
        </div>

        <CardTitle className="mt-3 text-start text-lg">{program.title}</CardTitle>
        <CardDescription className="text-start">{program.goal}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">انتخاب روز هفته</p>
            <p className="text-xs text-muted-foreground">
              روزهای استراحت غیرقابل انتخاب هستند
            </p>
          </div>

          <ToggleGroup
            type="single"
            value={selectedDay}
            onValueChange={(next) => {
              if (next) setSelectedDay(next);
            }}
            variant="outline"
            size="sm"
            className="grid w-full grid-cols-4 gap-2 sm:grid-cols-7"
          >
            {DAYS.map((d) => {
              const selectable = canSelectDay(d.key);
              return (
                <ToggleGroupItem
                  key={d.key}
                  value={d.key}
                  disabled={!selectable}
                  aria-label={d.label}
                  className={cn(
                    "flex h-auto min-w-0 flex-col gap-0.5 px-2 py-2 text-xs",
                    !selectable && "opacity-50"
                  )}
                >
                  <span>{d.label}</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {dayHint(d.key)}
                  </span>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>

        <Tabs defaultValue="workout" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="workout" className="gap-1.5">
              <Dumbbell className="size-3.5" />
              تمرین
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-1.5">
              <Coffee className="size-3.5" />
              تغذیه
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workout" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Dumbbell className="size-4 text-primary" />
                    برنامه تمرین
                  </CardTitle>
                  <Badge variant="outline">{selectedDayLabel}</Badge>
                </div>
                {workout?.title ? (
                  <CardDescription className="text-start">
                    {workout.title}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                {!workout ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    برای این روز برنامه تمرینی تعریف نشده.
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
                      variant="accordion"
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Coffee className="size-4 text-primary" />
                    برنامه تغذیه
                  </CardTitle>
                  <Badge variant="outline">{selectedDayLabel}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!nutrition ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    برای این روز برنامه غذایی تعریف نشده.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Card size="sm">
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">کالری هدف</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {nutrition.caloriesTarget} kcal
                          </p>
                        </CardContent>
                      </Card>
                      <Card size="sm">
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">پروتئین هدف</p>
                          <p className="mt-1 text-sm font-semibold">
                            {nutrition.proteinTarget}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {(nutrition.meals || []).length ? (
                      <Accordion type="multiple" className="w-full rounded-lg border px-3">
                        {(nutrition.meals || []).map((meal, index) => (
                          <AccordionItem
                            key={`${selectedDay}-meal-${index}`}
                            value={`${selectedDay}-meal-${index}`}
                          >
                            <AccordionTrigger className="hover:no-underline">
                              <span className="flex items-center gap-2 text-start">
                                <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
                                {meal.title}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {meal.detail}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          نکته: روزهای استراحت قابل انتخاب نیستند.
        </div>
      </CardContent>
    </Card>
  );
}
