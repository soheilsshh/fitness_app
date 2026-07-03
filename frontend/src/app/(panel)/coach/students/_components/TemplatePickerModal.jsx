"use client";

import { useEffect, useMemo, useState } from "react";
import { Apple, Dumbbell, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assignNutritionTemplateToStudent,
  assignWorkoutTemplateToStudent,
  listNutritionTemplates,
  listWorkoutTemplates,
} from "@/lib/api/coach";

const WORKOUT_FILTER_OPTIONS = {
  gender: [
    { value: "all", label: "همه" },
    { value: "آقا", label: "آقا" },
    { value: "خانم", label: "خانم" },
    { value: "هر دو", label: "هر دو" },
  ],
  level: [
    { value: "all", label: "همه سطوح" },
    { value: "مبتدی", label: "مبتدی" },
    { value: "متوسط", label: "متوسط" },
    { value: "پیشرفته", label: "پیشرفته" },
  ],
  target: [
    { value: "all", label: "همه اهداف" },
    { value: "حجم", label: "حجم" },
    { value: "کات", label: "کات" },
    { value: "کاهش وزن", label: "کاهش وزن" },
    { value: "افزایش وزن", label: "افزایش وزن" },
    { value: "تثبیت", label: "تثبیت" },
  ],
  location: [
    { value: "all", label: "همه مکان‌ها" },
    { value: "باشگاه", label: "باشگاه" },
    { value: "خانه", label: "خانه" },
    { value: "منزل", label: "منزل" },
  ],
};

const NUTRITION_FILTER_OPTIONS = {
  target: [
    { value: "all", label: "همه اهداف" },
    { value: "تثبیت", label: "تثبیت" },
    { value: "کاهش وزن", label: "کاهش وزن" },
    { value: "حجم", label: "حجم" },
  ],
};

function normalizeTemplate(item) {
  return {
    id: item.id,
    title: item.title || "تمپلیت بدون عنوان",
    type: item.type || "",
    gender: item.gender || "",
    level: item.level || "",
    target: item.target || "",
    location: item.location || "",
    dayCount: item.dayCount || item.day_count || 0,
    calorie: item.calorie || 0,
  };
}

function includesFilter(value, filterValue) {
  if (!filterValue || filterValue === "all") return true;
  if (!value) return false;
  return String(value).includes(filterValue);
}

export default function TemplatePickerModal({
  open,
  onClose,
  mode,
  studentId,
  onApplied,
}) {
  const isWorkout = mode === "workout";
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [applyingId, setApplyingId] = useState(null);
  const [workoutFilters, setWorkoutFilters] = useState({
    gender: "all",
    level: "all",
    target: "all",
    location: "all",
  });
  const [nutritionFilters, setNutritionFilters] = useState({
    target: "all",
    calorie: "all",
  });

  useEffect(() => {
    if (!open || !studentId) return;
    let cancelled = false;

    async function loadTemplates() {
      setLoading(true);
      try {
        const payload = isWorkout
          ? await listWorkoutTemplates()
          : await listNutritionTemplates();
        if (cancelled) return;
        setItems(payload.map(normalizeTemplate));
      } catch (error) {
        if (!cancelled) {
          toastError(
            "خطا",
            error?.response?.data?.error || "بارگذاری تمپلیت‌ها ناموفق بود.",
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [open, studentId, isWorkout]);

  const handleClose = () => {
    setApplyingId(null);
    setWorkoutFilters({
      gender: "all",
      level: "all",
      target: "all",
      location: "all",
    });
    setNutritionFilters({
      target: "all",
      calorie: "all",
    });
    onClose?.();
  };

  const calorieOptions = useMemo(() => {
    const uniq = Array.from(
      new Set(
        items
          .map((item) => Number(item.calorie))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    ).sort((a, b) => a - b);
    return uniq.slice(0, 20);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (isWorkout) {
      return items.filter(
        (item) =>
          includesFilter(item.gender, workoutFilters.gender) &&
          includesFilter(item.level, workoutFilters.level) &&
          includesFilter(item.target, workoutFilters.target) &&
          includesFilter(item.location, workoutFilters.location),
      );
    }
    return items.filter((item) => {
      const targetMatched = includesFilter(item.target, nutritionFilters.target);
      const calorieMatched =
        nutritionFilters.calorie === "all" ||
        Number(item.calorie) === Number(nutritionFilters.calorie);
      return targetMatched && calorieMatched;
    });
  }, [items, isWorkout, workoutFilters, nutritionFilters]);

  const handleApply = async (templateId) => {
    if (!studentId || applyingId) return;
    setApplyingId(templateId);
    try {
      if (isWorkout) {
        await assignWorkoutTemplateToStudent(studentId, templateId);
      } else {
        await assignNutritionTemplateToStudent(studentId, templateId);
      }
      await toastSuccess("موفق", "برنامه تمپلیت با موفقیت اعمال شد.");
      await onApplied?.();
      handleClose();
    } catch (error) {
      toastError(
        "خطا",
        error?.response?.data?.error || "اعمال تمپلیت ناموفق بود.",
      );
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-4xl" dir="rtl">
        <DialogHeader className="border-b px-5 py-4 text-start">
          <DialogTitle className="flex items-center gap-2">
            {isWorkout ? (
              <Dumbbell className="size-4 text-primary" />
            ) : (
              <Apple className="size-4 text-primary" />
            )}
            {isWorkout ? "بانک تمپلیت تمرینی" : "بانک تمپلیت تغذیه"}
          </DialogTitle>
          <DialogDescription>
            تمپلیت را فیلتر کنید و مستقیماً برای دانشجو اعمال نمایید.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b px-5 py-4">
          {isWorkout ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                value={workoutFilters.gender}
                onValueChange={(value) =>
                  setWorkoutFilters((prev) => ({ ...prev, gender: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="جنسیت" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_FILTER_OPTIONS.gender.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={workoutFilters.level}
                onValueChange={(value) =>
                  setWorkoutFilters((prev) => ({ ...prev, level: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="سطح" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_FILTER_OPTIONS.level.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={workoutFilters.target}
                onValueChange={(value) =>
                  setWorkoutFilters((prev) => ({ ...prev, target: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="هدف" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_FILTER_OPTIONS.target.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={workoutFilters.location}
                onValueChange={(value) =>
                  setWorkoutFilters((prev) => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="محل تمرین" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_FILTER_OPTIONS.location.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                value={nutritionFilters.target}
                onValueChange={(value) =>
                  setNutritionFilters((prev) => ({ ...prev, target: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="هدف تغذیه" />
                </SelectTrigger>
                <SelectContent>
                  {NUTRITION_FILTER_OPTIONS.target.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={nutritionFilters.calorie}
                onValueChange={(value) =>
                  setNutritionFilters((prev) => ({ ...prev, calorie: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="کالری کل برنامه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه کالری‌ها</SelectItem>
                  {calorieOptions.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value.toLocaleString("fa-IR")} kcal
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-44 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              تمپلیتی با این فیلترها پیدا نشد.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-base">{item.title}</CardTitle>
                    <CardDescription className="flex flex-wrap gap-1 text-start">
                      {item.gender ? <Badge variant="outline">{item.gender}</Badge> : null}
                      {item.level ? <Badge variant="outline">{item.level}</Badge> : null}
                      {item.target ? <Badge variant="outline">{item.target}</Badge> : null}
                      {isWorkout && item.location ? (
                        <Badge variant="outline">{item.location}</Badge>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                      {isWorkout ? (
                        <span>
                          تعداد روزها:{" "}
                          <strong className="tabular-nums">
                            {(item.dayCount || 0).toLocaleString("fa-IR")}
                          </strong>
                        </span>
                      ) : (
                        <span>
                          کالری کل:{" "}
                          <strong className="tabular-nums">
                            {(item.calorie || 0).toLocaleString("fa-IR")} kcal
                          </strong>
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={Boolean(applyingId)}
                      onClick={() => handleApply(item.id)}
                    >
                      {applyingId === item.id ? (
                        <>
                          <Loader2 data-icon="inline-start" className="animate-spin" />
                          در حال اعمال...
                        </>
                      ) : (
                        "بارگذاری و اعمال برنامه"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
