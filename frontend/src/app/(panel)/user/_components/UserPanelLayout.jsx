"use client";

import PanelLayout from "@/app/(panel)/_shared/PanelLayout";
import PanelAuthGate from "@/app/(panel)/_shared/gates/PanelAuthGate";
import StudentOnboardingGate from "@/app/(panel)/_shared/gates/StudentOnboardingGate";
import { ROLES } from "@/lib/auth/roles";
import {
  userBrand,
  userHeader,
  userNav,
} from "@/app/(panel)/_shared/nav-config/user";

export default function UserPanelLayout({ children }) {
  return (
    <PanelAuthGate requiredRole={ROLES.STUDENT}>
      <PanelLayout
        brand={userBrand}
        navItems={userNav}
        header={userHeader}
        profileHref="/user/profile"
        gate={StudentOnboardingGate}
      >
        {children}
      </PanelLayout>
    </PanelAuthGate>
  );
}
