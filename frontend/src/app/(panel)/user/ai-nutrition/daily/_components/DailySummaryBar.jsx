"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function Stat({ label, value, target }) {
  return (
    <div className="rounded-xl bg-muted/30 py-2.5 text-center">
      <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">{value}</p>
      {target ? (
        <p className="text-[10px] tabular-nums text-muted-foreground">هدف {target}</p>
      ) : null}
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function DailySummaryBar({
  totals,
  targets,
  onConfirm,
  confirming,
  confirmed,
  onApply,
  applying,
  applied,
}) {
  return (
    <Card className="sticky bottom-3">
      <CardContent className="space-y-3 pt-5">
        <p className="text-sm font-iranianSansDemiBold text-foreground">جمع روز</p>
        <div className="grid grid-cols-4 gap-2">
          <Stat label="کیلوکالری" value={Math.round(totals.calories)} target={targets?.targetCalories} />
          <Stat
            label="پروتئین"
            value={`${Math.round(totals.protein)}g`}
            target={targets?.proteinG ? `${targets.proteinG}g` : ""}
          />
          <Stat
            label="کربوهیدرات"
            value={`${Math.round(totals.carbs)}g`}
            target={targets?.carbsG ? `${targets.carbsG}g` : ""}
          />
          <Stat
            label="چربی"
            value={`${Math.round(totals.fat)}g`}
            target={targets?.fatG ? `${targets.fatG}g` : ""}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-11 w-full cursor-pointer gap-2"
            disabled={confirming || confirmed || applying || applied}
            onClick={onApply}
          >
            {applying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {applied ? "روی برنامه اصلی قرار گرفت" : applying ? "در حال اعمال..." : "بگذار روی برنامه اصلیم"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full cursor-pointer gap-2"
            disabled={confirming || confirmed || applying}
            onClick={onConfirm}
          >
            {confirming ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmed ? "برای تأیید مربی ارسال شد" : confirming ? "در حال ارسال..." : "ارسال برای تأیید مربی"}
          </Button>
        </div>
        {applied ? (
          <p className="text-center text-xs text-muted-foreground">
            این برنامه الان برنامه فعال تو است و در دفتر غذا دیده می‌شود.
          </p>
        ) : null}
        {confirmed ? (
          <p className="text-center text-xs text-muted-foreground">
            برای مربی ارسال شد. بعد از تأیید او، روی برنامه اصلیت اعمال می‌شود.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
