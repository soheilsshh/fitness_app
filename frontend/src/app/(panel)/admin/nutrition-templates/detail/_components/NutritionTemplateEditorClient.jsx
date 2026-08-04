"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function emptyItem() {
  return {
    menuName: "",
    orderIndex: 1,
    foodId: "",
    foodName: "",
    unit: "",
    value: 1,
    description: "",
  };
}

function emptyMeal(order = 1) {
  return {
    mealOrder: order,
    mealName: "",
    mealCalorie: 0,
    startTime: "",
    endTime: "",
    items: [emptyItem()],
  };
}

function emptyForm() {
  return {
    title: "",
    type: "",
    gender: "",
    target: "",
    limitation: "",
    calorie: 0,
    description: "",
    isPro: false,
    meals: [emptyMeal(1)],
  };
}

function detailToForm(data) {
  return {
    title: data.title || "",
    type: data.type || "",
    gender: data.gender || "",
    target: data.target || "",
    limitation: data.limitation || "",
    calorie: data.calorie || 0,
    description: data.description || "",
    isPro: Boolean(data.isPro),
    meals:
      data.meals?.length > 0
        ? data.meals.map((m, i) => ({
            mealOrder: m.mealOrder || i + 1,
            mealName: m.mealName || "",
            mealCalorie: m.mealCalorie || 0,
            startTime: m.startTime || "",
            endTime: m.endTime || "",
            items:
              m.items?.length > 0
                ? m.items.map((it, j) => ({
                    menuName: it.menuName || "",
                    orderIndex: it.orderIndex || j + 1,
                    foodId: it.foodId || "",
                    foodName: it.foodName || "",
                    unit: it.unit || "",
                    value: it.value ?? 1,
                    description: it.description || "",
                  }))
                : [emptyItem()],
          }))
        : [emptyMeal(1)],
  };
}

function formToPayload(form) {
  return {
    title: form.title.trim(),
    type: form.type.trim(),
    gender: form.gender.trim(),
    target: form.target.trim(),
    limitation: form.limitation.trim(),
    calorie: Number(form.calorie) || 0,
    description: form.description.trim(),
    isPro: Boolean(form.isPro),
    meals: form.meals.map((m, i) => ({
      mealOrder: Number(m.mealOrder) || i + 1,
      mealName: String(m.mealName || "").trim(),
      mealCalorie: Number(m.mealCalorie) || 0,
      startTime: String(m.startTime || "").trim(),
      endTime: String(m.endTime || "").trim(),
      items: (m.items || []).map((it, j) => ({
        menuName: String(it.menuName || "").trim(),
        orderIndex: Number(it.orderIndex) || j + 1,
        foodId: it.foodId ? Number(it.foodId) : undefined,
        foodName: String(it.foodName || "").trim(),
        unit: String(it.unit || "").trim(),
        value: Number(it.value) || 0,
        description: String(it.description || "").trim(),
      })),
    })),
  };
}

export default function NutritionTemplateEditorClient({ mode = "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isNew = mode === "new" || !id;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState([]);
  const [picking, setPicking] = useState(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/nutrition-templates/${id}`);
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
    if (!picking) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/admin/foods", {
          params: { page: 1, limit: 12, query: foodQuery || undefined },
        });
        if (!cancelled) setFoodResults(res.data?.items || []);
      } catch {
        if (!cancelled) setFoodResults([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [foodQuery, picking]);

  function updateMeal(mealIndex, patch) {
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === mealIndex ? { ...m, ...patch } : m)),
    }));
  }

  function updateItem(mealIndex, itemIndex, patch) {
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) =>
        i === mealIndex
          ? {
              ...m,
              items: m.items.map((it, j) =>
                j === itemIndex ? { ...it, ...patch } : it,
              ),
            }
          : m,
      ),
    }));
  }

  function addMeal() {
    setForm((f) => ({
      ...f,
      meals: [...f.meals, emptyMeal(f.meals.length + 1)],
    }));
  }

  function removeMeal(index) {
    setForm((f) => ({
      ...f,
      meals: f.meals.filter((_, i) => i !== index),
    }));
  }

  function addItem(mealIndex) {
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) =>
        i === mealIndex
          ? { ...m, items: [...m.items, emptyItem()] }
          : m,
      ),
    }));
  }

  function removeItem(mealIndex, itemIndex) {
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) =>
        i === mealIndex
          ? { ...m, items: m.items.filter((_, j) => j !== itemIndex) }
          : m,
      ),
    }));
  }

  function pickFood(mealIndex, itemIndex, food) {
    updateItem(mealIndex, itemIndex, {
      foodId: food.id,
      foodName: food.name,
      unit: food.unit || "",
      value: food.amount || 1,
    });
    setPicking(null);
    setFoodQuery("");
    setFoodResults([]);
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
        const res = await api.post("/admin/nutrition-templates", payload);
        await toastSuccess("موفق", "تمپلیت تغذیه ساخته شد.");
        router.push(
          `/admin/nutrition-templates/detail?id=${encodeURIComponent(res.data.id)}`,
        );
      } else {
        await api.put(`/admin/nutrition-templates/${id}`, payload);
        await toastSuccess("موفق", "تمپلیت تغذیه ذخیره شد.");
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
            {isNew ? "تمپلیت تغذیه جدید" : "ویرایش تمپلیت تغذیه"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مشخصات و وعده‌های غذایی تمپلیت
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/nutrition-templates">بازگشت</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            ذخیره
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اطلاعات کلی</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>عنوان</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>نوع</Label>
            <Input
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>جنسیت</Label>
            <Input
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>هدف</Label>
            <Input
              value={form.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>محدودیت</Label>
            <Input
              value={form.limitation}
              onChange={(e) =>
                setForm((f) => ({ ...f, limitation: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>کالری</Label>
            <Input
              type="number"
              value={form.calorie}
              onChange={(e) =>
                setForm((f) => ({ ...f, calorie: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>توضیحات</Label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">وعده‌ها</h2>
        <Button type="button" variant="outline" size="sm" onClick={addMeal}>
          <Plus className="size-4" /> وعده جدید
        </Button>
      </div>

      {form.meals.map((meal, mealIndex) => (
        <Card key={mealIndex}>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">
              وعده {mealIndex + 1}
              {meal.mealName ? ` — ${meal.mealName}` : ""}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeMeal(mealIndex)}
              disabled={form.meals.length <= 1}
            >
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label>نام وعده</Label>
                <Input
                  value={meal.mealName}
                  onChange={(e) =>
                    updateMeal(mealIndex, { mealName: e.target.value })
                  }
                  placeholder="صبحانه"
                />
              </div>
              <div className="space-y-2">
                <Label>کالری وعده</Label>
                <Input
                  type="number"
                  value={meal.mealCalorie}
                  onChange={(e) =>
                    updateMeal(mealIndex, { mealCalorie: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>شروع</Label>
                <Input
                  value={meal.startTime}
                  onChange={(e) =>
                    updateMeal(mealIndex, { startTime: e.target.value })
                  }
                  placeholder="08:00"
                />
              </div>
              <div className="space-y-2">
                <Label>پایان</Label>
                <Input
                  value={meal.endTime}
                  onChange={(e) =>
                    updateMeal(mealIndex, { endTime: e.target.value })
                  }
                  placeholder="09:00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>آیتم‌های غذایی</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(mealIndex)}
                >
                  <Plus className="size-4" /> آیتم
                </Button>
              </div>

              {meal.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="grid gap-2 md:grid-cols-5">
                    <Input
                      placeholder="نام منو"
                      value={item.menuName}
                      onChange={(e) =>
                        updateItem(mealIndex, itemIndex, {
                          menuName: e.target.value,
                        })
                      }
                    />
                    <Input
                      className="md:col-span-2"
                      placeholder="نام غذا"
                      value={item.foodName}
                      onChange={(e) =>
                        updateItem(mealIndex, itemIndex, {
                          foodName: e.target.value,
                        })
                      }
                      onFocus={() => setPicking({ mealIndex, itemIndex })}
                    />
                    <Input
                      placeholder="واحد"
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(mealIndex, itemIndex, {
                          unit: e.target.value,
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="مقدار"
                        value={item.value}
                        onChange={(e) =>
                          updateItem(mealIndex, itemIndex, {
                            value: e.target.value,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(mealIndex, itemIndex)}
                        disabled={meal.items.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {picking?.mealIndex === mealIndex &&
                  picking?.itemIndex === itemIndex ? (
                    <div className="space-y-2 rounded-md bg-muted/40 p-2">
                      <Input
                        placeholder="جستجوی غذا از کاتالوگ…"
                        value={foodQuery}
                        onChange={(e) => setFoodQuery(e.target.value)}
                      />
                      <div className="max-h-40 space-y-1 overflow-auto">
                        {foodResults.map((food) => (
                          <button
                            key={food.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-start text-sm hover:bg-background"
                            onClick={() =>
                              pickFood(mealIndex, itemIndex, food)
                            }
                          >
                            <span>{food.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {food.calories} kcal
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
