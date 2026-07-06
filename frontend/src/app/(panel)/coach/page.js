"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCoachProfile } from "@/app/(panel)/coach/_context/CoachProfileContext";

export default function CoachIndexPage() {
  const router = useRouter();
  const { loading, isRestricted } = useCoachProfile();

  useEffect(() => {
    if (loading) return;
    router.replace(isRestricted ? "/coach/profile" : "/coach/dashboard");
  }, [loading, isRestricted, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      در حال انتقال...
    </div>
  );
}
