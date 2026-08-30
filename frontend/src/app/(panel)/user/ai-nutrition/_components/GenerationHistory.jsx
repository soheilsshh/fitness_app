"use client";

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatHistoryTime } from "./generationHistory";

export default function GenerationHistory({ items = [], currentId, onRestore }) {
  if (!items.length) return null;

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" aria-hidden />
          <p className="text-sm font-iranianSansDemiBold text-foreground">تاریخچه تولید</p>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          اگر نسخه جدید مناسب نبود، از تاریخچه یکی از ساخت‌های قبلی را برگردان.
        </p>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 text-start">
                <p className="text-sm font-iranianSansMedium text-foreground">{item.summary}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  نسخه {items.length - index}
                  {item.id === currentId ? " · نسخه فعلی" : ""}
                  {item.at ? ` · ${formatHistoryTime(item.at)}` : ""}
                </p>
              </div>
              {item.id === currentId ? (
                <span className="inline-flex h-11 min-w-38 items-center justify-center text-xs text-muted-foreground">
                  در حال نمایش
                </span>
              ) : (
              <Button
                type="button"
                variant="outline"
                className="h-11 min-w-38 cursor-pointer touch-manipulation"
                onClick={() => onRestore(item)}
              >
                برگرد به این نسخه
              </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
