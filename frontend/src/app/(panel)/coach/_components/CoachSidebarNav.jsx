"use client";

import { NavRoleMain } from "@/components/nav-role-main";
import { coachNavGroups } from "@/app/(panel)/_shared/nav-config/coach";

/**
 * Sectioned coach sidebar. `navItems` may already be filtered down by the
 * approval gate (pending coaches only see the profile link) — groups with
 * no matching items after filtering are simply skipped.
 */
export function CoachSidebarNav({ navItems = [], toolsItems = [] }) {
  return (
    <>
      {coachNavGroups.map((group) => {
        const items = group.hrefs
          .map((href) => navItems.find((item) => item.href === href))
          .filter(Boolean);
        if (!items.length) return null;
        return <NavRoleMain key={group.id} items={items} label={group.label} />;
      })}
      {toolsItems.length ? (
        <NavRoleMain items={toolsItems} label="ابزارها" />
      ) : null}
    </>
  );
}
