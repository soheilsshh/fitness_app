"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Dumbbell,
  Link2,
  Moon,
  Plus,
  Save,
  Trash2,
  Unlink,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DAY_KEYS, DAY_LABELS } from "../../_components/programDays";
import {
  dayExercisesToPlanByDay,
  emptyDayExercises,
  formatExerciseEntry,
  generateSupersetId,
  getWorkoutSystemLabel,
  groupExercisesForDisplay,
  isExerciseLinked,
  normalizeSetsDetails,
  planByDayToDayExercises,
  resizeSetsDetails,
  summarizeSetReps,
  WORKOUT_LINK_OPTIONS,
} from "../../_components/exerciseHelpers";
import { Checkbox } from "@/components/ui/checkbox";
import ExercisePickerModal from "./ExercisePickerModal";
import ManualExerciseModal from "./ManualExerciseModal";
import TemplatePickerModal from "../../_components/TemplatePickerModal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.fitinoo.ir";

function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function WorkoutEditorClient({
  studentId: studentIdProp,
  embedded = false,
  onSaved,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = studentIdProp ?? searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programId, setProgramId] = useState(null);
  const [title, setTitle] = useState("برنامه تمرین");
  const [selectedDay, setSelectedDay] = useState("sat");
  const [restDays, setRestDays] = useState([]);
  const [dayExercises, setDayExercises] = useState(emptyDayExercises());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedUids, setSelectedUids] = useState([]);

  useEffect(() => {
    setSelectedUids([]);
  }, [selectedDay]);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/coach/students/${studentId}/programs`);
      const data = res.data || {};
      setProgramId(data.workoutProgramId || null);
      if (data.workoutProgramId && data.schedule?.restDays) {
        setRestDays(data.schedule.restDays);
      } else {
        setRestDays([]);
      }
      if (data.planByDay) {
        setDayExercises(planByDayToDayExercises(data.planByDay));
      }
    } catch {
      // برنامه جدید
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const isRestDay = restDays.includes(selectedDay);
  const currentExercises = dayExercises[selectedDay] || [];
  const exerciseGroups = groupExercisesForDisplay(currentExercises);
  const selectedCount = selectedUids.length;

  const addExercise = (entry) => {
    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), { uid: uid(), ...entry }],
    }));
    if (restDays.includes(selectedDay)) {
      setRestDays((prev) => prev.filter((d) => d !== selectedDay));
    }
  };

  const removeExercise = (exerciseUid) => {
    setDayExercises((prev) => {
      const list = prev[selectedDay] || [];
      const removed = list.find((e) => e.uid === exerciseUid);
      let next = list.filter((e) => e.uid !== exerciseUid);

      if (removed && isExerciseLinked(removed)) {
        const groupId = removed.supersetId;
        const remainingInGroup = next.filter((e) => e.supersetId === groupId);
        if (remainingInGroup.length === 1) {
          next = next.map((e) =>
            e.supersetId === groupId
              ? { ...e, supersetId: null, workoutSystemType: "normal" }
              : e
          );
        }
      }

      return { ...prev, [selectedDay]: next };
    });
    setSelectedUids((prev) => prev.filter((id) => id !== exerciseUid));
  };

  const toggleExerciseSelection = (exerciseUid) => {
    setSelectedUids((prev) =>
      prev.includes(exerciseUid)
        ? prev.filter((id) => id !== exerciseUid)
        : [...prev, exerciseUid]
    );
  };

  const linkSelectedExercises = (workoutSystemType) => {
    if (selectedUids.length < 2) return;
    const groupId = generateSupersetId();
    const selectedSet = new Set(selectedUids);

    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((e) =>
        selectedSet.has(e.uid)
          ? { ...e, supersetId: groupId, workoutSystemType }
          : e
      ),
    }));
    setSelectedUids([]);
  };

  const unlinkExercise = (exerciseUid) => {
    const target = currentExercises.find((e) => e.uid === exerciseUid);
    if (!target?.supersetId) {
      setDayExercises((prev) => ({
        ...prev,
        [selectedDay]: (prev[selectedDay] || []).map((e) =>
          e.uid === exerciseUid
            ? { ...e, supersetId: null, workoutSystemType: "normal" }
            : e
        ),
      }));
      setSelectedUids((prev) => prev.filter((id) => id !== exerciseUid));
      return;
    }

    const groupId = target.supersetId;
    setDayExercises((prev) => {
      const list = prev[selectedDay] || [];
      let next = list.map((e) =>
        e.uid === exerciseUid
          ? { ...e, supersetId: null, workoutSystemType: "normal" }
          : e
      );
      const remaining = next.filter(
        (e) => e.supersetId === groupId && isExerciseLinked(e)
      );
      if (remaining.length === 1) {
        next = next.map((e) =>
          e.supersetId === groupId
            ? { ...e, supersetId: null, workoutSystemType: "normal" }
            : e
        );
      }
      return { ...prev, [selectedDay]: next };
    });
    setSelectedUids((prev) => prev.filter((id) => id !== exerciseUid));
  };

  const updateExercise = (exerciseUid, field, value) => {
    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((e) => {
        if (e.uid !== exerciseUid) return e;

        if (field === "sets") {
          const defaultReps = e.setsDetails?.[0]?.reps || e.reps || "12";
          const setsDetails = resizeSetsDetails(e.setsDetails, value, defaultReps);
          return {
            ...e,
            sets: value,
            setsDetails,
            reps: summarizeSetReps(setsDetails),
          };
        }

        return { ...e, [field]: value };
      }),
    }));
  };

  const updateSetDetail = (exerciseUid, setIndex, patch) => {
    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((e) => {
        if (e.uid !== exerciseUid) return e;
        const setsDetails = normalizeSetsDetails(e.setsDetails).map((s, i) =>
          i === setIndex ? { ...s, ...patch, setNumber: i + 1 } : s
        );
        return {
          ...e,
          setsDetails,
          sets: String(setsDetails.length),
          reps: summarizeSetReps(setsDetails),
        };
      }),
    }));
  };

  const toggleRestDay = () => {
    if (isRestDay) {
      setRestDays((prev) => prev.filter((d) => d !== selectedDay));
    } else {
      setRestDays((prev) => [...prev, selectedDay]);
      setDayExercises((prev) => ({ ...prev, [selectedDay]: [] }));
    }
  };

  const hasAnyExercise = DAY_KEYS.some((k) => (dayExercises[k] || []).length > 0);
  const weekly = DAY_KEYS.filter((k) => !restDays.includes(k));

  const handleSave = async () => {
    if (!hasAnyExercise) {
      toastError("خطا", "حداقل یک حرکت به برنامه اضافه کنید.");
      return;
    }
    setSaving(true);
    try {
      const planByDay = dayExercisesToPlanByDay(dayExercises);
      const payload = {
        title,
        durationWeeks: 4,
        schedule: { weekly, restDays },
        planByDay,
      };
      if (programId) {
        await api.patch(`/coach/students/${studentId}/workout-programs/${programId}`, payload);
      } else {
        const res = await api.post(`/coach/students/${studentId}/workout-programs`, payload);
        setProgramId(res.data?.workoutProgramId || null);
      }
      await toastSuccess("موفق", "برنامه تمرین با موفقیت برای دانشجو ارسال شد.");
      onSaved?.();
      if (embedded) router.refresh();
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 text-start">
          {!embedded ? (
            <Button variant="outline" size="sm" asChild className="mb-2">
              <Link href={`/coach/students/detail?id=${encodeURIComponent(studentId)}`}>
                <ChevronLeft data-icon="inline-start" />
                بازگشت
              </Link>
            </Button>
          ) : null}
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Dumbbell className="size-5 text-primary" />
            {embedded ? "ساخت برنامه تمرین" : "ویرایش برنامه تمرین"}
          </h1>
          <p className="text-sm text-muted-foreground">
            حرکات هر روز را انتخاب کنید و برنامه را برای دانشجو ارسال نمایید.
          </p>
        </div>
        <Button type="button" onClick={handleSave} disabled={saving}>
          <Save data-icon="inline-start" />
          {saving ? "در حال ارسال..." : "ارسال برنامه به دانشجو"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">اطلاعات برنامه</CardTitle>
          <CardDescription>عنوانی که دانشجو در پنل خود می‌بیند</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="workout-title">عنوان برنامه</Label>
            <Input
              id="workout-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label className="text-muted-foreground">انتخاب روز</Label>
        <ToggleGroup
          type="single"
          value={selectedDay}
          onValueChange={(v) => v && setSelectedDay(v)}
          variant="outline"
          size="sm"
          className="flex flex-wrap justify-start gap-2"
        >
          {DAY_KEYS.map((key) => {
            const count = (dayExercises[key] || []).length;
            const isRest = restDays.includes(key);
            return (
              <ToggleGroupItem key={key} value={key} className={cn(isRest && "opacity-60")}>
                {DAY_LABELS[key]}
                {isRest ? (
                  <Moon className="ms-1 size-3 text-muted-foreground" />
                ) : null}
                {count > 0 ? (
                  <Badge variant="secondary" className="ms-1.5 h-5 min-w-5 px-1 tabular-nums">
                    {count.toLocaleString("fa-IR")}
                  </Badge>
                ) : null}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1 text-start">
              <CardTitle className="text-base">برنامه {DAY_LABELS[selectedDay]}</CardTitle>
              <CardDescription>
                {isRestDay
                  ? "این روز به‌عنوان استراحت علامت‌گذاری شده"
                  : `${currentExercises.length.toLocaleString("fa-IR")} حرکت ثبت شده`}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={toggleRestDay}>
              {isRestDay ? "لغو روز استراحت" : "روز استراحت"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isRestDay ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Moon className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  این روز به‌عنوان روز استراحت تنظیم شده است.
                </p>
                <Button type="button" variant="secondary" size="sm" onClick={toggleRestDay}>
                  فعال‌سازی و افزودن حرکت
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button
                type="button"
                className="w-full"
                onClick={() => setPickerOpen(true)}
              >
                <Plus data-icon="inline-start" />
                اضافه کردن حرکت
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setTemplatePickerOpen(true)}
              >
                <Dumbbell data-icon="inline-start" />
                انتخاب از بانک تمپلیت
              </Button>

              {currentExercises.length > 0 ? (
                <div className="space-y-3">
                  {selectedCount >= 2 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground tabular-nums">
                          {selectedCount.toLocaleString("fa-IR")}
                        </span>{" "}
                        حرکت انتخاب شده
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUids([])}
                        >
                          لغو انتخاب
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" size="sm">
                              <Link2 data-icon="inline-start" />
                              اتصال حرکات
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {WORKOUT_LINK_OPTIONS.map((opt) => (
                              <DropdownMenuItem
                                key={opt.value}
                                onClick={() => linkSelectedExercises(opt.value)}
                              >
                                {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ) : null}

                  {exerciseGroups.map((group) => {
                    if (group.kind === "group") {
                      return (
                        <SupersetGroup
                          key={group.supersetId}
                          workoutSystemType={group.workoutSystemType}
                        >
                          {group.exercises.map((ex, index) => (
                            <ExerciseRow
                              key={ex.uid}
                              ex={ex}
                              index={index}
                              inGroup
                              isLastInGroup={index === group.exercises.length - 1}
                              selected={selectedUids.includes(ex.uid)}
                              onToggleSelect={() => toggleExerciseSelection(ex.uid)}
                              onRemove={() => removeExercise(ex.uid)}
                              onUnlink={() => unlinkExercise(ex.uid)}
                              onUpdate={(field, value) => updateExercise(ex.uid, field, value)}
                              onUpdateSet={(setIndex, patch) =>
                                updateSetDetail(ex.uid, setIndex, patch)
                              }
                            />
                          ))}
                        </SupersetGroup>
                      );
                    }

                    const ex = group.exercises[0];
                    return (
                      <ExerciseRow
                        key={ex.uid}
                        ex={ex}
                        index={currentExercises.findIndex((e) => e.uid === ex.uid)}
                        selected={selectedUids.includes(ex.uid)}
                        onToggleSelect={() => toggleExerciseSelection(ex.uid)}
                        onRemove={() => removeExercise(ex.uid)}
                        onUnlink={() => unlinkExercise(ex.uid)}
                        onUpdate={(field, value) => updateExercise(ex.uid, field, value)}
                        onUpdateSet={(setIndex, patch) =>
                          updateSetDetail(ex.uid, setIndex, patch)
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    هنوز حرکتی برای {DAY_LABELS[selectedDay]} اضافه نشده
                  </CardContent>
                </Card>
              )}

              <Separator />

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setManualOpen(true)}
              >
                <Plus data-icon="inline-start" />
                افزودن حرکت دستی (جدید)
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        dayLabel={DAY_LABELS[selectedDay]}
        onAdd={(entry) => addExercise(entry)}
      />

      <ManualExerciseModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        dayLabel={DAY_LABELS[selectedDay]}
        onAdd={(entry) => addExercise(entry)}
      />
      <TemplatePickerModal
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        mode="workout"
        studentId={studentId}
        onApplied={async () => {
          await loadPrograms();
          onSaved?.();
          if (embedded) router.refresh();
        }}
      />
    </div>
  );
}

function SupersetGroup({ workoutSystemType, children }) {
  return (
    <Card
      size="sm"
      className="border-s-4 border-s-primary bg-muted/30 shadow-none"
    >
      <CardContent className="space-y-0 pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge variant="default" className="text-xs">
            {getWorkoutSystemLabel(workoutSystemType)}
          </Badge>
          <p className="text-xs text-muted-foreground">
            بدون استراحت بین حرکات این گروه
          </p>
        </div>
        <div>{children}</div>
      </CardContent>
    </Card>
  );
}

function ExerciseRow({
  ex,
  index,
  selected = false,
  inGroup = false,
  isLastInGroup = true,
  onToggleSelect,
  onRemove,
  onUnlink,
  onUpdate,
  onUpdateSet,
}) {
  const setsDetails = normalizeSetsDetails(ex.setsDetails);
  const setsCount = Math.max(setsDetails.length, parseInt(ex.sets, 10) || 0);
  const linked = isExerciseLinked(ex);

  const content = (
    <div className="flex gap-3 py-3">
      <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label={`انتخاب ${ex.name}`}
        />
        <ExerciseThumb ex={ex} index={index} />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{ex.name}</p>
          <Badge variant="outline" className="max-w-[55%] shrink-0 truncate tabular-nums">
            {formatExerciseEntry(ex)}
          </Badge>
        </div>

        {linked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onUnlink}
          >
            <Unlink data-icon="inline-start" />
            حذف از {getWorkoutSystemLabel(ex.workoutSystemType)}
          </Button>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor={`sets-${ex.uid}`} className="text-xs text-muted-foreground">
            تعداد ست
          </Label>
          <Input
            id={`sets-${ex.uid}`}
            type="number"
            min="1"
            value={ex.sets}
            onChange={(e) => onUpdate("sets", e.target.value)}
            className="h-8 w-20 tabular-nums"
          />
        </div>

        {setsCount > 0 ? (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">تکرار هر ست</p>
            <div className="space-y-2">
              {Array.from({ length: setsCount }, (_, i) => {
                const set = setsDetails[i] || {
                  setNumber: i + 1,
                  reps: "",
                  isAmrap: false,
                };
                return (
                  <div
                    key={`${ex.uid}-set-${i}`}
                    className="flex flex-wrap items-center gap-2 sm:gap-3"
                  >
                    <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                      ست {(i + 1).toLocaleString("fa-IR")}
                    </span>
                    <Input
                      value={set.reps}
                      onChange={(e) => onUpdateSet(i, { reps: e.target.value })}
                      placeholder="۱۲"
                      disabled={set.isAmrap}
                      className={cn("h-8 w-20 tabular-nums", set.isAmrap && "opacity-50")}
                      aria-label={`تکرار ست ${i + 1}`}
                    />
                    <label
                      htmlFor={`amrap-${ex.uid}-${i}`}
                      className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Checkbox
                        id={`amrap-${ex.uid}-${i}`}
                        checked={set.isAmrap}
                        onCheckedChange={(checked) =>
                          onUpdateSet(i, {
                            isAmrap: checked === true,
                            reps: checked === true ? "" : set.reps,
                          })
                        }
                      />
                      <span>ماکسیمم توان</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="حذف حرکت"
      >
        <Trash2 />
      </Button>
    </div>
  );

  if (inGroup) {
    return (
      <div className={cn(!isLastInGroup && "border-b border-border/40")}>{content}</div>
    );
  }

  return (
    <Card size="sm">
      <CardContent className="p-0 px-4">{content}</CardContent>
    </Card>
  );
}

function ExerciseThumb({ ex, index }) {
  const img = mediaUrl(ex.imageUrl);

  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={ex.name}
          className="size-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
          {(index + 1).toLocaleString("fa-IR")}
        </div>
      )}
      <span className="absolute bottom-1 inset-e-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
        {(index + 1).toLocaleString("fa-IR")}
      </span>
    </div>
  );
}
