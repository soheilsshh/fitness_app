"use client";

import PanelLayout from "@/app/(panel)/_shared/PanelLayout";
import StudentOnboardingGate from "@/app/(panel)/_shared/gates/StudentOnboardingGate";
import {
  userBrand,
  userHeader,
  userNav,
} from "@/app/(panel)/_shared/nav-config/user";

export default function UserPanelLayout({ children }) {
  return (
    <PanelLayout
      brand={userBrand}
      navItems={userNav}
      header={userHeader}
      profileHref="/user/profile"
      gate={StudentOnboardingGate}
    >
      {children}
    </PanelLayout>
  );
}
