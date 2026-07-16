import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Premium empty state — icon jewel, calm copy, optional CTA.
 */
export default function PanelEmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  className,
}) {
  return (
    <div
      className={cn(
        "fitino-empty relative overflow-hidden rounded-[1.35rem] px-5 py-12 text-center",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_0%,rgba(38,252,227,0.14),transparent_60%)]"
      />
      {Icon ? (
        <span className="fitino-empty-icon relative mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl">
          <Icon className="size-6 text-[#187272] dark:text-[#6ceade]" strokeWidth={1.75} />
        </span>
      ) : null}
      {title ? (
        <p className="relative font-iranianSansDemiBold text-base text-foreground">
          {title}
        </p>
      ) : null}
      {description ? (
        <p className="relative mx-auto mt-1.5 max-w-sm text-sm font-iranianSansMedium leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <div className="relative mt-5">
          <Button asChild size="lg">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
