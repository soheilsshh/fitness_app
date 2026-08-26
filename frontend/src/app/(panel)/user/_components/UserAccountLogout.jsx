"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { findActiveUserNavGroup } from "@/app/(panel)/_shared/nav-config/user";
import { logout } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Mobile-only logout, pinned just above the bottom dock so it never
 * sits under the navigation. Desktop keeps logout in the sidebar.
 */
export default function UserAccountLogout() {
  const pathname = usePathname();
  if (pathname?.startsWith("/user/onboarding")) return null;

  const group = findActiveUserNavGroup(pathname);
  if (group?.id !== "account") return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 md:hidden",
        "px-3.5",
        "bottom-[calc(4.75rem+max(0.85rem,env(safe-area-inset-bottom)))]"
      )}
    >
      <div className="pointer-events-auto mx-auto max-w-[26rem]">
        <Button
          type="button"
          variant="destructive"
          size="lg"
          onClick={() => logout()}
          className={cn(
            "h-12 w-full gap-2 rounded-2xl text-sm font-iranianSansDemiBold",
            "border border-destructive/20 shadow-[0_8px_24px_rgba(2,6,23,0.08)]"
          )}
        >
          <LogOut data-icon="inline-start" className="size-4" />
          خروج از حساب
        </Button>
      </div>
    </div>
  );
}
