"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Send } from "lucide-react";
import { api } from "@/lib/axios/client";
import {
  ACTIVITY_LEVELS,
  CALORIE_GOALS,
  calculateCaloriePlan,
} from "@/lib/tools/calorieCalculator";
import { Badge } from "@/components/ui/badge";
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

export default function CalorieCalculatorClient() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [goal, setGoal] = useState("maintain");
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadStudents() {
      try {
        const res = await api.get("/coach/students", {
          params: { page: 1, pageSize: 100, status: "active" },
        });
        if (!cancelled) setStudents(res.data?.items || []);
      } catch {
        if (!cancelled) setStudents([]);
      }
    }
    loadStudents();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const summaryText = result?.recommended
    ? `BMR: ${result.bmr?.toLocaleString("fa-IR")} | TDEE: ${result.tdee?.toLocaleString("fa-IR")} | کالری پیشنهادی: ${result.recommended.toLocaleString("fa-IR")} kcal`
    : "";

  const handleCopy = async () => {
    if (!result?.recommended) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  };

  const handleApplyToNutrition = () => {
    if (!selectedStudentId || !result?.recommended) return;
    router.push(
      `/coach/students/${selectedStudentId}/nutrition?calories=${result.recommended}`
    );
  };

  const selectedActivity = ACTIVITY_LEVELS.find((l) => l.id === activityLevel);
  const selectedGoal = CALORIE_GOALS.find((g) => g.id === goal);

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="text-start">
        <h1 className="text-xl font-semibold tracking-tight">محاسبه‌گر کالری</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تخمین BMR و TDEE با فرمول Mifflin–St Jeor برای برنامه‌ریزی تغذیه شاگرد
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ورودی‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  placeholder="مثلاً ۱۷۵"
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
                  placeholder="مثلاً ۷۵"
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
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card">
            <CardHeader>
              <CardTitle className="text-base">نتیجه محاسبه</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatCard
                      label="BMR (متابولیسم پایه)"
                      value={result.bmr}
                      unit="kcal"
                    />
                    <StatCard label="TDEE (مصرف روزانه)" value={result.tdee} unit="kcal" />
                  </div>
                  <Card size="sm" className="border-emerald-500/30 bg-emerald-500/10">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        کالری پیشنهادی روزانه
                      </p>
                      <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
                        {result.recommended.toLocaleString("fa-IR")}
                        <span className="ms-2 text-base font-normal">kcal</span>
                      </p>
                    </CardContent>
                  </Card>
                  <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                    <Copy data-icon="inline-start" />
                    {copyDone ? "کپی شد" : "کپی نتیجه"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  سن، قد و وزن را وارد کنید تا نتیجه نمایش داده شود.
                </p>
              )}
            </CardContent>
          </Card>

          {result?.recommended ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">اعمال به برنامه غذایی شاگرد</CardTitle>
                <CardDescription>
                  کالری پیشنهادی در ویرایشگر برنامه غذایی شاگرد پیش‌پر می‌شود.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب شاگرد..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.fullName || s.name || `شاگرد #${s.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  className="w-full"
                  disabled={!selectedStudentId}
                  onClick={handleApplyToNutrition}
                >
                  <Send data-icon="inline-start" />
                  باز کردن ویرایشگر غذا با این کالری
                </Button>
                {students.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    شاگرد فعالی یافت نشد.{" "}
                    <Link href="/coach/students" className="text-primary hover:underline">
                      مشاهده دانشجویان
                    </Link>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
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
    <Card size="sm">
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {value?.toLocaleString("fa-IR")}
          <span className="ms-1 text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
      </CardContent>
    </Card>
  );
}
