"use client";

import PanelLayout from "@/app/(panel)/_shared/PanelLayout";
import {
  adminBrand,
  adminHeader,
  adminNav,
} from "@/app/(panel)/_shared/nav-config/admin";

export default function AdminPanelLayout({ children }) {
  return (
    <PanelLayout
      brand={adminBrand}
      navItems={adminNav}
      header={adminHeader}
    >
      {children}
    </PanelLayout>
  );
}
