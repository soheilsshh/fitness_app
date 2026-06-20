"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, Send, Sparkles } from "lucide-react";
import {
  ACTIVITY_LEVELS,
  CALORIE_GOALS,
  calculateCaloriePlan,
} from "@/lib/tools/calorieCalculator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function CalorieAnalyzerCard({
  studentId,
  defaultAge,
  defaultGender,
  defaultHeightCm,
  defaultWeightKg,
}) {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [goal, setGoal] = useState("maintain");
  const [autoFilled, setAutoFilled] = useState(false);

  const fillFromStudent = () => {
    if (defaultAge != null) setAge(String(defaultAge));
    if (defaultGender) setGender(defaultGender);
    if (defaultHeightCm != null) setHeightCm(String(defaultHeightCm));
    if (defaultWeightKg != null) setWeightKg(String(defaultWeightKg));
    setAutoFilled(true);
  };

  const result = useMemo(() => {
    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);
    if (!ageNum || !heightNum || !weightNum) return null;
    return calculateCaloriePlan({
      age: ageNum,
      gender,
      heightCm: heightNum,
      weightKg: weightNum,
      activityLevel,
      goal,
    });
  }, [age, gender, heightCm, weightKg, activityLevel, goal]);

  const selectedActivity = ACTIVITY_LEVELS.find((l) => l.id === activityLevel);
  const selectedGoal = CALORIE_GOALS.find((g) => g.id === goal);
  const canAutoFill =
    defaultAge != null && defaultHeightCm != null && defaultWeightKg != null;

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="size-4 text-primary" />
          محاسبه‌گر و تحلیل‌گر کالری
        </CardTitle>
        <CardDescription>
          تخمین BMR و TDEE با فرمول Mifflin–St Jeor — قابل اعمال در برنامه غذایی
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className={"cursor-pointer"}
          size="sm"
          disabled={!canAutoFill}
          onClick={fillFromStudent}
        >
          <Sparkles data-icon="inline-start" />
          محاسبه خودکار از اطلاعات دانشجو
        </Button>
        {!canAutoFill ? (
          <p className="text-xs text-muted-foreground">
            برای پر کردن خودکار، سن، قد و وزن دانشجو باید در پروفایل ثبت شده باشد.
          </p>
        ) : autoFilled ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            اطلاعات دانشجو در فرم زیر بارگذاری شد.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="سن (سال)">
            <Input
              type="number"
              min={10}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="مثلاً ۲۸"
              className="tabular-nums"
            />
          </FormField>
          <FormField label="جنسیت">
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">مرد</SelectItem>
                <SelectItem value="female">زن</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="قد (سانتی‌متر)">
            <Input
              type="number"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="tabular-nums"
            />
          </FormField>
          <FormField label="وزن (کیلوگرم)">
            <Input
              type="number"
              min={30}
              max={300}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="tabular-nums"
            />
          </FormField>
        </div>

        <FormField label="سطح فعالیت">
          <Select value={activityLevel} onValueChange={setActivityLevel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_LEVELS.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedActivity ? (
            <p className="text-xs text-muted-foreground">{selectedActivity.hint}</p>
          ) : null}
        </FormField>

        <FormField label="هدف">
          <ToggleGroup
            type="single"
            value={goal}
            onValueChange={(v) => v && setGoal(v)}
            variant="outline"
            size="sm"
            className="flex flex-wrap justify-start gap-2"
          >
            {CALORIE_GOALS.map((g) => (
              <ToggleGroupItem key={g.id} value={g.id}>
                {g.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {selectedGoal && selectedGoal.adjustment !== 0 ? (
            <p className="text-xs text-muted-foreground">
              {selectedGoal.adjustment > 0
                ? `+${selectedGoal.adjustment} kcal نسبت به TDEE`
                : `${selectedGoal.adjustment} kcal نسبت به TDEE`}
            </p>
          ) : null}
        </FormField>

        {result ? (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="BMR (متابولیسم پایه)" value={result.bmr} unit="kcal" />
              <StatCard label="TDEE (مصرف روزانه)" value={result.tdee} unit="kcal" />
            </div>
            <Card size="sm" className="border-emerald-500/30 bg-emerald-500/10">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  کالری پیشنهادی روزانه
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
                  {result.recommended.toLocaleString("fa-IR")}
                  <span className="ms-2 text-sm font-normal">kcal</span>
                </p>
              </CardContent>
            </Card>
            {studentId && result.recommended ? (
              <Button type="button" className="w-full" asChild>
                <Link
                  href={`/coach/students/${studentId}/nutrition?calories=${result.recommended}`}
                >
                  <Send data-icon="inline-start" />
                  اعمال در برنامه غذایی
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            سن، قد و وزن را وارد کنید یا از دکمه محاسبه خودکار استفاده کنید.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value?.toLocaleString("fa-IR")}
        <span className="ms-1 text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
