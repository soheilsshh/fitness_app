"use client";

import { useMemo, useState } from "react";
import { Percent, Save, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function formatNumber(v) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(v) || 0);
  } catch {
    return String(v ?? 0);
  }
}

function formatWithSeparator(v) {
  const num = Number(String(v).replace(/,/g, ""));
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("en-US");
}

function removeSeparator(v) {
  return String(v).replace(/,/g, "");
}

function PriceField({ label, value, onChange }) {
  const [display, setDisplay] = useState(formatWithSeparator(value || ""));

  const handleChange = (e) => {
    const raw = removeSeparator(e.target.value);
    if (!/^\d*$/.test(raw)) return;
    setDisplay(formatWithSeparator(raw));
    onChange(Number(raw));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={display}
        onChange={handleChange}
        inputMode="numeric"
        placeholder="مثال: 2,400,000"
        className="tabular-nums"
      />
    </div>
  );
}

export default function PlanForm({ mode = "create", initialValue, onSubmit, submitText }) {
  const [value, setValue] = useState(initialValue);

  const price = Number(value.price || 0);
  const discountPrice = Number(value.discountPrice || 0);
  const discountPercent = Number(value.discountPercent || 0);

  const computed = useMemo(() => {
    const finalPrice = discountPrice > 0 ? discountPrice : price;
    const hasDiscount = discountPercent > 0 || discountPrice > 0;
    return { finalPrice, hasDiscount };
  }, [price, discountPrice, discountPercent]);

  const setField = (k, v) => setValue((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...value,
      price: Number(value.price || 0),
      discountPrice: Number(value.discountPrice || 0),
      discountPercent: Number(value.discountPercent || 0),
      durationDays: Number(value.durationDays || 0),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-start">
              <CardTitle className="text-base">اطلاعات پلن</CardTitle>
              <CardDescription>
                عنوان، توضیحات و اطلاعات قیمت‌گذاری
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Card size="sm">
                <CardContent className="pt-4 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="size-3.5 text-primary" />
                    قیمت نهایی:
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatNumber(computed.finalPrice)}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {computed.hasDiscount ? "دارای تخفیف" : "بدون تخفیف"}
                  </Badge>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="space-y-2 pt-4">
                  <Label className="text-xs text-muted-foreground">نوع پلن</Label>
                  <ToggleGroup
                    type="single"
                    value={value.planType}
                    onValueChange={(v) => v && setField("planType", v)}
                    variant="outline"
                    size="sm"
                    className="flex flex-wrap"
                  >
                    <ToggleGroupItem value="workout">تمرین</ToggleGroupItem>
                    <ToggleGroupItem value="nutrition">تغذیه</ToggleGroupItem>
                    <ToggleGroupItem value="both">هر دو</ToggleGroupItem>
                  </ToggleGroup>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
              <FormField
                label="عنوان"
                value={value.title}
                onChange={(v) => setField("title", v)}
                placeholder="مثال: پلن حرفه‌ای"
                required
              />
              <FormField
                label="اسم دوره"
                value={value.courseName}
                onChange={(v) => setField("courseName", v)}
                placeholder="مثال: دوره بدنسازی ۸ هفته‌ای"
              />
              <div className="md:col-span-2">
                <TextFormField
                  label="توضیحات"
                  value={value.description}
                  onChange={(v) => setField("description", v)}
                  placeholder="توضیحات دوره را بنویسید..."
                  rows={5}
                />
              </div>
              <div className="md:col-span-2">
                <TextFormField
                  label="ویژگی‌های دوره / متن توضیحی"
                  value={value.featuresText}
                  onChange={(v) => setField("featuresText", v)}
                  placeholder={"هر خط یک ویژگی...\n• دسترسی کامل\n• پشتیبانی"}
                  rows={6}
                />
              </div>
            </div>

            <Card size="sm" className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">قیمت‌گذاری</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  label="مدت زمان دوره (روز)"
                  value={String(value.durationDays ?? "")}
                  onChange={(v) => setField("durationDays", v.replace(/[^\d]/g, ""))}
                  placeholder="مثال: 30"
                />
                <PriceField
                  label="قیمت اصلی"
                  value={value.price}
                  onChange={(num) => setField("price", num)}
                />
                <PriceField
                  label="قیمت با تخفیف"
                  value={value.discountPrice}
                  onChange={(num) => setField("discountPrice", num)}
                />
                <div className="space-y-2">
                  <Label>درصد تخفیف</Label>
                  <div className="relative">
                    <Input
                      value={String(value.discountPercent ?? "")}
                      onChange={(e) => setField("discountPercent", e.target.value)}
                      type="number"
                      placeholder="مثال: 20"
                      className="pe-9 tabular-nums"
                    />
                    <Percent className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Checkbox
                    id="plan-popular"
                    checked={Boolean(value.isPopular)}
                    onCheckedChange={(checked) => setField("isPopular", !!checked)}
                  />
                  <Label htmlFor="plan-popular" className="font-medium">
                    پلن محبوب (Popular)
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">
          <Save data-icon="inline-start" />
          {submitText || (mode === "create" ? "ساخت پلن" : "ذخیره تغییرات")}
        </Button>
      </div>
    </form>
  );
}

function FormField({ label, value, onChange, placeholder, required }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function TextFormField({ label, value, onChange, placeholder, rows = 5 }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}
