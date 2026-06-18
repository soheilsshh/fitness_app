"use client";

import { FiBarChart2 } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function StatsEditor({ value, onChange }) {
  const stats = Array.isArray(value) ? value : [];

  const setField = (id, key, val) => {
    const next = stats.map((s) => (s.id === id ? { ...s, [key]: val } : s));
    onChange?.(next);
  };

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>آمار صفحه اصلی</CardTitle>
          <p className="text-sm text-muted-foreground">مقادیر کوتاه + عنوان زیرش</p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          <FiBarChart2 className="text-emerald-500" />
          {faNum(stats.length)} آیتم
        </span>
      </CardHeader>

      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.id} className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
              value={s.label ?? ""}
              onChange={(e) => setField(s.id, "label", e.target.value)}
              placeholder="مثال: کاربر فعال"
            />
            </div>

            <div className="space-y-2">
              <Label>مقدار</Label>
              <Input
              value={s.value ?? ""}
              onChange={(e) => setField(s.id, "value", e.target.value)}
              placeholder="مثال: 12,500+"
            />
            </div>
          </div>
        ))}
      </CardContent>

      <CardContent className="pt-0 text-xs text-muted-foreground">
        پیشنهاد: مقدارها کوتاه و قابل خواندن باشند.
      </CardContent>
    </Card>
  );
}
