"use client";

export default function WizardProgress({ index, total, title }) {
  const current = index + 1;
  const percent = Math.round((current / total) * 100);

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="min-w-0 truncate font-iranianSansDemiBold text-foreground">{title}</span>
        <span className="shrink-0 tabular-nums">
          سؤال {current.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
