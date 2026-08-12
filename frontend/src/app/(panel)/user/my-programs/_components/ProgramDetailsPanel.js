"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  Dumbbell,
  Flame,
  Info,
  ListChecks,
  Share2,
  Sparkles,
} from "lucide-react";
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
import { SHARE_DRAFT_KEY } from "../../community/_components/CommunityClient";
import { checkStreakMilestone } from "@/lib/streak/checkMilestone";
import StreakMilestonePopup from "@/components/streak/StreakMilestonePopup";

// Rough resistance-training estimate (~7 kcal/min) — a motivational figure for
// the share card, not a medical/nutrition-grade calculation.
const KCAL_PER_MINUTE_ESTIMATE = 7;

function buildShareCard({ dayLabel, durationMin, sets, newPrExercises }) {
  const exerciseCount = new Set((sets || []).map((s) => s.exerciseName)).size;
  const bestSet = (sets || []).reduce((best, s) => {
    const score = (s.weightKg || 0) * (s.reps || 1);
    const bestScore = best ? (best.weightKg || 0) * (best.reps || 1) : -1;
    return score > bestScore ? s : best;
  }, null);
  return {
    dayLabel,
    durationMin: durationMin || 0,
    calories: Math.round((durationMin || 0) * KCAL_PER_MINUTE_ESTIMATE),
    exerciseCount,
    bestSet,
    newPrExercises: newPrExercises || [],
  };
}

function ShareableProgressCard({ card, onShare }) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-card">
      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/10 px-4 py-3">
        <p className="text-xs font-iranianSansDemiBold text-muted-foreground">
          {card.dayLabel}
        </p>
        <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
          تکمیل شد
        </Badge>
      </div>
      <div className="space-y-4 p-4">
        <p className="text-center text-base font-iranianSansDemiBold text-foreground">
          تمرین {card.dayLabel} انجام شد 💪
        </p>
        <div
          className={cn(
            "grid gap-2",
            card.durationMin > 0 ? "grid-cols-3" : "grid-cols-1"
          )}
        >
          {card.durationMin > 0 ? (
            <>
              <div className="rounded-lg border bg-card px-2 py-2.5 text-center">
                <Clock className="mx-auto size-4 text-muted-foreground" />
                <p className="mt-1 text-sm font-iranianSansDemiBold tabular-nums">
                  {card.durationMin.toLocaleString("fa-IR")}
                </p>
                <p className="text-[10px] text-muted-foreground">دقیقه</p>
              </div>
              <div className="rounded-lg border bg-card px-2 py-2.5 text-center">
                <Flame className="mx-auto size-4 text-orange-500" />
                <p className="mt-1 text-sm font-iranianSansDemiBold tabular-nums">
                  {card.calories.toLocaleString("fa-IR")}
                </p>
                <p className="text-[10px] text-muted-foreground">kcal (تخمینی)</p>
              </div>
            </>
          ) : null}
          <div className="rounded-lg border bg-card px-2 py-2.5 text-center">
            <ListChecks className="mx-auto size-4 text-muted-foreground" />
            <p className="mt-1 text-sm font-iranianSansDemiBold tabular-nums">
              {card.exerciseCount.toLocaleString("fa-IR")}
            </p>
            <p className="text-[10px] text-muted-foreground">حرکت</p>
          </div>
        </div>
        {card.bestSet ? (
          <div className="rounded-lg border bg-card px-3 py-2.5 text-center">
            <p className="text-[11px] text-muted-foreground">بهترین حرکت</p>
            <p className="mt-0.5 text-sm font-iranianSansDemiBold tabular-nums">
              {card.bestSet.exerciseName} {card.bestSet.weightKg}kg ×{" "}
              {card.bestSet.reps}
            </p>
          </div>
        ) : null}
        {card.newPrExercises.length ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {card.newPrExercises.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
              >
                <Sparkles className="size-3" />
                رکورد جدید: {name}
              </Badge>
            ))}
          </div>
        ) : null}
        <Button type="button" className="w-full" onClick={onShare}>
          <Share2 className="size-4" data-icon="inline-start" />
          اشتراک در جامعه
        </Button>
      </div>
    </div>
  );
}

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

function hasWorkoutOnDay(program, key) {
  const workout = program?.planByDay?.[key]?.workout;
  return Boolean(
    workout &&
      ((workout.exercises?.length || 0) > 0 || (workout.steps?.length || 0) > 0)
  );
}

function hasNutritionOnDay(program, key) {
  const nutrition = program?.planByDay?.[key]?.nutrition;
  if (!nutrition) return false;
  return (nutrition.meals?.length || 0) > 0 || nutrition.caloriesTarget > 0;
}

function programHasNutrition(program) {
  return DAYS.some((d) => hasNutritionOnDay(program, d.key));
}

function programHasWorkout(program) {
  return DAYS.some((d) => hasWorkoutOnDay(program, d.key));
}

function defaultTabForProgram(program) {
  if (program?.type === "nutrition") return "nutrition";
  if (!programHasWorkout(program) && programHasNutrition(program)) return "nutrition";
  return "workout";
}

function defaultDayForTab(program, tab, restSet) {
  if (!program) return "sat";

  if (tab === "nutrition") {
    const todayKey = jsDayToKey(new Date().getDay());
    if (hasNutritionOnDay(program, todayKey)) return todayKey;
    const first = DAYS.find((d) => hasNutritionOnDay(program, d.key));
    return first?.key || "sat";
  }

  const todayKey = jsDayToKey(new Date().getDay());
  if (!restSet.has(todayKey) && hasWorkoutOnDay(program, todayKey)) return todayKey;
  const first = DAYS.find(
    (d) => !restSet.has(d.key) && hasWorkoutOnDay(program, d.key)
  );
  return first?.key || "sat";
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
  const router = useRouter();
  const restSet = useMemo(
    () => new Set(program?.schedule?.restDays || []),
    [program?.id, program?.schedule?.restDays]
  );
  const activeSet = useMemo(
    () => new Set(program?.schedule?.weekly || []),
    [program?.id, program?.schedule?.weekly]
  );

  const defaultTab = useMemo(() => defaultTabForProgram(program), [program]);

  const defaultDay = useMemo(
    () => defaultDayForTab(program, defaultTab, restSet),
    [program, defaultTab, restSet]
  );

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  // weights maps an exercise name to the weight (kg) the user lifted today.
  const [weights, setWeights] = useState({});
  const [shareCard, setShareCard] = useState(null);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [milestoneStreak, setMilestoneStreak] = useState(0);

  useEffect(() => {
    setActiveTab(defaultTab);
    setSelectedDay(defaultDay);
  }, [defaultTab, defaultDay]);

  const handleTabChange = (nextTab) => {
    if (!nextTab) return;
    setActiveTab(nextTab);
    setSelectedDay(defaultDayForTab(program, nextTab, restSet));
  };

  // Reset entered weights whenever the selected day changes.
  useEffect(() => {
    setWeights({});
    setShareCard(null);
  }, [selectedDay]);

  async function handleLogWorkout() {
    const dayWorkout = program?.planByDay?.[selectedDay]?.workout;
    if (!program?.id || !dayWorkout) return;
    setLoggingWorkout(true);
    try {
      const sets = buildSetsPayload(dayWorkout.exercises, weights);
      const res = await api.post("/me/workout-sessions", {
        subscriptionId: program.id,
        dayKey: selectedDay,
        durationMin: dayWorkout.durationMin || 0,
        ...(sets.length ? { sets } : {}),
      });
      toast.success("تمرین با موفقیت در تاریخچه ثبت شد");
      setShareCard(
        buildShareCard({
          dayLabel: DAYS.find((d) => d.key === selectedDay)?.label || "امروز",
          durationMin: dayWorkout.durationMin,
          sets,
          newPrExercises: res.data?.newPrExercises,
        })
      );
      setWeights({});
      const { shouldCelebrate, streak } = await checkStreakMilestone();
      if (shouldCelebrate) {
        setMilestoneStreak(streak);
        setMilestoneOpen(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت تمرین ناموفق بود");
    } finally {
      setLoggingWorkout(false);
    }
  }

  function handleShareToCommunity() {
    if (!shareCard) return;
    const statParts = [];
    if (shareCard.durationMin > 0) {
      statParts.push(`⏱️ ${shareCard.durationMin} دقیقه`, `🔥 ${shareCard.calories} kcal`);
    }
    statParts.push(`🏋️ ${shareCard.exerciseCount} حرکت`);
    const lines = [
      `تمرین ${shareCard.dayLabel} انجام شد 💪`,
      statParts.join(" · "),
    ];
    if (shareCard.bestSet) {
      lines.push(
        `بهترین حرکت: ${shareCard.bestSet.exerciseName} ${shareCard.bestSet.weightKg}kg × ${shareCard.bestSet.reps}`
      );
    }
    if (shareCard.newPrExercises.length) {
      lines.push(`🏆 رکورد جدید: ${shareCard.newPrExercises.join("، ")}`);
    }
    try {
      window.sessionStorage.setItem(
        SHARE_DRAFT_KEY,
        JSON.stringify({ content: lines.join("\n"), category: "progress" })
      );
    } catch {
      // sessionStorage unavailable — user can still type the post manually
    }
    router.push("/user/community");
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
    if (activeTab === "nutrition") {
      return hasNutritionOnDay(program, key);
    }
    if (restSet.has(key)) return false;
    return hasWorkoutOnDay(program, key);
  };

  const dayHint = (key) => {
    if (activeTab === "nutrition") {
      return hasNutritionOnDay(program, key) ? "غذا" : "—";
    }
    if (restSet.has(key)) return "استراحت";
    if (activeSet.has(key)) return "فعال";
    return "—";
  };

  const dayPickerHint =
    activeTab === "nutrition"
      ? "فقط روزهایی که برنامه غذایی دارند قابل انتخاب هستند"
      : "روزهای استراحت تمرین غیرقابل انتخاب هستند";

  return (
    <>
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
            <p className="text-xs text-muted-foreground">{dayPickerHint}</p>
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="workout" className="gap-1.5">
              <Dumbbell className="size-3.5" />
              تمرین
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-1.5">
              <Coffee className="size-3.5" />
              تغذیه
              {programHasNutrition(program) ? (
                <span className="ms-1 inline-flex size-1.5 rounded-full bg-primary" />
              ) : null}
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
                    {shareCard ? (
                      <ShareableProgressCard
                        card={shareCard}
                        onShare={handleShareToCommunity}
                      />
                    ) : null}
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
          {activeTab === "nutrition"
            ? "برای مشاهده برنامه غذایی، روزی را که مربی برای آن غذا تعریف کرده انتخاب کنید."
            : "روزهای استراحت تمرین در این بخش غیرفعال هستند؛ برای تغذیه به تب «تغذیه» بروید."}
        </div>
      </CardContent>
    </Card>
    <StreakMilestonePopup
      streak={milestoneStreak}
      open={milestoneOpen}
      onOpenChange={setMilestoneOpen}
    />
    </>
  );
}
