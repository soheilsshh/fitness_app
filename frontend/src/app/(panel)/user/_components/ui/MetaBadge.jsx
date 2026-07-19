import { cn } from "@/lib/utils";

/** Compact count / status jewel for page headers. */
export default function MetaBadge({ icon: Icon, label, value, className }) {
  return (
    <div
      className={cn(
        "fitino-meta-badge inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-iranianSansMedium",
        className
      )}
    >
      {Icon ? <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden /> : null}
      {label ? <span className="opacity-75">{label}</span> : null}
      <span className="font-iranianSansDemiBold tabular-nums">{value}</span>
    </div>
  );
}
