"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  findActiveUserNavGroup,
  isNavPathActive,
  userNavGroups,
} from "@/app/(panel)/_shared/nav-config/user";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * Desktop IA: five labeled groups with leaf links listed under each.
 */
export function UserSidebarNav() {
  const pathname = usePathname();
  const activeGroup = findActiveUserNavGroup(pathname);

  return (
    <>
      {userNavGroups.map((group) => {
        const GroupIcon = group.icon;
        const groupActive = activeGroup?.id === group.id;
        const multi = group.items.length > 1;

        return (
          <SidebarGroup
            key={group.id}
            className={cn(
              "rounded-2xl transition-colors",
              groupActive && "bg-sidebar-accent/40 ring-1 ring-[#187272]/12 dark:ring-[#26fce3]/15"
            )}
          >
            <SidebarGroupLabel
              className={cn(
                "gap-2 text-[11px] font-iranianSansDemiBold tracking-wide",
                groupActive && "text-[#187272] dark:text-[#6ceade]"
              )}
            >
              {GroupIcon ? <GroupIcon className="size-3.5 opacity-80" /> : null}
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {multi ? (
                  <SidebarMenuItem>
                    <SidebarMenuSub className="mx-0 border-s-0 px-0 translate-x-0 rtl:translate-x-0">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isNavPathActive(pathname, item.href);
                        return (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={active}
                              size="md"
                              className="h-9 font-iranianSansMedium"
                            >
                              <Link href={item.href}>
                                {Icon ? <Icon /> : null}
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                ) : (
                  group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isNavPathActive(pathname, item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.label}
                          isActive={active}
                          className="font-iranianSansMedium"
                        >
                          <Link href={item.href}>
                            {Icon ? <Icon /> : null}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
