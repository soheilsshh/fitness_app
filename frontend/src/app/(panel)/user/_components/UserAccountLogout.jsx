"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { findActiveUserNavGroup } from "@/app/(panel)/_shared/nav-config/user";
import { logout } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Mobile-only logout at the end of account pages. Desktop uses sidebar logout. */
export default function UserAccountLogout() {
  const pathname = usePathname();
  if (pathname?.startsWith("/user/onboarding")) return null;

  const group = findActiveUserNavGroup(pathname);
  if (group?.id !== "account") return null;

  return (
    <div className="mx-auto mt-6 w-full max-w-[26rem] md:hidden">
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
  );
}
