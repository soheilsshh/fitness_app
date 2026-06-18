"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { apiAssetUrl } from "@/lib/api/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function PhotoCompareBox({ label, photos = [], className }) {
  const sorted = useMemo(
    () =>
      [...photos].sort(
        (a, b) => new Date(b.uploadedAt || b.checkInDate) - new Date(a.uploadedAt || a.checkInDate)
      ),
    [photos]
  );
  const [index, setIndex] = useState(0);

  const current = sorted[index];
  const hasMultiple = sorted.length > 1;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted/30">
          {current?.url ? (
            <Image
              src={apiAssetUrl(current.url)}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="size-8 opacity-50" />
              <span className="text-xs">عکسی ثبت نشده</span>
            </div>
          )}
        </div>

        {current && (
          <p className="text-center text-xs text-muted-foreground">
            {formatPhotoDate(current.checkInDate || current.uploadedAt)}
            {hasMultiple && (
              <span className="ms-1 tabular-nums">
                ({(index + 1).toLocaleString("fa-IR")} از {sorted.length.toLocaleString("fa-IR")})
              </span>
            )}
          </p>
        )}

        {hasMultiple && (
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={index >= sorted.length - 1}
              onClick={() => setIndex((i) => Math.min(i + 1, sorted.length - 1))}
              aria-label="عکس قدیمی‌تر"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={index <= 0}
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              aria-label="عکس جدیدتر"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatPhotoDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
