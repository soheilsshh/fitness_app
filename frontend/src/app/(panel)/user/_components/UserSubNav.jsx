"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  findActiveUserNavGroup,
  isNavPathActive,
} from "@/app/(panel)/_shared/nav-config/user";
import { cn } from "@/lib/utils";

/**
 * Mobile secondary chips when the active bottom-nav group has multiple pages.
 * Matches the Fitino liquid-chip language of the floating dock.
 */
export default function UserSubNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/user/onboarding")) return null;

  const group = findActiveUserNavGroup(pathname);
  if (!group || group.items.length < 2) return null;

  return (
    <div
      dir="rtl"
      className="fitino-subnav-shell sticky top-[var(--header-height,3rem)] z-30 px-3 py-2.5 md:hidden"
    >
      <div
        className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={`بخش‌های ${group.label}`}
      >
        {group.items.map((item) => {
          const active = isNavPathActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={active}
              data-active={active ? "true" : "false"}
              className={cn(
                "fitino-subnav-chip inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs touch-manipulation",
                "transition-[transform,box-shadow,background,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26fce3]/65",
                "active:scale-[0.96] motion-reduce:active:scale-100",
                active
                  ? "font-iranianSansDemiBold"
                  : "font-iranianSansMedium text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon ? (
                <Icon
                  className="size-3.5"
                  strokeWidth={active ? 2.4 : 1.85}
                  aria-hidden
                />
              ) : null}
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
