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
  Bot,
  UserCheck,
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
import SavedPlansPoolCard from "./SavedPlansPoolCard";
import PostWorkoutSurveyModal from "./PostWorkoutSurveyModal";
import { SHARE_DRAFT_KEY } from "../../community/_components/CommunityClient";
import ExerciseCountReveal from "../../community/_components/ExerciseCountReveal";
import {
  METRIC_HOLD,
  METRIC_LABELS,
  METRIC_REPS,
  METRIC_WEIGHT,
  buildSetsPayload,
  detectMetricKind,
  formatMetricValue,
} from "@/lib/workout/exerciseMetric";
import { checkStreakMilestone } from "@/lib/streak/checkMilestone";
import StreakMilestonePopup from "@/components/streak/StreakMilestonePopup";

// Rough resistance-training estimate (~7 kcal/min) — a motivational figure for
// the share card, not a medical/nutrition-grade calculation.
const KCAL_PER_MINUTE_ESTIMATE = 7;

function uniqueExerciseNames(sets, workout) {
  const fromSets = (sets || []).map((s) => s.exerciseName).filter(Boolean);
  if (fromSets.length) return [...new Set(fromSets)];
  return [...new Set((workout?.exercises || []).map((ex) => ex.name).filter(Boolean))];
}

// setEffortScore ranks sets of different metric kinds against each other well
// enough to pick a single "بهترین حرکت" for the share card. The weights are
// deliberately rough — this is a motivational highlight, not a training metric.
function setEffortScore(set) {
  if (!set) return -1;
  switch (set.metricKind) {
    case METRIC_REPS:
      return (set.reps || 0) * 2;
    case METRIC_HOLD:
      return set.holdSeconds || 0;
    default:
      return (set.weightKg || 0) * (set.reps || 1);
  }
}

function buildShareCard({ dayLabel, durationMin, sets, workout, newPrExercises }) {
  const exerciseNames = uniqueExerciseNames(sets, workout);
  // "Best" has to be comparable across metrics: a weighted set scores by
  // tonnage, a bodyweight set by reps, an isometric one by seconds held.
  const bestSet = (sets || []).reduce((best, s) => {
    return setEffortScore(s) > setEffortScore(best) ? s : best;
  }, null);
  return {
    dayLabel,
    durationMin: durationMin || 0,
    calories: Math.round((durationMin || 0) * KCAL_PER_MINUTE_ESTIMATE),
    exerciseCount: exerciseNames.length,
    exerciseNames,
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
          {card.exerciseNames?.length ? (
            <ExerciseCountReveal names={card.exerciseNames} />
          ) : (
            <div className="rounded-lg border bg-card px-2 py-2.5 text-center">
              <ListChecks className="mx-auto size-4 text-muted-foreground" />
              <p className="mt-1 text-sm font-iranianSansDemiBold tabular-nums">
                {card.exerciseCount.toLocaleString("fa-IR")}
              </p>
              <p className="text-[10px] text-muted-foreground">حرکت</p>
            </div>
          )}
        </div>
        {card.bestSet ? (
          <div className="rounded-lg border bg-card px-3 py-2.5 text-center">
            <p className="text-[11px] text-muted-foreground">بهترین حرکت</p>
            <p className="mt-0.5 text-sm font-iranianSansDemiBold tabular-nums">
              {card.bestSet.exerciseName}{" "}
              {formatMetricValue(card.bestSet.metricKind, card.bestSet)}
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

// sourceBadgeProps turns a workoutMeta/nutritionMeta ({source, status, createdAt})
// into a small badge: who built this program's content, and when it was saved
// (AI_PROGRAM_REFACTOR_TODO.md فاز ۲ — "AI + ذخیره‌شده" + تاریخ ایجاد).
function sourceBadgeProps(meta) {
  if (!meta?.source) return null;
  if (meta.source === "ai") {
    const label =
      meta.status === "coach_approved"
        ? `هوش مصنوعی · تأیید مربی · ${formatDateFa(meta.createdAt)}`
        : `ساخته‌شده با هوش مصنوعی · ${formatDateFa(meta.createdAt)}`;
    return {
      label,
      icon: Bot,
      className:
        "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }
  return {
    label: `تنظیم‌شده توسط مربی · ${formatDateFa(meta.createdAt)}`,
    icon: UserCheck,
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
}

function SourceBadge({ meta }) {
  const props = sourceBadgeProps(meta);
  if (!props) return null;
  const Icon = props.icon;
  return (
    <Badge variant="outline" className={cn("gap-1", props.className)}>
      <Icon className="size-3" />
      {props.label}
    </Badge>
  );
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

// ExerciseRecordInput logs one exercise with the unit that movement is
// actually measured in. Weight PRs were the only kind the app understood, so a
// student doing شنا or پلانک had no way to record anything; the metric toggle
// lets them log reps or a hold, and switch if the guess is wrong (e.g. a
// weighted pull-up).
function ExerciseRecordInput({ exercise, entry, onChange }) {
  const defaultKind = detectMetricKind(exercise);
  const kind = entry?.kind || defaultKind;
  const labels = METRIC_LABELS[kind] || METRIC_LABELS[METRIC_WEIGHT];

  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-sm">{exercise.name}</span>
        <div className="flex shrink-0 items-center gap-1">
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step={kind === METRIC_WEIGHT ? "0.5" : "1"}
            placeholder="۰"
            aria-label={`${exercise.name} — ${labels.input}`}
            value={entry?.value ?? ""}
            onChange={(e) => onChange({ kind, value: e.target.value })}
            className="h-8 w-20 text-center"
          />
          <span className="text-xs text-muted-foreground">{labels.unit}</span>
        </div>
      </div>
      <ToggleGroup
        type="single"
        value={kind}
        onValueChange={(next) => {
          if (next) onChange({ kind: next, value: entry?.value ?? "" });
        }}
        variant="outline"
        size="sm"
        className="mt-2 grid grid-cols-3 gap-1"
      >
        <ToggleGroupItem value={METRIC_WEIGHT} className="h-7 text-[11px]">
          وزنه
        </ToggleGroupItem>
        <ToggleGroupItem value={METRIC_REPS} className="h-7 text-[11px]">
          تکرار
        </ToggleGroupItem>
        <ToggleGroupItem value={METRIC_HOLD} className="h-7 text-[11px]">
          ثانیه
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
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
  // setEntries maps an exercise name to what the student actually did today:
  // { kind: "weight"|"reps"|"hold", value: string }. The kind defaults to the
  // movement's natural metric so bodyweight work is loggable without fiddling.
  const [setEntries, setSetEntries] = useState({});
  const [shareCard, setShareCard] = useState(null);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [milestoneStreak, setMilestoneStreak] = useState(0);
  const [surveySession, setSurveySession] = useState(null); // { id, exercises } | null

  useEffect(() => {
    setActiveTab(defaultTab);
    setSelectedDay(defaultDay);
  }, [defaultTab, defaultDay]);

  const handleTabChange = (nextTab) => {
    if (!nextTab) return;
    setActiveTab(nextTab);
    setSelectedDay(defaultDayForTab(program, nextTab, restSet));
  };

  // Reset entered sets whenever the selected day changes.
  useEffect(() => {
    setSetEntries({});
    setShareCard(null);
  }, [selectedDay]);

  async function handleLogWorkout() {
    const dayWorkout = program?.planByDay?.[selectedDay]?.workout;
    if (!program?.id || !dayWorkout) return;
    setLoggingWorkout(true);
    try {
      const sets = buildSetsPayload(dayWorkout.exercises, setEntries);
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
          workout: dayWorkout,
          newPrExercises: res.data?.newPrExercises,
        })
      );
      setSetEntries({});
      if (res.data?.isFirstSessionToday && res.data?.id) {
        setSurveySession({ id: res.data.id, exercises: dayWorkout.exercises || [] });
      }
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
        `بهترین حرکت: ${shareCard.bestSet.exerciseName} ${formatMetricValue(
          shareCard.bestSet.metricKind,
          shareCard.bestSet
        )}`
      );
    }
    if (shareCard.newPrExercises.length) {
      lines.push(`🏆 رکورد جدید: ${shareCard.newPrExercises.join("، ")}`);
    }
    try {
      window.sessionStorage.setItem(
        SHARE_DRAFT_KEY,
        JSON.stringify({
          content: lines.join("\n"),
          category: "progress",
          metadata: shareCard.exerciseNames?.length
            ? { exerciseNames: shareCard.exerciseNames }
            : undefined,
        })
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
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadge meta={program.workoutMeta} />
                    <Badge variant="outline">{selectedDayLabel}</Badge>
                  </div>
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
                          <p className="text-sm font-medium">ثبت رکورد امروز (اختیاری)</p>
                          <p className="text-xs text-muted-foreground">
                            برای محاسبه رکوردهای شخصی
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {workout.exercises.map((ex, i) => (
                            <ExerciseRecordInput
                              key={`${ex.exerciseId || ex.name}-${i}`}
                              exercise={ex}
                              entry={setEntries[ex.name]}
                              onChange={(next) =>
                                setSetEntries((prev) => ({ ...prev, [ex.name]: next }))
                              }
                            />
                          ))}
                        </div>
                        <p className="mt-3 text-[11px] text-muted-foreground">
                          حرکت‌های با وزن بدن با تعداد تکرار و حرکت‌های ثابت مثل پلانک با
                          ثانیه ثبت می‌شوند.
                        </p>
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

            <div className="mt-4">
              <SavedPlansPoolCard type="workout" />
            </div>
          </TabsContent>

          <TabsContent value="nutrition" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Coffee className="size-4 text-primary" />
                    برنامه تغذیه
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadge meta={program.nutritionMeta} />
                    <Badge variant="outline">{selectedDayLabel}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <NutritionDayView nutrition={nutrition} dayKey={selectedDay} />
              </CardContent>
            </Card>

            <div className="mt-4">
              <SavedPlansPoolCard type="nutrition" />
            </div>
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
    {surveySession ? (
      <PostWorkoutSurveyModal
        open={Boolean(surveySession)}
        onOpenChange={(v) => !v && setSurveySession(null)}
        sessionId={surveySession.id}
        exercises={surveySession.exercises}
      />
    ) : null}
    </>
  );
}
