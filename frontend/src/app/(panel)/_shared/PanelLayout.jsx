"use client";

import { RoleSidebar } from "./RoleSidebar";
import { PanelHeader } from "./PanelHeader";
import { usePanelUser } from "./hooks/usePanelUser";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Shared shadcn panel shell for admin / coach / user panels.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {object} props.brand - { title, subtitle, href, icon? }
 * @param {Array} props.navItems - main navigation config
 * @param {Array} [props.secondaryNavItems]
 * @param {string} [props.secondaryNavLabel]
 * @param {object} props.header - { title, subtitle }
 * @param {string} [props.profileHref] - link for NavUser profile action
 * @param {boolean} [props.fetchUserProfile=true]
 * @param {React.ComponentType<{children: React.ReactNode}>} [props.gate]
 *   Role-specific wrapper (e.g. StudentOnboardingGate) rendered around page content.
 * @param {string} [props.contentClassName]
 */
export default function PanelLayout({
  children,
  brand,
  navItems,
  secondaryNavItems,
  secondaryNavLabel,
  header,
  profileHref,
  fetchUserProfile = true,
  gate: Gate,
  contentClassName,
}) {
  const user = usePanelUser({ fetchProfile: fetchUserProfile });

  const pageContent = Gate ? <Gate>{children}</Gate> : children;

  return (
    <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        }}
      >
        <RoleSidebar
          brand={brand}
          navItems={navItems}
          secondaryItems={secondaryNavItems}
          secondaryLabel={secondaryNavLabel}
          user={user}
          profileHref={profileHref}
        />

        <SidebarInset>
          <PanelHeader title={header?.title} subtitle={header?.subtitle} />

          <div className={contentClassName || "flex flex-1 flex-col"}>
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                {pageContent}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}
