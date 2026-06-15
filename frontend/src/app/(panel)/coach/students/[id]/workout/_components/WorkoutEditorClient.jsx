"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DAY_KEYS, DAY_LABELS } from "../../../_components/programDays";
import {
  dayExercisesToPlanByDay,
  emptyDayExercises,
  formatExerciseEntry,
  planByDayToDayExercises,
} from "../../../_components/exerciseHelpers";
import ExercisePickerModal from "./ExercisePickerModal";
import ManualExerciseModal from "./ManualExerciseModal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function WorkoutEditorClient({ studentId, embedded = false, onSaved }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programId, setProgramId] = useState(null);
  const [title, setTitle] = useState("برنامه تمرین");
  const [selectedDay, setSelectedDay] = useState("sat");
  const [restDays, setRestDays] = useState([]);
  const [dayExercises, setDayExercises] = useState(emptyDayExercises());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/coach/students/${studentId}/programs`);
        if (cancelled) return;
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
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const isRestDay = restDays.includes(selectedDay);
  const currentExercises = dayExercises[selectedDay] || [];

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
    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter((e) => e.uid !== exerciseUid),
    }));
  };

  const updateExercise = (exerciseUid, field, value) => {
    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((e) =>
        e.uid === exerciseUid ? { ...e, [field]: value } : e
      ),
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
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!embedded ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/coach/students/${studentId}`}>
              <ChevronLeft data-icon="inline-start" />
              بازگشت
            </Link>
          </Button>
        ) : (
          <p className="text-sm font-medium">ساخت برنامه تمرین</p>
        )}
        <Button type="button" onClick={handleSave} disabled={saving}>
          <Save data-icon="inline-start" />
          {saving ? "در حال ارسال..." : "ارسال برنامه به دانشجو"}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <Label htmlFor="workout-title">عنوان برنامه</Label>
          <Input
            id="workout-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </CardContent>
      </Card>

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
              {count > 0 ? (
                <Badge variant="secondary" className="ms-1.5 h-5 min-w-5 px-1 tabular-nums">
                  {count.toLocaleString("fa-IR")}
                </Badge>
              ) : null}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">برنامه {DAY_LABELS[selectedDay]}</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={toggleRestDay}>
              {isRestDay ? "لغو روز استراحت" : "علامت‌گذاری به‌عنوان روز استراحت"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRestDay ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              این روز به‌عنوان روز استراحت تنظیم شده است.
              <Button
                type="button"
                variant="link"
                className="mt-2 block w-full"
                onClick={toggleRestDay}
              >
                فعال‌سازی و افزودن حرکت
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                onClick={() => setPickerOpen(true)}
              >
                <Plus data-icon="inline-start" />
                اضافه کردن حرکت
              </Button>

              {currentExercises.length > 0 ? (
                <div className="space-y-3">
                  {currentExercises.map((ex, index) => (
                    <Card key={ex.uid} size="sm">
                      <CardContent className="flex gap-3 pt-4">
                        {ex.imageUrl ? (
                          <img
                            src={mediaUrl(ex.imageUrl)}
                            alt={ex.name}
                            className="size-16 shrink-0 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                            {(index + 1).toLocaleString("fa-IR")}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="text-sm font-medium">{ex.name}</p>
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Label className="text-xs">ست</Label>
                              <Input
                                type="number"
                                min="1"
                                value={ex.sets}
                                onChange={(e) =>
                                  updateExercise(ex.uid, "sets", e.target.value)
                                }
                                className="h-7 w-14 tabular-nums"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Label className="text-xs">تکرار</Label>
                              <Input
                                value={ex.reps}
                                onChange={(e) =>
                                  updateExercise(ex.uid, "reps", e.target.value)
                                }
                                placeholder="۱۲"
                                className="h-7 w-16"
                              />
                            </div>
                            <span className="self-center text-[11px] text-muted-foreground">
                              {formatExerciseEntry(ex)}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeExercise(ex.uid)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                  هنوز حرکتی برای {DAY_LABELS[selectedDay]} اضافه نشده
                </p>
              )}

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
    </div>
  );
}
