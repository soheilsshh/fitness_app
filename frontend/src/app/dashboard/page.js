"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPostLoginPath } from "@/lib/auth/roles";
import { getAuthSession } from "@/lib/auth/session";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getAuthSession();

    if (!session?.role) {
      router.replace("/auth?next=/dashboard");
      return;
    }

    const profileComplete =
      window.localStorage.getItem("profile_complete") !== "0";

    router.replace(getPostLoginPath(session.role, profileComplete));
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      در حال انتقال به پنل...
    </div>
  );
}
