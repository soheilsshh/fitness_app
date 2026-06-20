"use client";

import { FiList, FiPlus, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

// Icon keys must match PILLAR_ICONS in AboutSection.js.
const ICON_OPTIONS = [
  { value: "award", label: "مدال / تایید" },
  { value: "dumbbell", label: "دمبل / تمرین" },
  { value: "apple", label: "تغذیه" },
  { value: "trending", label: "نمودار رشد" },
  { value: "message", label: "پیام / پشتیبانی" },
  { value: "heartbeat", label: "سلامت" },
];

function newId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function PillarsEditor({ value, onChange }) {
  const pillars = Array.isArray(value) ? value : [];

  const setField = (id, key, val) => {
    const next = pillars.map((p) => (p.id === id ? { ...p, [key]: val } : p));
    onChange?.(next);
  };

  const addPillar = () => {
    onChange?.([...pillars, { id: newId(), icon: "award", title: "", desc: "" }]);
  };

  const removePillar = (id) => {
    onChange?.(pillars.filter((p) => p.id !== id));
  };

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>چرا FitPro؟ (ویژگی‌ها)</CardTitle>
          <p className="text-sm text-muted-foreground">
            کارت‌های مزیت که در بخش «چرا FitPro» نمایش داده می‌شوند
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addPillar}>
          <FiPlus />
          افزودن مورد
        </Button>
      </CardHeader>

      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p, idx) => (
          <div key={p.id} className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <FiList />
                مورد {faNum(idx + 1)}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removePillar(p.id)}
              >
                <FiTrash2 />
                حذف
              </Button>
            </div>

            <div className="space-y-2">
              <Label>آیکون</Label>
              <Select
                value={p.icon ?? "award"}
                onValueChange={(v) => setField(p.id, "icon", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب آیکون" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
                value={p.title ?? ""}
                onChange={(e) => setField(p.id, "title", e.target.value)}
                placeholder="مثال: برنامه تمرین اختصاصی"
              />
            </div>

            <div className="space-y-2">
              <Label>متن</Label>
              <Textarea
                value={p.desc ?? ""}
                onChange={(e) => setField(p.id, "desc", e.target.value)}
                rows={3}
                className="resize-none"
                placeholder="توضیح کوتاه..."
              />
            </div>
          </div>
        ))}
      </CardContent>

      <CardContent className="pt-0 text-xs text-muted-foreground">
        متن هر مورد کوتاه باشد تا در موبایل به‌هم نریزد.
      </CardContent>
    </Card>
  );
}
