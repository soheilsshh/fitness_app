"use client";

import PanelLayout from "@/app/(panel)/_shared/PanelLayout";
import PanelAuthGate from "@/app/(panel)/_shared/gates/PanelAuthGate";
import { ROLES } from "@/lib/auth/roles";
import {
  adminBrand,
  adminHeader,
  adminNav,
} from "@/app/(panel)/_shared/nav-config/admin";

export default function AdminPanelLayout({ children }) {
  return (
    <PanelAuthGate requiredRole={ROLES.ADMIN}>
      <PanelLayout
        brand={adminBrand}
        navItems={adminNav}
        header={adminHeader}
      >
        {children}
      </PanelLayout>
    </PanelAuthGate>
  );
}
