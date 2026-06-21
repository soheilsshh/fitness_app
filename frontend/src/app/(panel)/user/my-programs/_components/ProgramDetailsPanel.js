"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Coffee, Dumbbell, Info } from "lucide-react";
import { api } from "@/lib/axios/client";
import WorkoutExerciseCards from "@/components/workout/WorkoutExerciseCards";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDateFa, shortRemaining } from "./helpers";
import NutritionDayView from "./NutritionDayView";

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

// firstInt extracts the leading integer from a reps string like "12" or "8-10".
function firstInt(value) {
  const m = String(value ?? "").match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

// buildSetsPayload turns entered per-exercise weights into the API `sets` shape,
// dropping exercises with no (or non-positive) weight entered.
function buildSetsPayload(exercises, weights) {
  return (exercises || [])
    .map((ex) => {
      const w = parseFloat(weights?.[ex.name]);
      if (!Number.isFinite(w) || w <= 0) return null;
      return {
        exerciseName: ex.name,
        exerciseId: ex.exerciseId || undefined,
        setNumber: 1,
        weightKg: w,
        reps: firstInt(ex.reps),
      };
    })
    .filter(Boolean);
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
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  // weights maps an exercise name to the weight (kg) the user lifted today.
  const [weights, setWeights] = useState({});

  useEffect(() => {
    setSelectedDay(defaultDay);
  }, [defaultDay]);

  // Reset entered weights whenever the selected day changes.
  useEffect(() => {
    setWeights({});
  }, [selectedDay]);

  async function handleLogWorkout() {
    const dayWorkout = program?.planByDay?.[selectedDay]?.workout;
    if (!program?.id || !dayWorkout) return;
    setLoggingWorkout(true);
    try {
      const sets = buildSetsPayload(dayWorkout.exercises, weights);
      await api.post("/me/workout-sessions", {
        subscriptionId: program.id,
        dayKey: selectedDay,
        durationMin: dayWorkout.durationMin || 0,
        ...(sets.length ? { sets } : {}),
      });
      toast.success("تمرین با موفقیت در تاریخچه ثبت شد");
      setWeights({});
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت تمرین ناموفق بود");
    } finally {
      setLoggingWorkout(false);
    }
  }

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
                      variant="cards"
                    />
                    {timeline?.isActive && workout.exercises?.length ? (
                      <div className="mt-5 rounded-lg border bg-muted/30 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">ثبت وزنه‌ها (اختیاری)</p>
                          <p className="text-xs text-muted-foreground">
                            برای محاسبه رکوردهای شخصی
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {workout.exercises.map((ex, i) => (
                            <label
                              key={`${ex.exerciseId || ex.name}-${i}`}
                              className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2"
                            >
                              <span className="min-w-0 flex-1 truncate text-sm">
                                {ex.name}
                              </span>
                              <div className="flex shrink-0 items-center gap-1">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.5"
                                  placeholder="۰"
                                  value={weights[ex.name] ?? ""}
                                  onChange={(e) =>
                                    setWeights((prev) => ({
                                      ...prev,
                                      [ex.name]: e.target.value,
                                    }))
                                  }
                                  className="h-8 w-20 text-center"
                                />
                                <span className="text-xs text-muted-foreground">کیلوگرم</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {timeline?.isActive && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={handleLogWorkout}
                          disabled={loggingWorkout}
                        >
                          <CheckCircle2 className="size-4" />
                          {loggingWorkout ? "در حال ثبت..." : "ثبت اتمام تمرین"}
                        </Button>
                      </div>
                    )}
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
                <NutritionDayView nutrition={nutrition} dayKey={selectedDay} />
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
