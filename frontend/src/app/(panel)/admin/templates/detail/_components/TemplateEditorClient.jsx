"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function emptyItem(dayNumber = 1) {
  return {
    dayNumber,
    orderIndex: 1,
    exerciseId: "",
    exercise: "",
    notes: "",
    workoutSystemType: "normal",
    setsDetails: [{ setNumber: 1, reps: "12", isAmrap: false }],
    gifUrl: "",
    imageUrl: "",
  };
}

function emptyForm() {
  return {
    title: "",
    type: "",
    gender: "",
    location: "",
    dayCount: 3,
    target: "",
    level: "",
    injury: "",
    items: [emptyItem(1)],
  };
}

function detailToForm(data) {
  return {
    title: data.title || "",
    type: data.type || "",
    gender: data.gender || "",
    location: data.location || "",
    dayCount: data.dayCount || 1,
    target: data.target || "",
    level: data.level || "",
    injury: data.injury || "",
    items: (data.items || []).map((it, i) => ({
      dayNumber: it.dayNumber || 1,
      orderIndex: it.orderIndex || i + 1,
      exerciseId: it.exerciseId || "",
      exercise: it.exercise || "",
      notes: it.notes || "",
      workoutSystemType: it.workoutSystemType || "normal",
      setsDetails:
        it.setsDetails?.length > 0
          ? it.setsDetails.map((s, j) => ({
              setNumber: s.setNumber || j + 1,
              reps: s.reps || "",
              isAmrap: Boolean(s.isAmrap),
            }))
          : [{ setNumber: 1, reps: "12", isAmrap: false }],
      gifUrl: it.gifUrl || "",
      imageUrl: it.imageUrl || "",
    })),
  };
}

function formToPayload(form) {
  return {
    title: form.title.trim(),
    type: form.type.trim(),
    gender: form.gender.trim(),
    location: form.location.trim(),
    dayCount: Number(form.dayCount) || 1,
    target: form.target.trim(),
    level: form.level.trim(),
    injury: form.injury.trim(),
    items: form.items.map((it, i) => ({
      dayNumber: Number(it.dayNumber) || 1,
      orderIndex: Number(it.orderIndex) || i + 1,
      exerciseId: it.exerciseId ? Number(it.exerciseId) : undefined,
      exercise: String(it.exercise || "").trim(),
      notes: String(it.notes || "").trim(),
      workoutSystemType: it.workoutSystemType || "normal",
      setsDetails: (it.setsDetails || []).map((s, j) => ({
        setNumber: Number(s.setNumber) || j + 1,
        reps: String(s.reps || "").trim(),
        isAmrap: Boolean(s.isAmrap),
      })),
    })),
  };
}

export default function TemplateEditorClient({ mode = "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isNew = mode === "new" || !id;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [exerciseResults, setExerciseResults] = useState([]);
  const [pickingIndex, setPickingIndex] = useState(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/workout-templates/${id}`);
        if (!cancelled) setForm(detailToForm(res.data || {}));
      } catch (e) {
        toastError("خطا", e?.response?.data?.error || "بارگذاری تمپلیت ناموفق بود.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  useEffect(() => {
    if (pickingIndex == null) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/admin/exercises", {
          params: { page: 1, pageSize: 12, query: exerciseQuery || undefined },
        });
        if (!cancelled) setExerciseResults(res.data?.items || []);
      } catch {
        if (!cancelled) setExerciseResults([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [exerciseQuery, pickingIndex]);

  const previewHint = useMemo(
    () => "برای انیمیشن، حرکت را از کاتالوگ انتخاب کنید یا از صفحه تمرین‌ها gif را آپدیت کنید.",
    [],
  );

  function updateItem(index, patch) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setForm((f) => ({
      ...f,
      items: [...f.items, emptyItem(Number(f.dayCount) || 1)],
    }));
  }

  function removeItem(index) {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  }

  function pickExercise(index, ex) {
    updateItem(index, {
      exerciseId: ex.id,
      exercise: ex.name,
      gifUrl: ex.gifUrl || "",
      imageUrl: ex.imageUrl || "",
    });
    setPickingIndex(null);
    setExerciseQuery("");
    setExerciseResults([]);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toastError("خطا", "عنوان تمپلیت الزامی است.");
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (isNew) {
        const res = await api.post("/admin/workout-templates", payload);
        await toastSuccess("موفق", "تمپلیت ساخته شد.");
        router.push(`/admin/templates/detail?id=${encodeURIComponent(res.data.id)}`);
      } else {
        await api.put(`/admin/workout-templates/${id}`, payload);
        await toastSuccess("موفق", "تمپلیت ذخیره شد.");
      }
    } catch (e) {
      toastError("خطا", e?.response?.data?.error || "ذخیره ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" dir="rtl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? "تمپلیت جدید" : "ویرایش تمپلیت"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{previewHint}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/templates">
            <Button variant="outline">بازگشت</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "ذخیره"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اطلاعات کلی</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["title", "عنوان", true],
            ["gender", "جنسیت"],
            ["level", "سطح"],
            ["target", "هدف"],
            ["location", "مکان"],
            ["type", "نوع"],
            ["injury", "آسیب / محدودیت"],
            ["dayCount", "تعداد روز"],
          ].map(([key, label, required]) => (
            <div key={key} className="space-y-1.5">
              <Label>
                {label}
                {required ? " *" : ""}
              </Label>
              <Input
                type={key === "dayCount" ? "number" : "text"}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">حرکات برنامه</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="size-4" /> افزودن حرکت
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز حرکتی اضافه نشده.</p>
          ) : (
            form.items.map((it, index) => {
              const preview = apiAssetUrl(it.gifUrl || it.imageUrl);
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-14 overflow-hidden rounded-lg border bg-background">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center text-[10px] text-muted-foreground">
                            بدون انیمیشن
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          حرکت {index + 1}
                          {it.exerciseId ? (
                            <Link
                              className="ms-2 text-xs text-primary hover:underline"
                              href={`/admin/exercises/detail?id=${encodeURIComponent(it.exerciseId)}`}
                            >
                              ویرایش انیمیشن
                            </Link>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          با لینک به کاتالوگ، انیمیشن خودکار می‌آید
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label>روز</Label>
                      <Input
                        type="number"
                        value={it.dayNumber}
                        onChange={(e) =>
                          updateItem(index, { dayNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>نام حرکت</Label>
                      <Input
                        value={it.exercise}
                        onChange={(e) =>
                          updateItem(index, { exercise: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>تکرار ست ۱</Label>
                      <Input
                        value={it.setsDetails?.[0]?.reps || ""}
                        onChange={(e) =>
                          updateItem(index, {
                            setsDetails: [
                              {
                                setNumber: 1,
                                reps: e.target.value,
                                isAmrap: false,
                              },
                            ],
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setPickingIndex(index);
                        setExerciseQuery(it.exercise || "");
                      }}
                    >
                      انتخاب از کاتالوگ تمرین
                    </Button>
                    {pickingIndex === index && (
                      <div className="mt-2 rounded-lg border bg-background p-3">
                        <Input
                          placeholder="جستجوی حرکت…"
                          value={exerciseQuery}
                          onChange={(e) => setExerciseQuery(e.target.value)}
                          className="mb-2"
                        />
                        <div className="max-h-48 space-y-1 overflow-auto">
                          {exerciseResults.map((ex) => (
                            <button
                              key={ex.id}
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted"
                              onClick={() => pickExercise(index, ex)}
                            >
                              <span className="truncate font-medium">{ex.name}</span>
                              <span className="ms-auto text-xs text-muted-foreground">
                                {ex.gifUrl ? "انیمیشن دارد" : "بدون انیمیشن"}
                              </span>
                            </button>
                          ))}
                          {exerciseResults.length === 0 && (
                            <p className="text-xs text-muted-foreground">نتیجه‌ای نیست.</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => setPickingIndex(null)}
                        >
                          بستن
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
