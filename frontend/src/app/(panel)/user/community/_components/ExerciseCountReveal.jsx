"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExerciseCountReveal({ names, className }) {
  const [open, setOpen] = useState(false);
  const list = (names || []).map((n) => String(n).trim()).filter(Boolean);
  if (!list.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-lg border bg-card px-2 py-2.5 text-center transition-colors hover:bg-muted/40"
      >
        <ListChecks className="mx-auto size-4 text-muted-foreground" />
        <p className="mt-1 text-sm font-iranianSansDemiBold tabular-nums">
          {list.length.toLocaleString("fa-IR")}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {open ? "بستن لیست حرکات" : "حرکت · برای دیدن اسامی بزنید"}
        </p>
      </button>
      {open ? (
        <ul className="space-y-1 rounded-lg border bg-muted/30 px-3 py-2 text-start">
          {list.map((name) => (
            <li key={name} className="text-xs text-foreground">
              {name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
