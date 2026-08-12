"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function ageFromBirthDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const years = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.floor(years));
}

function birthDateFromAge(age) {
  const n = Number(age);
  if (!Number.isFinite(n) || n <= 0) return null;
  const year = new Date().getFullYear() - Math.round(n);
  return `${year}-01-01`;
}

export default function InfoStep({ profile, onNext, onBack, saving }) {
  const [age, setAge] = useState(() => ageFromBirthDate(profile?.birthDate) || "");
  const [heightCm, setHeightCm] = useState(() => profile?.heightCm ?? "");
  const [weightKg, setWeightKg] = useState(() => profile?.weightKg ?? "");
  const [gender, setGender] = useState(() => profile?.gender || "");
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    if (!heightCm || !weightKg || !age || !gender) {
      setError("همه فیلدها را پر کنید تا هوش مصنوعی بتواند برنامه دقیقی بسازد.");
      return;
    }
    const payload = {
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      gender,
    };
    const bd = birthDateFromAge(age);
    if (bd) payload.birthDate = bd;
    onNext(payload);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-iranianSansDemiBold text-foreground">اطلاعات شما</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          این اطلاعات در پروفایل شما هم ذخیره می‌شود و پایه محاسبات هوش مصنوعی است.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ai-age">سن (سال)</Label>
          <Input
            id="ai-age"
            type="number"
            inputMode="numeric"
            min={13}
            max={100}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>جنسیت</Label>
          <ToggleGroup
            type="single"
            value={gender}
            onValueChange={(v) => v && setGender(v)}
            variant="outline"
            className="grid w-full grid-cols-2 gap-2"
          >
            <ToggleGroupItem value="male" className="h-12">
              مرد
            </ToggleGroupItem>
            <ToggleGroupItem value="female" className="h-12">
              زن
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai-height">قد (سانتی‌متر)</Label>
          <Input
            id="ai-height"
            type="number"
            inputMode="numeric"
            min={80}
            max={250}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai-weight">وزن (کیلوگرم)</Label>
          <Input
            id="ai-weight"
            type="number"
            inputMode="numeric"
            min={20}
            max={300}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={saving} className="h-11 gap-2">
          <ArrowRight data-icon="inline-start" />
          قبلی
        </Button>
        <Button type="button" onClick={submit} disabled={saving} className="h-11 gap-2">
          {saving ? "لطفاً صبر کنید..." : "ادامه"}
          <ArrowLeft data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
