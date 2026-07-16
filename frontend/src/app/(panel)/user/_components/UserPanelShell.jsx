"use client";

import { usePathname } from "next/navigation";
import { RoleSidebar } from "@/app/(panel)/_shared/RoleSidebar";
import { usePanelUser } from "@/app/(panel)/_shared/hooks/usePanelUser";
import { userBrand } from "@/app/(panel)/_shared/nav-config/user";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import FitinoAIAssistant from "./FitinoAIAssistant";
import UserBottomNav from "./UserBottomNav";
import UserPanelHeader from "./UserPanelHeader";
import { UserSidebarNav } from "./UserSidebarNav";
import UserSubNav from "./UserSubNav";

/**
 * Student panel chrome:
 * - Mobile: bottom navigation only (no hamburger / no sheet sidebar)
 * - Desktop: grouped sidebar with five categories + subsections
 */
export default function UserPanelShell({ children, gate: Gate }) {
  const user = usePanelUser({ fetchProfile: true });
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/user/onboarding");
  const isAiChat = pathname?.startsWith("/user/ai");
  const pageContent = Gate ? <Gate>{children}</Gate> : children;

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 14)",
      }}
    >
      <RoleSidebar
        brand={userBrand}
        desktopOnly
        navContent={<UserSidebarNav />}
        user={user}
        profileHref="/user/profile"
      />

      <SidebarInset className="fitino-panel min-w-0 bg-background">
        <UserPanelHeader />
        <UserSubNav />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div
              className={cn(
                "flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6",
                !isOnboarding &&
                  "pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-6",
                isAiChat && "pt-3 md:pt-4"
              )}
            >
              {pageContent}
            </div>
          </div>
        </div>
      </SidebarInset>

      <UserBottomNav />
      {!isOnboarding ? <FitinoAIAssistant /> : null}
    </SidebarProvider>
  );
}
