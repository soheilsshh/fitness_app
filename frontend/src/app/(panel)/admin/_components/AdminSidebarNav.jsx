"use client";

import { NavRoleMain } from "@/components/nav-role-main";
import { adminNavGroups } from "@/app/(panel)/_shared/nav-config/admin";

/**
 * Sectioned admin sidebar: one labeled `NavRoleMain` group per IA section
 * instead of 14 flat, unsectioned links.
 */
export function AdminSidebarNav() {
  return (
    <>
      {adminNavGroups.map((group) => (
        <NavRoleMain key={group.id} items={group.items} label={group.label} />
      ))}
    </>
  );
}
