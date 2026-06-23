"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/user/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      در حال انتقال...
    </div>
  );
}
