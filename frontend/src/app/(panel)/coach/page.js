"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CoachIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coach/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      در حال انتقال...
    </div>
  );
}
