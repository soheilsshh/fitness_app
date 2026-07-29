import { cn } from "@/lib/utils";

/**
 * Student panel page title — H1 24/32 + muted body, matches style guide.
 */
export default function PageHeader({
  title,
  description,
  meta,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0 flex-1 text-start">
        <h2 className="text-2xl font-iranianSansBlack leading-8 tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm font-iranianSansMedium leading-[22px] text-muted-foreground">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  );
}
