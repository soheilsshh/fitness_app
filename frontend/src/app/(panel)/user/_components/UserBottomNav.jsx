"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  findActiveUserNavGroup,
  userNavGroups,
} from "@/app/(panel)/_shared/nav-config/user";
import { cn } from "@/lib/utils";

/**
 * Student panel bottom dock — style-guide surfaces + primary teal active pill.
 */
export default function UserBottomNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (pathname?.startsWith("/user/onboarding")) return null;

  const activeGroup = findActiveUserNavGroup(pathname);

  return (
    <nav
      dir="rtl"
      aria-label="ناوبری اصلی پنل"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden",
        "px-3.5 pb-[max(0.85rem,env(safe-area-inset-bottom))]"
      )}
    >
      <motion.div
        className="pointer-events-auto relative mx-auto max-w-[26rem]"
        initial={reduceMotion ? false : { y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.45,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border",
            "bg-card shadow-[var(--up-shadow,0_8px_24px_rgba(2,6,23,0.06))]",
            "dark:bg-[color:var(--up-surface-elev,#111827)]"
          )}
        >
          <ul className="relative z-[1] grid grid-cols-5 gap-0.5 p-1.5">
            {userNavGroups.map((group) => {
              const Icon = group.icon;
              const active = activeGroup?.id === group.id;

              return (
                <li key={group.id} className="relative min-w-0">
                  {active ? (
                    <motion.span
                      layoutId={reduceMotion ? undefined : "user-dock-active"}
                      aria-hidden
                      className={cn(
                        "absolute inset-0 rounded-[14px]",
                        "bg-[linear-gradient(165deg,#14b8a6_0%,#0d9488_100%)]",
                        "shadow-[0_8px_18px_-8px_rgba(13,148,136,0.55)]"
                      )}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                        mass: 0.7,
                      }}
                    />
                  ) : null}

                  <Link
                    href={group.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative z-[1] flex min-h-[3.5rem] flex-col items-center justify-center gap-1 rounded-[14px] px-1 py-1.5",
                      "text-[10px] leading-none tracking-tight touch-manipulation",
                      "transition-colors duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "active:scale-[0.96] motion-reduce:active:scale-100",
                      active
                        ? "font-iranianSansDemiBold text-white"
                        : "font-iranianSansMedium text-[color:var(--up-icon,#64748b)] hover:text-foreground"
                    )}
                  >
                    <span className="relative flex size-7 items-center justify-center">
                      {Icon ? (
                        <Icon
                          className="size-6"
                          strokeWidth={active ? 2.4 : 1.85}
                          aria-hidden
                        />
                      ) : null}
                    </span>

                    <span className="relative max-w-full truncate px-0.5">
                      {group.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </nav>
  );
}
