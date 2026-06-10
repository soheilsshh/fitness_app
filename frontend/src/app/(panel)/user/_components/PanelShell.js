"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/axios/client";
import { ROLES } from "@/lib/auth/roles";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function PanelShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!pathname?.startsWith("/user")) return;
    if (pathname.startsWith("/user/onboarding")) return;

    const role =
      typeof window !== "undefined"
        ? window.localStorage.getItem("user_role")
        : "";
    if (role !== ROLES.STUDENT) return;

    let cancelled = false;
    async function ensureProfileComplete() {
      try {
        const res = await api.get("/me");
        if (cancelled) return;
        if (!res.data?.isProfileComplete) {
          router.replace("/user/onboarding");
        } else {
          window.localStorage.setItem("profile_complete", "1");
        }
      } catch {
        // ignore; auth errors handled elsewhere
      }
    }
    ensureProfileComplete();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-8xl md:pl-12 md:pr-5">
        <div className="flex">
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <div className="min-w-0 flex-1">
            <Topbar
              onOpenMobile={() => setMobileOpen(true)}
              collapsed={collapsed}
            />

            <main className="px-4 pb-10 pt-6 md:px-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
