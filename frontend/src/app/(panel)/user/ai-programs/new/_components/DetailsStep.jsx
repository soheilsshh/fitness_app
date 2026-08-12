"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const EQUIPMENT_OPTIONS = [
  { value: "none", label: "بدون تجهیزات" },
  { value: "dumbbell", label: "دمبل" },
  { value: "barbell", label: "هالتر" },
  { value: "band", label: "کش" },
  { value: "full_gym", label: "باشگاه کامل" },
];

export const DAYS_OPTIONS = [2, 3, 4, 5, 6];
export const SESSION_MINUTES_OPTIONS = [20, 30, 45, 60, 90];

export const LIMITATION_OPTIONS = [
  { value: "knee", label: "زانو" },
  { value: "back", label: "کمر" },
  { value: "shoulder", label: "شانه" },
  { value: "pregnancy", label: "بارداری" },
  { value: "none", label: "بدون محدودیت" },
];

export default function DetailsStep({ value, onChange, onNext, onBack, saving }) {
  const { equipment, daysPerWeek, sessionMinutes, limitations } = value;

  const toggleEquipment = (next) => onChange({ ...value, equipment: next });

  const toggleLimitations = (next) => {
    const prevHadNone = limitations.includes("none");
    const nextHasNone = next.includes("none");
    if (nextHasNone && !prevHadNone) {
      onChange({ ...value, limitations: ["none"] });
      return;
    }
    onChange({ ...value, limitations: next.filter((v) => v !== "none") });
  };

  const canContinue =
    equipment.length > 0 && daysPerWeek && sessionMinutes && limitations.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-iranianSansDemiBold text-foreground">جزئیات برنامه</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          این موارد فقط برای همین برنامه استفاده می‌شوند تا هوش مصنوعی متناسب با امکانات شما بسازد.
        </p>
      </div>

      <div className="space-y-2">
        <Label>تجهیزات در دسترس</Label>
        <ToggleGroup
          type="multiple"
          value={equipment}
          onValueChange={toggleEquipment}
          variant="outline"
          className="flex flex-wrap gap-2"
        >
          {EQUIPMENT_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value} className="h-10 px-4 text-xs sm:text-sm">
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label>روزهای تمرین در هفته</Label>
        <ToggleGroup
          type="single"
          value={daysPerWeek ? String(daysPerWeek) : ""}
          onValueChange={(v) => v && onChange({ ...value, daysPerWeek: Number(v) })}
          variant="outline"
          className="flex flex-wrap gap-2"
        >
          {DAYS_OPTIONS.map((d) => (
            <ToggleGroupItem key={d} value={String(d)} className="h-10 w-14 text-xs sm:text-sm">
              {d.toLocaleString("fa-IR")} روز
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label>مدت هر جلسه (دقیقه)</Label>
        <ToggleGroup
          type="single"
          value={sessionMinutes ? String(sessionMinutes) : ""}
          onValueChange={(v) => v && onChange({ ...value, sessionMinutes: Number(v) })}
          variant="outline"
          className="flex flex-wrap gap-2"
        >
          {SESSION_MINUTES_OPTIONS.map((m) => (
            <ToggleGroupItem key={m} value={String(m)} className="h-10 w-14 text-xs sm:text-sm">
              {m.toLocaleString("fa-IR")}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label>محدودیت‌های جسمی</Label>
        <ToggleGroup
          type="multiple"
          value={limitations}
          onValueChange={toggleLimitations}
          variant="outline"
          className="flex flex-wrap gap-2"
        >
          {LIMITATION_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value} className="h-10 px-4 text-xs sm:text-sm">
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={saving} className="h-11 gap-2">
          <ArrowRight data-icon="inline-start" />
          قبلی
        </Button>
        <Button type="button" onClick={onNext} disabled={!canContinue || saving} className="h-11 gap-2">
          {saving ? "لطفاً صبر کنید..." : "ادامه"}
          <ArrowLeft data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
