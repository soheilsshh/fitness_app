"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { REGENERATE_REASONS } from "./nutritionGoals";

export default function RegenerateMealDialog({ open, mealName, onClose, onConfirm, loading }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    const reason = [selectedReason, customReason.trim()].filter(Boolean).join(" — ");
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onClose?.()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle>چرا می‌خواهی «{mealName}» را تغییر بدهی؟</DialogTitle>
          <DialogDescription>یک دلیل انتخاب کن یا خودت توضیح بده.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REGENERATE_REASONS.map((reason) => {
              const active = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(active ? "" : reason)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-iranianSansMedium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {reason}
                </button>
              );
            })}
          </div>
          <Textarea
            rows={3}
            placeholder="مثلاً: مرغ ندارم، با تخم‌مرغ جایگزینش کن."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
            انصراف
          </Button>
          <Button
            type="button"
            disabled={loading || (!selectedReason && !customReason.trim())}
            onClick={handleConfirm}
            className="gap-2"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {loading ? "در حال ساخت..." : "غذای دیگری پیشنهاد بده"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
