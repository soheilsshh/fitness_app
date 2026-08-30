"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MEAL_SLOTS } from "@/lib/nutrition/mealSlots";
import { cn } from "@/lib/utils";

function fallbackSlots() {
  return MEAL_SLOTS.map((s) => ({
    slot: s.value,
    label: s.label,
    foods: [],
    calories: 0,
    empty: true,
  }));
}

export default function ReplaceMealSlotDialog({
  open,
  recipeName,
  onClose,
  onConfirm,
  confirming,
}) {
  const [slots, setSlots] = useState(fallbackSlots);
  const [hasProgram, setHasProgram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSelected("");
    setLoading(true);
    (async () => {
      try {
        const res = await api.get("/me/nutrition/today-slots");
        if (cancelled) return;
        const next = Array.isArray(res.data?.slots) && res.data.slots.length
          ? res.data.slots
          : fallbackSlots();
        setSlots(next);
        setHasProgram(Boolean(res.data?.hasProgram));
      } catch {
        if (!cancelled) {
          setSlots(fallbackSlots());
          setHasProgram(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !confirming && onClose?.()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle>جایگزین کدام وعده شود؟</DialogTitle>
          <DialogDescription>
            {hasProgram
              ? `«${recipeName || "این غذا"}» را به‌جای کدام بخش برنامه امروز می‌گذاری؟`
              : "برنامه فعالی برای امروز پیدا نشد. این غذا به‌عنوان کدام وعده ذخیره شود؟"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {slots.map((slot) => {
              const active = selected === slot.slot;
              return (
                <button
                  key={slot.slot}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(slot.slot)}
                  className={cn(
                    "flex w-full min-h-11 cursor-pointer touch-manipulation flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-start transition-colors duration-200",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-muted/20 text-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-sm font-iranianSansDemiBold">{slot.label}</span>
                  <span className="text-xs leading-5 text-muted-foreground">
                    {slot.empty
                      ? "این وعده امروز خالی است"
                      : `${(slot.foods || []).join("، ")}${slot.calories ? ` · ${slot.calories} kcal` : ""}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            className="h-11 cursor-pointer"
            disabled={confirming}
            onClick={onClose}
          >
            انصراف
          </Button>
          <Button
            type="button"
            className="h-11 cursor-pointer"
            disabled={confirming || loading || !selected}
            onClick={() => onConfirm(selected)}
          >
            {confirming ? "در حال جایگزینی..." : "جایگزین کن"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
