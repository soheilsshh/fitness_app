"use client";

import { FiList, FiPlus, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function FeatureBulletsEditor({ value, onChange }) {
  const title = value?.title ?? "بخش";
  const items = Array.isArray(value?.items) ? value.items : [];

  const setTitle = (t) => onChange?.({ ...value, title: t });
  const setItem = (idx, text) => {
    const next = [...items];
    next[idx] = text;
    onChange?.({ ...value, items: next });
  };

  const addItem = () => {
    const next = [...items, ""];
    onChange?.({ ...value, items: next });
  };

  const removeItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    onChange?.({ ...value, items: next });
  };

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>بخش ویژگی‌ها</CardTitle>
          <p className="text-sm text-muted-foreground">
            مواردی که در صفحه اصلی کنار هم نمایش داده می‌شوند
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addItem}>
          <FiPlus />
          افزودن مورد
        </Button>
      </CardHeader>

      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>عنوان بخش</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: بخش"
          />
        </div>

        {items.map((it, idx) => (
          <div key={idx} className="rounded-xl border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <FiList />
                مورد {faNum(idx + 1)}
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeItem(idx)}
              >
                <FiTrash2 />
                حذف
              </Button>
            </div>

            <Input
              value={it}
              onChange={(e) => setItem(idx, e.target.value)}
              placeholder="مثال: برنامه شخصی‌سازی‌شده"
            />
          </div>
        ))}
      </CardContent>

      <CardContent className="pt-0 text-xs text-muted-foreground">
        بهتره متن هر مورد کوتاه و یک‌خطی باشد.
      </CardContent>
    </Card>
  );
}
