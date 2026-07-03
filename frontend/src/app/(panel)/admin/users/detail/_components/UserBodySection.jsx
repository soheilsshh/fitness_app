"use client";

import { useMemo, useState } from "react";
import { Camera, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageLightboxModal from "./ImageLightboxModal";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function UserBodySection({ heightCm, weightKg, photos = [] }) {
  const safePhotos = useMemo(() => (Array.isArray(photos) ? photos.slice(0, 5) : []), [photos]);

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const openAt = (i) => {
    setIdx(i);
    setOpen(true);
  };

  const onPrev = () => setIdx((p) => (p - 1 + safePhotos.length) % safePhotos.length);
  const onNext = () => setIdx((p) => (p + 1) % safePhotos.length);

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-end justify-between">
        <div>
          <CardTitle>اطلاعات بدنی</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            قد، وزن و تصاویر آپلود شده (حداکثر ۵ عکس)
          </div>
        </div>
        <Badge variant="outline" className="h-auto gap-1.5 rounded-md px-3 py-2 text-xs">
          <Info className="size-4" />
          تصاویر: {safePhotos.length}/5
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          <Card className="bg-muted/20">
            <CardContent className="pt-4">
              <div className="text-[11px] text-muted-foreground">قد</div>
              <div className="mt-1 text-lg font-extrabold">
                {heightCm ? `${heightCm} cm` : "—"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20">
            <CardContent className="pt-4">
              <div className="text-[11px] text-muted-foreground">وزن</div>
              <div className="mt-1 text-lg font-extrabold">
                {weightKg ? `${weightKg} kg` : "—"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <Camera className="size-4" />
            تصاویر کاربر
          </div>

          {safePhotos.length === 0 ? (
            <Card className="bg-muted/20">
              <CardContent className="pt-4 text-sm text-muted-foreground">
                هنوز تصویری آپلود نشده.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {safePhotos.map((p, i) => (
                <button
                  key={p.id || p.url}
                  onClick={() => openAt(i)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-border bg-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  )}
                  aria-label={`Open photo ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.name || "photo"}
                    className="h-28 w-full object-cover transition group-hover:scale-[1.03] sm:h-36"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3">
                    <div className="truncate text-[11px] text-zinc-200">{p.name || "photo"}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <ImageLightboxModal
        open={open}
        photos={safePhotos}
        index={idx}
        onClose={() => setOpen(false)}
        onPrev={onPrev}
        onNext={onNext}
      />
    </Card>
  );
}
