"use client";

import Link from "next/link";
import { NavRoleMain } from "@/components/nav-role-main";
import { NavUser } from "@/components/nav-user";
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
import { DumbbellIcon } from "lucide-react";

function NavUserPlaceholder() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="pointer-events-none"
          aria-hidden
        >
          <Skeleton className="size-8 rounded-lg" />
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
  ...props
}) {
  const BrandIcon = brand?.icon || DumbbellIcon;

  return (
    <Sidebar
      collapsible="offcanvas"
      side="right"
      dir="rtl"
      variant="inset"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-2!"
            >
              <Link href={brand?.href || "/"}>
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-sidebar-border">
                  <BrandIcon className="size-4" />
                </span>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {brand?.title || "FitPro"}
                  </span>
                  {brand?.subtitle ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {brand.subtitle}
                    </span>
                  ) : null}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavRoleMain items={navItems} />
        {secondaryItems?.length ? (
          <NavRoleMain items={secondaryItems} label={secondaryLabel} />
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <NavUser user={user} profileHref={profileHref} />
        ) : (
          <NavUserPlaceholder />
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
