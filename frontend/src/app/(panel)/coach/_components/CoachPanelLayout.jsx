"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import PanelLayout from "@/app/(panel)/_shared/PanelLayout";
import PanelAuthGate from "@/app/(panel)/_shared/gates/PanelAuthGate";
import CoachApprovalGate from "@/app/(panel)/_shared/gates/CoachApprovalGate";
import { ROLES } from "@/lib/auth/roles";
import {
  coachBrand,
  coachHeader,
  coachNav,
  coachToolsNav,
} from "@/app/(panel)/_shared/nav-config/coach";
import {
  CoachProfileProvider,
  useCoachProfile,
} from "@/app/(panel)/coach/_context/CoachProfileContext";

const COACH_PANEL_SEGMENTS = new Set([
  "dashboard",
  "profile",
  "plans",
  "students",
  "tickets",
  "tools",
  "tracking",
]);

const PROFILE_HREF = "/coach/profile";

function isCoachPanelPath(pathname) {
  if (pathname === "/coach") return true;
  if (!pathname?.startsWith("/coach/")) return false;
  const segment = pathname.split("/")[2];
  return COACH_PANEL_SEGMENTS.has(segment);
}

function filterNavForApproval(items, isRestricted) {
  if (!isRestricted) return items;
  return items.filter((item) => item.href === PROFILE_HREF);
}

function CoachPanelShell({ children }) {
  const { isRestricted, loading } = useCoachProfile();

  const navItems = useMemo(
    () => filterNavForApproval(coachNav, loading || isRestricted),
    [isRestricted, loading],
  );

  const secondaryNavItems = useMemo(
    () => (loading || isRestricted ? [] : coachToolsNav),
    [isRestricted, loading],
  );

  return (
    <PanelLayout
      brand={coachBrand}
      navItems={navItems}
      secondaryNavItems={secondaryNavItems}
      secondaryNavLabel="ابزارها"
      header={coachHeader}
      profileHref={PROFILE_HREF}
      gate={CoachApprovalGate}
    >
      {children}
    </PanelLayout>
  );
}

export default function CoachPanelLayout({ children }) {
  const pathname = usePathname();

  if (!isCoachPanelPath(pathname)) {
    return children;
  }

  return (
    <PanelAuthGate requiredRole={ROLES.COACH}>
      <CoachProfileProvider>
        <CoachPanelShell>{children}</CoachPanelShell>
      </CoachProfileProvider>
    </PanelAuthGate>
  );
}
