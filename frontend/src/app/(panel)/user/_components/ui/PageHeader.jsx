import { cn } from "@/lib/utils";

/**
 * Luxury Fitino page title block for student panel surfaces.
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
        <div className="mb-2 h-1 w-10 rounded-full bg-[linear-gradient(90deg,#26fce3,#187272)]" />
        <h2 className="font-iranianSansBlack text-xl tracking-tight text-foreground sm:text-[1.35rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm font-iranianSansMedium leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  );
}
