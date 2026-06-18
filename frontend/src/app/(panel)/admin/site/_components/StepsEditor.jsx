"use client";

import { FiClipboard } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function StepsEditor({ value, onChange }) {
  const steps = Array.isArray(value) ? value : [];

  const setField = (id, key, val) => {
    const next = steps.map((s) => (s.id === id ? { ...s, [key]: val } : s));
    onChange?.(next);
  };

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>کارت‌های توضیحی</CardTitle>
          <p className="text-sm text-muted-foreground">عنوان + متن کوتاه (سه کارت)</p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          <FiClipboard className="text-cyan-500" />
          {faNum(steps.length)} کارت
        </span>
      </CardHeader>

      <CardContent className="grid gap-3 lg:grid-cols-3">
        {steps.map((c) => (
          <div key={c.id} className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
              value={c.title ?? ""}
              onChange={(e) => setField(c.id, "title", e.target.value)}
              placeholder="مثال: ثبت پیشرفت"
            />
            </div>

            <div className="space-y-2">
              <Label>متن</Label>
              <Textarea
              value={c.text ?? ""}
              onChange={(e) => setField(c.id, "text", e.target.value)}
              rows={4}
              className="resize-none"
              placeholder="توضیح کوتاه کارت..."
            />
            </div>
          </div>
        ))}
      </CardContent>

      <CardContent className="pt-0 text-xs text-muted-foreground">
        متن‌ها کوتاه باشند تا در موبایل به‌هم نریزد.
      </CardContent>
    </Card>
  );
}
