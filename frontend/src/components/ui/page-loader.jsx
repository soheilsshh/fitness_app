import { cn } from "@/lib/utils";

export function PageLoader({ className }) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6",
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
    </div>
  );
}

export function SectionLoader({ className }) {
  return (
    <div
      className={cn("flex min-h-[280px] items-center justify-center", className)}
      aria-hidden="true"
    >
      <div className="size-6 animate-spin rounded-full border-2 border-primary/60 border-t-transparent" />
    </div>
  );
}
