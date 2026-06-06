"use client";

import { useState } from "react";
import CoachSidebar from "./CoachSidebar";
import CoachTopbar from "./CoachTopbar";

export default function CoachShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-zinc-950 text-white">
      <div className="mx-auto max-w-8xl px-2 md:pl-12 md:pr-5">
        <div className="flex gap-4">
          <CoachSidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <div className="min-w-0 flex-1 pb-5">
            <CoachTopbar onOpenMobile={() => setMobileOpen(true)} />
            <main className="mt-4 rounded-[26px] border border-white/10 bg-white/5 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
