"use client";

import PanelLayout from "@/app/(panel)/_shared/PanelLayout";
import {
  coachBrand,
  coachHeader,
  coachNav,
  coachToolsNav,
} from "@/app/(panel)/_shared/nav-config/coach";

export default function CoachPanelLayout({ children }) {
  return (
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
  );
}
