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
 * Luxury liquid-glass dock for the student panel (mobile).
 * Shared layoutId capsule slides between tabs for a jewel-like active state.
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
      {/* Atmospheric underwater glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 bottom-0 h-16 overflow-hidden"
      >
        <span className="absolute inset-x-8 bottom-2 h-10 rounded-full bg-[#26fce3]/30 blur-3xl dark:bg-[#26fce3]/22" />
        <span className="absolute start-1/4 bottom-1 h-8 w-24 rounded-full bg-[#187272]/35 blur-2xl" />
        <span className="absolute end-1/4 bottom-1 h-8 w-20 rounded-full bg-[#58cac0]/25 blur-2xl" />
      </div>

      <motion.div
        className="pointer-events-auto relative mx-auto max-w-[26rem]"
        initial={reduceMotion ? false : { y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.55,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Outer luminous rim */}
        <div
          className={cn(
            "relative rounded-[2rem] p-[1px]",
            "bg-[linear-gradient(145deg,rgba(255,255,255,0.55)_0%,rgba(108,234,222,0.45)_28%,rgba(24,114,114,0.35)_62%,rgba(255,255,255,0.12)_100%)]",
            "dark:bg-[linear-gradient(145deg,rgba(108,234,222,0.55)_0%,rgba(38,252,227,0.2)_35%,rgba(24,114,114,0.55)_70%,rgba(255,255,255,0.08)_100%)]",
            "shadow-[0_22px_50px_-18px_rgba(8,40,40,0.55),0_8px_18px_-10px_rgba(38,252,227,0.35)]",
            "dark:shadow-[0_28px_60px_-16px_rgba(0,0,0,0.75),0_10px_28px_-12px_rgba(38,252,227,0.28)]"
          )}
        >
          <div
            className={cn(
              "fitino-dock-liquid relative overflow-hidden rounded-[1.92rem]",
              "bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(232,252,250,0.55)_45%,rgba(210,240,236,0.48)_100%)]",
              "dark:bg-[linear-gradient(180deg,rgba(18,36,36,0.88)_0%,rgba(10,22,22,0.82)_50%,rgba(8,16,16,0.9)_100%)]",
              "backdrop-blur-2xl backdrop-saturate-150",
              "ring-1 ring-inset ring-white/40 dark:ring-white/[0.08]"
            )}
          >
            {/* Specular top bevel */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-l from-transparent via-white/80 to-transparent dark:via-[#26fce3]/45"
            />
            {/* Soft inner vignette */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(38,252,227,0.12),transparent_55%)] dark:bg-[radial-gradient(120%_80%_at_50%_0%,rgba(38,252,227,0.16),transparent_55%)]"
            />
            {/* Film grain */}
            <span aria-hidden className="fitino-dock-grain pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]" />

            <ul className="relative z-[1] grid grid-cols-5 gap-1 p-1.5">
              {userNavGroups.map((group) => {
                const Icon = group.icon;
                const active = activeGroup?.id === group.id;

                return (
                  <li key={group.id} className="relative min-w-0">
                    {active ? (
                      <motion.span
                        layoutId={reduceMotion ? undefined : "fitino-dock-jewel"}
                        aria-hidden
                        className={cn(
                          "absolute inset-0 rounded-[1.35rem]",
                          "bg-[linear-gradient(165deg,#7af5e8_0%,#2fb8ad_38%,#1a7f7a_72%,#0f4f4c_100%)]",
                          "dark:bg-[linear-gradient(165deg,#5ef0df_0%,#2a9c96_40%,#145e5a_78%,#0a3331_100%)]",
                          "shadow-[0_10px_22px_-8px_rgba(24,114,114,0.7),0_2px_0_rgba(255,255,255,0.42)_inset,0_-3px_8px_rgba(0,0,0,0.22)_inset]",
                          "ring-1 ring-white/35 dark:ring-[#26fce3]/30"
                        )}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                          mass: 0.7,
                        }}
                      >
                        <span className="absolute inset-x-2 top-0.5 h-[46%] rounded-t-[1.1rem] bg-gradient-to-b from-white/45 to-transparent" />
                        <span className="absolute inset-x-3 -bottom-1 h-3 rounded-full bg-[#26fce3]/45 blur-md" />
                        <span className="fitino-dock-sheen absolute inset-0 overflow-hidden rounded-[1.35rem]" />
                      </motion.span>
                    ) : null}

                    <Link
                      href={group.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative z-[1] flex min-h-[3.55rem] flex-col items-center justify-center gap-1 rounded-[1.35rem] px-1 py-1.5",
                        "text-[10px] leading-none tracking-tight touch-manipulation",
                        "transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26fce3]/7 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                        "active:scale-[0.94] motion-reduce:active:scale-100",
                        active
                          ? "text-white font-iranianSansBlack"
                          : "font-iranianSansMedium text-slate-500/90 hover:text-slate-800 dark:text-white/45 dark:hover:text-white/85"
                      )}
                    >
                      <span
                        className={cn(
                          "relative flex size-8 items-center justify-center rounded-2xl transition-transform duration-300",
                          active
                            ? "scale-110 bg-white/15 shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] motion-reduce:scale-100"
                            : "bg-transparent"
                        )}
                      >
                        {Icon ? (
                          <Icon
                            className={cn(
                              "size-[1.32rem]",
                              active &&
                                "drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                            )}
                            strokeWidth={active ? 2.6 : 1.75}
                            aria-hidden
                          />
                        ) : null}
                      </span>

                      <span
                        className={cn(
                          "relative max-w-full truncate px-0.5",
                          active && "drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                        )}
                      >
                        {group.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.div>
    </nav>
  );
}
