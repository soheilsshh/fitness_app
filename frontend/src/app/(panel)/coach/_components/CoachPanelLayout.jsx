"use client";

import { usePathname } from "next/navigation";
import PanelLayout from "@/app/(panel)/_shared/PanelLayout";
import PanelAuthGate from "@/app/(panel)/_shared/gates/PanelAuthGate";
import { ROLES } from "@/lib/auth/roles";
import {
  coachBrand,
  coachHeader,
  coachNav,
  coachToolsNav,
} from "@/app/(panel)/_shared/nav-config/coach";

const COACH_PANEL_SEGMENTS = new Set([
  "dashboard",
  "profile",
  "plans",
  "students",
  "tickets",
  "tools",
  "tracking",
]);

function isCoachPanelPath(pathname) {
  if (pathname === "/coach") return true;
  if (!pathname?.startsWith("/coach/")) return false;
  const segment = pathname.split("/")[2];
  return COACH_PANEL_SEGMENTS.has(segment);
}

export default function CoachPanelLayout({ children }) {
  const pathname = usePathname();

  if (!isCoachPanelPath(pathname)) {
    return children;
  }

  return (
    <PanelAuthGate requiredRole={ROLES.COACH}>
      <PanelLayout
        brand={coachBrand}
        navItems={coachNav}
        secondaryNavItems={coachToolsNav}
        secondaryNavLabel="ابزارها"
        header={coachHeader}
        profileHref="/coach/profile"
      >
        {children}
      </PanelLayout>
    </PanelAuthGate>
  );
}
