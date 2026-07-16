"use client";

import Link from "next/link";
import { NavRoleMain } from "@/components/nav-role-main";
import { NavUser } from "@/components/nav-user";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";

function NavUserPlaceholder() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="pointer-events-none rounded-2xl border border-sidebar-border/70"
          aria-hidden
        >
          <Skeleton className="size-9 rounded-xl" />
          <div className="grid flex-1 gap-1.5 text-start">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function RoleSidebar({
  brand,
  navItems = [],
  user,
  profileHref,
  secondaryItems,
  secondaryLabel,
  /** Custom nav body (e.g. grouped student IA). Replaces navItems when set. */
  navContent = null,
  /** Never mount the mobile sheet sidebar — used with bottom navigation. */
  desktopOnly = false,
  ...props
}) {
  const isMobile = useIsMobile();
  if (desktopOnly && isMobile) return null;

  return (
    <Sidebar
      collapsible="offcanvas"
      side="right"
      dir="rtl"
      variant="inset"
      {...props}
    >
      <SidebarHeader className="gap-0 px-3 pt-3">
        <Link
          href={brand?.href || "/"}
          className="group/brand relative flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-sidebar-accent/50 focus-visible:outline-none"
        >
          <span className="fitino-sidebar-brand-mark relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
            <span
              className="absolute inset-[2px] rounded-[0.9rem] bg-white/92 dark:bg-[#0f1717]/85"
              aria-hidden
            />
            <Logo className="relative size-7 object-contain" />
          </span>
          <span className="grid min-w-0 flex-1 text-start leading-tight">
            <span className="truncate font-iranianSansBlack text-[15px] tracking-tight text-sidebar-foreground">
              {brand?.title || "فیتینو"}
            </span>
            {brand?.subtitle ? (
              <span className="mt-0.5 inline-flex w-fit max-w-full items-center truncate rounded-full bg-[#187272]/10 px-2 py-0.5 text-[10px] font-iranianSansDemiBold text-[#187272] dark:bg-[#26fce3]/12 dark:text-[#6ceade]">
                {brand.subtitle}
              </span>
            ) : null}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navContent ? (
          navContent
        ) : (
          <>
            <NavRoleMain items={navItems} />
            {secondaryItems?.length ? (
              <NavRoleMain items={secondaryItems} label={secondaryLabel} />
            ) : null}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-2">
        {user ? (
          <NavUser user={user} profileHref={profileHref} />
        ) : (
          <NavUserPlaceholder />
        )}
      </SidebarFooter>

      <SidebarRail className="hidden md:flex" />
    </Sidebar>
  );
}
