"use client";

import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mealFromManualEntry } from "../../../_components/nutritionHelpers";

export default function ManualFoodModal({
  open,
  onClose,
  onAdd,
  dayLabel,
  primaryAddLabel = "افزودن به برنامه",
  secondaryAddLabel = "افزودن و ادامه",
}) {
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDetail("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setError("");
    }
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDetail("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setError("");
  };

  const handleSubmit = async (andContinue) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("نام غذا الزامی است.");
      return;
    }

    try {
      await onAdd?.(
        mealFromManualEntry({
          title: trimmedTitle,
          detail,
          calories,
          protein,
          carbs,
          fat,
        })
      );
    } catch {
      return;
    }

    if (andContinue) {
      resetForm();
    } else {
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden px-0 sm:max-w-lg" dir="rtl">
        <DialogHeader className="border-b px-5 py-4 text-start">
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="size-4 text-primary" />
            افزودن غذای دستی
          </DialogTitle>
          {dayLabel ? <DialogDescription>برنامه {dayLabel}</DialogDescription> : null}
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="manual-food-title">
              نام غذا <span className="text-destructive">*</span>
            </Label>
            <Input
              id="manual-food-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: سالاد سفارشی"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-food-detail">مقدار / توضیح</Label>
            <Input
              id="manual-food-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="مثلاً: ۱ پرس متوسط"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manual-food-calories">کالری</Label>
              <Input
                id="manual-food-calories"
                type="number"
                min="0"
                step="any"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="tabular-nums"
                placeholder="۰"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-food-protein">پروتئین (g)</Label>
              <Input
                id="manual-food-protein"
                type="number"
                min="0"
                step="any"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="tabular-nums"
                placeholder="۰"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-food-carbs">کربوهیدرات (g)</Label>
              <Input
                id="manual-food-carbs"
                type="number"
                min="0"
                step="any"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="tabular-nums"
                placeholder="۰"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-food-fat">چربی (g)</Label>
              <Input
                id="manual-food-fat"
                type="number"
                min="0"
                step="any"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="tabular-nums"
                placeholder="۰"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t px-5 py-4 sm:justify-start">
          <Button type="button" variant="outline" className="flex-1" onClick={() => handleSubmit(true)}>
            {secondaryAddLabel}
          </Button>
          <Button type="button" className="flex-1" onClick={() => handleSubmit(false)}>
            {primaryAddLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
